"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CheckCircle2, LayoutGrid, Plus, Repeat, User } from "lucide-react";

const navItems = [
    { label: "Today", href: "/today", icon: CheckCircle2 },
    { label: "Areas", href: "/accounts", icon: LayoutGrid },
    { label: "Add", href: "/tasks/new", icon: Plus, isAction: true },
    { label: "Routines", href: "/routines", icon: Repeat },
    { label: "Meetings", href: "/meetings", icon: Calendar },
    { label: "Profile", href: "/profile", icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="mobile-only" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingBottom: '16px', // For home indicator
            zIndex: 100,
        }}>
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                if (item.isAction) {
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            aria-label={item.label}
                            style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: 'var(--primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                marginBottom: '10px'
                            }}>
                            <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            color: isActive ? 'var(--primary)' : 'var(--border)',
                            transition: 'var(--transition-ease)',
                        }}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                        <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
