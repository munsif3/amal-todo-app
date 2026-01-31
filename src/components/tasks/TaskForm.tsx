"use client";

import { useState, useEffect } from "react";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { Account, Task } from "@/types";
import { Input, Textarea, Button } from "@/components/ui/Form";
import { Timestamp } from "firebase/firestore";

import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";

interface TaskFormProps {
    userId: string;
    initialData?: Partial<Task>;
    onSubmit: (data: Partial<Task>) => Promise<void>;
    submitLabel?: string;
    isSubmitting?: boolean;
}

export default function TaskForm({ userId, initialData, onSubmit, submitLabel = "Save", isSubmitting = false }: TaskFormProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");

    // Helper to format Timestamp to YYYY-MM-DDTHH:MM for input
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        await onSubmit({
            title,
            description,
            accountId: accountId || null,
            deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                label="What needs to be done?"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
            />

            <Textarea
                label="Context / Details"
                placeholder="Briefly describe the outcome..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <Input
                type="datetime-local"
                label="Due Date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
            />

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', opacity: 0.7 }}>Area</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {accounts.map(acc => {
                        const isSelected = accountId === acc.id;
                        const color = acc.color || DEFAULT_ACCOUNT_COLOR;

                        return (
                            <button
                                key={acc.id}
                                type="button"
                                onClick={() => setAccountId(isSelected ? "" : acc.id)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    border: `1px solid ${color}`,
                                    backgroundColor: isSelected ? color : 'transparent',
                                    color: isSelected ? 'white' : 'var(--foreground)',
                                    opacity: isSelected ? 1 : 0.7,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {acc.name}
                            </button>
                        );
                    })}
                    {accounts.length === 0 && (
                        <p style={{ fontSize: '0.875rem', opacity: 0.5, fontStyle: 'italic' }}>
                            No areas created yet.
                        </p>
                    )}
                </div>
            </div>

            <Button type="submit" disabled={isSubmitting || !title}>
                {isSubmitting ? "Saving..." : submitLabel}
            </Button>
        </form>
    );
}
