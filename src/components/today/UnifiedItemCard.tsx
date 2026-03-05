"use client";

import { useTheme } from "next-themes";
import { Check, Clock, Calendar, Repeat, MoreVertical, ListTodo, Trash2 } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import Link from "next/link";
import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";
import { Task, Routine, Meeting } from "@/types";

// Unified Interface for display
export interface UnifiedItem {
    id: string;
    type: 'task' | 'routine' | 'meeting';
    title: string;
    subtitle?: string;
    time?: Date;
    isCompleted: boolean;
    accountId?: string;
    areaColor?: string;
    originalItem: Task | Routine | Meeting;
    badge?: {
        text: string;
        variant: 'default' | 'destructive' | 'warning' | 'neutral';
    };
    isFrog?: boolean;
    isTwoMinute?: boolean;
    isPriority?: boolean;
    subtasksCount?: { completed: number; total: number };
}

interface UnifiedItemCardProps {
    item: UnifiedItem;
    onToggle: (item: UnifiedItem) => void;
    onToggleFrog?: (item: UnifiedItem) => void;
    onToggleTwoMinute?: (item: UnifiedItem) => void;
    onTogglePriority?: (item: UnifiedItem) => void;
    onDelete?: (item: UnifiedItem) => void;
    dragControls?: import('framer-motion').DragControls;
    isBlocked?: boolean;
}

export default function UnifiedItemCard({ item, onToggle, onToggleFrog, onToggleTwoMinute, onTogglePriority, onDelete, isBlocked, dragControls }: UnifiedItemCardProps) {
    const x = useMotionValue(0);
    const { resolvedTheme } = useTheme();
    const centerColor = resolvedTheme === 'dark' ? '#242424' : '#ffffff';

    // Swipe background colors
    const background = useTransform(
        x,
        [-100, 0, 100],
        ["rgba(209, 184, 148, 0.5)", centerColor, "rgba(138, 154, 91, 0.5)"]
    );

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (item.isCompleted || isBlocked) return;

        if (info.offset.x > 100) {
            if (!item.isCompleted && item.subtasksCount && item.subtasksCount.completed < item.subtasksCount.total) {
                alert(`Cannot complete task: ${item.subtasksCount.total - item.subtasksCount.completed} requirement(s) remaining.`);
                return;
            }

            if (navigator.vibrate) navigator.vibrate(50);
            onToggle(item);
        }
    };

    // Date/Time formatting
    const formatDate = (date?: Date) => {
        if (!date) return null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (itemDate.getTime() === today.getTime()) {
            return `Today, ${timeStr}`;
        } else if (itemDate.getTime() === tomorrow.getTime()) {
            return `Tomorrow, ${timeStr}`;
        } else {
            return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${timeStr}`;
        }
    };

    const timeString = formatDate(item.time);

    // Badge styling helpers
    const getBadgeStyle = (variant: string) => {
        switch (variant) {
            case 'destructive':
                return {
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--destructive)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontWeight: 700
                };
            case 'warning':
                return {
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    color: 'var(--warning)',
                    border: '1px solid rgba(234, 179, 8, 0.2)'
                };
            case 'neutral':
                return {
                    backgroundColor: 'rgba(120, 120, 120, 0.1)',
                    color: 'var(--muted-foreground)',
                    border: '1px solid var(--border)'
                };
            default:
                return {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                };
        }
    };

    const badgeStyle = item.badge ? getBadgeStyle(item.badge.variant) : {};

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onDelete) return;
        if (confirm(`Delete "${item.title}"? This cannot be undone.`)) {
            onDelete(item);
        }
    };

    return (
        <div style={{ position: 'relative', marginBottom: '0.75rem', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
            {/* Background for swipe */}
            {item.type !== 'meeting' && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0 1.5rem', zIndex: 0, backgroundColor: 'var(--muted)', opacity: 0.5
                }}>
                    <Check size={20} color="var(--status-next)" />
                    <Clock size={20} color="var(--status-waiting)" />
                </div>
            )}
            {item.type === 'meeting' && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'center',
                    padding: '0 1.5rem', zIndex: 0, backgroundColor: 'var(--status-done)', opacity: 0.2
                }}>
                    <Check size={20} color="var(--status-next)" />
                </div>
            )}

            <motion.div
                className="mobile-card-padding"
                style={{
                    x: (isBlocked) ? 0 : x,
                    background: centerColor,
                    padding: '1rem',
                    borderRadius: 'var(--radius)',
                    borderTop: item.isFrog && !item.isCompleted ? '2px solid var(--accent-sage)' : item.isPriority && !item.isCompleted ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRight: item.isFrog && !item.isCompleted ? '2px solid var(--accent-sage)' : item.isPriority && !item.isCompleted ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderBottom: item.isFrog && !item.isCompleted ? '2px solid var(--accent-sage)' : item.isPriority && !item.isCompleted ? '2px solid var(--primary)' : '1px solid var(--border)',
                    boxShadow: item.isFrog && !item.isCompleted ? '0 0 15px rgba(138, 154, 91, 0.2)' : item.isPriority && !item.isCompleted ? '0 0 12px rgba(var(--primary-rgb, 0, 0, 0), 0.1)' : 'none',
                    borderLeft: item.areaColor ? `4px solid ${item.areaColor}` : (item.accountId ? `4px solid ${DEFAULT_ACCOUNT_COLOR}` : `4px solid var(--border)`),
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: (item.isCompleted || isBlocked) ? 'default' : 'grab',
                    opacity: isBlocked ? 0.7 : 1,
                }}
                drag={(item.isCompleted || isBlocked) ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                whileTap={{ cursor: isBlocked ? 'not-allowed' : 'grabbing' }}
            >
                {/* Checkbox / Icon Area */}
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!item.isCompleted && item.subtasksCount && item.subtasksCount.completed < item.subtasksCount.total) {
                            alert(`Cannot complete task: ${item.subtasksCount.total - item.subtasksCount.completed} requirement(s) remaining.`);
                            return;
                        }
                        onToggle(item);
                    }}
                    whileTap={{ scale: 0.8 }}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${item.isCompleted ? 'var(--status-done)' : 'var(--border)'}`,
                        backgroundColor: item.isCompleted ? 'var(--status-done)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0,
                        outline: 'none',
                    }}
                >
                    {item.isCompleted && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Check size={14} color="white" strokeWidth={3} />
                        </motion.div>
                    )}
                    {item.type === 'routine' && !item.isCompleted && <Repeat size={14} className="text-muted-foreground" />}
                </motion.button>

                <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: item.isCompleted ? 'var(--status-done)' : 'var(--foreground)',
                        textDecoration: item.isCompleted ? 'line-through' : 'none',
                        margin: 0,
                        lineHeight: '1.3',
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {item.title}
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                        {item.isPriority && !item.isCompleted && (
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                padding: '0.1rem 0.4rem',
                                backgroundColor: 'var(--bg-subtle)',
                                color: 'var(--primary)',
                                borderRadius: '4px',
                                border: '1px solid var(--border)',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                flexShrink: 0,
                            }} title="Priority Task">
                                ⭐ Priority
                            </span>
                        )}
                        {item.isFrog && !item.isCompleted && (
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                padding: '0.1rem 0.4rem',
                                backgroundColor: 'rgba(138, 154, 91, 0.15)',
                                color: 'var(--status-next, #8a9a5b)',
                                borderRadius: '4px',
                                border: '1px solid rgba(138, 154, 91, 0.3)',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                flexShrink: 0,
                            }} title="Frog Task">
                                🐸 Frog
                            </span>
                        )}
                        {item.badge && !item.isCompleted && (
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: '600',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                                ...badgeStyle
                            }}>
                                {item.badge.text}
                            </span>
                        )}
                        {timeString && (
                            <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--primary)',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}>
                                {item.type === 'meeting' ? <Clock size={12} /> : <Calendar size={12} />}
                                {timeString}
                            </span>
                        )}
                        {item.isTwoMinute && !item.isCompleted && (
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                padding: '0.1rem 0.4rem',
                                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                color: 'var(--warning, #eab308)',
                                borderRadius: '4px',
                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                flexShrink: 0,
                            }}>
                                ⚡ 2m
                            </span>
                        )}
                        {item.subtasksCount && item.subtasksCount.total > 0 && (
                            <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                backgroundColor: 'var(--bg-subtle)',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                border: '1px solid var(--border)',
                                fontWeight: '500'
                            }}>
                                <ListTodo size={12} />
                                {item.subtasksCount.completed}/{item.subtasksCount.total}
                            </span>
                        )}
                    </div>

                    {item.subtitle && (
                        <span style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-muted)',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word'
                        }}>
                            {item.subtitle.replace(/<[^>]*>?/gm, ' ')}
                        </span>
                    )}
                </div>

                {/* Actions: Delete + Edit Link */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0, paddingLeft: '0.25rem' }}>
                    {onDelete && !item.isCompleted && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            title="Delete"
                            style={{
                                opacity: 0.3,
                                padding: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--destructive)',
                                transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                    <Link
                        href={`/edit?type=${item.type}&id=${item.id}`}
                        style={{ opacity: 0.3, padding: '0.5rem' }}
                    >
                        <MoreVertical size={16} />
                    </Link>
                </div>

            </motion.div>
        </div>
    );
}
