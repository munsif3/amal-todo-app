import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRoutines } from '../use-routines';
import * as routinesModule from '@/lib/firebase/routines';
import type { Routine } from '@/types';

vi.mock('@/lib/firebase/client', () => ({ db: {}, auth: {}, app: {} }));
vi.mock('@/lib/firebase/routines');

const fakeUser = { uid: 'user-1' } as any;

/** Creates a minimal Routine object */
const makeRoutine = (overrides: Partial<Routine> = {}): Routine => ({
    id: 'r1',
    ownerId: fakeUser.uid,
    title: 'Test Routine',
    schedule: 'daily',
    type: 'fixed',
    isShared: false,
    completionLog: {},
    days: [],
    ...overrides,
});

describe('useRoutines', () => {
    let unsubscribeMock: ReturnType<typeof vi.fn>;
    let capturedCallback: ((routines: Routine[]) => void) | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        capturedCallback = null;
        unsubscribeMock = vi.fn();

        (routinesModule.subscribeToRoutines as ReturnType<typeof vi.fn>).mockImplementation(
            (_uid: string, cb: (routines: Routine[]) => void) => {
                capturedCallback = cb;
                return unsubscribeMock;
            }
        );
    });

    it('returns empty routines and loading=false when user is null', () => {
        const { result } = renderHook(() => useRoutines(null));
        expect(result.current.routines).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('calls subscribeToRoutines when user is provided', () => {
        renderHook(() => useRoutines(fakeUser));
        expect(routinesModule.subscribeToRoutines).toHaveBeenCalledWith(
            fakeUser.uid,
            expect.any(Function)
        );
    });

    it('unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useRoutines(fakeUser));
        unmount();
        expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });

    // ─── todaysRoutines filtering ──────────────────────────────
    describe('todaysRoutines filtering', () => {
        const todayDayIdx = new Date().getDay();
        const otherDayIdx = (todayDayIdx + 1) % 7;
        const todayMonthDay = new Date().getDate();
        const otherMonthDay = (todayMonthDay % 28) + 1;

        it('includes a daily routine', async () => {
            const { result } = renderHook(() => useRoutines(fakeUser));
            capturedCallback!([makeRoutine({ schedule: 'daily' })]);

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.todaysRoutines).toHaveLength(1);
        });

        it('includes a weekly routine scheduled for today', async () => {
            const { result } = renderHook(() => useRoutines(fakeUser));
            capturedCallback!([makeRoutine({ schedule: 'weekly', days: [todayDayIdx] })]);

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.todaysRoutines).toHaveLength(1);
        });

        it('excludes a weekly routine scheduled for another day', async () => {
            const { result } = renderHook(() => useRoutines(fakeUser));
            capturedCallback!([makeRoutine({ schedule: 'weekly', days: [otherDayIdx] })]);

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.todaysRoutines).toHaveLength(0);
        });

        it('includes a monthly routine with matching monthDay', async () => {
            const { result } = renderHook(() => useRoutines(fakeUser));
            capturedCallback!([makeRoutine({ schedule: 'monthly', monthDay: todayMonthDay })]);

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.todaysRoutines).toHaveLength(1);
        });

        it('excludes a monthly routine with non-matching monthDay', async () => {
            const { result } = renderHook(() => useRoutines(fakeUser));
            capturedCallback!([makeRoutine({ schedule: 'monthly', monthDay: otherMonthDay })]);

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.todaysRoutines).toHaveLength(0);
        });

        it('excludes routines that do not match the search query', async () => {
            const { result } = renderHook(() => useRoutines(fakeUser, 'gym'));
            capturedCallback!([
                makeRoutine({ title: 'Morning Run', schedule: 'daily' }),
                makeRoutine({ id: 'r2', title: 'Gym Workout', schedule: 'daily' }),
            ]);

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.todaysRoutines).toHaveLength(1);
            expect(result.current.todaysRoutines[0].title).toBe('Gym Workout');
        });

        it('is case-insensitive for search filtering', async () => {
            const { result } = renderHook(() => useRoutines(fakeUser, 'GYM'));
            capturedCallback!([makeRoutine({ title: 'gym session', schedule: 'daily' })]);

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.todaysRoutines).toHaveLength(1);
        });
    });
});
