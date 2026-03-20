import { useState } from "react";
import { User } from "firebase/auth";
import { Account, Note } from "@/types";
import { Input, Button } from "@/components/ui/Form";
import AreaSelector from "@/components/ui/AreaSelector";
import RichTextArea from "@/components/ui/RichTextArea";
import { useWarnIfUnsavedChanges } from "@/lib/hooks/use-warn-if-unsaved";
import { createNote, updateNote } from "@/lib/firebase/notes";

// --- Types ---
export interface NoteFormData {
    title: string;
    content: string;
    accountId: string;
    type: "text" | "checklist";
}

export interface NoteFormPresenterProps {
    initialData?: Partial<Note>;
    accounts: Account[];
    isSubmitting: boolean;
    onSubmit: (data: NoteFormData) => void;
    onClose: () => void;
}

// --- DUMB PRESENTER ---
export function NoteFormPresenter({
    initialData,
    accounts,
    isSubmitting,
    onSubmit,
    onClose
}: NoteFormPresenterProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");
    const [noteType, setNoteType] = useState<"text" | "checklist">(initialData?.type || "text");

    const hasUnsavedChanges = title.trim().length > 0 || content.trim().length > 0;
    useWarnIfUnsavedChanges(hasUnsavedChanges);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            title, content, accountId, type: noteType
        });
    };

    const handleClose = () => {
        if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
            return;
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideIn 0.3s ease' }}>
            {/* Title */}
            <Input
                placeholder="Note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus={!initialData?.id}
                required
                style={{ fontSize: '1.5rem', padding: '0.5rem 0', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, background: 'transparent' }}
            />

            {/* Note Type (Optional visual context, typically Notes default to text here until rich checklist editor is built) */}
            <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', opacity: 0.9 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                    <input
                        type="radio"
                        name="noteType"
                        checked={noteType === 'text'}
                        onChange={() => setNoteType('text')}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <span>Text Note</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                    <input
                        type="radio"
                        name="noteType"
                        checked={noteType === 'checklist'}
                        onChange={() => setNoteType('checklist')}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <span>Checklist</span>
                </label>
            </div>

            {/* Area Selector */}
            <AreaSelector accounts={accounts} selectedAccountId={accountId} onSelect={setAccountId} label="Assign Area" />

            {/* Content Array */}
            <RichTextArea
                value={content}
                onChange={setContent}
                placeholder="Write your note here... (supports **markdown**)"
                minHeight="200px"
            />

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem' }}>
                <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" disabled={!title || isSubmitting} isLoading={isSubmitting} style={{ flex: 1 }}>
                    {initialData?.id ? "Save Changes" : "Create Note"}
                </Button>
            </div>
        </form>
    );
}

// --- SMART CONTAINER ---
interface NoteFormProps {
    user: User;
    itemId?: string;
    initialData?: Partial<Note>;
    accounts: Account[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function NoteForm({
    user,
    itemId,
    initialData,
    accounts,
    onClose,
    onSuccess
}: NoteFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: NoteFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                title: data.title,
                content: data.content,
                accountId: data.accountId || "",
                type: data.type,
            };

            if (itemId) {
                await updateNote(itemId, payload);
            } else {
                await createNote(user.uid, { ...payload, isPinned: false });
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving note:", error);
            alert("Failed to save note.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <NoteFormPresenter
            initialData={initialData}
            accounts={accounts}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onClose={onClose}
        />
    );
}
