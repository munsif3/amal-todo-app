export default function CockpitSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '6rem' }}>
            {/* Header Skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={skeletonBlock(250, 40)} />
                    <div style={skeletonBlock(320, 20)} />
                </div>
                <div style={skeletonBlock(180, 40)} />
            </div>

            {/* Summary Bar Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={skeletonBlock(80, 16)} />
                        <div style={skeletonBlock(60, 40)} />
                    </div>
                ))}
            </div>

            {/* Tabs Skeleton */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[...Array(7)].map((_, i) => (
                    <div key={i} style={{ ...skeletonBlock(80, 32), borderRadius: '16px' }} />
                ))}
            </div>

            {/* Table Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={skeletonBlock(120, 16)} />
                <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border)' }} />
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0' }}>
                        <div style={skeletonBlock(200, 20)} />
                        <div style={skeletonBlock(60, 20)} />
                        <div style={skeletonBlock(80, 20)} />
                        <div style={skeletonBlock(100, 20)} />
                    </div>
                ))}
            </div>

            {/* Team Pulse Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                <div style={skeletonBlock(150, 16)} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ ...skeletonBlock(40, 40), borderRadius: '50%' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={skeletonBlock(100, 16)} />
                                    <div style={skeletonBlock(60, 12)} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const skeletonBlock = (width: number | string, height: number | string): React.CSSProperties => ({
    width,
    height,
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '4px',
    opacity: 0.7,
});
