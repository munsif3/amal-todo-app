"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToTasks, updateTaskStatus } from "@/lib/firebase/tasks";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { Task, Account } from "@/types";
import { useEffect, useState } from "react";
import TaskCard from "@/components/today/TaskCard";

export default function TodayPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

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

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const finishedTasks = tasks.filter(t => t.status === 'done');

    if (loading) {
        return <div style={{ opacity: 0.5, padding: '2rem 0' }}>Loading your day...</div>;
    }

    return (
        <div>
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
                    activeTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            areaColor={task.accountId ? accounts.find(a => a.id === task.accountId)?.color : undefined}
                            onStatusChange={(status) => handleStatusChange(task.id, status)}
                        />
                    ))
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
