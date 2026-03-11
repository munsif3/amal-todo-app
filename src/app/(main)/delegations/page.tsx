"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useDelegations } from "@/lib/hooks/use-delegations";
import DelegationCard from "@/components/delegations/DelegationCard";
import Loader from "@/components/ui/Loading";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

export default function DelegationsPage() {
    const { user } = useAuth();
    const { activeDelegations, reviewDelegations, closedDelegations, loading } = useDelegations(user);

    if (loading) {
        return <Loader fullScreen={false} className="py-8" />;
    }

    const totalActive = activeDelegations.length + reviewDelegations.length;

    return (
        <div style={{ paddingBottom: '6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Delegations</h1>
                <Link
                    href="/delegations/new"
                    id="new-delegation-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        transition: 'var(--transition-ease)',
                    }}
                >
                    <Plus size={16} />
                    <span>New</span>
                </Link>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {totalActive} active delegation{totalActive !== 1 ? 's' : ''} you&apos;re tracking.
            </p>

            {totalActive === 0 && closedDelegations.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: 'var(--text-muted)',
                }}>
                    <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>No delegations yet</p>
                    <p style={{ fontSize: '0.875rem' }}>Create one to start tracking big tasks you&apos;ve assigned to your team.</p>
                </div>
            )}

            {/* Active */}
            {activeDelegations.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        Active ({activeDelegations.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activeDelegations.map(d => <DelegationCard key={d.id} delegation={d} />)}
                    </div>
                </div>
            )}

            {/* In Review */}
            {reviewDelegations.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d1b894', marginBottom: '0.75rem' }}>
                        In Review ({reviewDelegations.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {reviewDelegations.map(d => <DelegationCard key={d.id} delegation={d} />)}
                    </div>
                </div>
            )}

            {/* Closed */}
            {closedDelegations.length > 0 && (
                <CollapsibleSection title={`Closed (${closedDelegations.length})`} defaultOpen={false}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {closedDelegations.map(d => <DelegationCard key={d.id} delegation={d} />)}
                    </div>
                </CollapsibleSection>
            )}
        </div>
    );
}
