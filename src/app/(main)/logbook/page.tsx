"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useAccounts } from "@/lib/hooks/use-accounts";
import TaskCard from "@/components/today/TaskCard";
import Loader from "@/components/ui/Loading";
import { ArrowLeft, ScrollText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LogbookPage() {
    const { user } = useAuth();
    const router = useRouter();

    // We only care about finished tasks here
    const { finishedTasks, loading: tasksLoading, changeTaskStatus } = useTasks(user);
    const { accounts, loading: accountsLoading } = useAccounts(user);

    const isLoading = tasksLoading || accountsLoading;

    if (isLoading) {
        return <Loader fullScreen={false} className="py-8" />;
    }

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ScrollText size={24} color="var(--primary)" />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Logbook</h1>
                </div>
            </header>

            {finishedTasks.length === 0 ? (
                <div style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    opacity: 0.5,
                    border: '1px dashed var(--border)',
                    borderRadius: '16px'
                }}>
                    <p>No completed tasks yet.</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Finish some tasks to see them here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {finishedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            areaColor={task.accountId ? accounts.find(a => a.id === task.accountId)?.color : undefined}
                            onStatusChange={(status) => changeTaskStatus(task.id, status)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
