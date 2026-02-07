"use client";

import { Account } from "@/types";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";

interface AccountCardProps {
    account: Account;
    onEdit: (account: Account) => void;
    onDelete?: (account: Account) => void;
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
    return (
        <Link href={`/account?id=${account.id}`} style={{
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(account);
                    }}
                    style={{
                        padding: '0.5rem',
                        opacity: 0.5,
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        color: 'var(--foreground)',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                    }}
                    title="Edit Area"
                >
                    <Pencil size={18} />
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onDelete) onDelete(account);
                    }}
                    style={{
                        padding: '0.5rem',
                        opacity: 0.5,
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        color: 'var(--red-500, #ef4444)',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                    }}
                    title="Delete Area"
                >
                    <Trash2 size={18} />
                </button>
                <ChevronRight size={20} style={{ opacity: 0.3 }} />
            </div>
        </Link>
    );
}
