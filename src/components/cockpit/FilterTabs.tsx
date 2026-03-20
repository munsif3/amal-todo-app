export type FilterValue = 'All' | 'OPUS' | 'OPS' | 'Flash' | 'Magellan' | 'Orion' | 'Needs me';

const FILTERS: FilterValue[] = [
    'All', 'OPUS', 'OPS', 'Flash', 'Magellan', 'Orion', 'Needs me'
];

interface FilterTabsProps {
    currentFilter: FilterValue;
    onFilterChange: (filter: FilterValue) => void;
}

export default function FilterTabs({ currentFilter, onFilterChange }: FilterTabsProps) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0' }}>
            {FILTERS.map(filter => {
                const isSelected = currentFilter === filter;
                return (
                    <button
                        key={filter}
                        onClick={() => onFilterChange(filter)}
                        style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '16px',
                            fontSize: '0.8125rem',
                            fontWeight: '500',
                            transition: 'var(--transition-ease)',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--card-bg)' : 'transparent',
                            color: isSelected ? 'var(--foreground)' : 'var(--text-secondary)',
                            border: `1px solid ${isSelected ? 'var(--border)' : 'rgba(128, 128, 128, 0.2)'}`,
                        }}
                        onMouseOver={(e) => {
                            if (!isSelected) {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isSelected) {
                                e.currentTarget.style.borderColor = 'rgba(128, 128, 128, 0.2)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }
                        }}
                    >
                        {filter}
                    </button>
                );
            })}
        </div>
    );
}
