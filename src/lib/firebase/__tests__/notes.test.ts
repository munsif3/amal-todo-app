import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import {
    createNote,
    updateNote,
    deleteNote,
    getNote,
    subscribeToNotes,
} from '../notes';

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
        onSnapshot: vi.fn(() => vi.fn()), // returns unsubscribe fn
        serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
        Timestamp: {
            now: () => ({ toMillis: () => 0, seconds: 0, nanoseconds: 0 }),
        },
    };
});

vi.mock('../client', () => ({ db: {} }));
vi.mock('../converters', () => ({
    genericConverter: vi.fn(() => ({})),
}));

describe('notes firebase module', () => {
    const userId = 'user-1';
    const noteId = 'note-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (firestore.onSnapshot as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn());
    });

    // ─── createNote ───────────────────────────────────────────
    describe('createNote', () => {
        it('adds a doc with defaults: type="text", isPinned=false', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-note' });

            await createNote(userId, { title: 'My Note', content: 'Hello' });

            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    title: 'My Note',
                    content: 'Hello',
                    ownerId: userId,
                    type: 'text',
                    isPinned: false,
                    createdAt: 'SERVER_TIMESTAMP',
                    updatedAt: 'SERVER_TIMESTAMP',
                })
            );
        });

        it('throws when userId is missing', async () => {
            await expect(createNote('', { title: 'X' })).rejects.toThrow(
                'User ID is required to create a note'
            );
        });

        it('throws when title exceeds 200 characters', async () => {
            const longTitle = 'A'.repeat(201);
            await expect(createNote(userId, { title: longTitle })).rejects.toThrow(
                'Title exceeds maximum length of 200 characters.'
            );
        });

        it('throws when content exceeds 20000 characters', async () => {
            const longContent = 'B'.repeat(20001);
            await expect(createNote(userId, { content: longContent })).rejects.toThrow(
                'Content exceeds maximum length of 20000 characters.'
            );
        });

        it('preserves explicit type="checklist"', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'n2' });
            await createNote(userId, { title: 'List', type: 'checklist' });

            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'checklist' })
            );
        });
    });

    // ─── updateNote ───────────────────────────────────────────
    describe('updateNote', () => {
        it('calls updateDoc with data and updatedAt', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await updateNote(noteId, { title: 'New Title' });

            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ title: 'New Title', updatedAt: 'SERVER_TIMESTAMP' })
            );
        });

        it('throws when noteId is missing', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            await expect(updateNote('', { title: 'X' })).rejects.toThrow(
                'Note ID is required for update'
            );
        });

        it('throws on validation failure for title length', async () => {
            await expect(updateNote(noteId, { title: 'A'.repeat(201) })).rejects.toThrow(
                'Title exceeds maximum length'
            );
        });
    });

    // ─── deleteNote ───────────────────────────────────────────
    describe('deleteNote', () => {
        it('calls deleteDoc for the given note', async () => {
            (firestore.deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await deleteNote(noteId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.deleteDoc).toHaveBeenCalled();
        });

        it('throws when noteId is missing', async () => {
            await expect(deleteNote('')).rejects.toThrow('Note ID is required for deletion');
        });
    });

    // ─── getNote ──────────────────────────────────────────────
    describe('getNote', () => {
        it('returns note data when the doc exists', async () => {
            const fakeNote = { id: noteId, title: 'My Note', ownerId: userId };
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => fakeNote,
            });

            const result = await getNote(noteId);
            expect(result).toEqual(fakeNote);
        });

        it('returns null when doc does not exist', async () => {
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => false,
            });

            const result = await getNote(noteId);
            expect(result).toBeNull();
        });

        it('throws when noteId is empty', async () => {
            await expect(getNote('')).rejects.toThrow('Note ID is required');
        });
    });

    // ─── subscribeToNotes ─────────────────────────────────────
    describe('subscribeToNotes', () => {
        it('returns a no-op unsubscribe when userId is empty', () => {
            const unsub = subscribeToNotes('', vi.fn());
            expect(typeof unsub).toBe('function');
            expect(firestore.onSnapshot).not.toHaveBeenCalled();
        });

        it('sets up an onSnapshot listener when userId is provided', () => {
            subscribeToNotes(userId, vi.fn());
            expect(firestore.onSnapshot).toHaveBeenCalled();
        });
    });
});
