"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useRoutines } from "@/lib/hooks/use-routines";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { subscribeToMeetings } from "@/lib/firebase/meetings";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckSquare, Repeat, Calendar, ArrowRight, Folder, Users } from "lucide-react";
import Loader from "@/components/ui/Loading";
import { Meeting } from "@/types";
import StatsWidget from "@/components/gamification/StatsWidget";
import SomedaySweeper from "@/components/gamification/SomedaySweeper";
import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";
import { useDelegations } from "@/lib/hooks/use-delegations";
import ActivityRing from "@/components/ui/ActivityRing";

export default function DashboardPage() {
    const { user } = useAuth();

    // Accounts (Areas)
    const { accounts, loading: accountsLoading } = useAccounts(user);

    // Todo Counts
    const { activeTasks, finishedTasks, loading: tasksLoading } = useTasks(user, "");

    // Delegations
    const { activeDelegations, reviewDelegations, loading: delegationsLoading } = useDelegations(user);

    // Routine Counts
    const { todaysRoutines, loading: routinesLoading } = useRoutines(user, "");
    const [pendingRoutinesCount, setPendingRoutinesCount] = useState(0);

    // Meeting Counts
    const [meetingsCount, setMeetingsCount] = useState(0);
    const [meetingsLoading, setMeetingsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Calculate pending routines (simple check for now, can be improved with completion logic if not already in hook)
        // actually useRoutines returns 'todaysRoutines'. We need to filter by completion.
        // The hook might not return completion status directly attached to routine object heavily enough 
        // without the `useRoutineCompletion` hook. Let's start with just raw count of "Today's Routines" first. 
        // Or better, let's use the completion hook if possible, or just show total for today. 
        // Plan says "Pending Routines".
        // Let's refine this after initial render, for now just length of todaysRoutines is a good proxy for "Active Habits".
        setPendingRoutinesCount(todaysRoutines.length);

    }, [todaysRoutines]);

    const [completedTasksTodayCount, setCompletedTasksTodayCount] = useState(0);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        let completed = 0;
        finishedTasks.forEach(t => {
            const getCompletionDate = (task: any) => {
                const doneEntries = task.history?.filter((h: any) => h.action === 'status_changed_to_done');
                if (doneEntries && doneEntries.length > 0) {
                    const latest = doneEntries.reduce((prev: any, current: any) => {
                        return (prev.timestamp?.toMillis() || 0) > (current.timestamp?.toMillis() || 0) ? prev : current;
                    });
                    return latest.timestamp?.toDate();
                }
                return task.updatedAt?.toDate();
            };
            const cDate = getCompletionDate(t);
            if (cDate && cDate >= today && cDate <= endOfToday) {
                completed++;
            }
        });
        setCompletedTasksTodayCount(completed);
    }, [finishedTasks]);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToMeetings(user.uid, (data) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todaysMeetings = data.filter(m => {
                if (!m.startTime) return false;
                const date = m.startTime.toDate();
                return date >= today && date < tomorrow;
            });
            setMeetingsCount(todaysMeetings.length);
            setMeetingsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const isLoading = tasksLoading || routinesLoading || meetingsLoading || accountsLoading || delegationsLoading;

    if (isLoading) {
        return <Loader fullScreen={false} className="py-8" />;
    }

    const activeTodayTasks = activeTasks.filter(t => {
        if (!t.deadline) return true;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return t.deadline.toDate() <= today;
    });

    const totalTasksToday = activeTodayTasks.length + completedTasksTodayCount;
    const taskProgress = totalTasksToday > 0 ? (completedTasksTodayCount / totalTasksToday) * 100 : 0;

    const cards = [
        {
            title: "Todo",
            count: activeTodayTasks.length,
            progress: taskProgress,
            hasProgress: true,
            icon: CheckSquare,
            href: "/today",
            color: "var(--primary)",
            description: "Active tasks today"
        },
        {
            title: "Routine",
            count: pendingRoutinesCount,
            progress: 0, // Simplified for now
            hasProgress: false,
            icon: Repeat,
            href: "/today",
            color: "#8A9A5B",
            description: "Scheduled habits"
        },
        {
            title: "Meeting",
            count: meetingsCount,
            icon: Calendar,
            hasProgress: false,
            href: "/today",
            color: "#D1B894", // Gold/Tan
            description: "Events & Calls"
        },
        {
            title: "Delegated",
            count: activeDelegations.length + reviewDelegations.length,
            icon: Users,
            hasProgress: false,
            href: "/delegations",
            color: "#4b6584",
            description: "Team assignments"
        }
    ];

    return (
        <div style={{ paddingBottom: '6rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Here is your overview for today.</p>

            {user && (
                <div style={{ margin: '0 -1rem 1.5rem -1rem' }} className="mobile-only">
                    <StatsWidget userId={user.uid} />
                </div>
            )}

            <SomedaySweeper activeTasks={activeTasks} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cards.map((card) => (
                    <Link href={card.href} key={card.title} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        padding: '1.5rem',
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'transform 0.1s ease, border-color 0.2s ease',
                        textDecoration: 'none',
                        color: 'inherit'
                    }}>
                        <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {card.hasProgress && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityRing progress={card.progress || 0} size={60} strokeWidth={4} color={card.color} trackColor="var(--border)" />
                                </div>
                            )}
                            <div style={{
                                width: card.hasProgress ? '44px' : '60px',
                                height: card.hasProgress ? '44px' : '60px',
                                borderRadius: card.hasProgress ? '50%' : '12px',
                                backgroundColor: `${card.color}15`,
                                color: card.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1
                            }}>
                                <card.icon size={24} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>
                                {card.count}
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--foreground)' }}>
                                {card.title}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {card.description}
                            </div>
                        </div>

                        <div style={{ opacity: 0.3 }}>
                            <ArrowRight size={24} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Areas Section */}
            {accounts.length > 0 && (
                <div style={{ marginTop: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', opacity: 0.7 }}>
                        <Folder size={16} />
                        <h2 style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Your Areas
                        </h2>
                    </div>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                        gap: '1rem' 
                    }}>
                        {accounts.map(account => {
                            const accountTasksCount = activeTasks.filter(t => t.accountId === account.id).length;
                            const color = account.color || DEFAULT_ACCOUNT_COLOR;
                            
                            return (
                                <Link href={`/area?id=${account.id}`} key={account.id} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '1.25rem',
                                    backgroundColor: 'var(--card-bg)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    borderTop: `4px solid ${color}`,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                                    transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                                }}>
                                    <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {account.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {accountTasksCount} active task{accountTasksCount !== 1 ? 's' : ''}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
