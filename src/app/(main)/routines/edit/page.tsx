"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { getRoutine, updateRoutine, createRoutine, deleteRoutine } from "@/lib/firebase/routines";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Loader from "@/components/ui/Loading";

import AreaSelector from "@/components/ui/AreaSelector";

function RoutineDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    // id will be "new" or a uuid
    const id = searchParams.get('id');

    const isNew = !id || id === "new";
    const [loading, setLoading] = useState(!isNew);
    const [title, setTitle] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [monthDay, setMonthDay] = useState<number>(1);
    const [frequencyType, setFrequencyType] = useState<'weekly' | 'monthly'>('weekly');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [accountId, setAccountId] = useState<string>("");

    useEffect(() => {
        if (!user) return;

        // Subscribe to accounts
        const unsubscribeAccounts = subscribeToAccounts(user.uid, (data) => {
            setAccounts(data);
        });

        if (isNew) {
            setLoading(false);
            return () => unsubscribeAccounts();
        }

        getRoutine(id as string).then(data => {
            if (data) {
                setTitle(data.title);
                setAccountId(data.accountId || "");

                // Determine frequency type based on schedule
                if (data.schedule === 'monthly') {
                    setFrequencyType('monthly');
                    setMonthDay(data.monthDay || 1);
                } else {
                    setFrequencyType('weekly');
                    // ... existing weekly logic ...
                    const loadedSchedule = data.schedule as string;
                    if (loadedSchedule === 'weekdays') {
                        setSelectedDays([1, 2, 3, 4, 5]);
                    } else {
                        if (data.days) {
                            setSelectedDays(data.days);
                        } else {
                            setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
                        }
                    }
                }
            }
            setLoading(false);
        });

        return () => unsubscribeAccounts();
    }, [user, id, isNew]);

    const handleSave = async () => {
        if (!user) return;

        let finalSchedule: "daily" | "weekly" | "custom" | "monthly" = "custom";
        let finalDays = selectedDays;
        let finalMonthDay = undefined;

        if (frequencyType === 'monthly') {
            finalSchedule = 'monthly';
            finalDays = []; // No weekly days for monthly
            finalMonthDay = monthDay;
        } else {
            if (selectedDays.length === 7) finalSchedule = "daily";
            else if (selectedDays.length === 1) finalSchedule = "weekly";
        }

        const routineData: any = {
            title,
            schedule: finalSchedule,
            days: finalDays,
            accountId: accountId || null
        };

        if (finalMonthDay) {
            routineData.monthDay = finalMonthDay;
        }

        if (isNew) {
            await createRoutine(user.uid, routineData);
        } else {
            await updateRoutine(id as string, routineData);
        }
        router.push("/routines");
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this routine?")) return;
        await deleteRoutine(id as string);
        router.push("/routines");
    };




    if (loading) return <Loader fullScreen={false} className="py-8" />;

    return (
        <div style={{ paddingBottom: '80px', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
            }}>
                <Link href="/routines" style={{ color: '#666' }}>
                    <ArrowLeft size={24} />
                </Link>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    {isNew ? "New Routine" : "Edit Routine"}
                </h2>
                <div style={{ flex: 1 }} />
                {!isNew && (
                    <button onClick={handleDelete} style={{ color: '#ff4444', background: 'none', border: 'none', marginRight: '1rem' }}>
                        <Trash2 size={20} />
                    </button>
                )}
                <button
                    onClick={handleSave}
                    style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                    }}
                >
                    Save
                </button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Routine Name</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Pay Rent"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div>
                    <AreaSelector
                        accounts={accounts}
                        selectedAccountId={accountId}
                        onSelect={(id) => setAccountId(id)}
                        label="Area (Optional)"
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setFrequencyType('weekly')}
                            style={{
                                padding: '0.5rem 0',
                                borderBottom: frequencyType === 'weekly' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: frequencyType === 'weekly' ? 'var(--primary)' : '#888',
                                background: 'none',
                                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Weekly Schedule
                        </button>
                        <button
                            onClick={() => setFrequencyType('monthly')}
                            style={{
                                padding: '0.5rem 0',
                                borderBottom: frequencyType === 'monthly' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: frequencyType === 'monthly' ? 'var(--primary)' : '#888',
                                background: 'none',
                                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Monthly
                        </button>
                    </div>

                    {frequencyType === 'weekly' ? (
                        <>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Repeat On</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                    const isSelected = selectedDays.includes(idx);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedDays(selectedDays.filter(d => d !== idx));
                                                } else {
                                                    setSelectedDays([...selectedDays, idx].sort());
                                                }
                                            }}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                border: isSelected ? 'none' : '1px solid var(--border)',
                                                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                                                color: isSelected ? 'white' : 'var(--foreground)',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#666' }}>
                                {selectedDays.length === 7 ? "Every day" :
                                    selectedDays.length === 0 ? "No days selected" :
                                        selectedDays.length === 5 && selectedDays.every(d => d >= 1 && d <= 5) ? "Weekdays" :
                                            "Custom schedule"}
                            </p>
                        </>
                    ) : (
                        <>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Day of Month</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#666' }}>Every</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={monthDay}
                                    onChange={(e) => setMonthDay(Number(e.target.value))}
                                    style={{
                                        width: '60px',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        textAlign: 'center'
                                    }}
                                />
                                <span style={{ color: '#666' }}>of the month</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RoutineDetailPage() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <RoutineDetailContent />
        </Suspense>
    );
}
