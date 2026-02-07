import { Account } from "@/types";
import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";

interface AreaSelectorProps {
    accounts: Account[];
    selectedAccountId: string;
    onSelect: (accountId: string) => void;
    label?: string;
    showLabel?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export default function AreaSelector({
    accounts,
    selectedAccountId,
    onSelect,
    label = "Area",
    showLabel = true,
    className,
    style
}: AreaSelectorProps) {
    return (
        <div className={className} style={{ marginBottom: className ? 0 : '2rem', ...style }}>
            {showLabel && (
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', opacity: 0.7 }}>
                    {label}
                </label>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {accounts.map(acc => {
                    const isSelected = selectedAccountId === acc.id;
                    const color = acc.color || DEFAULT_ACCOUNT_COLOR;

                    return (
                        <button
                            key={acc.id}
                            type="button"
                            onClick={() => onSelect(isSelected ? "" : acc.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                border: `1px solid ${color}`,
                                backgroundColor: isSelected ? color : 'transparent',
                                color: isSelected ? 'white' : 'var(--foreground)',
                                opacity: isSelected ? 1 : 0.7,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {acc.name}
                        </button>
                    );
                })}
                {accounts.length === 0 && (
                    <p style={{ fontSize: '0.875rem', opacity: 0.5, fontStyle: 'italic' }}>
                        No areas created yet.
                    </p>
                )}
            </div>
        </div>
    );
}
