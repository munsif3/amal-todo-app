import {
    collection,
    addDoc,
    doc,
    updateDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
    getDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "./client";
import { Account, CreateAccountInput, UpdateAccountInput } from "@/types";
import { genericConverter } from "./converters";

const ACCOUNTS_COLLECTION = "accounts";
const accountConverter = genericConverter<Account>();

/** Subscribes to all accounts for a user, ordered by creation date. */
export function subscribeToAccounts(userId: string, callback: (accounts: Account[]) => void) {
    const q = query(
        collection(db, ACCOUNTS_COLLECTION).withConverter(accountConverter),
        where("ownerId", "==", userId),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const accounts = snapshot.docs.map((doc) => doc.data());
        callback(accounts);
    }, (error) => {
        console.error("Error subscribing to accounts:", error);
    });
}

/** Creates a new account for a user with default active status. */
export async function createAccount(userId: string, data: CreateAccountInput) {
    const newAccount = {
        ...data,
        ownerId: userId,
        status: "active",
        color: data.color || "#2d3436",
        createdAt: serverTimestamp(),
    };

    return addDoc(collection(db, ACCOUNTS_COLLECTION), newAccount);
}

/** Fetches a single account by ID, returns null if not found. */
export async function getAccount(accountId: string) {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId).withConverter(accountConverter);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

/** Updates an account's fields and refreshes `updatedAt` timestamp. */
export async function updateAccount(accountId: string, data: UpdateAccountInput) {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    return updateDoc(accountRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/** Permanently deletes an account. */
export async function deleteAccount(accountId: string) {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    return deleteDoc(accountRef);
}
