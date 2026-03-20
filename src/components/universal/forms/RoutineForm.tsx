import { useState } from "react";
import { User } from "firebase/auth";
import { Account, Routine } from "@/types";
import { Input, Button } from "@/components/ui/Form";
import AreaSelector from "@/components/ui/AreaSelector";
import { Calendar, Repeat } from "lucide-react";
import { useWarnIfUnsavedChanges } from "@/lib/hooks/use-warn-if-unsaved";
import { createRoutine, updateRoutine } from "@/lib/firebase/routines";

// --- Types ---
export interface RoutineFormData {
    title: string;
    accountId: string;
    schedule: "daily" | "weekly" | "monthly" | "custom";
    days: number[];
    monthDay: number;
    time: string;
}

export interface RoutineFormPresenterProps {
    initialData?: Partial<Routine>;
    accounts: Account[];
    defaultTime?: string;
    isSubmitting: boolean;
    onSubmit: (data: RoutineFormData) => void;
    onClose: () => void;
}

// --- DUMB PRESENTER ---
export function RoutineFormPresenter({
    initialData,
    accounts,
    defaultTime,
    isSubmitting,
    onSubmit,
    onClose
}: RoutineFormPresenterProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");
    const [routineSchedule, setRoutineSchedule] = useState(initialData?.schedule || "daily");
    const [routineDays, setRoutineDays] = useState<number[]>(initialData?.days || []);
    const [routineMonthDay, setRoutineMonthDay] = useState<number>(initialData?.monthDay || 1);
    const [routineTime, setRoutineTime] = useState(initialData?.time || defaultTime || "09:30");

    const hasUnsavedChanges = title.trim().length > 0;
    useWarnIfUnsavedChanges(hasUnsavedChanges);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            title, accountId, schedule: routineSchedule as "daily" | "weekly" | "monthly" | "custom", days: routineDays, monthDay: routineMonthDay, time: routineTime
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
                placeholder="Name of routine..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus={!initialData?.id}
                required
                style={{ fontSize: '1.5rem', padding: '0.5rem 0', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, background: 'transparent' }}
            />

            {/* Area Selector */}
            <AreaSelector accounts={accounts} selectedAccountId={accountId} onSelect={setAccountId} label="Assign Area" />

            {/* Routine Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>Routine Schedule</h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ opacity: 0.5 }}><Calendar size={18} /></span>
                    <Input
                        type="time"
                        value={routineTime}
                        onChange={(e) => setRoutineTime(e.target.value)}
                        style={{ flex: 1, cursor: 'pointer' }}
                        placeholder="Time (optional)"
                    />
                    <span style={{ fontSize: '0.875rem', opacity: 0.5 }}>(Optional)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ opacity: 0.5 }}><Repeat size={18} /></span>
                    <select
                        value={routineSchedule}
                        onChange={(e) => setRoutineSchedule(e.target.value as any)}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', flex: 1, cursor: 'pointer' }}
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                {routineSchedule === 'weekly' && (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                            const isSelected = routineDays.includes(index);
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setRoutineDays(prev => prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index])}
                                    style={{
                                        width: '36px', height: '36px',
                                        borderRadius: '50%',
                                        border: isSelected ? 'none' : '1px solid var(--border)',
                                        background: isSelected ? 'var(--primary)' : 'var(--card-bg)',
                                        color: isSelected ? 'var(--primary-foreground)' : 'var(--foreground)',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem', fontWeight: '600',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                )}

                {routineSchedule === 'monthly' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '2.5rem' }}>
                        <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>On the</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Input
                                type="number"
                                min="1" max="31"
                                value={routineMonthDay}
                                onChange={(e) => setRoutineMonthDay(parseInt(e.target.value) || 1)}
                                style={{ width: '60px', textAlign: 'center', background: 'var(--card-bg)' }}
                            />
                            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>day of the month</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem' }}>
                <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" disabled={!title || isSubmitting} isLoading={isSubmitting} style={{ flex: 1 }}>
                    {initialData?.id ? "Save Changes" : "Create Routine"}
                </Button>
            </div>
        </form>
    );
}

// --- SMART CONTAINER ---
interface RoutineFormProps {
    user: User;
    itemId?: string;
    initialData?: Partial<Routine>;
    accounts: Account[];
    defaultTime?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RoutineForm({
    user,
    itemId,
    initialData,
    accounts,
    defaultTime,
    onClose,
    onSuccess
}: RoutineFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: RoutineFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                title: data.title,
                accountId: data.accountId || null,
                schedule: data.schedule,
                days: data.days,
                monthDay: data.monthDay,
                time: data.time || undefined,
            };

            if (itemId) {
                await updateRoutine(itemId, payload);
            } else {
                await createRoutine(user.uid, { ...payload, type: 'fixed', isShared: false });
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving routine:", error);
            alert("Failed to save routine.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <RoutineFormPresenter
            initialData={initialData}
            accounts={accounts}
            defaultTime={defaultTime}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onClose={onClose}
        />
    );
}
