"use client";

import { useState, useEffect } from "react";
import { CreateNoteInput, Note, Account } from "@/types";
import { createNote, updateNote, deleteNote } from "@/lib/firebase/notes";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { ArrowLeft, Save, Trash2, ListChecks, FileText, Plus, X } from "lucide-react";

interface NoteEditorProps {
    existingNote?: Note;
    initialAccountId?: string;
}

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export default function NoteEditor({ existingNote, initialAccountId }: NoteEditorProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [title, setTitle] = useState(existingNote?.title || "");
    const [content, setContent] = useState(existingNote?.content || "");
    const [accountId, setAccountId] = useState(existingNote?.accountId || initialAccountId || "");
    const [isPinned, setIsPinned] = useState(existingNote?.isPinned || false);
    const [isSaving, setIsSaving] = useState(false);

    // Checklist Mode State
    const [mode, setMode] = useState<'text' | 'checklist'>(existingNote?.type === 'checklist' ? 'checklist' : 'text');
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [newItemText, setNewItemText] = useState("");

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToAccounts(user.uid, (data) => {
            setAccounts(data);
            // Default to first account if none selected and not editing
            if (!existingNote && !accountId && data.length > 0) {
                setAccountId(data[0].id);
            }
        });
        return () => unsubscribe();
    }, [user, existingNote, accountId]);

    // Initialize checklist items from content if switching to checklist mode
    useEffect(() => {
        if (mode === 'checklist' && checklistItems.length === 0 && content) {
            const lines = content.split('\n');
            const items: ChecklistItem[] = [];

            lines.forEach((line) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('- [ ] ')) {
                    items.push({ id: crypto.randomUUID(), text: line.replace('- [ ] ', ''), checked: false });
                } else if (trimmed.startsWith('- [x] ')) {
                    items.push({ id: crypto.randomUUID(), text: line.replace('- [x] ', ''), checked: true });
                } else if (trimmed.length > 0) {
                    // Treat plain text lines as unchecked items if just switching
                    items.push({ id: crypto.randomUUID(), text: line, checked: false });
                }
            });
            setChecklistItems(items);
        }
    }, [mode, content]); // Depend on content only for initial load logic effectively

    const handleSave = async () => {
        if (!user || !accountId) return;
        setIsSaving(true);

        let finalContent = content;

        // Serialize checklist if in checklist mode
        if (mode === 'checklist') {
            finalContent = checklistItems.map(item =>
                `- [${item.checked ? 'x' : ' '}] ${item.text}`
            ).join('\n');
        }

        try {
            if (existingNote) {
                await updateNote(existingNote.id, {
                    title,
                    content: finalContent,
                    accountId,
                    isPinned,
                    type: mode
                });
            } else {
                await createNote(user.uid, {
                    title,
                    content: finalContent,
                    accountId,
                    isPinned,
                    type: mode
                });
            }
            router.back();
        } catch (error) {
            console.error("Failed to save note", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingNote || !confirm("Are you sure you want to delete this note?")) return;
        try {
            await deleteNote(existingNote.id);
            router.back();
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    // Checklist Actions
    const addChecklistItem = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newItemText.trim()) return;
        setChecklistItems([...checklistItems, {
            id: crypto.randomUUID(),
            text: newItemText,
            checked: false
        }]);
        setNewItemText("");
    };

    const toggleChecklistItem = (id: string) => {
        setChecklistItems(checklistItems.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const deleteChecklistItem = (id: string) => {
        setChecklistItems(checklistItems.filter(item => item.id !== id));
    };

    const updateChecklistItemText = (id: string, text: string) => {
        setChecklistItems(checklistItems.map(item =>
            item.id === id ? { ...item, text } : item
        ));
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--muted-foreground)'
                    }}
                >
                    <ArrowLeft size={20} />
                    Back
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {existingNote && (
                        <button
                            onClick={handleDelete}
                            style={{
                                padding: '0.5rem',
                                color: 'var(--destructive)',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)'
                            }}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !accountId}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            borderRadius: 'var(--radius)',
                            opacity: (isSaving || !accountId) ? 0.7 : 1
                        }}
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Note Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        width: '100%'
                    }}
                />

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)'
                        }}
                    >
                        <option value="" disabled>Select Account</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                        />
                        Pin to top
                    </label>

                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                        <button
                            onClick={() => setMode('text')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius)',
                                backgroundColor: mode === 'text' ? 'rgba(0,0,0,0.05)' : 'transparent',
                                opacity: mode === 'text' ? 1 : 0.5
                            }}
                        >
                            <FileText size={16} /> Text
                        </button>
                        <button
                            onClick={() => setMode('checklist')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius)',
                                backgroundColor: mode === 'checklist' ? 'rgba(0,0,0,0.05)' : 'transparent',
                                opacity: mode === 'checklist' ? 1 : 0.5
                            }}
                        >
                            <ListChecks size={16} /> List
                        </button>
                    </div>
                </div>

                {mode === 'text' ? (
                    <textarea
                        placeholder="Write your note here... (Markdown supported)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{
                            minHeight: '400px',
                            padding: '1rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            resize: 'vertical',
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            backgroundColor: 'var(--card)'
                        }}
                    />
                ) : (
                    <div style={{
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        {checklistItems.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => toggleChecklistItem(item.id)}
                                    style={{ marginTop: '0.35rem', cursor: 'pointer' }}
                                />
                                <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: 'transparent',
                                        fontSize: '1rem',
                                        color: item.checked ? 'var(--muted-foreground)' : 'var(--foreground)',
                                        textDecoration: item.checked ? 'line-through' : 'none',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={() => deleteChecklistItem(item.id)}
                                    style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}

                        <form onSubmit={addChecklistItem} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                            <Plus size={16} />
                            <input
                                type="text"
                                placeholder="Add item..."
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
