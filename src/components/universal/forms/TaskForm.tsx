import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { Account, Task, Subtask } from "@/types";
import { Epic as CockpitEpic } from "@/lib/firebase/cockpit";
import { Input, Button } from "@/components/ui/Form";
import AreaSelector from "@/components/ui/AreaSelector";
import RichTextArea from "@/components/ui/RichTextArea";
import { Calendar, X, User as UserIcon, Plus, Kanban } from "lucide-react";
import { useWarnIfUnsavedChanges } from "@/lib/hooks/use-warn-if-unsaved";
import { createTask, updateTask } from "@/lib/firebase/tasks";
import { toLocalDatetimeString } from "@/lib/utils/date-helpers";

// --- Types ---
export interface TaskFormData {
    title: string;
    description: string;
    accountId: string;
    deadlineStr: string;
    isFrog: boolean;
    isTwoMinute: boolean;
    isPriority: boolean;
    subtasks: Subtask[];
    epicId: string | null;
    epicName: string | null;
}

export interface TaskFormPresenterProps {
    initialData?: Partial<Task>;
    accounts: Account[];
    availableEpics: CockpitEpic[];
    defaultDeadlineStr?: string;
    isSubmitting: boolean;
    onSubmit: (data: TaskFormData) => void;
    onClose: () => void;
}

// --- DUMB PRESENTER ---
export function TaskFormPresenter({
    initialData,
    accounts,
    availableEpics,
    defaultDeadlineStr,
    isSubmitting,
    onSubmit,
    onClose
}: TaskFormPresenterProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");
    
    const [isFrog, setIsFrog] = useState(initialData?.isFrog || false);
    const [isTwoMinute, setIsTwoMinute] = useState(initialData?.isTwoMinute || false);
    const [isPriority, setIsPriority] = useState(initialData?.isPriority || false);
    const [subtasks, setSubtasks] = useState<Subtask[]>(initialData?.subtasks || []);
    
    // Convert timestamp to local string if editing, otherwise use default
    const [deadlineStr, setDeadlineStr] = useState(() => {
        if (initialData?.deadline) {
            return toLocalDatetimeString(initialData.deadline.toDate());
        }
        return defaultDeadlineStr || "";
    });

    const [epicId, setEpicId] = useState<string | null>(initialData?.epicId || null);

    const hasUnsavedChanges = title.trim().length > 0 || (description && description.trim().length > 0) || false;
    useWarnIfUnsavedChanges(hasUnsavedChanges);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            title, description, accountId, deadlineStr, isFrog, isTwoMinute, isPriority, subtasks, epicId, epicName: epicId ? availableEpics.find(e => e.id === epicId)?.name || null : null
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
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus={!initialData?.id}
                required
                style={{ fontSize: '1.5rem', padding: '0.5rem 0', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, background: 'transparent' }}
            />

            {/* Deadline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ opacity: 0.5 }}><Calendar size={18} /></span>
                <Input
                    type="datetime-local"
                    value={deadlineStr}
                    onChange={(e) => setDeadlineStr(e.target.value)}
                    placeholder="Deadline (optional)"
                    style={{ flex: 1 }}
                />
            </div>

            {/* Area Selector */}
            <AreaSelector accounts={accounts} selectedAccountId={accountId} onSelect={setAccountId} label="Assign Area" />

            {/* Epic Selector (Only if Work area selected and epics exist) */}
            {(() => {
                const selectedAccount = accounts.find(a => a.id === accountId);
                const isWorkArea = selectedAccount?.name.toLowerCase() === 'work';
                if (!isWorkArea || availableEpics.length === 0) return null;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ opacity: 0.5 }}><Kanban size={18} /></span>
                        <select
                            value={epicId || ''}
                            onChange={(e) => setEpicId(e.target.value || null)}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.875rem' }}
                        >
                            <option value="">No Epic (standalone task)</option>
                            {availableEpics.map(epic => (
                                <option key={epic.id} value={epic.id}>{epic.name}</option>
                            ))}
                        </select>
                    </div>
                );
            })()}

            {/* Description */}
            <RichTextArea
                value={description}
                onChange={setDescription}
                placeholder="Details, context, or notes... (supports **markdown**)"
                minHeight="120px"
            />

            {/* Requirements / Subtasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>Requirements</h4>
                {subtasks.map((subtask, index) => (
                    <div key={subtask.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            checked={subtask.isCompleted}
                            onChange={(e) => {
                                const newSubtasks = [...subtasks];
                                newSubtasks[index].isCompleted = e.target.checked;
                                setSubtasks(newSubtasks);
                            }}
                            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <Input
                            placeholder="Requirement title"
                            value={subtask.title}
                            onChange={(e) => {
                                const newSubtasks = [...subtasks];
                                newSubtasks[index].title = e.target.value;
                                setSubtasks(newSubtasks);
                            }}
                            style={{ flex: 1 }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.5rem', background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: '0 0.5rem', border: '1px solid var(--border)' }}>
                            <UserIcon size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="Assignee (optional)"
                                value={subtask.assignee || ''}
                                onChange={(e) => {
                                    const newSubtasks = [...subtasks];
                                    newSubtasks[index].assignee = e.target.value;
                                    setSubtasks(newSubtasks);
                                }}
                                style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.5rem 0', outline: 'none', fontSize: '0.875rem', color: 'var(--foreground)' }}
                            />
                        </div>
                        <button type="button" onClick={() => setSubtasks(subtasks.filter((_, i) => i !== index))} style={{ opacity: 0.5, padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <X size={16} />
                        </button>
                    </div>
                ))}
                <Button type="button" variant="secondary" onClick={() => setSubtasks([...subtasks, { id: crypto.randomUUID(), title: '', isCompleted: false }])} style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Plus size={16} /> Add Requirement
                </Button>
            </div>

            {/* Gamification Toggles */}
            <div className="mobile-wrap" style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--accent-sage)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="isPriority" checked={isPriority} onChange={(e) => setIsPriority(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                    <label htmlFor="isPriority" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>⭐ Priority Today</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="isFrog" checked={isFrog} onChange={(e) => setIsFrog(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                    <label htmlFor="isFrog" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>🐸 Eat the Frog</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="isTwoMinute" checked={isTwoMinute} onChange={(e) => setIsTwoMinute(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                    <label htmlFor="isTwoMinute" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>⚡ 2-Minute Rule</label>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem' }}>
                <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" disabled={!title || isSubmitting} isLoading={isSubmitting} style={{ flex: 1 }}>
                    {initialData?.id ? "Save Changes" : "Create Item"}
                </Button>
            </div>
        </form>
    );
}

// --- SMART CONTAINER ---
interface TaskFormContainerProps {
    user: User;
    itemId?: string;
    initialData?: Partial<Task>;
    accounts: Account[];
    availableEpics: CockpitEpic[];
    defaultDeadlineStr?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TaskForm({
    user,
    itemId,
    initialData,
    accounts,
    availableEpics,
    defaultDeadlineStr,
    onClose,
    onSuccess
}: TaskFormContainerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: TaskFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                title: data.title,
                description: data.description,
                accountId: data.accountId || null,
                deadline: data.deadlineStr ? Timestamp.fromDate(new Date(data.deadlineStr)) : null,
                isFrog: data.isFrog,
                isTwoMinute: data.isTwoMinute,
                isPriority: data.isPriority,
                subtasks: data.subtasks,
                epicId: data.epicId || null,
                epicName: data.epicName || null,
            };

            if (itemId) {
                await updateTask(itemId, payload);
            } else {
                await createTask(user.uid, { ...payload, status: 'next' });
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Failed to save task.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <TaskFormPresenter
            initialData={initialData}
            accounts={accounts}
            availableEpics={availableEpics}
            defaultDeadlineStr={defaultDeadlineStr}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onClose={onClose}
        />
    );
}
