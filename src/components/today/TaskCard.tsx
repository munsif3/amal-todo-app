"use client";

import { Task } from "@/types";
import { Check, Clock, Pencil, Calendar, GripVertical } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";

import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";

interface TaskCardProps {
    task: Task;
    onStatusChange: (status: Task['status']) => void;
    areaColor?: string;
    isBlocked?: boolean;
    dragControls?: any; // strict typing would be DragControls from framer-motion
}

export default function TaskCard({ task, onStatusChange, areaColor, isBlocked = false, dragControls }: TaskCardProps) {
    const x = useMotionValue(0);

    // Transform x position to colors for swipe actions
    const background = useTransform(
        x,
        [-100, 0, 100],
        ["rgba(209, 184, 148, 0.5)", "rgba(255, 255, 255, 1)", "rgba(138, 154, 91, 0.5)"]
    );

    const handleDragEnd = (_: any, info: any) => {
        if (task.status === 'done' || isBlocked) return;

        if (info.offset.x > 100) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
            onStatusChange('done');
        } else if (info.offset.x < -100) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
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
                    x: isBlocked ? 0 : x,
                    background,
                    padding: '1.25rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    borderLeft: areaColor ? `4px solid ${areaColor}` : (task.accountId ? `4px solid ${DEFAULT_ACCOUNT_COLOR}` : '1px solid var(--border)'),
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: task.status === 'done' || isBlocked ? 'default' : 'grab',
                    opacity: isBlocked ? 0.7 : 1,
                }}
                drag={task.status === 'done' || isBlocked ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                whileTap={{ cursor: isBlocked ? 'not-allowed' : 'grabbing' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Drag Handle */}
                <div
                    className="drag-handle"
                    onPointerDown={(e) => dragControls?.start(e)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        padding: '0.5rem',
                        opacity: 0.3,
                        marginRight: '0.5rem',
                        touchAction: 'none'
                    }}
                >
                    <GripVertical size={16} />
                </div>

                {/* Tick Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Toggle between done and next (todo)
                        onStatusChange(task.status === 'done' ? 'next' : 'done');
                    }}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${task.status === 'done' ? 'var(--status-done)' : 'var(--border)'}`,
                        backgroundColor: task.status === 'done' ? 'var(--status-done)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0
                    }}
                >
                    {task.status === 'done' && <Check size={14} color="white" strokeWidth={3} />}
                </button>

                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: task.status === 'done' ? 'var(--status-done)' : 'var(--foreground)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {isBlocked && <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f0f0f0', color: '#888' }}>BLOCKED</span>}
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
                    {task.references && task.references.length > 0 && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {task.references.map((ref, idx) => (
                                <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer" style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    textDecoration: 'none',
                                    backgroundColor: 'rgba(0,0,0,0.03)',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span>{ref.type === 'email' ? '✉️' : '🔗'}</span>
                                    {ref.label}
                                </a>
                            ))}
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
                    <Link href={`/tasks/edit?id=${task.id}`} style={{ opacity: 0.3 }}>
                        <Pencil size={16} />
                    </Link>
                )}
            </motion.div>
        </div>
    );
}
