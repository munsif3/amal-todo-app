"use client";

import Link from "next/link";
import { Delegation } from "@/types";
import { getDelegationProgress } from "@/lib/hooks/use-delegations";
import { User, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const statusConfig: Record<Delegation['status'], { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "#8a9a5b", bg: "rgba(138,154,91,0.15)" },
    review: { label: "In Review", color: "#d1b894", bg: "rgba(209,184,148,0.15)" },
    closed: { label: "Closed", color: "#b2bec3", bg: "rgba(178,190,195,0.15)" },
};

interface DelegationCardProps {
    delegation: Delegation;
}

export default function DelegationCard({ delegation }: DelegationCardProps) {
    const progress = getDelegationProgress(delegation);
    const config = statusConfig[delegation.status];
    const isOverdue = delegation.deadline && delegation.deadline.toDate() < new Date() && delegation.status !== 'closed';

    return (
        <Link
            href={`/delegations/view?id=${delegation.id}`}
            id={`delegation-card-${delegation.id}`}
            style={{
                display: 'block',
                padding: '1.25rem',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.1s ease, box-shadow 0.2s ease',
            }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {delegation.title}
                    </h3>
                    {delegation.assignee && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            <User size={13} />
                            <span>{delegation.assignee}</span>
                        </div>
                    )}
                </div>

                {/* Status chip */}
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    backgroundColor: config.bg,
                    color: config.color,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                }}>
                    {config.label}
                </span>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {delegation.subtasks?.filter(s => s.isCompleted).length || 0}/{delegation.subtasks?.length || 0} subtasks
                    </span>
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: progress === 100 ? '#8a9a5b' : 'var(--text-secondary)',
                    }}>
                        {progress}%
                    </span>
                </div>
                <div style={{
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: 'var(--bg-subtle)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        borderRadius: '3px',
                        backgroundColor: progress === 100 ? '#8a9a5b' : 'var(--primary)',
                        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isOverdue && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--destructive)' }}>
                        <AlertCircle size={12} />
                        Overdue
                    </span>
                )}
                {delegation.deadline && !isOverdue && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {delegation.deadline.toDate().toLocaleDateString()}
                    </span>
                )}
                {progress === 100 && delegation.status === 'active' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#8a9a5b' }}>
                        <CheckCircle2 size={12} />
                        Ready for review
                    </span>
                )}
            </div>
        </Link>
    );
}
