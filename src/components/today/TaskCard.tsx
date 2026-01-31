"use client";

import { Task } from "@/types";
import { Check, Clock, Pencil, Calendar } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";

import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";

interface TaskCardProps {
    task: Task;
    onStatusChange: (status: Task['status']) => void;
    areaColor?: string;
}

export default function TaskCard({ task, onStatusChange, areaColor }: TaskCardProps) {
    const x = useMotionValue(0);

    // Transform x position to colors for swipe actions
    const background = useTransform(
        x,
        [-100, 0, 100],
        ["rgba(209, 184, 148, 0.5)", "rgba(255, 255, 255, 1)", "rgba(138, 154, 91, 0.5)"]
    );

    const handleDragEnd = (_: any, info: any) => {
        if (task.status === 'done') return;

        if (info.offset.x > 100) {
            onStatusChange('done');
        } else if (info.offset.x < -100) {
            onStatusChange('waiting');
        }
    };

    return (
        <div style={{ position: 'relative', marginBottom: '0.75rem', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
            {/* Background action indicators */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 1.5rem',
                zIndex: 0,
                backgroundColor: 'var(--muted)',
                opacity: 0.5
            }}>
                <Check size={20} color="var(--status-next)" />
                <Clock size={20} color="var(--status-waiting)" />
            </div>

            <motion.div
                style={{
                    x,
                    background,
                    padding: '1.25rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    borderLeft: areaColor ? `4px solid ${areaColor}` : (task.accountId ? `4px solid ${DEFAULT_ACCOUNT_COLOR}` : '1px solid var(--border)'),
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex', // Restored flex layout
                    alignItems: 'center', // Restored alignment
                    gap: '1rem', // Restored gap
                    cursor: task.status === 'done' ? 'default' : 'grab'
                }}
                drag={task.status === 'done' ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                whileTap={{ cursor: 'grabbing' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: task.status === 'done' ? 'var(--status-done)' : 'var(--foreground)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        marginBottom: '0.25rem'
                    }}>
                        {task.title}
                    </h3>
                    {task.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.5 }}>
                            {task.description}
                        </p>
                    )}
                    {task.deadline && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', opacity: 0.6 }}>
                            <Calendar size={12} />
                            <span style={{ fontSize: '0.75rem' }}>
                                {task.deadline.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}
                </div>

                {task.status === 'done' ? (
                    <button
                        onClick={() => onStatusChange('next')}
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--status-done)',
                            fontWeight: '500'
                        }}
                    >
                        Undo
                    </button>
                ) : (
                    <Link href={`/tasks/${task.id}/edit`} style={{ opacity: 0.3 }}>
                        <Pencil size={16} />
                    </Link>
                )}
            </motion.div>
        </div>
    );
}
