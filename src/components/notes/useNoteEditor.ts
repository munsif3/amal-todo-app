"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Note, Account } from "@/types";
import { useAuth } from "@/lib/firebase/auth-context";
import { createNote, updateNote, deleteNote } from "@/lib/firebase/notes";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { ChecklistItem, parseChecklist, serializeChecklist } from "./note-utils";

interface UseNoteEditorProps {
    existingNote?: Note;
    initialAccountId?: string;
}

export function useNoteEditor({ existingNote, initialAccountId }: UseNoteEditorProps) {
    const router = useRouter();
    const { user } = useAuth();

    // Domain State
    const [title, setTitle] = useState(existingNote?.title || "");
    const [accountId, setAccountId] = useState(existingNote?.accountId || initialAccountId || "");
    const [isPinned, setIsPinned] = useState(existingNote?.isPinned || false);
    const [mode, setModeState] = useState<'text' | 'checklist'>(existingNote?.type === 'checklist' ? 'checklist' : 'text');

    // Content State
    const [content, setContent] = useState(existingNote?.content || "");
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

    // UI/Async State
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [noteId, setNoteId] = useState<string | undefined>(existingNote?.id);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Accounts
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToAccounts(user.uid, (data) => {
            setAccounts(data);
            if (!existingNote && !accountId && data.length > 0) {
                setAccountId(data[0].id);
            }
        });
        return () => unsubscribe();
    }, [user, existingNote, accountId]);

    // Initial parsing if loading a checklist note
    useEffect(() => {
        if (existingNote?.type === 'checklist' && existingNote.content) {
            setChecklistItems(parseChecklist(existingNote.content));
        }
    }, [existingNote]);

    // Mode Switching Logic
    const setMode = useCallback((newMode: 'text' | 'checklist') => {
        if (newMode === mode) return;

        if (newMode === 'checklist') {
            // Switching from Text -> Checklist
            // Parse current text content into items
            const parsed = parseChecklist(content);
            setChecklistItems(parsed);
        } else {
            // Switching from Checklist -> Text
            // Serialize items back to text
            const serialized = serializeChecklist(checklistItems);
            setContent(serialized);
        }
        setModeState(newMode);
    }, [mode, content, checklistItems]);

    // Checklist Operations
    const addChecklistItem = useCallback((text: string) => {
        const newItem: ChecklistItem = { id: crypto.randomUUID(), text, checked: false };
        setChecklistItems(prev => [...prev, newItem]);
    }, []);

    const updateChecklistItem = useCallback((id: string, text: string) => {
        setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, text } : item));
    }, []);

    const toggleChecklistItem = useCallback((id: string) => {
        setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    }, []);

    const deleteChecklistItem = useCallback((id: string) => {
        setChecklistItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // Persistence Logic
    const save = useCallback(async (shouldExit: boolean = true) => {
        if (!user || !accountId) {
            setError("Missing user or account information.");
            return;
        }
        setIsSaving(true);
        setError(null);

        try {
            // Determine final content based on current mode
            const finalContent = mode === 'checklist'
                ? serializeChecklist(checklistItems)
                : content;

            const noteData = {
                title,
                content: finalContent,
                accountId,
                isPinned,
                type: mode
            };

            if (noteId) {
                await updateNote(noteId, noteData);
            } else {
                const newNoteRef = await createNote(user.uid, noteData);
                setNoteId(newNoteRef.id);
            }

            setLastSavedAt(new Date());
            setIsDirty(false);

            if (shouldExit) {
                router.back();
            }
        } catch (err: any) {
            console.error("Failed to save note", err);
            setError(err.message || "Failed to save note.");
        } finally {
            setIsSaving(false);
        }
    }, [user, accountId, mode, checklistItems, content, title, isPinned, noteId, router]);

    // Auto-save Effect
    useEffect(() => {
        // Skip auto-save if not dirty or essential data missing
        if (!isDirty || !user || !accountId) return;

        const timeoutId = setTimeout(() => {
            save(false);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [title, content, checklistItems, isPinned, accountId, isDirty, user, save]);

    // Better approach: Wrap Setters or use a dedicated effect that skips first run
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setIsDirty(true);
    }, [title, content, checklistItems, isPinned, accountId, mode]);

    const remove = async () => {
        if (!noteId || !confirm("Are you sure you want to delete this note?")) return;
        try {
            await deleteNote(noteId);
            router.back();
        } catch (err: any) {
            console.error("Failed to delete note", err);
            setError(err.message || "Failed to delete note.");
        }
    };

    const dismissError = useCallback(() => setError(null), []);

    return {
        metadata: {
            title, setTitle,
            accountId, setAccountId,
            isPinned, setIsPinned,
            accounts
        },
        modeState: {
            mode, setMode
        },
        contentState: {
            content, setContent
        },
        checklistState: {
            items: checklistItems,
            addItem: addChecklistItem,
            updateItem: updateChecklistItem,
            toggleItem: toggleChecklistItem,
            deleteItem: deleteChecklistItem,
            reorderItems: (newItems: ChecklistItem[]) => setChecklistItems(newItems)
        },
        actions: {
            save: () => save(true),
            remove,
            isSaving,
            canSave: !isSaving && !!accountId,
            lastSavedAt,
            isDirty,
            error,
            dismissError
        }
    };
}
