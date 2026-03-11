"use client";

import { useState, useEffect } from "react";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { Account, Delegation, DelegationSubtask } from "@/types";
import { Input, Textarea, Button } from "@/components/ui/Form";
import AreaSelector from "@/components/ui/AreaSelector";
import { Timestamp } from "firebase/firestore";
import { Plus, X } from "lucide-react";

interface DelegationFormProps {
    userId: string;
    initialData?: Partial<Delegation>;
    onSubmit: (data: Partial<Delegation>) => Promise<void>;
    onDelete?: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
}

export default function DelegationForm({
    userId,
    initialData,
    onSubmit,
    onDelete,
    submitLabel = "Save",
    isSubmitting = false,
}: DelegationFormProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [assignee, setAssignee] = useState(initialData?.assignee || "");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");
    const [subtasks, setSubtasks] = useState<DelegationSubtask[]>(initialData?.subtasks || []);
    const [newSubtask, setNewSubtask] = useState("");

    const formatTimestampToInput = (ts?: Timestamp | null) => {
        if (!ts) return "";
        const date = ts.toDate();
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().slice(0, 16);
    };

    const [deadline, setDeadline] = useState(formatTimestampToInput(initialData?.deadline));

    useEffect(() => {
        if (userId) {
            const unsubscribe = subscribeToAccounts(userId, setAccounts);
            return () => unsubscribe();
        }
    }, [userId]);

    const addSubtask = () => {
        if (!newSubtask.trim()) return;
        setSubtasks([...subtasks, {
            id: crypto.randomUUID(),
            title: newSubtask.trim(),
            isCompleted: false,
        }]);
        setNewSubtask("");
    };

    const removeSubtask = (id: string) => {
        setSubtasks(subtasks.filter(s => s.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        await onSubmit({
            title,
            description,
            assignee,
            accountId: accountId || null,
            deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
            subtasks,
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '600px' }}>
            <Input
                label="Delegation Title"
                placeholder="e.g. Q2 Platform Migration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                id="delegation-title"
            />

            <Input
                label="Assigned To"
                placeholder="e.g. Sarah K."
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                id="delegation-assignee"
            />

            <Textarea
                label="Context / Expected Outcome"
                placeholder="Describe what success looks like..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                id="delegation-description"
            />

            <Input
                type="datetime-local"
                label="Target Deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                id="delegation-deadline"
            />

            <AreaSelector
                accounts={accounts}
                selectedAccountId={accountId}
                onSelect={(id) => setAccountId(id)}
            />

            {/* Subtasks Manager */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                    Subtasks
                </label>

                {subtasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {subtasks.map((st) => (
                            <div key={st.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                backgroundColor: 'var(--card-bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                            }}>
                                <span style={{ flex: 1, fontSize: '0.875rem' }}>{st.title}</span>
                                <button
                                    type="button"
                                    onClick={() => removeSubtask(st.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '2px',
                                        display: 'flex',
                                    }}
                                    aria-label={`Remove subtask: ${st.title}`}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Add a subtask..."
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addSubtask();
                            }
                        }}
                        id="delegation-new-subtask"
                        style={{
                            flex: 1,
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card-bg)',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                        }}
                    />
                    <button
                        type="button"
                        onClick={addSubtask}
                        disabled={!newSubtask.trim()}
                        style={{
                            padding: '0.6rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            border: 'none',
                            cursor: newSubtask.trim() ? 'pointer' : 'not-allowed',
                            opacity: newSubtask.trim() ? 1 : 0.4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        aria-label="Add subtask"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button type="submit" disabled={isSubmitting || !title} isLoading={isSubmitting}>
                    {submitLabel}
                </Button>
                {onDelete && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onDelete}
                        style={{ marginLeft: 'auto', color: 'var(--destructive)' }}
                        disabled={isSubmitting}
                    >
                        Delete
                    </Button>
                )}
            </div>
        </form>
    );
}
