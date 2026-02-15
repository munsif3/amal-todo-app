"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const { user, loginWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/today");
        }
    }, [user, router]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>AMAL</h1>
            <p style={{ color: 'var(--foreground)', opacity: 0.6, marginBottom: '2.5rem', fontSize: '1rem' }}>
                Intentional action. Calm focus.
            </p>

            <button
                onClick={loginWithGoogle}
                style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    padding: '0.8rem 2rem',
                    borderRadius: 'var(--radius)',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'var(--transition-ease)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    border: 'none',
                }}
            >
                Sign in with Google
            </button>

            <div style={{ marginTop: '4rem', fontSize: '0.8rem', opacity: 0.4 }}>
                A mobile-first personal productivity tool.
            </div>
        </div>
    );
}
