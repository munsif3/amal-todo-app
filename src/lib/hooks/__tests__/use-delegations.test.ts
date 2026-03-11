import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDelegations, getDelegationProgress } from '../use-delegations';
import * as delegationsModule from '@/lib/firebase/delegations';
import type { Delegation } from '@/types';

vi.mock('@/lib/firebase/client', () => ({ db: {}, auth: {}, app: {} }));
vi.mock('@/lib/firebase/delegations');

const fakeUser = { uid: 'user-1' } as any;

let activeCallback: ((delegations: Delegation[]) => void) | null = null;
let closedCallback: ((delegations: Delegation[]) => void) | null = null;

const makeDelegation = (overrides: Partial<Delegation>): Delegation => ({
    id: 'd1',
    ownerId: fakeUser.uid,
    title: 'A Delegation',
    description: '',
    assignee: 'Someone',
    status: 'active',
    subtasks: [],
    closingNotes: '',
    createdAt: { toMillis: () => 1000 } as any,
    updatedAt: { toMillis: () => 1000 } as any,
    ...overrides,
});

describe('useDelegations', () => {
    let unsubActive: ReturnType<typeof vi.fn>;
    let unsubClosed: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        activeCallback = null;
        closedCallback = null;
        unsubActive = vi.fn();
        unsubClosed = vi.fn();

        (delegationsModule.subscribeToDelegations as ReturnType<typeof vi.fn>).mockImplementation(
            (_uid: string, cb: (delegations: Delegation[]) => void) => {
                activeCallback = cb;
                return unsubActive;
            }
        );
        (delegationsModule.subscribeToClosedDelegations as ReturnType<typeof vi.fn>).mockImplementation(
            (_uid: string, _limit: number, cb: (delegations: Delegation[]) => void) => {
                closedCallback = cb;
                return unsubClosed;
            }
        );
    });

    it('returns empty delegations and loading=false when user is null', () => {
        const { result } = renderHook(() => useDelegations(null));
        expect(result.current.delegations).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(delegationsModule.subscribeToDelegations).not.toHaveBeenCalled();
    });

    it('subscribes to both active and closed delegations', () => {
        renderHook(() => useDelegations(fakeUser));
        expect(delegationsModule.subscribeToDelegations).toHaveBeenCalledWith(
            fakeUser.uid,
            expect.any(Function)
        );
        expect(delegationsModule.subscribeToClosedDelegations).toHaveBeenCalledWith(
            fakeUser.uid,
            30,
            expect.any(Function)
        );
    });

    it('calls both unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useDelegations(fakeUser));
        unmount();
        expect(unsubActive).toHaveBeenCalledTimes(1);
        expect(unsubClosed).toHaveBeenCalledTimes(1);
    });

    it('correctly partitions active, review, and closed delegations', async () => {
        const { result } = renderHook(() => useDelegations(fakeUser));

        activeCallback!([
            makeDelegation({ id: 'd1', status: 'active' }),
            makeDelegation({ id: 'd2', status: 'review' }),
        ]);
        closedCallback!([
            makeDelegation({ id: 'd3', status: 'closed' }),
        ]);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.activeDelegations.map(d => d.id)).toEqual(['d1']);
        expect(result.current.reviewDelegations.map(d => d.id)).toEqual(['d2']);
        expect(result.current.closedDelegations.map(d => d.id)).toEqual(['d3']);
    });
});

describe('getDelegationProgress', () => {
    const make = (overrides: Partial<Delegation>) => ({
        id: 'd1', ownerId: 'u1', title: '', description: '', assignee: '',
        status: 'active' as const, subtasks: [], closingNotes: '',
        createdAt: {} as any, updatedAt: {} as any,
        ...overrides,
    });

    it('returns 0 when there are no subtasks', () => {
        expect(getDelegationProgress(make({ subtasks: [] }))).toBe(0);
    });

    it('returns 0 when no subtasks are completed', () => {
        expect(getDelegationProgress(make({
            subtasks: [
                { id: 's1', title: 'A', isCompleted: false },
                { id: 's2', title: 'B', isCompleted: false },
            ],
        }))).toBe(0);
    });

    it('returns 50 when half are completed', () => {
        expect(getDelegationProgress(make({
            subtasks: [
                { id: 's1', title: 'A', isCompleted: true },
                { id: 's2', title: 'B', isCompleted: false },
            ],
        }))).toBe(50);
    });

    it('returns 100 when all subtasks are completed', () => {
        expect(getDelegationProgress(make({
            subtasks: [
                { id: 's1', title: 'A', isCompleted: true },
                { id: 's2', title: 'B', isCompleted: true },
            ],
        }))).toBe(100);
    });

    it('rounds to nearest integer', () => {
        expect(getDelegationProgress(make({
            subtasks: [
                { id: 's1', title: 'A', isCompleted: true },
                { id: 's2', title: 'B', isCompleted: false },
                { id: 's3', title: 'C', isCompleted: false },
            ],
        }))).toBe(33); // 33.33... rounds to 33
    });
});
