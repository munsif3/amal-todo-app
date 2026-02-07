"use client";

import { Reorder } from "framer-motion";
import { useAuth } from "@/lib/firebase/auth-context";
import { Task, Account, Routine } from "@/types";
import { useState } from "react";
import TaskCard from "@/components/today/TaskCard";
import DraggableTaskCard from "@/components/today/DraggableTaskCard";
import Loader from "@/components/ui/Loading";
import { Check, Search } from "lucide-react";

import { useRoutineCompletion } from "@/lib/hooks/use-routine-completion";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useRoutines } from "@/lib/hooks/use-routines";
import { useAccounts } from "@/lib/hooks/use-accounts";

export default function TodayPage() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    const {
        activeTasks,
        snoozedTasks,
        finishedTasks,
        loading: tasksLoading,
        reorderTasks,
        changeTaskStatus,
        taskStatusMap
    } = useTasks(user, searchQuery);

    const { todaysRoutines, loading: routinesLoading } = useRoutines(user, searchQuery);
    const { accounts, loading: accountsLoading } = useAccounts(user);

    const { isRoutineCompletedToday, toggleCompletion } = useRoutineCompletion(user);

    const isLoading = tasksLoading || routinesLoading || accountsLoading;

    if (isLoading) {
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
                        onReorder={reorderTasks}
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
                                    onStatusChange={(status) => changeTaskStatus(task.id, status)}
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
                            onStatusChange={(status) => changeTaskStatus(task.id, status)}
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
                            onStatusChange={(status) => changeTaskStatus(task.id, status)}
                        />
                    ))}
                </section>
            )}
        </div>
    );
}
