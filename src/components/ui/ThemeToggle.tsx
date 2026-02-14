"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button style={{ width: 32, height: 32, opacity: 0.5 }} aria-label="Theme toggle placeholder" />
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '20px',
            border: '1px solid var(--border)'
        }}>
            <button
                onClick={() => setTheme("light")}
                style={{
                    padding: '0.25rem',
                    borderRadius: '50%',
                    backgroundColor: theme === 'light' ? 'var(--card-bg)' : 'transparent',
                    color: theme === 'light' ? 'var(--foreground)' : 'var(--text-muted)',
                    boxShadow: theme === 'light' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                aria-label="Light mode"
            >
                <Sun size={14} />
            </button>
            <button
                onClick={() => setTheme("dark")}
                style={{
                    padding: '0.25rem',
                    borderRadius: '50%',
                    backgroundColor: theme === 'dark' ? 'var(--card-bg)' : 'transparent',
                    color: theme === 'dark' ? 'var(--foreground)' : 'var(--text-muted)',
                    boxShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                aria-label="Dark mode"
            >
                <Moon size={14} />
            </button>
            <button
                onClick={() => setTheme("system")}
                style={{
                    padding: '0.25rem',
                    borderRadius: '50%',
                    backgroundColor: theme === 'system' ? 'var(--card-bg)' : 'transparent',
                    color: theme === 'system' ? 'var(--foreground)' : 'var(--text-muted)',
                    boxShadow: theme === 'system' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                aria-label="System theme"
            >
                <Monitor size={14} />
            </button>
        </div>
    );
}
