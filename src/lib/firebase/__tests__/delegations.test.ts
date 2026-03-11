import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import {
    createDelegation,
    updateDelegation,
    deleteDelegation,
    subscribeToDelegations,
    subscribeToClosedDelegations,
    getDelegation,
} from '../delegations';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
    const fakeRef = { withConverter: vi.fn().mockReturnThis() };
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
    };
});

vi.mock('../client', () => ({
    db: {},
}));

vi.mock('../converters', () => ({
    genericConverter: vi.fn(() => ({})),
}));

describe('delegations firebase module', () => {
    const userId = 'test-user-id';
    const delegationId = 'del-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── createDelegation ────────────────────────────────────
    describe('createDelegation', () => {
        it('adds a doc with correct defaults', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-id' });

            await createDelegation(userId, { title: 'Platform Migration', assignee: 'Sarah K.' });

            expect(firestore.collection).toHaveBeenCalled();
            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    ownerId: userId,
                    title: 'Platform Migration',
                    assignee: 'Sarah K.',
                    status: 'active',
                    subtasks: [],
                    closingNotes: '',
                    description: '',
                    createdAt: 'SERVER_TIMESTAMP',
                    updatedAt: 'SERVER_TIMESTAMP',
                })
            );
        });

        it('respects explicit status override', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-id' });

            await createDelegation(userId, { title: 'Test', status: 'review' });

            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ status: 'review' })
            );
        });
    });

    // ─── updateDelegation ────────────────────────────────────
    describe('updateDelegation', () => {
        it('calls updateDoc with the provided data and updatedAt', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await updateDelegation(delegationId, { title: 'Updated title' });

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ title: 'Updated title', updatedAt: 'SERVER_TIMESTAMP' })
            );
        });
    });

    // ─── deleteDelegation ────────────────────────────────────
    describe('deleteDelegation', () => {
        it('calls deleteDoc for the given delegation', async () => {
            (firestore.deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await deleteDelegation(delegationId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.deleteDoc).toHaveBeenCalledWith(expect.anything());
        });
    });

    // ─── subscribeToDelegations ──────────────────────────────
    describe('subscribeToDelegations', () => {
        it('sets up an onSnapshot query filtered by ownerId and non-closed status', () => {
            const callback = vi.fn();
            const fakeDocs = [
                { id: 'd1', title: 'Active Del', status: 'active' },
                { id: 'd2', title: 'Review Del', status: 'review' },
            ];

            (firestore.onSnapshot as ReturnType<typeof vi.fn>).mockImplementationOnce(
                (_q: unknown, onNext: (snap: any) => void) => {
                    onNext({ docs: fakeDocs.map(d => ({ data: () => d })) });
                    return vi.fn();
                }
            );

            const unsub = subscribeToDelegations(userId, callback);

            expect(firestore.collection).toHaveBeenCalled();
            expect(firestore.query).toHaveBeenCalled();
            expect(firestore.where).toHaveBeenCalledWith('ownerId', '==', userId);
            expect(firestore.where).toHaveBeenCalledWith('status', '!=', 'closed');
            expect(callback).toHaveBeenCalledWith(fakeDocs);
            expect(typeof unsub).toBe('function');
        });
    });

    // ─── subscribeToClosedDelegations ────────────────────────
    describe('subscribeToClosedDelegations', () => {
        it('sets up an onSnapshot with status=closed, orderBy, and limit', () => {
            const callback = vi.fn();
            const fakeDocs = [{ id: 'd3', title: 'Closed Del', status: 'closed' }];

            (firestore.onSnapshot as ReturnType<typeof vi.fn>).mockImplementationOnce(
                (_q: unknown, onNext: (snap: any) => void) => {
                    onNext({ docs: fakeDocs.map(d => ({ data: () => d })) });
                    return vi.fn();
                }
            );

            const unsub = subscribeToClosedDelegations(userId, 10, callback);

            expect(firestore.where).toHaveBeenCalledWith('status', '==', 'closed');
            expect(firestore.orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
            expect(firestore.limit).toHaveBeenCalledWith(10);
            expect(callback).toHaveBeenCalledWith(fakeDocs);
            expect(typeof unsub).toBe('function');
        });

        it('uses 30 as the default limit', () => {
            (firestore.onSnapshot as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn());
            subscribeToClosedDelegations(userId, undefined as any, vi.fn());
            expect(firestore.limit).toHaveBeenCalledWith(30);
        });
    });

    // ─── getDelegation ───────────────────────────────────────
    describe('getDelegation', () => {
        it('returns delegation data when the document exists', async () => {
            const fakeDelegation = { id: delegationId, title: 'My Del', ownerId: userId };
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => fakeDelegation,
            });

            const result = await getDelegation(delegationId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(result).toEqual(fakeDelegation);
        });

        it('returns null when the document does not exist', async () => {
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => false,
            });

            const result = await getDelegation(delegationId);
            expect(result).toBeNull();
        });
    });
});
