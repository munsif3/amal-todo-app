"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToRoutines } from "@/lib/firebase/routines";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { Routine, Account } from "@/types";
import { Plus, Check, MoreVertical, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loading";
import UnifiedItemCard, { UnifiedItem } from "@/components/today/UnifiedItemCard";

import { useRoutineCompletion } from "@/lib/hooks/use-routine-completion";

export default function RoutinesPage() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCompleted, setShowCompleted] = useState(false);

    // Use the hook
    const { isRoutineCompletedToday, toggleCompletion, todayStr } = useRoutineCompletion(user);

    useEffect(() => {
        if (!user) return;
        const unsubscribeRoutines = subscribeToRoutines(user.uid, (data) => {
            setRoutines(data);
            setLoading(false);
        });
        const unsubscribeAccounts = subscribeToAccounts(user.uid, (data) => {
            setAccounts(data);
        });
        return () => {
            unsubscribeRoutines();
            unsubscribeAccounts();
        };
    }, [user]);

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

    const getFormattedSchedule = (routine: Routine) => {
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
        if (routine.schedule === 'custom' && (!routine.days || routine.days.length === 0)) return "Custom";
        return routine.schedule || "Daily";
    };

    const unifiedRoutines: UnifiedItem[] = routines.map(routine => {
        const isCompleted = routine.completionLog?.[todayStr]?.[user!.uid] || false;
        const daysUntil = getDaysUntilNext(routine);

        let itemTime = undefined;
        if (routine.time) {
            const [hours, minutes] = routine.time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            itemTime = date;
        }

        let badge: UnifiedItem['badge'] = undefined;
        if (daysUntil > 0) {
            badge = {
                text: daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`,
                variant: 'neutral'
            };
        }

        return {
            id: routine.id!,
            type: 'routine',
            title: routine.title,
            subtitle: getFormattedSchedule(routine),
            time: itemTime,
            isCompleted: isCompleted,
            accountId: routine.accountId || undefined,
            areaColor: accounts.find(a => a.id === routine.accountId)?.color,
            originalItem: routine,
            badge: badge
        };
    });

    const filteredRoutines = unifiedRoutines.filter(r => showCompleted || !r.isCompleted);

    const handleToggle = (item: UnifiedItem) => {
        toggleCompletion(item.originalItem);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        style={{
                            padding: '0.5rem',
                            color: showCompleted ? 'var(--primary)' : 'var(--text-secondary)',
                            backgroundColor: showCompleted ? 'var(--primary-muted)' : 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            width: '36px',
                            height: '36px'
                        }}
                        title={showCompleted ? "Hide Completed" : "Show Completed"}
                    >
                        {showCompleted ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <Link href="/new?mode=ROUTINE" style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Plus size={20} />
                    </Link>
                </div>
            </header>

            {loading ? (
                <Loader fullScreen={false} className="py-8" />
            ) : routines.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: 'var(--text-muted)',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px'
                }}>
                    <p>No routines established yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredRoutines.map((routine) => (
                        <UnifiedItemCard
                            key={routine.id}
                            item={routine}
                            onToggle={handleToggle}
                        />
                    ))}
                    {filteredRoutines.length === 0 && !showCompleted && routines.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            All routines completed for today!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
