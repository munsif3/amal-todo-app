"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToAccountTasks, updateTaskStatus } from "@/lib/firebase/tasks";
import { getAccount } from "@/lib/firebase/accounts"; // Need to make sure this export exists
import { Task, Account } from "@/types";
import { useEffect, useState } from "react";
import TaskCard from "@/components/today/TaskCard";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal } from "lucide-react";

export default function AccountDetailsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams() as { id: string };
    const accountId = params.id;

    const [account, setAccount] = useState<Account | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !accountId) return;

        // Fetch Account Details
        // Note: We might need to implement subscribeToAccount or just get once. 
        // For MVP, get once is fine, but subscribe is better for updates.
        // Let's assume we have a way to get it or I'll implement it.
        // For now, let's just fetch tasks.

        const unsubscribeTasks = subscribeToAccountTasks(user.uid, accountId, (fetchedTasks) => {
            setTasks(fetchedTasks);
        });

        return () => {
            unsubscribeTasks();
        };
    }, [user, accountId]);

    // Separate effect for fetching account details to keep it clean
    useEffect(() => {
        if (!accountId) return;

        getAccount(accountId).then(acc => {
            if (acc) {
                setAccount(acc);
            }
        });
    }, [accountId]);


    const handleStatusChange = async (taskId: string, status: Task['status']) => {
        if (user) {
            await updateTaskStatus(taskId, status, user.uid);
        }
    };

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const finishedTasks = tasks.filter(t => t.status === 'done');

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        opacity: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}
                >
                    <ArrowLeft size={16} /> Back to Areas
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                            {account ? account.name : "Loading..."}
                        </h2>
                        <p style={{ opacity: 0.5 }}>{account?.description || "Area tasks"}</p>
                    </div>
                </div>
            </header>

            <section style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    Active
                </h3>

                {activeTasks.length === 0 ? (
                    <div style={{
                        padding: '3rem 1rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: 'var(--radius)',
                        border: '1px dashed var(--border)'
                    }}>
                        <p style={{ opacity: 0.5 }}>No active tasks in this area.</p>
                    </div>
                ) : (
                    activeTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            areaColor={account?.color}
                            onStatusChange={(status) => handleStatusChange(task.id, status)}
                        />
                    ))
                )}
            </section>

            {finishedTasks.length > 0 && (
                <section style={{ opacity: 0.6 }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Done
                    </h3>
                    {finishedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            areaColor={account?.color}
                            onStatusChange={(status) => handleStatusChange(task.id, status)}
                        />
                    ))}
                </section>
            )}
        </div>
    );
}
