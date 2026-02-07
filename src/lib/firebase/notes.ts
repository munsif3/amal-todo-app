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

// Validation Constants
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 20000;

function validateNoteInput(input: Partial<CreateNoteInput> | Partial<UpdateNoteInput>) {
    if (input.title !== undefined && input.title.length > MAX_TITLE_LENGTH) {
        throw new Error(`Title exceeds maximum length of ${MAX_TITLE_LENGTH} characters.`);
    }
    if (input.content !== undefined && input.content.length > MAX_CONTENT_LENGTH) {
        throw new Error(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters.`);
    }
}

export function subscribeToNotes(userId: string, callback: (notes: Note[]) => void) {
    if (!userId) {
        console.error("subscribeToNotes called without userId");
        return () => { };
    }

    const q = query(
        collection(db, NOTES_COLLECTION).withConverter(noteConverter),
        where("ownerId", "==", userId),
        orderBy("isPinned", "desc"),
        orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const notes = snapshot.docs.map((doc) => doc.data());
        callback(notes);
    }, (error) => {
        console.error("Error subscribing to notes:", error);
        // Could propagate error to callback if signature allowed, currently logging.
    });
}

export function subscribeToAccountNotes(userId: string, accountId: string, callback: (notes: Note[]) => void) {
    if (!userId || !accountId) {
        console.error("subscribeToAccountNotes called with missing arguments");
        return () => { };
    }

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
    }, (error) => {
        console.error("Error subscribing to account notes:", error);
    });
}

export async function getNote(noteId: string) {
    if (!noteId) throw new Error("Note ID is required");

    try {
        const docRef = doc(db, NOTES_COLLECTION, noteId).withConverter(noteConverter);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching note:", error);
        throw new Error("Failed to fetch note. Please try again.");
    }
}

export async function createNote(userId: string, noteData: CreateNoteInput) {
    if (!userId) throw new Error("User ID is required to create a note");
    validateNoteInput(noteData);

    try {
        const newNote = {
            ...noteData,
            ownerId: userId,
            type: noteData.type || 'text',
            isPinned: noteData.isPinned || false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        return await addDoc(collection(db, NOTES_COLLECTION), newNote);
    } catch (error) {
        console.error("Error creating note:", error);
        throw new Error("Failed to create note. Please check your connection.");
    }
}

export async function updateNote(noteId: string, data: UpdateNoteInput) {
    if (!noteId) throw new Error("Note ID is required for update");
    validateNoteInput(data);

    try {
        const noteRef = doc(db, NOTES_COLLECTION, noteId);
        return await updateDoc(noteRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating note:", error);
        throw new Error("Failed to update note. Please check your connection.");
    }
}

export async function deleteNote(noteId: string) {
    if (!noteId) throw new Error("Note ID is required for deletion");

    try {
        const noteRef = doc(db, NOTES_COLLECTION, noteId);
        return await deleteDoc(noteRef);
    } catch (error) {
        console.error("Error deleting note:", error);
        throw new Error("Failed to delete note.");
    }
}
