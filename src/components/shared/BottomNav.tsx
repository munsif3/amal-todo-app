"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Book, CheckCircle2, LayoutGrid, Plus, User, Users, Kanban, MoreHorizontal, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const primaryNavItems = [
    { label: "Today", href: "/today", icon: CheckCircle2 },
    { label: "Cockpit", href: "/cockpit", icon: Kanban },
    { label: "Add", href: "/add", icon: Plus, isAction: true },
    { label: "Home", href: "/dashboard", icon: LayoutGrid },
    { label: "More", href: "#more", icon: MoreHorizontal, isDrawerTrigger: true },
];

const secondaryNavItems = [
    { label: "Delegations", href: "/delegations", icon: Users },
    { label: "Library", href: "/notes", icon: Book },
    { label: "Profile", href: "/profile", icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close drawer when navigating
    useEffect(() => {
        setIsMoreOpen(false);
    }, [pathname]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setIsMoreOpen(false);
            }
        };
        if (isMoreOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMoreOpen]);

    return (
        <>
            {/* Dark Overlay for Drawer */}
            {isMoreOpen && (
                <div 
                    className="mobile-only"
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }}
                    onClick={() => setIsMoreOpen(false)}
                />
            )}

            {/* More Drawer */}
            <div 
                ref={drawerRef}
                className="mobile-only"
                style={{
                    position: 'fixed',
                    bottom: isMoreOpen ? '80px' : '-100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--card-bg)',
                    borderTop: '1px solid var(--border)',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    padding: '1.5rem',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
                    transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    zIndex: 95,
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>More</h3>
                    <button onClick={() => setIsMoreOpen(false)} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={18} color="var(--text-secondary)" />
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {secondaryNavItems.map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link key={item.label} href={item.href} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                                padding: '1rem', borderRadius: '12px', backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                                color: isActive ? 'var(--primary)' : 'var(--foreground)', textDecoration: 'none'
                            }}>
                                <Icon size={28} strokeWidth={isActive ? 2.5 : 2} color={isActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                                <span style={{ fontSize: '0.85rem', fontWeight: isActive ? '600' : '500' }}>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            <nav className="mobile-only" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '80px',
                backgroundColor: 'var(--card-bg)', // Use themed background
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', // For home indicator + safe area
                zIndex: 100,
            }}>
                {primaryNavItems.map((item) => {
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
                                    color: 'var(--primary-foreground)', // Ensure correct contrast
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    marginBottom: '10px'
                                }}>
                                <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
                            </Link>
                        );
                    }

                    if (item.isDrawerTrigger) {
                        return (
                            <button
                                key={item.label}
                                onClick={(e) => { e.preventDefault(); setIsMoreOpen(!isMoreOpen); }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: isMoreOpen ? 'var(--primary)' : 'var(--muted-foreground)', // Better contrast for inactive
                                    transition: 'var(--transition-ease)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                <Icon size={24} strokeWidth={isMoreOpen ? 2.5 : 2} aria-hidden="true" />
                                <span style={{ fontSize: '10px', fontWeight: isMoreOpen ? '600' : '400' }}>{item.label}</span>
                            </button>
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
                                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)', // Better contrast for inactive
                                transition: 'var(--transition-ease)',
                                textDecoration: 'none'
                            }}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                            <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
