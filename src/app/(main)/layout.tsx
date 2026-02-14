"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "@/components/shared/BottomNav";
import Sidebar from "@/components/shared/Sidebar";
import Loading from "@/components/ui/Loading";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <Loading />;
    }

    return (
        <>
            <Sidebar />
            <div className="main-layout-content" style={{ minHeight: '100vh' }}>
                <header className="mobile-only" style={{
                    padding: '2rem 1.5rem 1rem',
                    backgroundColor: 'var(--background)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>AMAL</h1>
                    <ThemeToggle />
                </header>
                <main style={{ padding: '0 1.5rem' }}>
                    {children}
                </main>
                <BottomNav />
            </div>
        </>
    );
}
