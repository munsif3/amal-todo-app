"use client";

import { Reorder } from "framer-motion";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToTasks, updateTaskStatus, updateTasksOrder } from "@/lib/firebase/tasks";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { subscribeToRoutines } from "@/lib/firebase/routines";
import { Task, Account, Routine } from "@/types";
import { useEffect, useState, useRef } from "react";
import TaskCard from "@/components/today/TaskCard";
import DraggableTaskCard from "@/components/today/DraggableTaskCard";
import Loader from "@/components/ui/Loading";
import { Check, Repeat, Search } from "lucide-react";

import { useRoutineCompletion } from "@/lib/hooks/use-routine-completion";

export default function TodayPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isReordering, setIsReordering] = useState(false);

    const { isRoutineCompletedToday, toggleCompletion, todayStr } = useRoutineCompletion(user);

    const todayDate = new Date();
    // todayStr is now provided by the hook, but we need todayDate components for filtering
    const currentDayIdx = todayDate.getDay(); // 0-6
    const currentMonthDay = todayDate.getDate(); // 1-31

    useEffect(() => {
        if (user) {
            const unsubscribeTasks = subscribeToTasks(user.uid, (fetchedTasks) => {
                // Client-side sort by order then createdAt
                const sorted = [...fetchedTasks].sort((a, b) => {
                    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                    if (orderA !== orderB) return orderA - orderB;
                    // Fallback to createdAt desc (newer first) if no order, or stable sort
                    return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
                });

                // Only update from snapshot if we are NOT currently reordering locally to prevent jumps
                if (!isReordering) {
                    setTasks(sorted);
                }
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
    }, [user, loading, isReordering]);

    // Redundant effect removed


    const handleStatusChange = async (taskId: string, status: Task['status']) => {
        if (user) {
            await updateTaskStatus(taskId, status, user.uid);
        }
    };

    // Filter logic
    const filterItem = (text: string) => text.toLowerCase().includes(searchQuery.toLowerCase());

    const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'waiting' && (filterItem(t.title) || (t.description && filterItem(t.description))));
    const snoozedTasks = tasks.filter(t => t.status === 'waiting' && (filterItem(t.title) || (t.description && filterItem(t.description))));
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
        return <Loader fullScreen={false} className="py-8" />;
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
                    <Reorder.Group
                        axis="y"
                        values={activeTasks}
                        onReorder={(newOrder) => {
                            // Optimistically update local state
                            setIsReordering(true);

                            // We need to merge the new order of activeTasks into the full tasks list
                            // Create a map of ids to their new desired index in the active list
                            const activeIdSet = new Set(newOrder.map(t => t.id));

                            // Reconstruct tasks: 
                            // 1. Keep non-active tasks where they are (or filter them out and append? No, keep relative order)
                            // 2. Replace the sequence of active tasks with the new sequence?
                            // Easier: Just update the `tasks` array by replacing the items that are in activeTasks with the new order items
                            // But wait, the `tasks` array contains ALL tasks.
                            // If we just swap the objects in `tasks`, we need to find their indices.

                            // Strategy: Filter out active tasks from `tasks`, then splice them back in? 
                            // OR simply: `setTasks` with a new array where we look up the active tasks from `newOrder` if they exist there.

                            // Let's create a new full list
                            const newTasks = [...tasks];
                            // Sort relevant items in newTasks to match newOrder?
                            // Actually, simply updating the `order` property on the items is enough if we resort?
                            // But for smooth UI, we want to update the array order immediately.

                            // Let's map ids to 0..N based on newOrder
                            const orderMap = new Map(newOrder.map((t, i) => [t.id, i]));

                            const reorderedActive = newOrder.map((t, i) => ({ ...t, order: i }));

                            // Update the main tasks state
                            const updatedTasks = tasks.map(t => {
                                if (orderMap.has(t.id)) {
                                    return { ...t, order: orderMap.get(t.id) };
                                }
                                return t;
                            }).sort((a, b) => {
                                // Same sort logic as useEffect
                                const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                                const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                                if (orderA !== orderB) return orderA - orderB;
                                return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
                            });

                            setTasks(updatedTasks);

                            // Save to DB (debounced handled by caller or just trigger?)
                            // For now fire and forget, but ideally debounce.
                            // Since `onReorder` can fire rapidly, valid concern. 
                            // But usually onReorder fires once per swap or continuously? 
                            // Framer Motion Reorder fires on every frame? No, on change of order.
                            // Let's just save.
                            updateTasksOrder(reorderedActive.map(t => ({ id: t.id, order: t.order! })))
                                .catch(console.error)
                                .finally(() => {
                                    setTimeout(() => setIsReordering(false), 1000); // cooldown
                                });
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0 }}
                    >
                        {activeTasks.map(task => {
                            const blockedBy = task.dependencies || [];
                            const isBlocked = blockedBy.some(depId => {
                                const status = taskStatusMap.get(depId);
                                return status && status !== 'done';
                            });

                            return (
                                <DraggableTaskCard
                                    key={task.id}
                                    task={task}
                                    areaColor={task.accountId ? accounts.find(a => a.id === task.accountId)?.color : undefined}
                                    onStatusChange={(status) => handleStatusChange(task.id, status)}
                                    isBlocked={isBlocked}
                                />
                            );
                        })}
                    </Reorder.Group>
                )}
            </section>

            {snoozedTasks.length > 0 && (
                <section style={{ marginBottom: '2.5rem', opacity: 0.8 }}>
                    <h2 style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Snoozed / Later
                    </h2>
                    {snoozedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            areaColor={task.accountId ? accounts.find(a => a.id === task.accountId)?.color : undefined}
                            onStatusChange={(status) => handleStatusChange(task.id, status)}
                        />
                    ))}
                </section>
            )}

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
