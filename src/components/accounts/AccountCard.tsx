"use client";

import { Account } from "@/types";
import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";

interface AccountCardProps {
    account: Account;
    onEdit: (account: Account) => void;
}

export default function AccountCard({ account, onEdit }: AccountCardProps) {
    return (
        <Link href={`/accounts/${account.id}`} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1.25rem',
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            marginBottom: '0.75rem',
            transition: 'var(--transition-ease)',
            position: 'relative',
            borderLeft: `4px solid ${account.color || DEFAULT_ACCOUNT_COLOR}`
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{account.name}</h3>
                {account.description && (
                    <p style={{ fontSize: '0.875rem', opacity: 0.5, color: 'var(--foreground)' }}>{account.description}</p>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(account);
                    }}
                    style={{ opacity: 0.3, cursor: 'pointer', border: 'none', background: 'none' }}
                >
                    <Pencil size={16} />
                </button>
                <ChevronRight size={20} style={{ opacity: 0.3 }} />
            </div>
        </Link>
    );
}
