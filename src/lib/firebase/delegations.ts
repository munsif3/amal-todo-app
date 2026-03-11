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
    limit,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./client";
import { Delegation, CreateDelegationInput, UpdateDelegationInput } from "@/types";
import { genericConverter } from "./converters";

const DELEGATIONS_COLLECTION = "delegations";
const delegationConverter = genericConverter<Delegation>();

/**
 * Subscribes to all non-closed delegations for a user, ordered by most recently updated.
 */
export function subscribeToDelegations(userId: string, callback: (delegations: Delegation[]) => void) {
    const q = query(
        collection(db, DELEGATIONS_COLLECTION).withConverter(delegationConverter),
        where("ownerId", "==", userId),
        where("status", "!=", "closed"),
    );

    return onSnapshot(q, (snapshot) => {
        const delegations = snapshot.docs.map((d) => d.data());
        callback(delegations);
    }, (error) => {
        console.error("Error subscribing to delegations:", error);
    });
}

/**
 * Subscribes to recently closed delegations for a user.
 */
export function subscribeToClosedDelegations(userId: string, limitCount: number = 30, callback: (delegations: Delegation[]) => void) {
    const q = query(
        collection(db, DELEGATIONS_COLLECTION).withConverter(delegationConverter),
        where("ownerId", "==", userId),
        where("status", "==", "closed"),
        orderBy("updatedAt", "desc"),
        limit(limitCount),
    );

    return onSnapshot(q, (snapshot) => {
        const delegations = snapshot.docs.map((d) => d.data());
        callback(delegations);
    }, (error) => {
        console.error("Error subscribing to closed delegations:", error);
    });
}

/** Fetches a single delegation by ID, returns null if not found. */
export async function getDelegation(delegationId: string) {
    const docRef = doc(db, DELEGATIONS_COLLECTION, delegationId).withConverter(delegationConverter);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

/** Creates a new delegation with default fields. */
export async function createDelegation(userId: string, data: CreateDelegationInput) {
    const newDelegation = {
        ...data,
        ownerId: userId,
        title: data.title || "",
        description: data.description || "",
        assignee: data.assignee || "",
        status: data.status || "active",
        subtasks: data.subtasks || [],
        closingNotes: data.closingNotes || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    return addDoc(collection(db, DELEGATIONS_COLLECTION), newDelegation);
}

/** Updates a delegation's fields and refreshes `updatedAt`. */
export async function updateDelegation(delegationId: string, data: UpdateDelegationInput) {
    const ref = doc(db, DELEGATIONS_COLLECTION, delegationId);
    return updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/** Permanently deletes a delegation. */
export async function deleteDelegation(delegationId: string) {
    const ref = doc(db, DELEGATIONS_COLLECTION, delegationId);
    return deleteDoc(ref);
}
