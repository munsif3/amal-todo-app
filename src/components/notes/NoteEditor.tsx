"use client";

import { useState } from "react";
import { ArrowLeft, Save, Trash2, ListChecks, FileText, Plus, X } from "lucide-react";
import { Note } from "@/types";
import { useNoteEditor } from "./useNoteEditor";
import { ChecklistItem } from "./note-utils";
import { useRouter } from "next/navigation";

interface NoteEditorProps {
    existingNote?: Note;
    initialAccountId?: string;
}

export default function NoteEditor(props: NoteEditorProps) {
    const {
        metadata,
        modeState,
        contentState,
        checklistState,
        actions
    } = useNoteEditor(props);

    const { router } = useNoteEditorRouter(); // Helper for pure routing actions if needed, or just use actions.

    return (
        <div style={styles.container}>
            <NoteToolbar
                onBack={() => history.back()} // Or router.back(), handled by custom hook usually? 
                // Wait, hook handles back in 'save'/'remove', but we need a plain back button.
                // The hook already imported useRouter. Let's start clean.
                // We'll pass a simple back handler.
                onSave={actions.save}
                onDelete={props.existingNote ? actions.remove : undefined}
                isSaving={actions.isSaving}
                canSave={actions.canSave}
            />

            <div style={styles.contentStack}>
                <NoteHeader
                    title={metadata.title}
                    setTitle={metadata.setTitle}
                    accountId={metadata.accountId}
                    setAccountId={metadata.setAccountId}
                    isPinned={metadata.isPinned}
                    setIsPinned={metadata.setIsPinned}
                    accounts={metadata.accounts}
                    mode={modeState.mode}
                    setMode={modeState.setMode}
                />

                {modeState.mode === 'text' ? (
                    <TextEditor
                        content={contentState.content}
                        setContent={contentState.setContent}
                    />
                ) : (
                    <ChecklistEditor
                        items={checklistState.items}
                        onToggle={checklistState.toggleItem}
                        onUpdate={checklistState.updateItem}
                        onDelete={checklistState.deleteItem}
                        onAdd={checklistState.addItem}
                    />
                )}
            </div>
        </div>
    );
}

// --- Sub Components ---

/* 
   Note: We extracted the router usage in the parent or hook. 
   Ideally, the View components shouldn't know about Next.js Router.
   We'll duplicate the back button logic here simpler: 
*/
const useNoteEditorRouter = () => {
    const router = useRouter();
    return { router };
}

function NoteToolbar({
    onBack,
    onSave,
    onDelete,
    isSaving,
    canSave
}: {
    onBack?: () => void,
    onSave: () => void,
    onDelete?: () => void,
    isSaving: boolean,
    canSave: boolean
}) {
    const router = useRouter();
    const handleBack = onBack || router.back;

    return (
        <div style={styles.toolbar}>
            <button onClick={handleBack} style={styles.backButton}>
                <ArrowLeft size={20} />
                Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    {isSaving ? 'Saving...' : 'Saved'}
                </div>
                {onDelete && (
                    <button onClick={onDelete} style={styles.deleteButton}>
                        <Trash2 size={20} />
                    </button>
                )}
                <button
                    onClick={onSave}
                    disabled={!canSave}
                    style={{
                        ...styles.saveButton,
                        opacity: canSave ? 1 : 0.7,
                        cursor: canSave ? 'pointer' : 'not-allowed'
                    }}
                >
                    <Save size={18} />
                    Save
                </button>
            </div>
        </div>
    );
}

function NoteHeader({
    title, setTitle,
    accountId, setAccountId,
    isPinned, setIsPinned,
    accounts,
    mode, setMode
}: {
    title: string, setTitle: (s: string) => void,
    accountId: string, setAccountId: (s: string) => void,
    isPinned: boolean, setIsPinned: (b: boolean) => void,
    accounts: any[],
    mode: 'text' | 'checklist', setMode: (m: 'text' | 'checklist') => void
}) {
    return (
        <>
            <input
                type="text"
                placeholder="Note Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.titleInput}
            />

            <div style={styles.controlsRow}>
                <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    style={styles.select}
                >
                    <option value="" disabled>Select Account</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>

                <label style={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                    />
                    Pin to top
                </label>

                <div style={styles.modeToggleGroup}>
                    <ModeButton
                        isActive={mode === 'text'}
                        onClick={() => setMode('text')}
                        icon={<FileText size={16} />}
                        label="Text"
                    />
                    <ModeButton
                        isActive={mode === 'checklist'}
                        onClick={() => setMode('checklist')}
                        icon={<ListChecks size={16} />}
                        label="List"
                    />
                </div>
            </div>
        </>
    );
}

function ModeButton({ isActive, onClick, icon, label }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            style={{
                ...styles.modeButton,
                backgroundColor: isActive ? 'rgba(0,0,0,0.05)' : 'transparent',
                opacity: isActive ? 1 : 0.5
            }}
        >
            {icon} {label}
        </button>
    );
}

function TextEditor({ content, setContent }: { content: string, setContent: (s: string) => void }) {
    return (
        <textarea
            placeholder="Write your note here... (Markdown supported)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textArea}
        />
    );
}

function ChecklistEditor({
    items,
    onToggle,
    onUpdate,
    onDelete,
    onAdd
}: {
    items: ChecklistItem[],
    onToggle: (id: string) => void,
    onUpdate: (id: string, text: string) => void,
    onDelete: (id: string) => void,
    onAdd: (text: string) => void
}) {
    const [newItemText, setNewItemText] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        onAdd(newItemText);
        setNewItemText("");
    };

    return (
        <div style={styles.checklistContainer}>
            {items.map(item => (
                <div key={item.id} style={styles.checklistItem}>
                    <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => onToggle(item.id)}
                        style={{ marginTop: '0.35rem', cursor: 'pointer' }}
                    />
                    <input
                        type="text"
                        value={item.text}
                        onChange={(e) => onUpdate(item.id, e.target.value)}
                        style={{
                            ...styles.checklistInput,
                            color: item.checked ? 'var(--muted-foreground)' : 'var(--foreground)',
                            textDecoration: item.checked ? 'line-through' : 'none',
                        }}
                    />
                    <button
                        onClick={() => onDelete(item.id)}
                        style={styles.deleteItemButton}
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}

            <form onSubmit={handleSubmit} style={styles.addItemForm}>
                <Plus size={16} />
                <input
                    type="text"
                    placeholder="Add item..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    style={styles.addItemInput}
                />
            </form>
        </div>
    );
}

// --- Styles ---
// Extracted to keep the render clean. 
// Using CSS variables as per original, but organized.

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '1rem'
    },
    contentStack: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem'
    },
    // Toolbar
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--muted-foreground)'
    },
    deleteButton: {
        padding: '0.5rem',
        color: 'var(--destructive)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)'
    },
    saveButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--primary)',
        color: 'white',
        borderRadius: 'var(--radius)',
    },
    // Metadata
    titleInput: {
        fontSize: '1.5rem',
        fontWeight: '700',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        width: '100%'
    },
    controlsRow: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap' as const
    },
    select: {
        padding: '0.5rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--background)'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem'
    },
    modeToggleGroup: {
        display: 'flex',
        gap: '0.5rem',
        marginLeft: 'auto'
    },
    modeButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        borderRadius: 'var(--radius)',
    },
    // Text Editor
    textArea: {
        minHeight: '400px',
        padding: '1rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        resize: 'vertical' as const,
        fontFamily: 'monospace',
        fontSize: '1rem',
        lineHeight: '1.6',
        backgroundColor: 'var(--card)',
        width: '100%'
    },
    // Checklist
    checklistContainer: {
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem'
    },
    checklistItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
    },
    checklistInput: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        fontSize: '1rem',
        outline: 'none'
    },
    deleteItemButton: {
        color: 'var(--muted-foreground)',
        opacity: 0.5
    },
    addItemForm: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginTop: '0.5rem',
        opacity: 0.7
    },
    addItemInput: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        fontSize: '1rem',
        outline: 'none'
    }
};
