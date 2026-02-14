"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToAccountTasks, updateTaskStatus } from "@/lib/firebase/tasks";
import { subscribeToAccountNotes } from "@/lib/firebase/notes";
import { getAccount } from "@/lib/firebase/accounts";
import { Task, Account, Note } from "@/types";
import { useEffect, useState, Suspense } from "react";
import TaskCard from "@/components/today/TaskCard";
import NoteList from "@/components/notes/NoteList";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

function AccountDetailsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const accountId = searchParams.get('id');

    const [account, setAccount] = useState<Account | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');

    // Derived loading state based on presence of data, initially true
    const [loadingAccount, setLoadingAccount] = useState(true);

    useEffect(() => {
        if (!user || !accountId) return;

        const unsubscribeTasks = subscribeToAccountTasks(user.uid, accountId, (fetchedTasks) => {
            setTasks(fetchedTasks);
        });

        const unsubscribeNotes = subscribeToAccountNotes(user.uid, accountId, (fetchedNotes) => {
            setNotes(fetchedNotes);
        });

        return () => {
            unsubscribeTasks();
            unsubscribeNotes();
        };
    }, [user, accountId]);

    useEffect(() => {
        if (!accountId) return;

        getAccount(accountId).then(acc => {
            if (acc) {
                setAccount(acc);
            }
            setLoadingAccount(false);
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
                        color: 'var(--text-muted)',
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
                        <p style={{ opacity: 0.5 }}>{account?.description || "Area items"}</p>
                    </div>

                    <Link href={activeTab === 'tasks' ? "/tasks/new" : `/notes/new?accountId=${accountId}`}>
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius)',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                        }}>
                            <Plus size={18} />
                            {activeTab === 'tasks' ? 'New Task' : 'New Note'}
                        </button>
                    </Link>
                </div>
            </header>

            <div style={{
                display: 'flex',
                gap: '1.5rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '2rem'
            }}>
                <button
                    onClick={() => setActiveTab('tasks')}
                    style={{
                        padding: '0.75rem 0',
                        fontWeight: activeTab === 'tasks' ? '600' : '500',
                        color: activeTab === 'tasks' ? 'var(--primary)' : 'var(--muted-foreground)',
                        borderBottom: activeTab === 'tasks' ? '2px solid var(--primary)' : '2px solid transparent',
                        transition: 'var(--transition-ease)'
                    }}
                >
                    Tasks ({tasks.length})
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    style={{
                        padding: '0.75rem 0',
                        fontWeight: activeTab === 'notes' ? '600' : '500',
                        color: activeTab === 'notes' ? 'var(--primary)' : 'var(--muted-foreground)',
                        borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent',
                        transition: 'var(--transition-ease)'
                    }}
                >
                    Notes ({notes.length})
                </button>
            </div>

            {activeTab === 'tasks' ? (
                <>
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
                </>
            ) : (
                <NoteList notes={notes} />
            )}
        </div>
    );
}

export default function AccountDetailsPage() {
    return (
        <Suspense fallback={<div style={{ opacity: 0.5, padding: '2rem 0' }}>Loading area...</div>}>
            <AccountDetailsContent />
        </Suspense>
    );
}
