"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { getAccount, updateAccount, createAccount, deleteAccount } from "@/lib/firebase/accounts";
import { Account } from "@/types";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Loader from "@/components/ui/Loading";
import { PRESET_COLORS, DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";

function AccountDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    // id will be "new" or a uuid
    const id = searchParams.get('id');

    const isNew = !id || id === "new";
    const [loading, setLoading] = useState(!isNew);
    const [name, setName] = useState("");
    const [color, setColor] = useState(DEFAULT_ACCOUNT_COLOR);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;

        if (isNew) {
            setLoading(false);
            return;
        }

        getAccount(id as string).then(data => {
            if (data) {
                setName(data.name);
                setColor(data.color || DEFAULT_ACCOUNT_COLOR);
            }
            setLoading(false);
        });
    }, [user, id, isNew]);

    const handleSave = async () => {
        if (!user || !name.trim()) return;
        setSubmitting(true);

        const accountData = {
            name,
            color,
            description: "" // Optional description
        };

        try {
            if (isNew) {
                await createAccount(user.uid, accountData);
            } else {
                await updateAccount(id as string, accountData);
            }
            router.push("/accounts");
        } catch (error) {
            console.error("Error saving account:", error);
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this area? Tasks in this area will not be deleted but will have no area assigned.")) return;
        setSubmitting(true);
        try {
            await deleteAccount(id as string);
            router.push("/accounts");
        } catch (error) {
            console.error("Error deleting account:", error);
            setSubmitting(false);
        }
    };

    if (loading) return <Loader fullScreen={false} className="py-8" />;

    return (
        <div style={{ paddingBottom: '80px', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
            }}>
                <Link href="/accounts" style={{ color: '#666' }}>
                    <ArrowLeft size={24} />
                </Link>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    {isNew ? "New Area" : "Edit Area"}
                </h2>
                <div style={{ flex: 1 }} />
                {!isNew && (
                    <button onClick={handleDelete} disabled={submitting} style={{ color: '#ff4444', background: 'none', border: 'none', marginRight: '1rem', opacity: submitting ? 0.5 : 1 }}>
                        <Trash2 size={20} />
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={submitting || !name.trim()}
                    style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontWeight: '600',
                        opacity: (submitting || !name.trim()) ? 0.7 : 1,
                        cursor: (submitting || !name.trim()) ? 'not-allowed' : 'pointer'
                    }}
                >
                    {submitting ? "Saving..." : "Save"}
                </button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Area Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Work, Home, Client-X"
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', margin: '1.5rem 0 0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Color Tag</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setColor(c.value)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: c.value,
                                    border: color === c.value ? '3px solid var(--foreground)' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    transform: color === c.value ? 'scale(1.1)' : 'scale(1)'
                                }}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AccountDetailPage() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <AccountDetailContent />
        </Suspense>
    );
}
