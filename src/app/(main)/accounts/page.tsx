"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToAccounts, createAccount, updateAccount, deleteAccount } from "@/lib/firebase/accounts";
import { Account } from "@/types";
import { Input, Button } from "@/components/ui/Form";
import AccountCard from "@/components/accounts/AccountCard";
import { Plus } from "lucide-react";
import { PRESET_COLORS, DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";

export default function AccountsPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [name, setName] = useState("");
    const [color, setColor] = useState(DEFAULT_ACCOUNT_COLOR);
    const [submitting, setSubmitting] = useState(false);


    // Replaced local PRESET_COLORS definition with import

    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToAccounts(user.uid, (fetched) => {
                setAccounts(fetched);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name) return;

        setSubmitting(true);
        try {
            if (editingAccount) {
                await updateAccount(editingAccount.id, { name, color });
            } else {
                await createAccount(user.uid, { name, description: "", color });
            }
            resetForm();
        } catch (error) {
            console.error("Error saving account:", error);
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName("");
        setColor(DEFAULT_ACCOUNT_COLOR);
        setEditingAccount(null);
        setIsFormOpen(false);
        setSubmitting(false);
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setName(account.name);
        setColor(account.color || DEFAULT_ACCOUNT_COLOR);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!editingAccount || !user) return;

        if (window.confirm(`Are you sure you want to delete "${editingAccount.name}"? Tasks in this area will not be deleted but will have no area assigned.`)) {
            try {
                await deleteAccount(editingAccount.id);
                resetForm();
            } catch (e) {
                console.error("Error deleting account:", e);
                alert("Failed to delete area.");
            }
        }
    };

    const toggleForm = () => {
        if (isFormOpen) {
            resetForm();
        } else {
            setIsFormOpen(true);
        }
    };

    if (loading) return <div style={{ opacity: 0.5, padding: '2rem 0' }}>Loading accounts...</div>;

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Areas</h2>
                <button
                    onClick={toggleForm}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isFormOpen ? 'var(--muted)' : 'var(--primary)',
                        color: isFormOpen ? 'var(--foreground)' : 'white',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'var(--transition-ease)'
                    }}
                >
                    <Plus size={20} style={{ transform: isFormOpen ? 'rotate(45deg)' : 'none', transition: 'var(--transition-ease)' }} />
                </button>
            </header>

            {isFormOpen && (
                <form onSubmit={handleSubmit} style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                }}>
                    <Input
                        label={editingAccount ? "Edit Area Name" : "Area Name"}
                        placeholder="e.g. Work, Home, Client-X"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                    />

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', opacity: 0.7 }}>Color Tag</label>
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

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button type="submit" disabled={submitting || !name}>
                            {submitting ? "Saving..." : (editingAccount ? "Update" : "Create")}
                        </Button>
                        <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                        {editingAccount && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleDelete}
                                style={{ marginLeft: 'auto', color: 'var(--red-600, #e74c3c)' }}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </form>
            )}

            {accounts.length === 0 && !isFormOpen ? (
                <div style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    opacity: 0.5,
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius)'
                }}>
                    <p>No areas yet. Use areas to group your actions.</p>
                </div>
            ) : (
                accounts.map(acc => (
                    <AccountCard key={acc.id} account={acc} onEdit={handleEdit} />
                ))
            )}
        </div>
    );
}
