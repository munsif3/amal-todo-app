"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { getAccount } from "@/lib/firebase/accounts";
import { subscribeToMeetings } from "@/lib/firebase/meetings";
import { subscribeToAccountNotes } from "@/lib/firebase/notes";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useRoutines } from "@/lib/hooks/use-routines";
import { Account, Meeting, Note } from "@/types";
import Loader from "@/components/ui/Loading";
import { ArrowLeft, MoreVertical, Calendar, Repeat, CheckSquare, Plus } from "lucide-react";
import Link from "next/link";
import TaskCard from "@/components/today/TaskCard";
import NoteList from "@/components/notes/NoteList";

function AreaDashboardContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const { user } = useAuth();
    const router = useRouter();
    const [account, setAccount] = useState<Account | null>(null);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');
    const [loadingAccount, setLoadingAccount] = useState(true);

    const { tasks, changeTaskStatus, loading: tasksLoading } = useTasks(user);
    const { routines, loading: routinesLoading } = useRoutines(user);

    useEffect(() => {
        if (!user || !id) return;

        // Fetch Account
        getAccount(id).then(acc => {
            setAccount(acc);
            setLoadingAccount(false);
        });

        // Fetch Meetings (manually for now)
        const unsubMeetings = subscribeToMeetings(user.uid, (allMeetings) => {
            setMeetings(allMeetings.filter(m => m.accountId === id));
        });

        // Fetch Notes
        const unsubNotes = subscribeToAccountNotes(user.uid, id, (fetchedNotes) => {
            setNotes(fetchedNotes);
        });

        return () => {
            unsubMeetings();
            unsubNotes();
        };
    }, [user, id]);

    if (loadingAccount || tasksLoading || routinesLoading) {
        return <Loader fullScreen={false} className="py-8" />;
    }

    if (!account) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Area not found</div>;
    }

    const areaTasks = tasks.filter(t => t.accountId === id && t.status !== 'done');
    const areaRoutines = routines.filter(r => r.accountId === id);

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                paddingTop: '1rem'
            }}>
                <button onClick={() => router.back()} style={{ opacity: 0.6 }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    backgroundColor: account.color || '#ccc'
                }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{account.name}</h1>
                <Link href={`/accounts/edit?id=${account.id}`} style={{ marginLeft: 'auto', opacity: 0.5 }}>
                    <MoreVertical />
                </Link>
            </header>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <Link href={activeTab === 'overview' ? "/tasks/new" : `/notes/new?accountId=${id}`}>
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
                        {activeTab === 'overview' ? 'New Task' : 'New Note'}
                    </button>
                </Link>
            </div>

            <div style={{
                display: 'flex',
                gap: '1.5rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '2rem'
            }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        padding: '0.75rem 0',
                        fontWeight: activeTab === 'overview' ? '600' : '500',
                        color: activeTab === 'overview' ? 'var(--primary)' : 'var(--muted-foreground)',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
                        transition: 'var(--transition-ease)',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    style={{
                        padding: '0.75rem 0',
                        fontWeight: activeTab === 'notes' ? '600' : '500',
                        color: activeTab === 'notes' ? 'var(--primary)' : 'var(--muted-foreground)',
                        borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent',
                        transition: 'var(--transition-ease)',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Notes ({notes.length})
                </button>
            </div>

            {/* Content Sections */}

            {activeTab === 'overview' ? (
                <>
                    {/* 1. Tasks */}
            <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', opacity: 0.7 }}>
                    <CheckSquare size={16} />
                    <h2 style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Active Tasks ({areaTasks.length})
                    </h2>
                </div>
                {areaTasks.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>No active tasks in this area.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {areaTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                areaColor={account.color}
                                onStatusChange={(status) => changeTaskStatus(task.id, status)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* 2. Routines */}
            <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', opacity: 0.7 }}>
                    <Repeat size={16} />
                    <h2 style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Routines ({areaRoutines.length})
                    </h2>
                </div>
                {areaRoutines.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>No routines.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {areaRoutines.map(routine => (
                            <div key={routine.id} style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: '500' }}>{routine.title}</span>
                                <Link href={`/routines/edit?id=${routine.id}`} style={{ opacity: 0.4 }}><MoreVertical size={16} /></Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 3. Meetings */}
            <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', opacity: 0.7 }}>
                    <Calendar size={16} />
                    <h2 style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Meetings ({meetings.length})
                    </h2>
                </div>
                {meetings.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>No meetings scheduled.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {meetings.map(meeting => (
                            <div key={meeting.id} style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                            }}>
                                <div style={{ fontWeight: '600' }}>{meeting.title}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{meeting.startTime?.toDate().toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
                </>
            ) : (
                <NoteList notes={notes} />
            )}
        </div>
    );
}

export default function AreaDashboard() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <AreaDashboardContent />
        </Suspense>
    );
}
