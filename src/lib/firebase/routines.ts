import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./client";
import { Routine, CreateRoutineInput, UpdateRoutineInput } from "@/types";
import { genericConverter } from "./converters";

const ROUTINES_COLLECTION = "routines";
const routineConverter = genericConverter<Routine>();

/** Subscribes to all routines for a user, ordered by title. */
export function subscribeToRoutines(userId: string, callback: (routines: Routine[]) => void) {
    const q = query(
        collection(db, ROUTINES_COLLECTION).withConverter(routineConverter),
        where("ownerId", "==", userId),
        orderBy("title", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const routines = snapshot.docs.map((doc) => doc.data());
        callback(routines);
    }, (error) => {
        console.error("Error subscribing to routines:", error);
    });
}

/** Fetches a single routine by ID. */
export async function getRoutine(routineId: string) {
    const docRef = doc(db, ROUTINES_COLLECTION, routineId).withConverter(routineConverter);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

/** Creates a new routine for a user. */
export async function createRoutine(userId: string, routineData: CreateRoutineInput) {
    const newRoutine = {
        ...routineData,
        ownerId: userId,
        completionLog: {},
        type: routineData.type || 'fixed',
        isShared: routineData.isShared || false,
    };

    return addDoc(collection(db, ROUTINES_COLLECTION), newRoutine);
}

/** Updates a routine's fields. */
export async function updateRoutine(routineId: string, data: UpdateRoutineInput) {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    return updateDoc(routineRef, data);
}

/** Toggles routine completion for a specific user on a given date. */
export async function toggleRoutineCompletion(routineId: string, userId: string, date: string, completed: boolean) {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    return updateDoc(routineRef, {
        [`completionLog.${date}.${userId}`]: completed
    });
}

/** Permanently deletes a routine. */
export async function deleteRoutine(routineId: string) {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    return deleteDoc(routineRef);
}
