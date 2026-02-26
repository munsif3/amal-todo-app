"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { createTask, updateTask } from "@/lib/firebase/tasks";
import { createRoutine, updateRoutine } from "@/lib/firebase/routines";
import { createMeeting, updateMeeting } from "@/lib/firebase/meetings";
import { createNote, updateNote } from "@/lib/firebase/notes";
import { Account, TaskStatus, Subtask } from "@/types";
import { Input, Textarea, Button } from "@/components/ui/Form";
import AreaSelector from "@/components/ui/AreaSelector";
import { Timestamp } from "firebase/firestore";
import { Calendar, Repeat, Book, Video, CheckSquare, ArrowLeft, Plus, X, User } from "lucide-react";

type CaptureMode = 'TASK' | 'ROUTINE' | 'MEETING' | 'NOTE';

interface UniversalItemFormProps {
    onClose?: () => void;
    onSuccess?: () => void;
    initialMode?: CaptureMode;
    initialData?: any;
    itemId?: string;
}

export default function UniversalItemForm({
    onClose,
    onSuccess,
    initialMode = 'TASK',
    initialData,
    itemId
}: UniversalItemFormProps) {
    const { user } = useAuth();
    const [mode, setMode] = useState<CaptureMode>(initialMode);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [accountId, setAccountId] = useState("");

    // Gamification State (Tasks only)
    const [isFrog, setIsFrog] = useState(false);
    const [isTwoMinute, setIsTwoMinute] = useState(false);
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);

    // Specific State
    const [deadline, setDeadline] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 30, 0, 0);
        const offset = tomorrow.getTimezoneOffset() * 60000;
        return (new Date(tomorrow.getTime() - offset)).toISOString().slice(0, 16);
    });

    // Routine State
    const [routineSchedule, setRoutineSchedule] = useState("daily");
    const [routineDays, setRoutineDays] = useState<number[]>([]);
    const [routineMonthDay, setRoutineMonthDay] = useState<number>(1);
    const [routineTime, setRoutineTime] = useState("09:30");

    // Meeting State
    const [meetingTime, setMeetingTime] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 30, 0, 0);
        const offset = tomorrow.getTimezoneOffset() * 60000;
        return (new Date(tomorrow.getTime() - offset)).toISOString().slice(0, 16);
    });

    // Note State
    const [noteType, setNoteType] = useState<'text' | 'checklist'>('text');

    // Subscribe to Accounts
    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToAccounts(user.uid, setAccounts);
            return () => unsubscribe();
        }
    }, [user]);

    // Initialize Data from Props
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || "");
            setAccountId(initialData.accountId || "");

            setDescription(initialData.description || "");
            setIsFrog(initialData.isFrog || false);
            setIsTwoMinute(initialData.isTwoMinute || false);
            setSubtasks(initialData.subtasks || []);
            if (initialData.deadline) {
                const date = initialData.deadline.toDate();
                const offset = date.getTimezoneOffset() * 60000;
                setDeadline((new Date(date.getTime() - offset)).toISOString().slice(0, 16));
            }
        } else if (mode === 'ROUTINE') {
            setRoutineSchedule(initialData.schedule || "daily");
            setRoutineDays(initialData.days || []);
            setRoutineMonthDay(initialData.monthDay || 1);
            setRoutineTime(initialData.time || "");
        } else if (mode === 'MEETING') {
            if (initialData.startTime) {
                const date = initialData.startTime.toDate();
                const offset = date.getTimezoneOffset() * 60000;
                setMeetingTime((new Date(date.getTime() - offset)).toISOString().slice(0, 16));
            }
            setDescription(initialData.notes?.before || "");
        } else if (mode === 'NOTE') {
            setDescription(initialData.content || "");
            setNoteType(initialData.type || 'text');
        }
    }, [initialData, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title) return;

        setIsSubmitting(true);
        try {
            if (mode === 'TASK') {
                const data = {
                    title,
                    description,
                    accountId: accountId || null,
                    deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
                    isFrog,
                    isTwoMinute,
                    subtasks
                };
                if (itemId) await updateTask(itemId, data);
                else await createTask(user.uid, { ...data, status: 'next' });
            }
            else if (mode === 'ROUTINE') {
                const data = {
                    title,
                    accountId: accountId || null,
                    schedule: routineSchedule as "daily" | "weekly" | "monthly",
                    days: routineDays,
                    monthDay: routineMonthDay,
                    time: routineTime || undefined,
                };
                if (itemId) await updateRoutine(itemId, data);
                else await createRoutine(user.uid, { ...data, type: 'fixed', isShared: false });
            }
            else if (mode === 'MEETING') {
                const data = {
                    title,
                    accountId: accountId || null,
                    startTime: meetingTime ? Timestamp.fromDate(new Date(meetingTime)) : Timestamp.now(),
                    notes: { before: description, during: "", after: "" }, // Preserve existing notes if editing? 
                    // Ideally for meetings we probably want to support updating specific note fields, 
                    // but for this "Unified" form we likely only edit the 'before/description' part or basic details.
                    // For full meeting notes, maybe we need the dedicated page?
                    // Let's assume description maps to 'before' for now.
                };

                if (itemId) {
                    // Fetch existing to merge notes? or just update title/time/account
                    // For simplicity, let's just update the known fields. 
                    const updateData: any = {
                        title: data.title,
                        accountId: data.accountId,
                        startTime: data.startTime
                    };
                    if (description !== initialData?.notes?.before) {
                        updateData.notes = { ...initialData?.notes, before: description };
                    }
                    await updateMeeting(itemId, updateData);
                } else {
                    await createMeeting(user.uid, { ...data, prepTaskIds: [], checklist: [] });
                }
            }
            else if (mode === 'NOTE') {
                const data = {
                    title,
                    content: description,
                    accountId: accountId || "",
                    type: noteType,
                };
                if (itemId) await updateNote(itemId, data);
                else await createNote(user.uid, { ...data, isPinned: false });
            }

            if (onSuccess) onSuccess();
            // We usually don't close automatically if just editing? Matches 'New' flow safely.
            // If editing, router.back() (handled by onSuccess in wrapper) works.
        } catch (error) {
            console.error("Error saving item:", error);
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideIn 0.3s ease' }}>

            {/* 1. Common Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Input
                    placeholder={
                        mode === 'ROUTINE' ? "Name of routine..." :
                            mode === 'MEETING' ? "Meeting subject..." :
                                "What needs to be done?"
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus={!itemId}
                    required
                    style={{ fontSize: '1.5rem', padding: '0.5rem 0', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, background: 'transparent' }}
                />
            </div>

            {/* 2. Primary Date/Time Input (Acts as Deadline for Task, StartTime for Meeting) */}
            {/* For Routine, we might not need this if we have the schedule, or it could be "Start Date" */}
            {mode !== 'ROUTINE' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ opacity: 0.5 }}>
                        {mode === 'MEETING' ? <Video size={18} /> : mode === 'TASK' ? <Calendar size={18} /> : <Calendar size={18} />}
                    </span>
                    <Input
                        type="datetime-local"
                        value={mode === 'MEETING' ? meetingTime : deadline}
                        onChange={(e) => {
                            if (mode === 'MEETING') setMeetingTime(e.target.value);
                            else setDeadline(e.target.value);
                        }}
                        placeholder={mode === 'MEETING' ? "Start Time" : "Deadline (optional)"}
                        style={{ flex: 1 }}
                    />
                </div>
            )}

            {/* 3. Mode Selection (Radio Buttons) */}
            {!itemId && (
                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0', opacity: 0.9 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                        <input
                            type="radio"
                            name="itemMode"
                            checked={mode === 'TASK'}
                            onChange={() => setMode('TASK')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>One-off</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                        <input
                            type="radio"
                            name="itemMode"
                            checked={mode === 'ROUTINE'}
                            onChange={() => setMode('ROUTINE')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>Routine</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                        <input
                            type="radio"
                            name="itemMode"
                            checked={mode === 'MEETING'}
                            onChange={() => setMode('MEETING')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>Meeting</span>
                    </label>
                </div>
            )}

            {/* 4. Dynamic Fields based on Selection */}

            {/* Routine Schedule */}
            {mode === 'ROUTINE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--primary)', animation: 'slideIn 0.2s ease' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>Routine Schedule</h4>

                    {/* Time Input (Optional) */}
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
                            onChange={(e) => setRoutineSchedule(e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', flex: 1, cursor: 'pointer' }}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    {/* Weekly Day Selector */}
                    {routineSchedule === 'weekly' && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                                const isSelected = routineDays.includes(index);
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            setRoutineDays(prev =>
                                                prev.includes(index)
                                                    ? prev.filter(d => d !== index)
                                                    : [...prev, index]
                                            );
                                        }}
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

                    {/* Monthly Day Selector */}
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
            )}

            {/* 5. Common: Area Selector */}
            <AreaSelector
                accounts={accounts}
                selectedAccountId={accountId}
                onSelect={setAccountId}
                label="Assign Area"
            />

            {/* 6. Common: Description */}
            <Textarea
                placeholder={
                    mode === 'MEETING' ? "Meeting agenda/notes..." :
                        "Details, context, or notes..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: '120px' }}
            />

            {/* Subtasks / Requirements (Tasks Only) */}
            {mode === 'TASK' && (
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
                                <User size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
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
                            <button
                                type="button"
                                onClick={() => {
                                    const newSubtasks = subtasks.filter((_, i) => i !== index);
                                    setSubtasks(newSubtasks);
                                }}
                                style={{ opacity: 0.5, padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setSubtasks([...subtasks, { id: crypto.randomUUID(), title: '', isCompleted: false }]);
                        }}
                        style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                        <Plus size={16} /> Add Requirement
                    </Button>
                </div>
            )}

            {/* Gamification Toggles (Tasks Only) */}
            {mode === 'TASK' && (
                <div className="mobile-wrap" style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--accent-sage)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="isFrog"
                            checked={isFrog}
                            onChange={(e) => setIsFrog(e.target.checked)}
                            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="isFrog" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            🐸 Eat the Frog
                        </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="isTwoMinute"
                            checked={isTwoMinute}
                            onChange={(e) => setIsTwoMinute(e.target.checked)}
                            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="isTwoMinute" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ⚡ 2-Minute Rule
                        </label>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="submit" disabled={!title || isSubmitting} isLoading={isSubmitting} style={{ width: '100%' }}>
                    {itemId ? "Save Changes" : `Create ${mode === 'TASK' ? 'Item' : mode.charAt(0) + mode.slice(1).toLowerCase()}`}
                </Button>
            </div>

        </form>
    );
}
