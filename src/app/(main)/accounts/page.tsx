"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToAccounts, deleteAccount } from "@/lib/firebase/accounts";
import { Account } from "@/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import AccountCard from "@/components/accounts/AccountCard";
import Loader from "@/components/ui/Loading";
import { useRouter } from "next/navigation";

export default function AccountsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToAccounts(user.uid, (fetched) => {
                setAccounts(fetched);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleEdit = (account: Account) => {
        router.push(`/accounts/edit?id=${account.id}`);
    };

    const handleDelete = async (account: Account) => {
        if (!user) return;
        if (window.confirm(`Are you sure you want to delete "${account.name}"? Tasks in this area will not be deleted but will have no area assigned.`)) {
            try {
                await deleteAccount(account.id);
            } catch (e) {
                console.error("Error deleting account:", e);
                alert("Failed to delete area.");
            }
        }
    };

    if (loading) return <Loader fullScreen={false} className="py-8" />;

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Areas</h2>
                <Link href="/accounts/edit?id=new" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'var(--transition-ease)'
                }}>
                    <Plus size={20} />
                </Link>
            </header>

            {accounts.length === 0 ? (
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
                    <AccountCard key={acc.id} account={acc} onEdit={handleEdit} onDelete={handleDelete} />
                ))
            )}
        </div>
    );
}
