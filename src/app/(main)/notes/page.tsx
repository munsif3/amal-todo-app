"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToNotes } from "@/lib/firebase/notes";
import { Note } from "@/types";
import NoteList from "@/components/notes/NoteList";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Loader from "@/components/ui/Loading";

export default function NotesPage() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToNotes(user.uid, (data) => {
            setNotes(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );




    if (loading) return <Loader fullScreen={false} className="py-8" />;

    return (
        <div>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Library</h2>
                    <p style={{ opacity: 0.5 }}>Reference notes and lists</p>
                </div>

                <Link href="/notes/new">
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius)',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                    }}>
                        <Plus size={18} />
                        New Note
                    </button>
                </Link>
            </header>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        fontSize: '1rem',
                        backgroundColor: 'var(--bg-subtle)'
                    }}
                />
            </div>

            <NoteList notes={filteredNotes} />
        </div>
    );
}
