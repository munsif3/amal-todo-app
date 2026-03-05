import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRoutineCompletion } from '../use-routine-completion';
import * as routinesModule from '@/lib/firebase/routines';
import type { Routine } from '@/types';

vi.mock('@/lib/firebase/client', () => ({ db: {}, auth: {}, app: {} }));
vi.mock('@/lib/firebase/routines');

const fakeUser = { uid: 'user-1' } as any;

const todayStr = new Date().toISOString().split('T')[0];

const makeRoutine = (completionOverrides?: Record<string, Record<string, boolean>>): Routine => ({
    id: 'r1',
    ownerId: fakeUser.uid,
    title: 'Test Routine',
    schedule: 'daily',
    type: 'fixed',
    isShared: false,
    completionLog: completionOverrides ?? {},
});

describe('useRoutineCompletion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (routinesModule.toggleRoutineCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    });

    // ─── isRoutineCompletedToday ──────────────────────────────
    describe('isRoutineCompletedToday', () => {
        it('returns false when user is null', () => {
            const { result } = renderHook(() => useRoutineCompletion(null));
            const routine = makeRoutine();
            expect(result.current.isRoutineCompletedToday(routine)).toBe(false);
        });

        it('returns false when the routine has no completion log for today', () => {
            const { result } = renderHook(() => useRoutineCompletion(fakeUser));
            const routine = makeRoutine({});
            expect(result.current.isRoutineCompletedToday(routine)).toBe(false);
        });

        it('returns true when the current user has completed today', () => {
            const { result } = renderHook(() => useRoutineCompletion(fakeUser));
            const routine = makeRoutine({ [todayStr]: { [fakeUser.uid]: true } });
            expect(result.current.isRoutineCompletedToday(routine)).toBe(true);
        });

        it('returns false when a different user completed it (not current user)', () => {
            const { result } = renderHook(() => useRoutineCompletion(fakeUser));
            const routine = makeRoutine({ [todayStr]: { 'other-user': true } });
            expect(result.current.isRoutineCompletedToday(routine)).toBe(false);
        });

        it('returns the correct todayStr in ISO format', () => {
            const { result } = renderHook(() => useRoutineCompletion(fakeUser));
            expect(result.current.todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    // ─── toggleCompletion ─────────────────────────────────────
    describe('toggleCompletion', () => {
        it('does not call firebase when user is null', async () => {
            const { result } = renderHook(() => useRoutineCompletion(null));
            const routine = makeRoutine();
            await result.current.toggleCompletion(routine);
            expect(routinesModule.toggleRoutineCompletion).not.toHaveBeenCalled();
        });

        it('marks routine as completed when it was not completed today', async () => {
            const { result } = renderHook(() => useRoutineCompletion(fakeUser));
            const routine = makeRoutine({}); // not completed
            await result.current.toggleCompletion(routine);

            expect(routinesModule.toggleRoutineCompletion).toHaveBeenCalledWith(
                routine.id,
                fakeUser.uid,
                todayStr,
                true // toggling ON since it was not completed
            );
        });

        it('marks routine as not-completed when it was already done today', async () => {
            const { result } = renderHook(() => useRoutineCompletion(fakeUser));
            const routine = makeRoutine({ [todayStr]: { [fakeUser.uid]: true } });
            await result.current.toggleCompletion(routine);

            expect(routinesModule.toggleRoutineCompletion).toHaveBeenCalledWith(
                routine.id,
                fakeUser.uid,
                todayStr,
                false // toggling OFF since it was already completed
            );
        });
    });
});
