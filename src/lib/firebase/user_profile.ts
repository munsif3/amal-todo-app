import { db } from "./client";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
} from "firebase/firestore";
import { UserProfile } from "@/types";

const USER_PROFILES_COLLECTION = "user_profiles";

/** Default profile preferences. */
const DEFAULT_PREFERENCES: UserProfile["preferences"] = {
    theme: "light",
    notifications: true,
    defaultTaskTime: "09:30",
};

/** Fetches a user profile, creating it with defaults if it doesn't exist. */
export async function getOrCreateUserProfile(userId: string, email: string, displayName: string): Promise<UserProfile> {
    const profileRef = doc(db, USER_PROFILES_COLLECTION, userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
        return profileSnap.data() as UserProfile;
    }

    const initial: UserProfile = {
        uid: userId,
        email,
        displayName,
        preferences: DEFAULT_PREFERENCES,
    };

    await setDoc(profileRef, initial);
    return initial;
}

/** Updates user profile fields. */
export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, "uid">>) {
    const profileRef = doc(db, USER_PROFILES_COLLECTION, userId);
    return updateDoc(profileRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/** Updates only user profile preferences (merged, not replaced). */
export async function updateUserPreferences(userId: string, preferences: Partial<UserProfile["preferences"]>) {
    const profileRef = doc(db, USER_PROFILES_COLLECTION, userId);
    // Use dot notation for nested update
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(preferences)) {
        updates[`preferences.${key}`] = value;
    }
    return updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/** Real-time subscription to a user's profile. Initializes it if missing. */
export function subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void {
    if (!userId) {
        callback(null);
        return () => { };
    }

    const profileRef = doc(db, USER_PROFILES_COLLECTION, userId);
    let initialized = false;

    const unsubscribe = onSnapshot(profileRef, async (snap) => {
        if (snap.exists()) {
            callback(snap.data() as UserProfile);
        } else if (!initialized) {
            initialized = true;
            // We don't have email/displayName here, use placeholders
            // The auth context should have called getOrCreateUserProfile already
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to user profile:", error);
        callback(null);
    });

    return unsubscribe;
}
