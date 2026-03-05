import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import {
    initializeUserStats,
    awardGamificationPoints,
} from '../user_stats';

// We need to intercept getDoc/updateDoc/setDoc
vi.mock('firebase/firestore', async () => ({
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    Timestamp: {
        now: () => ({ toDate: () => new Date(), seconds: 0, nanoseconds: 0 }),
    },
}));

vi.mock('../client', () => ({ db: {} }));

/** Helpers to build fake Firestore snapshots */
const makeSnap = (data: Record<string, unknown> | null) => ({
    exists: () => data !== null,
    data: () => data,
});

/** Build a minimal UserStats-like object with today as lastActiveDate */
const makeStats = (overrides: Record<string, unknown> = {}) => ({
    userId: 'user-1',
    karma: 100,
    currentStreak: 3,
    longestStreak: 5,
    lastActiveDate: null as unknown,
    updatedAt: { seconds: 0, nanoseconds: 0 },
    ...overrides,
});

/**
 * A helper to simulate a date N days ago from "today".
 * Returns a Timestamp-like object (with .toDate()).
 */
const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return { toDate: () => d };
};

describe('user_stats firebase module', () => {
    const userId = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (firestore.setDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    });

    // ─── initializeUserStats ──────────────────────────────────
    describe('initializeUserStats', () => {
        it('returns existing stats without creating a new document', async () => {
            const existingStats = makeStats();
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(
                makeSnap(existingStats)
            );

            const result = await initializeUserStats(userId);

            expect(result).toEqual(existingStats);
            expect(firestore.setDoc).not.toHaveBeenCalled();
        });

        it('creates default stats when document does not exist', async () => {
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnap(null));

            const result = await initializeUserStats(userId);

            expect(firestore.setDoc).toHaveBeenCalled();
            expect(result).toMatchObject({
                userId,
                karma: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: null,
            });
        });
    });

    // ─── awardGamificationPoints – karma ──────────────────────
    describe('awardGamificationPoints – karma calculation', () => {
        beforeEach(() => {
            // Stats with no previous activity (firstCompletion = streak 1)
            const stats = makeStats({ karma: 0, currentStreak: 0, longestStreak: 0, lastActiveDate: null });
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnap(stats));
        });

        it('awards base 10 karma for a regular completion', async () => {
            await awardGamificationPoints(userId, {});

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ karma: 10 })
            );
        });

        it('awards 50 karma for a frog task', async () => {
            await awardGamificationPoints(userId, { isFrog: true });

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ karma: 50 })
            );
        });

        it('awards 5 karma for a two-minute task', async () => {
            await awardGamificationPoints(userId, { isTwoMinute: true });

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ karma: 5 })
            );
        });

        it('awards 15 karma for a routine', async () => {
            await awardGamificationPoints(userId, { isRoutine: true });

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ karma: 15 })
            );
        });
    });

    // ─── awardGamificationPoints – streak logic ───────────────
    describe('awardGamificationPoints – streak logic', () => {
        it('sets streak to 1 on first-ever completion (no lastActiveDate)', async () => {
            const stats = makeStats({ currentStreak: 0, longestStreak: 0, lastActiveDate: null });
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnap(stats));

            await awardGamificationPoints(userId, {});

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ currentStreak: 1 })
            );
        });

        it('keeps streak unchanged when already completed today', async () => {
            const stats = makeStats({ currentStreak: 5, longestStreak: 5, lastActiveDate: daysAgo(0) });
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnap(stats));

            await awardGamificationPoints(userId, {});

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ currentStreak: 5 })
            );
        });

        it('increments streak by 1 when last active was yesterday', async () => {
            const stats = makeStats({ currentStreak: 3, longestStreak: 5, lastActiveDate: daysAgo(1) });
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnap(stats));

            await awardGamificationPoints(userId, {});

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ currentStreak: 4 })
            );
        });

        it('resets streak to 1 when a day was missed', async () => {
            const stats = makeStats({ currentStreak: 7, longestStreak: 10, lastActiveDate: daysAgo(2) });
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnap(stats));

            await awardGamificationPoints(userId, {});

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ currentStreak: 1 })
            );
        });

        it('updates longestStreak when new streak exceeds it', async () => {
            const stats = makeStats({ currentStreak: 5, longestStreak: 5, lastActiveDate: daysAgo(1) });
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnap(stats));

            await awardGamificationPoints(userId, {});

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ currentStreak: 6, longestStreak: 6 })
            );
        });

        it('does not lower longestStreak after a reset', async () => {
            const stats = makeStats({ currentStreak: 8, longestStreak: 10, lastActiveDate: daysAgo(5) });
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue(makeSnap(stats));

            await awardGamificationPoints(userId, {});

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ currentStreak: 1, longestStreak: 10 })
            );
        });
    });
});
