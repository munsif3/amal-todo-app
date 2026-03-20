import { useState } from "react";
import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { Account, Delegation, DelegationSubtask } from "@/types";
import { Input, Button } from "@/components/ui/Form";
import AreaSelector from "@/components/ui/AreaSelector";
import RichTextArea from "@/components/ui/RichTextArea";
import { Calendar, User as UserIcon, X, Plus } from "lucide-react";
import { useWarnIfUnsavedChanges } from "@/lib/hooks/use-warn-if-unsaved";
import { createDelegation, updateDelegation } from "@/lib/firebase/delegations";
import { toLocalDatetimeString } from "@/lib/utils/date-helpers";

// --- Types ---
export interface DelegationFormData {
    title: string;
    description: string;
    assignee: string;
    accountId: string;
    deadlineStr: string;
    subtasks: DelegationSubtask[];
}

export interface DelegationFormPresenterProps {
    initialData?: Partial<Delegation>;
    accounts: Account[];
    defaultDeadlineStr?: string;
    isSubmitting: boolean;
    onSubmit: (data: DelegationFormData) => void;
    onClose: () => void;
}

// --- DUMB PRESENTER ---
export function DelegationFormPresenter({
    initialData,
    accounts,
    defaultDeadlineStr,
    isSubmitting,
    onSubmit,
    onClose
}: DelegationFormPresenterProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");
    const [assignee, setAssignee] = useState(initialData?.assignee || "");
    const [delegationSubtasks, setDelegationSubtasks] = useState<DelegationSubtask[]>(initialData?.subtasks || []);
    const [newDelegationSubtask, setNewDelegationSubtask] = useState("");

    const [deadlineStr, setDeadlineStr] = useState(() => {
        if (initialData?.deadline) {
            return toLocalDatetimeString(initialData.deadline.toDate());
        }
        return defaultDeadlineStr || "";
    });

    const hasUnsavedChanges = title.trim().length > 0 || description.trim().length > 0;
    useWarnIfUnsavedChanges(hasUnsavedChanges);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !assignee.trim()) return;
        onSubmit({
            title, description, assignee, accountId, deadlineStr, subtasks: delegationSubtasks
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
                placeholder="e.g. Q2 Platform Migration"
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

            {/* Delegation Specifics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid #4b6584' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>Delegation Details</h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ opacity: 0.5 }}><UserIcon size={18} /></span>
                    <Input
                        placeholder="Assigned to (e.g. Sarah K.)"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        required
                        style={{ flex: 1 }}
                    />
                </div>

                {/* Subtasks list */}
                {delegationSubtasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {delegationSubtasks.map((st) => (
                            <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <span style={{ flex: 1, fontSize: '0.875rem' }}>{st.title}</span>
                                <button type="button" onClick={() => setDelegationSubtasks(delegationSubtasks.filter(s => s.id !== st.id))} style={{ opacity: 0.5, padding: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add subtask */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Input
                        placeholder="Add a subtask..."
                        value={newDelegationSubtask}
                        onChange={(e) => setNewDelegationSubtask(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newDelegationSubtask.trim()) {
                                e.preventDefault();
                                setDelegationSubtasks([...delegationSubtasks, { id: crypto.randomUUID(), title: newDelegationSubtask.trim(), isCompleted: false }]);
                                setNewDelegationSubtask("");
                            }
                        }}
                        style={{ flex: 1 }}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={!newDelegationSubtask.trim()}
                        onClick={() => {
                            if (!newDelegationSubtask.trim()) return;
                            setDelegationSubtasks([...delegationSubtasks, { id: crypto.randomUUID(), title: newDelegationSubtask.trim(), isCompleted: false }]);
                            setNewDelegationSubtask("");
                        }}
                        style={{ padding: '0.5rem' }}
                    >
                        <Plus size={16} />
                    </Button>
                </div>
            </div>

            {/* Description / Notes */}
            <RichTextArea
                value={description}
                onChange={setDescription}
                placeholder="Details, context, or notes... (supports **markdown**)"
                minHeight="120px"
            />

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem' }}>
                <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" disabled={!title || !assignee || isSubmitting} isLoading={isSubmitting} style={{ flex: 1 }}>
                    {initialData?.id ? "Save Changes" : "Create Delegation"}
                </Button>
            </div>
        </form>
    );
}

// --- SMART CONTAINER ---
interface DelegationFormProps {
    user: User;
    itemId?: string;
    initialData?: Partial<Delegation>;
    accounts: Account[];
    defaultDeadlineStr?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DelegationForm({
    user,
    itemId,
    initialData,
    accounts,
    defaultDeadlineStr,
    onClose,
    onSuccess
}: DelegationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: DelegationFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                title: data.title,
                description: data.description,
                assignee: data.assignee,
                accountId: data.accountId || null,
                deadline: data.deadlineStr ? Timestamp.fromDate(new Date(data.deadlineStr)) : null,
                subtasks: data.subtasks,
            };

            if (itemId) {
                await updateDelegation(itemId, payload);
            } else {
                await createDelegation(user.uid, payload);
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving delegation:", error);
            alert("Failed to save delegation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DelegationFormPresenter
            initialData={initialData}
            accounts={accounts}
            defaultDeadlineStr={defaultDeadlineStr}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onClose={onClose}
        />
    );
}
