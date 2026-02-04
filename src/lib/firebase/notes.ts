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
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./client";
import { Note, CreateNoteInput, UpdateNoteInput } from "@/types";
import { genericConverter } from "./converters";

const NOTES_COLLECTION = "notes";
const noteConverter = genericConverter<Note>();

export function subscribeToNotes(userId: string, callback: (notes: Note[]) => void) {
    const q = query(
        collection(db, NOTES_COLLECTION).withConverter(noteConverter),
        where("ownerId", "==", userId),
        orderBy("isPinned", "desc"),
        orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const notes = snapshot.docs.map((doc) => doc.data());
        callback(notes);
    });
}

export function subscribeToAccountNotes(userId: string, accountId: string, callback: (notes: Note[]) => void) {
    const q = query(
        collection(db, NOTES_COLLECTION).withConverter(noteConverter),
        where("ownerId", "==", userId),
        where("accountId", "==", accountId),
        orderBy("isPinned", "desc"),
        orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const notes = snapshot.docs.map((doc) => doc.data());
        callback(notes);
    });
}

export async function getNote(noteId: string) {
    const docRef = doc(db, NOTES_COLLECTION, noteId).withConverter(noteConverter);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

export async function createNote(userId: string, noteData: CreateNoteInput) {
    const newNote = {
        ...noteData,
        ownerId: userId,
        type: noteData.type || 'text',
        isPinned: noteData.isPinned || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    return addDoc(collection(db, NOTES_COLLECTION), newNote);
}

export async function updateNote(noteId: string, data: UpdateNoteInput) {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    return updateDoc(noteRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteNote(noteId: string) {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    return deleteDoc(noteRef);
}
