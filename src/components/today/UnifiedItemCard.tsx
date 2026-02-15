"use client";

import { useTheme } from "next-themes";
import { Check, Clock, Calendar, Repeat, MoreVertical, MapPin } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";
import { Timestamp } from "firebase/firestore";

// Unified Interface for display
export interface UnifiedItem {
    id: string;
    type: 'task' | 'routine' | 'meeting';
    title: string;
    subtitle?: string; // description for tasks, notes for meetings?
    time?: Date; // deadline for tasks, startTime for meetings
    isCompleted: boolean;
    accountId?: string;
    areaColor?: string;
    originalItem: any; // Keep ref to original for actions
    badge?: {
        text: string;
        variant: 'default' | 'destructive' | 'warning' | 'neutral';
    };
}

interface UnifiedItemCardProps {
    item: UnifiedItem;
    onToggle: (item: UnifiedItem) => void;
    dragControls?: any;
    isBlocked?: boolean;
}

export default function UnifiedItemCard({ item, onToggle, isBlocked, dragControls }: UnifiedItemCardProps) {
    const x = useMotionValue(0);
    const { resolvedTheme } = useTheme();
    const centerColor = resolvedTheme === 'dark' ? '#242424' : '#ffffff';

    // Swipe background colors
    const background = useTransform(
        x,
        [-100, 0, 100],
        ["rgba(209, 184, 148, 0.5)", centerColor, "rgba(138, 154, 91, 0.5)"]
    );

    const handleDragEnd = (_: any, info: any) => {
        if (item.isCompleted || isBlocked) return;
        // Meetings are now swipeable

        if (info.offset.x > 100) {
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
        // "Classy" styles: subtle backgrounds, clear text, borders
        switch (variant) {
            case 'destructive':
                // Overdue: Subtle red background, red text
                return {
                    backgroundColor: 'rgba(239, 68, 68, 0.15)', // slightly less diluted
                    color: 'var(--destructive)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontWeight: 700 // Make text bolder
                };
            case 'warning':
                return {
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    color: 'var(--warning)',
                    border: '1px solid rgba(234, 179, 8, 0.2)'
                };
            case 'neutral':
                // No Deadline: Minimalist grey
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
            {/* Allow swipe background for meetings too if we are enabling drag, effectively treating them like tasks */}
            {item.type === 'meeting' && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'center',
                    padding: '0 1.5rem', zIndex: 0, backgroundColor: 'var(--status-done)', opacity: 0.2
                }}>
                    <Check size={20} color="var(--status-next)" />
                </div>
            )}


            <motion.div
                style={{
                    x: (isBlocked) ? 0 : x,
                    background: centerColor,
                    padding: '1rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
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
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Allow toggling via click too
                        onToggle(item);
                    }}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%', // Circular for all
                        border: `2px solid ${item.isCompleted ? 'var(--status-done)' : 'var(--border)'}`,
                        backgroundColor: item.isCompleted ? 'var(--status-done)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0
                    }}
                >
                    {item.isCompleted && <Check size={14} color="white" strokeWidth={3} />}
                    {item.type === 'routine' && !item.isCompleted && <Repeat size={14} className="text-muted-foreground" />}
                    {/* Meetings now look empty when not done, like tasks */}
                </button>

                <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: item.isCompleted ? 'var(--status-done)' : 'var(--foreground)',
                            textDecoration: item.isCompleted ? 'line-through' : 'none',
                            margin: 0,
                            lineHeight: '1.2',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            minWidth: 0
                        }}>
                            {item.title}
                        </h3>
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
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                        {item.subtitle && (
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                            }}>
                                {item.subtitle}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions / Edit Link */}
                <Link
                    href={
                        `/edit?type=${item.type}&id=${item.id}`
                    }
                    style={{ opacity: 0.3 }}
                >
                    <MoreVertical size={16} />
                </Link>

            </motion.div>
        </div>
    );
}
