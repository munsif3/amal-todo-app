import { Epic } from "@/lib/firebase/cockpit";

interface SummaryBarProps {
    epics: Epic[];
}

export default function SummaryBar({ epics }: SummaryBarProps) {
    const totalEpics = epics.length;
    const onTrack = epics.filter(e => e.status === 'green').length;
    const atRisk = epics.filter(e => e.status === 'amber').length;
    const blocked = epics.filter(e => e.status === 'red').length;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', padding: '1rem 0' }}>
            <StatCard label="TOTAL EPICS" value={totalEpics} valueColor="var(--text-secondary)" />
            <StatCard label="ON TRACK" value={onTrack} valueColor="#10b981" />
            <StatCard label="AT RISK" value={atRisk} valueColor="#f59e0b" />
            <StatCard label="BLOCKED" value={blocked} valueColor="var(--destructive)" />
        </div>
    );
}

function StatCard({ label, value, valueColor }: { label: string, value: number, valueColor: string }) {
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            padding: '1.25rem',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px'
        }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                {label}
            </div>
            <div style={{ fontSize: '2rem', letterSpacing: '-0.02em', fontWeight: '600', color: valueColor, lineHeight: 1 }}>
                {value}
            </div>
        </div>
    );
}
