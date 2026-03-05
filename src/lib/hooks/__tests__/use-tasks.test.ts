import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from '../use-tasks';
import * as tasksModule from '@/lib/firebase/tasks';
import type { Task } from '@/types';

vi.mock('@/lib/firebase/client', () => ({ db: {}, auth: {}, app: {} }));
vi.mock('@/lib/firebase/tasks');

const fakeUser = { uid: 'user-1' } as any;

let activeCallback: ((tasks: Task[]) => void) | null = null;
let completedCallback: ((tasks: Task[]) => void) | null = null;

/** Creates a minimal Task-like object */
const makeTask = (overrides: Partial<Task>): Task => ({
    id: 't1',
    ownerId: fakeUser.uid,
    title: 'A Task',
    description: '',
    status: 'next',
    dependencies: [],
    references: [],
    history: [],
    createdAt: { toMillis: () => 1000 } as any,
    updatedAt: { toMillis: () => 1000 } as any,
    order: undefined,
    ...overrides,
});

describe('useTasks', () => {
    let unsubActive: ReturnType<typeof vi.fn>;
    let unsubCompleted: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        activeCallback = null;
        completedCallback = null;
        unsubActive = vi.fn();
        unsubCompleted = vi.fn();

        (tasksModule.subscribeToActiveTasks as ReturnType<typeof vi.fn>).mockImplementation(
            (_uid: string, cb: (tasks: Task[]) => void) => {
                activeCallback = cb;
                return unsubActive;
            }
        );
        (tasksModule.subscribeToRecentCompletedTasks as ReturnType<typeof vi.fn>).mockImplementation(
            (_uid: string, _limit: number, cb: (tasks: Task[]) => void) => {
                completedCallback = cb;
                return unsubCompleted;
            }
        );
        (tasksModule.updateTaskStatus as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (tasksModule.updateTasksOrder as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    });

    // ─── null / undefined user ────────────────────────────────
    it('returns empty tasks and loading=false when user is null', () => {
        const { result } = renderHook(() => useTasks(null));
        expect(result.current.tasks).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(tasksModule.subscribeToActiveTasks).not.toHaveBeenCalled();
    });

    it('subscribes to both active and completed tasks when user is provided', () => {
        renderHook(() => useTasks(fakeUser));
        expect(tasksModule.subscribeToActiveTasks).toHaveBeenCalledWith(
            fakeUser.uid,
            expect.any(Function)
        );
        expect(tasksModule.subscribeToRecentCompletedTasks).toHaveBeenCalledWith(
            fakeUser.uid,
            50,
            expect.any(Function)
        );
    });

    it('calls both unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useTasks(fakeUser));
        unmount();
        expect(unsubActive).toHaveBeenCalledTimes(1);
        expect(unsubCompleted).toHaveBeenCalledTimes(1);
    });

    // ─── task partitioning ────────────────────────────────────
    describe('task partitioning', () => {
        it('correctly partitions active, snoozed, someday and finished tasks', async () => {
            const { result } = renderHook(() => useTasks(fakeUser));

            const allTasks = [
                makeTask({ id: 't1', status: 'next' }),
                makeTask({ id: 't2', status: 'blocked' }),
                makeTask({ id: 't3', status: 'waiting' }),
                makeTask({ id: 't4', status: 'someday' }),
                makeTask({ id: 't5', status: 'done' }),
            ];

            activeCallback!(allTasks);
            completedCallback!([]);

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.activeTasks.map(t => t.id)).toEqual(
                expect.arrayContaining(['t1', 't2'])
            );
            expect(result.current.snoozedTasks.map(t => t.id)).toEqual(['t3']);
            expect(result.current.somedayTasks.map(t => t.id)).toEqual(['t4']);
            expect(result.current.finishedTasks.map(t => t.id)).toEqual(['t5']);
        });

        it('combines active tasks from both subscription callbacks', async () => {
            const { result } = renderHook(() => useTasks(fakeUser));

            activeCallback!([makeTask({ id: 't1', status: 'next' })]);
            completedCallback!([makeTask({ id: 't2', status: 'done' })]);

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.tasks).toHaveLength(2);
            expect(result.current.activeTasks).toHaveLength(1);
            expect(result.current.finishedTasks).toHaveLength(1);
        });
    });

    // ─── search filtering ─────────────────────────────────────
    describe('search filtering', () => {
        it('filters active tasks by title (case-insensitive)', async () => {
            const { result } = renderHook(() => useTasks(fakeUser, 'firebase'));

            activeCallback!([
                makeTask({ id: 't1', title: 'Setup Firebase', status: 'next' }),
                makeTask({ id: 't2', title: 'Write tests', status: 'next' }),
            ]);
            completedCallback!([]);

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.activeTasks).toHaveLength(1);
            expect(result.current.activeTasks[0].title).toBe('Setup Firebase');
        });

        it('filters active tasks by description', async () => {
            const { result } = renderHook(() => useTasks(fakeUser, 'vitest'));

            activeCallback!([
                makeTask({ id: 't1', title: 'Task A', description: 'Use vitest for this', status: 'next' }),
                makeTask({ id: 't2', title: 'Task B', description: 'Something else', status: 'next' }),
            ]);
            completedCallback!([]);

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.activeTasks).toHaveLength(1);
            expect(result.current.activeTasks[0].id).toBe('t1');
        });
    });

    // ─── task sorting ─────────────────────────────────────────
    describe('task sorting', () => {
        it('sorts tasks by order field ascending', async () => {
            const { result } = renderHook(() => useTasks(fakeUser));

            const tasks = [
                makeTask({ id: 'ta', status: 'next', order: 10 }),
                makeTask({ id: 'tb', status: 'next', order: 5 }),
                makeTask({ id: 'tc', status: 'next', order: 1 }),
            ];
            activeCallback!(tasks);
            completedCallback!([]);

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.activeTasks.map(t => t.id)).toEqual(['tc', 'tb', 'ta']);
        });
    });

    // ─── changeTaskStatus ─────────────────────────────────────
    describe('changeTaskStatus', () => {
        it('calls updateTaskStatus when user is provided', async () => {
            const { result } = renderHook(() => useTasks(fakeUser));
            activeCallback!([]);
            completedCallback!([]);

            await result.current.changeTaskStatus('task-x', 'done');

            expect(tasksModule.updateTaskStatus).toHaveBeenCalledWith(
                'task-x',
                'done',
                fakeUser.uid
            );
        });
    });
});
