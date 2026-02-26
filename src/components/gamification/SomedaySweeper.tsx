"use client";

import { useState } from "react";
import { Task } from "@/types";
import { bulkUpdateTaskStatus } from "@/lib/firebase/tasks";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";

interface SomedaySweeperProps {
    activeTasks: Task[];
}

export default function SomedaySweeper({ activeTasks }: SomedaySweeperProps) {
    const { user } = useAuth();
    const [isSweeping, setIsSweeping] = useState(false);

    // Identify stale tasks (> 14 days old)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const staleTasks = activeTasks.filter(task => {
        // A task is stale if:
        // 1. Its deadline has passed by more than 14 days OR
        // 2. It has no deadline, but it was created more than 14 days ago.

        if (task.deadline) {
            return task.deadline.toDate() < fourteenDaysAgo;
        }

        if (!task.createdAt) return false;
        return task.createdAt.toDate() < fourteenDaysAgo;
    });

    if (staleTasks.length === 0 || !user) return null;

    const handleSweep = async () => {
        if (!confirm(`Are you sure you want to move ${staleTasks.length} old tasks to your 'Someday' list? You can review them anytime.`)) return;

        setIsSweeping(true);
        try {
            const taskIds = staleTasks.map(t => t.id);
            await bulkUpdateTaskStatus(taskIds, 'someday', user.uid);
        } catch (error) {
            console.error("Failed to sweep tasks:", error);
        } finally {
            setIsSweeping(false);
        }
    };

    return (
        <div className="mobile-col mobile-card-padding" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            backgroundColor: 'rgba(138, 154, 91, 0.1)', // Subtle Sage Green
            borderRadius: '12px',
            border: '1px solid rgba(138, 154, 91, 0.3)',
            animation: 'fadeIn 0.5s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    backgroundColor: 'rgba(138, 154, 91, 0.2)',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    color: '#8A9A5B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--foreground)', margin: 0, marginBottom: '0.25rem' }}>
                        Task Bankruptcy?
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                        You have <strong style={{ color: 'var(--foreground)' }}>{staleTasks.length}</strong> tasks older than 2 weeks. Let's move them to 'Someday' and clear your mind.
                    </p>
                </div>
            </div>

            <button
                onClick={handleSweep}
                disabled={isSweeping}
                style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#8A9A5B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: isSweeping ? 'not-allowed' : 'pointer',
                    opacity: isSweeping ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'opacity 0.2s',
                    whiteSpace: 'nowrap'
                }}
            >
                {isSweeping ? 'Sweeping...' : 'Sweep Now'}
                {!isSweeping && <ArrowRight size={16} />}
            </button>
        </div>
    );
}
