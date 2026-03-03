import { db } from "./client";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { UserStats } from "@/types";

const USER_STATS_COLLECTION = "user_stats";

/**
 * Ensures a user stats document exists, creates if missing with defaults
 */
export async function initializeUserStats(userId: string): Promise<UserStats> {
    const statsRef = doc(db, USER_STATS_COLLECTION, userId);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
        return statsSnap.data() as UserStats;
    }

    const initialStats: UserStats = {
        userId,
        karma: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        updatedAt: Timestamp.now(),
    };

    await setDoc(statsRef, initialStats);
    return initialStats;
}

/**
 * Awards karma and updates streaks based on task completion
 */
export async function awardGamificationPoints(
    userId: string,
    actionMetadata: { isFrog?: boolean; isTwoMinute?: boolean; isRoutine?: boolean }
) {
    const statsRef = doc(db, USER_STATS_COLLECTION, userId);
    const statsSnap = await getDoc(statsRef);

    let stats = statsSnap.exists() ? (statsSnap.data() as UserStats) : await initializeUserStats(userId);

    // Calculate Karma Points
    let pointsToAdd = 10; // Base completion
    if (actionMetadata.isFrog) pointsToAdd = 50;
    else if (actionMetadata.isTwoMinute) pointsToAdd = 5;
    else if (actionMetadata.isRoutine) pointsToAdd = 15;

    let newKarma = stats.karma + pointsToAdd;
    let newStreak = stats.currentStreak;
    let newLongest = stats.longestStreak;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let lastActive = stats.lastActiveDate ? stats.lastActiveDate.toDate() : null;
    let lastActiveDay = lastActive ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) : null;

    // Streak Logic Calculation
    if (!lastActiveDay) {
        // First ever completion
        newStreak = 1;
    } else {
        const diffTime = Math.abs(today.getTime() - lastActiveDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already completed something today, streak remains the same
        } else if (diffDays === 1) {
            // Completed yesterday, streak continues!
            newStreak += 1;
        } else {
            // Missed a day, streak resets
            newStreak = 1;
        }
    }

    if (newStreak > newLongest) {
        newLongest = newStreak;
    }

    const updates = {
        karma: newKarma,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    await updateDoc(statsRef, updates);
}

/**
 * Subscribes to real-time updates of a user's stats document.
 * Automatically initializes the document if it doesn't exist.
 */
export function subscribeToUserStats(
    userId: string,
    callback: (stats: UserStats | null) => void
): () => void {
    if (!userId) {
        callback(null);
        return () => { };
    }

    const statsRef = doc(db, USER_STATS_COLLECTION, userId);
    let initialized = false;

    const unsubscribe = onSnapshot(statsRef, async (snap) => {
        if (snap.exists()) {
            callback(snap.data() as UserStats);
        } else if (!initialized) {
            initialized = true;
            try {
                const stats = await initializeUserStats(userId);
                callback(stats);
            } catch (err: unknown) {
                const firebaseErr = err as { code?: string };
                if (firebaseErr.code !== 'permission-denied') {
                    console.error("Failed to initialize user stats:", err);
                }
                callback(null);
            }
        }
    }, (error) => {
        if (error.code !== 'permission-denied') {
            console.error("Error subscribing to user stats:", error);
        }
    });

    return unsubscribe;
}
