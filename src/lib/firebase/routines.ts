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

export function subscribeToRoutines(userId: string, callback: (routines: Routine[]) => void) {
    const q = query(
        collection(db, ROUTINES_COLLECTION).withConverter(routineConverter),
        where("ownerId", "==", userId),
        orderBy("title", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const routines = snapshot.docs.map((doc) => doc.data());
        callback(routines);
    });
}

export async function getRoutine(routineId: string) {
    const docRef = doc(db, ROUTINES_COLLECTION, routineId).withConverter(routineConverter);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

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

export async function updateRoutine(routineId: string, data: UpdateRoutineInput) {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    return updateDoc(routineRef, data);
}

export async function toggleRoutineCompletion(routineId: string, userId: string, date: string, completed: boolean) {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    return updateDoc(routineRef, {
        [`completionLog.${date}.${userId}`]: completed
    });
}

export async function deleteRoutine(routineId: string) {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    return deleteDoc(routineRef);
}
