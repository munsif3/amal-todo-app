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

    // Swipe background colors (only for tasks/routines?)
    const background = useTransform(
        x,
        [-100, 0, 100],
        ["rgba(209, 184, 148, 0.5)", centerColor, "rgba(138, 154, 91, 0.5)"]
    );

    const handleDragEnd = (_: any, info: any) => {
        if (item.isCompleted || isBlocked) return;
        if (item.type === 'meeting') return; // Don't swipe meetings?

        if (info.offset.x > 100) {
            if (navigator.vibrate) navigator.vibrate(50);
            onToggle(item);
        }
        // Left swipe could constitute "Snooze" or "Skip"
    };

    // Icon logic
    const Icon = item.type === 'meeting' ? Calendar : (item.type === 'routine' ? Repeat : Check);

    // Time formatting
    const timeString = item.time ? item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

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

            <motion.div
                style={{
                    x: (isBlocked || item.type === 'meeting') ? 0 : x,
                    background: item.type === 'meeting' ? 'var(--card-bg)' : background,
                    padding: '1rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    borderLeft: item.areaColor ? `4px solid ${item.areaColor}` : (item.accountId ? `4px solid ${DEFAULT_ACCOUNT_COLOR}` : `4px solid var(--border)`),
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: (item.isCompleted || isBlocked || item.type === 'meeting') ? 'default' : 'grab',
                    opacity: isBlocked ? 0.7 : 1,
                }}
                drag={(item.isCompleted || isBlocked || item.type === 'meeting') ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                whileTap={{ cursor: isBlocked ? 'not-allowed' : 'grabbing' }}
            >
                {/* Checkbox / Icon Area */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // For meetings, maybe open details? For tasks/routines, toggle.
                        if (item.type !== 'meeting') onToggle(item);
                    }}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: item.type === 'routine' ? '50%' : (item.type === 'meeting' ? '6px' : '50%'), // Meetings square-ish?
                        border: `2px solid ${item.isCompleted ? 'var(--status-done)' : 'var(--border)'}`,
                        backgroundColor: item.isCompleted ? 'var(--status-done)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: item.type === 'meeting' ? 'default' : 'pointer',
                        padding: 0,
                        flexShrink: 0
                    }}
                >
                    {item.isCompleted && <Check size={14} color="white" strokeWidth={3} />}
                    {item.type === 'meeting' && !item.isCompleted && <Calendar size={14} className="text-muted-foreground" />}
                    {item.type === 'routine' && !item.isCompleted && <Repeat size={14} className="text-muted-foreground" />}
                </button>

                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: item.isCompleted ? 'var(--status-done)' : 'var(--foreground)',
                        textDecoration: item.isCompleted ? 'line-through' : 'none',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        {item.title}
                    </h3>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                        {timeString && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                {item.type === 'meeting' ? <Clock size={12} /> : <Calendar size={12} />}
                                {timeString}
                            </span>
                        )}
                        {item.subtitle && (
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
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
