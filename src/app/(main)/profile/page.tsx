"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/Form";
import { LogOut, User, ScrollText, Repeat, Calendar, LayoutGrid } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

export default function ProfilePage() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div style={{ padding: '1rem 0' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--muted)',
                    margin: '0 auto 1rem',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden'
                }}>
                    {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ""} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <User size={40} style={{ opacity: 0.3 }} />
                    )}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{user.displayName}</h2>
                <p style={{ opacity: 0.5, fontSize: '0.875rem' }}>{user.email}</p>
            </header>

            <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.4, letterSpacing: '0.1em', marginBottom: '1rem' }}>Management</h3>
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    marginBottom: '2rem'
                }}>
                    <Link href="/logbook" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                            <ScrollText size={20} className="text-muted-foreground" />
                            <span>Logbook</span>
                            <span style={{ marginLeft: 'auto', opacity: 0.3, fontSize: '0.875rem' }}>History</span>
                        </div>
                    </Link>
                    <Link href="/accounts" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                            <LayoutGrid size={20} className="text-muted-foreground" />
                            <span>Areas</span>
                        </div>
                    </Link>
                    <Link href="/routines" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                            <Repeat size={20} className="text-muted-foreground" />
                            <span>Routines</span>
                        </div>
                    </Link>
                    <Link href="/meetings" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                            <Calendar size={20} className="text-muted-foreground" />
                            <span>Meetings</span>
                        </div>
                    </Link>
                </div>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.4, letterSpacing: '0.1em', marginBottom: '1rem' }}>Preferences</h3>
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Appearance</span>
                        <ThemeToggle />
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Weekly Digest</span>
                        <span style={{ opacity: 0.3 }}>Coming Soon</span>
                    </div>
                </div>
            </section>

            <Button variant="secondary" onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#e74c3c', borderColor: '#e74c3c' }}>
                <LogOut size={18} />
                Sign Out
            </Button>
        </div>
    );
}
