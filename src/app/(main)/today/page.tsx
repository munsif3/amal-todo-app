"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToTasks, updateTaskStatus } from "@/lib/firebase/tasks";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { subscribeToRoutines } from "@/lib/firebase/routines";
import { Task, Account, Routine } from "@/types";
import { useEffect, useState } from "react";
import TaskCard from "@/components/today/TaskCard";
import { Check, Repeat, Search } from "lucide-react";

import { useRoutineCompletion } from "@/lib/hooks/use-routine-completion";

export default function TodayPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const { isRoutineCompletedToday, toggleCompletion, todayStr } = useRoutineCompletion(user);

    const todayDate = new Date();
    // todayStr is now provided by the hook, but we need todayDate components for filtering
    const currentDayIdx = todayDate.getDay(); // 0-6
    const currentMonthDay = todayDate.getDate(); // 1-31

    useEffect(() => {
        if (user) {
            const unsubscribeTasks = subscribeToTasks(user.uid, (fetchedTasks) => {
                setTasks(fetchedTasks);
                if (loading) setLoading(false);
            });
            const unsubscribeAccounts = subscribeToAccounts(user.uid, (fetchedAccounts) => {
                setAccounts(fetchedAccounts);
            });
            const unsubscribeRoutines = subscribeToRoutines(user.uid, (fetchedRoutines) => {
                setRoutines(fetchedRoutines);
            });

            return () => {
                unsubscribeTasks();
                unsubscribeAccounts();
                unsubscribeRoutines();
            };
        }
    }, [user, loading]);

    useEffect(() => {
        if (user) {
            const unsubscribeTasks = subscribeToTasks(user.uid, (fetchedTasks) => {
                setTasks(fetchedTasks);
                if (loading) setLoading(false);
            });
            const unsubscribeAccounts = subscribeToAccounts(user.uid, (fetchedAccounts) => {
                setAccounts(fetchedAccounts);
            });
            return () => {
                unsubscribeTasks();
                unsubscribeAccounts();
            };
        }
    }, [user, loading]);

    const handleStatusChange = async (taskId: string, status: Task['status']) => {
        if (user) {
            await updateTaskStatus(taskId, status, user.uid);
        }
    };

    // Filter logic
    const filterItem = (text: string) => text.toLowerCase().includes(searchQuery.toLowerCase());

    const activeTasks = tasks.filter(t => t.status !== 'done' && (filterItem(t.title) || (t.description && filterItem(t.description))));
    const finishedTasks = tasks.filter(t => t.status === 'done' && (filterItem(t.title) || (t.description && filterItem(t.description))));

    // Filter Routines for Today
    const todaysRoutines = routines.filter(r => {
        // Search filter
        if (!filterItem(r.title)) return false;

        // Monthly
        if (r.schedule === 'monthly') {
            return r.monthDay === currentMonthDay;
        }
        // Specific Days
        if (r.days && r.days.length > 0) {
            return r.days.includes(currentDayIdx);
        }
        // Legacy/Default Daily
        if (r.schedule === 'daily' || !r.schedule) return true;

        // Legacy Weekly (deprecated but handle safe) - maybe show on Mondays? 
        // Or just hide? Let's hide weekly legacy if no days array to avoid confusion, 
        // or assume Monday. Safe bet: if no days array and weekly, hide or show all? 
        // Let's assume daily if fallback.
        return true;
    });

    const taskStatusMap = new Map(tasks.map(t => [t.id, t.status]));

    if (loading) {
        return <div style={{ opacity: 0.5, padding: '2rem 0' }}>Loading your day...</div>;
    }

    return (
        <div>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                    type="text"
                    placeholder="Search today..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        fontSize: '1rem',
                        backgroundColor: 'rgba(0,0,0,0.02)'
                    }}
                />
            </div>

            {todaysRoutines.length > 0 && (
                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Routines
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {todaysRoutines.map(routine => {
                            const isCompleted = isRoutineCompletedToday(routine);
                            const areaColor = routine.accountId ? accounts.find(a => a.id === routine.accountId)?.color : undefined;

                            return (
                                <div key={routine.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: 'white',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    borderLeft: areaColor ? `4px solid ${areaColor}` : '1px solid var(--border)',
                                    opacity: isCompleted ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}>
                                    <button
                                        onClick={() => toggleCompletion(routine)}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: `2px solid ${isCompleted ? 'var(--primary)' : '#ddd'}`,
                                            backgroundColor: isCompleted ? 'var(--primary)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            marginRight: '0.75rem',
                                            cursor: 'pointer',
                                            flexShrink: 0
                                        }}
                                    >
                                        {isCompleted && <Check size={12} strokeWidth={4} />}
                                    </button>
                                    <span style={{
                                        fontSize: '0.9375rem',
                                        fontWeight: '500',
                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                        color: isCompleted ? '#999' : 'var(--foreground)'
                                    }}>
                                        {routine.title}
                                    </span>
                                    {routine.schedule === 'monthly' && (
                                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#888', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                                            Monthly
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    Tomorrow belongs to those who prepare
                </h2>

                {activeTasks.length === 0 ? (
                    <div style={{
                        padding: '3rem 1rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: 'var(--radius)',
                        border: '1px dashed var(--border)'
                    }}>
                        <p style={{ opacity: 0.5 }}>Your slate is clean.</p>
                    </div>
                ) : (
                    activeTasks.map(task => {
                        const blockedBy = task.dependencies || [];
                        const isBlocked = blockedBy.some(depId => {
                            const status = taskStatusMap.get(depId);
                            // logic: if dependency exists and is not done, then blocked.
                            return status && status !== 'done';
                        });

                        return (
                            <TaskCard
                                key={task.id}
                                task={task}
                                areaColor={task.accountId ? accounts.find(a => a.id === task.accountId)?.color : undefined}
                                onStatusChange={(status) => handleStatusChange(task.id, status)}
                                isBlocked={isBlocked}
                            />
                        );
                    })
                )}
            </section>

            {finishedTasks.length > 0 && (
                <section style={{ opacity: 0.6 }}>
                    <h2 style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Completed
                    </h2>
                    {finishedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            areaColor={task.accountId ? accounts.find(a => a.id === task.accountId)?.color : undefined}
                            onStatusChange={(status) => handleStatusChange(task.id, status)}
                        />
                    ))}
                </section>
            )}
        </div>
    );
}
