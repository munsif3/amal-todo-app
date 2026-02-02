"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToRoutines, toggleRoutineCompletion } from "@/lib/firebase/routines";
import { Routine } from "@/types";
import { Plus, Check, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RoutinesPage() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToRoutines(user.uid, (data) => {
            setRoutines(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleToggle = async (routine: Routine) => {
        if (!user) return;
        // Check current status
        const isCompleted = routine.completionLog?.[todayStr]?.[user.uid] || false;
        await toggleRoutineCompletion(routine.id, user.uid, todayStr, !isCompleted);
    };

    const getDaysUntilNext = (routine: Routine): number => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayIndex = now.getDay();
        const todayDate = now.getDate();

        if (routine.schedule === 'monthly') {
            const targetDay = routine.monthDay || 1;
            if (targetDay === todayDate) return 0;

            let target = new Date(now.getFullYear(), now.getMonth(), targetDay);
            if (target < now) {
                target = new Date(now.getFullYear(), now.getMonth() + 1, targetDay);
            }

            const diffMs = target.getTime() - now.getTime();
            return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }

        if (routine.days && routine.days.length > 0) {
            if (routine.days.includes(todayIndex)) return 0;

            const sortedDays = [...routine.days].sort((a, b) => a - b);
            const nextDay = sortedDays.find(d => d > todayIndex);

            if (nextDay !== undefined) {
                return nextDay - todayIndex;
            } else {
                return (7 - todayIndex) + sortedDays[0];
            }
        }

        return 0; // Default daily
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Routines</h2>
                <Link href="/routines/edit?id=new" style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Plus size={20} />
                </Link>
            </header>

            {loading ? (
                <p>Loading routines...</p>
            ) : routines.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: '#888',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px'
                }}>
                    <p>No routines established yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {routines.map((routine) => {
                        const isCompleted = routine.completionLog?.[todayStr]?.[user!.uid] || false;
                        const daysUntil = getDaysUntilNext(routine);
                        return (
                            <div key={routine.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: isCompleted ? 'rgba(0,0,0,0.02)' : 'white',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                transition: 'all 0.2s ease',
                                opacity: isCompleted ? 0.8 : 1
                            }}>
                                <button
                                    onClick={() => handleToggle(routine)}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: `2px solid ${isCompleted ? 'var(--primary)' : '#ccc'}`,
                                        backgroundColor: isCompleted ? 'var(--primary)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        marginRight: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isCompleted && <Check size={14} strokeWidth={3} />}
                                </button>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontWeight: '600',
                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                        color: isCompleted ? '#888' : 'inherit'
                                    }}>
                                        {routine.title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#888' }}>
                                            {(() => {
                                                if (routine.days && routine.days.length > 0) {
                                                    if (routine.days.length === 7) return "Daily";
                                                    if (routine.days.length === 5 && routine.days.every(d => d >= 1 && d <= 5)) return "Weekdays";
                                                    if (routine.days.length === 2 && routine.days.includes(0) && routine.days.includes(6)) return "Weekends";

                                                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                    return routine.days.sort().map(d => dayNames[d]).join(', ');
                                                }
                                                // Fallback for legacy data
                                                if (routine.schedule === 'daily') return "Daily";
                                                if (routine.schedule === 'weekly') return "Weekly";
                                                if (routine.schedule === 'monthly') {
                                                    const suffix = (n: number) => {
                                                        if (n >= 11 && n <= 13) return "th";
                                                        switch (n % 10) {
                                                            case 1: return "st";
                                                            case 2: return "nd";
                                                            case 3: return "rd";
                                                            default: return "th";
                                                        }
                                                    };
                                                    return `Monthly on the ${routine.monthDay || 1}${suffix(routine.monthDay || 1)}`;
                                                }
                                                if (routine.schedule === 'custom' && (!routine.days || routine.days.length === 0)) return "Custom"; // or "Paused"?
                                                return routine.schedule || "Daily";
                                            })()}
                                        </p>
                                        {daysUntil > 0 && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: '#666',
                                                backgroundColor: '#f0f0f0',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Link href={`/routines/edit?id=${routine.id}`} style={{ color: '#ccc', padding: '0.5rem' }}>
                                    <MoreVertical size={20} />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
