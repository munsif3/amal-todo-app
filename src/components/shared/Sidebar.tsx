"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CheckCircle2, LayoutGrid, Plus, Repeat, User, Book } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navItems = [
    { label: "Today", href: "/today", icon: CheckCircle2 },
    { label: "Areas", href: "/accounts", icon: LayoutGrid },
    { label: "Library", href: "/notes", icon: Book },
    { label: "Profile", href: "/profile", icon: User },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="desktop-only" style={{
            width: 'var(--sidebar-width)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
        }}>
            <div style={{ paddingLeft: '0.5rem' }}>
                <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em', cursor: 'pointer' }}>AMAL</h1>
                </Link>
            </div>

            <Link href="/new" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'var(--transition-ease)',
                marginTop: '1rem',
            }}>
                <Plus size={20} />
                <span>New Item</span>
            </Link>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                                transition: 'var(--transition-ease)',
                                fontWeight: isActive ? '600' : '500',
                            }}
                        >
                            <Icon size={20} aria-hidden="true" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <ThemeToggle />
            </div>
        </aside>
    );
}
