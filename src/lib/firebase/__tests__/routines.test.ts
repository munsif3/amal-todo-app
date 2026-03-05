import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import {
    createRoutine,
    updateRoutine,
    deleteRoutine,
    toggleRoutineCompletion,
    getRoutine,
} from '../routines';

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
        onSnapshot: vi.fn(),
        serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    };
});

vi.mock('../client', () => ({ db: {} }));
vi.mock('../converters', () => ({
    genericConverter: vi.fn(() => ({})),
}));

describe('routines firebase module', () => {
    const userId = 'user-1';
    const routineId = 'routine-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── createRoutine ────────────────────────────────────────
    describe('createRoutine', () => {
        it('adds doc with empty completionLog and default type/isShared', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-r' });

            await createRoutine(userId, {
                title: 'Morning Run',
                schedule: 'daily',
            });

            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    title: 'Morning Run',
                    schedule: 'daily',
                    ownerId: userId,
                    completionLog: {},
                    type: 'fixed',
                    isShared: false,
                })
            );
        });

        it('respects explicit type and isShared values', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-r2' });

            await createRoutine(userId, {
                title: 'Team Standup',
                schedule: 'weekly',
                type: 'flexible',
                isShared: true,
            });

            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'flexible', isShared: true })
            );
        });
    });

    // ─── updateRoutine ────────────────────────────────────────
    describe('updateRoutine', () => {
        it('calls updateDoc with the provided data', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await updateRoutine(routineId, { title: 'Evening Walk' });

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ title: 'Evening Walk' })
            );
        });
    });

    // ─── deleteRoutine ────────────────────────────────────────
    describe('deleteRoutine', () => {
        it('calls deleteDoc for the given routine', async () => {
            (firestore.deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await deleteRoutine(routineId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.deleteDoc).toHaveBeenCalledWith(expect.anything());
        });
    });

    // ─── toggleRoutineCompletion ──────────────────────────────
    describe('toggleRoutineCompletion', () => {
        it('calls updateDoc with the correct nested completionLog field path', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await toggleRoutineCompletion(routineId, userId, '2026-01-15', true);

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                { [`completionLog.2026-01-15.${userId}`]: true }
            );
        });

        it('sets completed=false when toggling off', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await toggleRoutineCompletion(routineId, userId, '2026-01-15', false);

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                { [`completionLog.2026-01-15.${userId}`]: false }
            );
        });
    });

    // ─── getRoutine ───────────────────────────────────────────
    describe('getRoutine', () => {
        it('returns routine data when document exists', async () => {
            const fakeRoutine = { id: routineId, title: 'Morning Run', ownerId: userId };
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => fakeRoutine,
            });

            const result = await getRoutine(routineId);
            expect(result).toEqual(fakeRoutine);
        });

        it('returns null when document does not exist', async () => {
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => false,
            });

            const result = await getRoutine(routineId);
            expect(result).toBeNull();
        });
    });
});
