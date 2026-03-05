import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import {
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    toggleTaskFrog,
    toggleTaskTwoMinute,
    bulkUpdateTaskStatus,
    bulkUpdateTaskDeadline,
    updateTasksOrder,
    subscribeToActiveTasks,
    subscribeToRecentCompletedTasks,
    subscribeToAccountTasks,
    getTask,
} from '../tasks';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
    const fakeRef = { withConverter: vi.fn().mockReturnThis() };
    const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
    };
    return {
        getFirestore: vi.fn(),
        collection: vi.fn(() => fakeRef),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        doc: vi.fn(() => fakeRef),
        getDoc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        onSnapshot: vi.fn(),
        Timestamp: {
            now: () => ({ toMillis: () => 1234567890, seconds: 1234567890, nanoseconds: 0 }),
        },
        serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
        arrayUnion: vi.fn((val) => val),
        writeBatch: vi.fn(() => mockBatch),
    };
});

// Mock the client to avoid initializing real app
vi.mock('../client', () => ({
    db: {},
}));

vi.mock('../converters', () => ({
    genericConverter: vi.fn(() => ({})),
}));

describe('tasks firebase module', () => {
    const userId = 'test-user-id';
    const taskId = 'task-1';

    // Shared mock batch — re-initialised in beforeEach so vi.clearAllMocks() doesn't wipe it
    let mockBatch: { update: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        vi.clearAllMocks();

        mockBatch = {
            update: vi.fn(),
            commit: vi.fn().mockResolvedValue(undefined),
        };
        vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);
    });

    // ─── createTask ───────────────────────────────────────────
    describe('createTask', () => {
        it('adds a doc with correct shape including defaults', async () => {
            const taskInput = {
                title: 'New Task',
                description: 'Description',
                accountId: 'acc-1',
                projectId: 'proj-1',
                priority: 'p1' as const,
                estimatedDuration: 30,
            };

            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-task-id' });

            await createTask(userId, taskInput);

            expect(firestore.collection).toHaveBeenCalled();
            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(), // collection ref
                expect.objectContaining({
                    ...taskInput,
                    ownerId: userId,
                    status: 'next',
                    isFrog: false,
                    isTwoMinute: false,
                    dependencies: [],
                    references: [],
                    subtasks: [],
                    history: expect.arrayContaining([
                        expect.objectContaining({ action: 'created', userId }),
                    ]),
                })
            );
        });

        it('respects an explicit status override', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'id-2' });
            await createTask(userId, { title: 'Someday task', status: 'someday' });

            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ status: 'someday' })
            );
        });
    });

    // ─── updateTask ───────────────────────────────────────────
    describe('updateTask', () => {
        it('calls updateDoc with the provided data and updatedAt', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await updateTask(taskId, { title: 'Updated title' });

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ title: 'Updated title', updatedAt: 'SERVER_TIMESTAMP' })
            );
        });
    });

    // ─── updateTaskStatus ─────────────────────────────────────
    describe('updateTaskStatus', () => {
        it('calls updateDoc with new status, updatedAt, and a history entry via arrayUnion', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await updateTaskStatus(taskId, 'done', userId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.arrayUnion).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'status_changed_to_done', userId })
            );
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ status: 'done', updatedAt: 'SERVER_TIMESTAMP' })
            );
        });
    });

    // ─── deleteTask ───────────────────────────────────────────
    describe('deleteTask', () => {
        it('calls deleteDoc for the given task', async () => {
            (firestore.deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await deleteTask(taskId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.deleteDoc).toHaveBeenCalledWith(expect.anything());
        });
    });

    // ─── toggleTaskFrog ───────────────────────────────────────
    describe('toggleTaskFrog', () => {
        it('calls updateDoc with isFrog=true', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await toggleTaskFrog(taskId, true);

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ isFrog: true, updatedAt: 'SERVER_TIMESTAMP' })
            );
        });

        it('calls updateDoc with isFrog=false', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await toggleTaskFrog(taskId, false);

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ isFrog: false })
            );
        });
    });

    // ─── toggleTaskTwoMinute ──────────────────────────────────
    describe('toggleTaskTwoMinute', () => {
        it('calls updateDoc with isTwoMinute=true', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await toggleTaskTwoMinute(taskId, true);

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ isTwoMinute: true, updatedAt: 'SERVER_TIMESTAMP' })
            );
        });
    });

    // ─── bulkUpdateTaskStatus ─────────────────────────────────
    describe('bulkUpdateTaskStatus', () => {
        it('returns early without touching batch when given empty array', async () => {
            await bulkUpdateTaskStatus([], 'done', userId);
            expect(firestore.writeBatch).not.toHaveBeenCalled();
        });

        it('uses a batch to update all task statuses and history', async () => {
            await bulkUpdateTaskStatus(['t1', 't2'], 'waiting', userId);

            expect(mockBatch.update).toHaveBeenCalledTimes(2);
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
            expect(mockBatch.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ status: 'waiting' })
            );
        });
    });

    // ─── bulkUpdateTaskDeadline ───────────────────────────────
    describe('bulkUpdateTaskDeadline', () => {
        it('returns early without touching batch when given empty array', async () => {
            await bulkUpdateTaskDeadline([], null);
            expect(firestore.writeBatch).not.toHaveBeenCalled();
        });

        it('uses a batch to update deadlines for all tasks', async () => {
            const deadline = { seconds: 9999, nanoseconds: 0 } as any;

            await bulkUpdateTaskDeadline(['t1', 't2', 't3'], deadline);

            expect(mockBatch.update).toHaveBeenCalledTimes(3);
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
            expect(mockBatch.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ deadline })
            );
        });
    });

    // ─── updateTasksOrder ─────────────────────────────────────
    describe('updateTasksOrder', () => {
        it('uses a batch to update order of each task', async () => {
            const updates = [
                { id: 't1', order: 0 },
                { id: 't2', order: 1 },
            ];

            await updateTasksOrder(updates);

            expect(mockBatch.update).toHaveBeenCalledTimes(2);
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
            expect(mockBatch.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ order: 0 })
            );
        });
    });
    // ─── subscribeToActiveTasks ───────────────────────────────
    describe('subscribeToActiveTasks', () => {
        it('sets up an onSnapshot query filtered by ownerId != done', () => {
            const callback = vi.fn();
            const fakeDocs = [
                { id: 't1', title: 'Active', status: 'next' },
                { id: 't2', title: 'Blocked', status: 'blocked' },
            ];

            // onSnapshot should invoke our callback with the snapshot docs
            (firestore.onSnapshot as ReturnType<typeof vi.fn>).mockImplementationOnce(
                (_q: unknown, onNext: (snap: any) => void) => {
                    onNext({ docs: fakeDocs.map(d => ({ data: () => d })) });
                    return vi.fn(); // unsubscribe fn
                }
            );

            const unsub = subscribeToActiveTasks(userId, callback);

            expect(firestore.collection).toHaveBeenCalled();
            expect(firestore.query).toHaveBeenCalled();
            expect(firestore.where).toHaveBeenCalledWith('ownerId', '==', userId);
            expect(firestore.where).toHaveBeenCalledWith('status', '!=', 'done');
            expect(firestore.onSnapshot).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(fakeDocs);
            expect(typeof unsub).toBe('function');
        });
    });

    // ─── subscribeToRecentCompletedTasks ─────────────────────
    describe('subscribeToRecentCompletedTasks', () => {
        it('sets up an onSnapshot query with status=done, orderBy updatedAt, and limit', () => {
            const callback = vi.fn();
            const fakeDocs = [{ id: 't5', title: 'Done task', status: 'done' }];

            (firestore.onSnapshot as ReturnType<typeof vi.fn>).mockImplementationOnce(
                (_q: unknown, onNext: (snap: any) => void) => {
                    onNext({ docs: fakeDocs.map(d => ({ data: () => d })) });
                    return vi.fn();
                }
            );

            const unsub = subscribeToRecentCompletedTasks(userId, 10, callback);

            expect(firestore.where).toHaveBeenCalledWith('status', '==', 'done');
            expect(firestore.orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
            expect(firestore.limit).toHaveBeenCalledWith(10);
            expect(callback).toHaveBeenCalledWith(fakeDocs);
            expect(typeof unsub).toBe('function');
        });

        it('uses 50 as the default limit', () => {
            (firestore.onSnapshot as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn());
            subscribeToRecentCompletedTasks(userId, undefined as any, vi.fn());
            // Default limitCount is 50 per the function signature
            expect(firestore.limit).toHaveBeenCalledWith(50);
        });
    });

    // ─── subscribeToAccountTasks ──────────────────────────────
    describe('subscribeToAccountTasks', () => {
        it('filters by ownerId, accountId and non-done status, ordered by createdAt', () => {
            const callback = vi.fn();
            const accountId = 'acc-1';

            (firestore.onSnapshot as ReturnType<typeof vi.fn>).mockImplementationOnce(
                (_q: unknown, onNext: (snap: any) => void) => {
                    onNext({ docs: [] });
                    return vi.fn();
                }
            );

            subscribeToAccountTasks(userId, accountId, callback);

            expect(firestore.where).toHaveBeenCalledWith('ownerId', '==', userId);
            expect(firestore.where).toHaveBeenCalledWith('accountId', '==', accountId);
            expect(firestore.where).toHaveBeenCalledWith('status', '!=', 'done');
            expect(firestore.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
            expect(callback).toHaveBeenCalledWith([]);
        });
    });

    // ─── getTask ──────────────────────────────────────────────
    describe('getTask', () => {
        it('returns task data when the document exists', async () => {
            const fakeTask = { id: taskId, title: 'My Task', ownerId: userId };
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => fakeTask,
            });

            const result = await getTask(taskId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(result).toEqual(fakeTask);
        });

        it('returns null when the document does not exist', async () => {
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => false,
            });

            const result = await getTask(taskId);
            expect(result).toBeNull();
        });
    });
});
