import { Epic } from "@/lib/firebase/cockpit";

interface TeamPulseProps {
    epics: Epic[];
}

export default function TeamPulse({ epics }: TeamPulseProps) {
    // Filter out only flash epics
    const flashEpics = epics.filter(e => e.team === 'Flash');
    
    // Group by owner
    const ownersMap = new Map<string, Epic[]>();
    flashEpics.forEach(epic => {
        if (!ownersMap.has(epic.owner)) {
            ownersMap.set(epic.owner, []);
        }
        ownersMap.get(epic.owner)!.push(epic);
    });

    const owners = Array.from(ownersMap.entries()).map(([owner, ownerEpics]) => ({ owner, ownerEpics }));

    if (owners.length === 0) return null;

    return (
        <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                TEAM PULSE — FLASH
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {owners.map(({ owner, ownerEpics }) => (
                    <OwnerCard key={owner} owner={owner} epics={ownerEpics} />
                ))}
            </div>
        </div>
    );
}

function OwnerCard({ owner, epics }: { owner: string, epics: Epic[] }) {
    const initials = owner.substring(0, 2).toUpperCase();
    
    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.8125rem', 
                    fontWeight: '700', 
                    color: '#fff', 
                    ...getAvatarStyle(owner) 
                }}>
                    {initials}
                </div>
                <div>
                    <div style={{ fontWeight: '600', color: 'var(--foreground)', fontSize: '0.875rem' }}>{owner}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Epic owner</div>
                </div>
            </div>
            
            <div style={{ borderTop: '1px solid rgba(128,128,128,0.1)' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {epics.map((epic, index) => (
                        <li key={epic.id} style={{ 
                            padding: '0.625rem 1rem', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            backgroundColor: 'var(--bg-subtle)',
                            borderBottom: index === epics.length - 1 ? 'none' : '1px solid rgba(128,128,128,0.05)',
                            transition: 'background-color 0.2s'
                        }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '1rem' }}>
                                {epic.name}
                            </span>
                            <span style={{ 
                                display: 'inline-block', 
                                flexShrink: 0,
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                boxShadow: '0 0 0 2px var(--card-bg)',
                                backgroundColor: getStatusColor(epic.status) 
                            }} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function getAvatarStyle(name: string): React.CSSProperties {
    if (name.includes('Sadeep')) return { backgroundColor: '#9333ea' }; // purple
    if (name.includes('Buwaneka')) return { backgroundColor: '#0d9488' }; // teal
    if (name.includes('Sachini')) return { backgroundColor: '#e11d48' }; // rose
    if (name.includes('Jose')) return { backgroundColor: '#2563eb' }; // blue
    if (name.includes('Arkam')) return { backgroundColor: '#d97706' }; // amber
    if (name.includes('Lumbini')) return { backgroundColor: '#059669' }; // emerald
    
    // Fallback
    const colors = ['#4f46e5', '#db2777', '#0891b2', '#ea580c'];
    const index = name.charCodeAt(0) % colors.length;
    return { backgroundColor: colors[index] };
}

function getStatusColor(status: string) {
    switch (status) {
        case 'green': return '#10b981';
        case 'amber': return '#f59e0b';
        case 'red': return 'var(--destructive)';
        default: return 'var(--text-secondary)';
    }
}
