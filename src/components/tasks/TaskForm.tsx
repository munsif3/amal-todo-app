"use client";

import { useState, useEffect } from "react";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { subscribeToTasks } from "@/lib/firebase/tasks";
import { Account, Task } from "@/types";
import { Input, Textarea, Button } from "@/components/ui/Form";
import AreaSelector from "@/components/ui/AreaSelector";
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
    const [tasks, setTasks] = useState<Task[]>([]);
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
    const [emailSubject, setEmailSubject] = useState("");
    const [emailLink, setEmailLink] = useState("");
    const [dependencies, setDependencies] = useState<string[]>(initialData?.dependencies || []);

    useEffect(() => {
        if (initialData?.references) {
            const emailRef = initialData.references.find(r => r.type === 'email');
            if (emailRef) {
                setEmailSubject(emailRef.label);
                setEmailLink(emailRef.url || "");
            }
        }
        if (initialData?.dependencies) {
            setDependencies(initialData.dependencies);
        }
    }, [initialData]);

    useEffect(() => {
        if (userId) {
            const unsubscribeAccounts = subscribeToAccounts(userId, setAccounts);
            const unsubscribeTasks = subscribeToTasks(userId, setTasks);
            return () => {
                unsubscribeAccounts();
                unsubscribeTasks();
            };
        }
    }, [userId]);

    // Filter available tasks for dependencies: exclude self and done tasks
    const availableTasks = tasks.filter(t => t.id !== initialData?.id && t.status !== 'done');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        const references = [];
        if (emailSubject || emailLink) {
            references.push({
                type: 'email' as const,
                label: emailSubject || "No Subject",
                url: emailLink
            });
        }

        await onSubmit({
            title,
            description,
            accountId: accountId || null,
            deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
            dependencies,
            references,
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

            <AreaSelector
                accounts={accounts}
                selectedAccountId={accountId}
                onSelect={(id) => setAccountId(id)}
            />

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: '#666' }}>Email Reference</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Email Subject"
                        placeholder="Subject line..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                    />
                    <Input
                        label="Email Link / Deep Link"
                        placeholder="message://... or https://..."
                        value={emailLink}
                        onChange={(e) => setEmailLink(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', opacity: 0.7 }}>Blocked By (Dependencies)</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem' }}>
                    {availableTasks.length === 0 ? (
                        <p style={{ fontSize: '0.875rem', color: '#888', fontStyle: 'italic', padding: '0.5rem' }}>No other active tasks to block this one.</p>
                    ) : (
                        availableTasks.map(t => (
                            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={dependencies.includes(t.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setDependencies([...dependencies, t.id]);
                                        } else {
                                            setDependencies(dependencies.filter(id => id !== t.id));
                                        }
                                    }}
                                />
                                <span style={{ fontSize: '0.875rem' }}>{t.title}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>

            <Button type="submit" disabled={isSubmitting || !title}>
                {isSubmitting ? "Saving..." : submitLabel}
            </Button>
        </form>
    );
}
