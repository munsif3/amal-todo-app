"use client";

import { Note } from "@/types";
import NoteCard from "./NoteCard";
import { updateNote } from "@/lib/firebase/notes";

interface NoteListProps {
    notes: Note[];
}

export default function NoteList({ notes }: NoteListProps) {
    const handlePin = async (id: string, isPinned: boolean) => {
        try {
            await updateNote(id, { isPinned });
        } catch (error) {
            console.error("Failed to update pin status", error);
        }
    };

    if (notes.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                color: 'var(--muted-foreground)',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)'
            }}>
                <p>No notes yet.</p>
            </div>
        );
    }

    return (
        <div style={{ columnCount: 3, columnGap: '1rem', width: '100%' }}>
            {notes.map(note => (
                <div key={note.id} style={{ marginBottom: '1rem', breakInside: 'avoid' }}>
                    <NoteCard
                        note={note}
                        onPin={handlePin}
                        onDelete={async (id) => {
                            if (confirm('Are you sure you want to delete this note?')) {
                                try {
                                    await import("@/lib/firebase/notes").then(mod => mod.deleteNote(id));
                                } catch (error) {
                                    console.error("Failed to delete note", error);
                                }
                            }
                        }}
                    />
                </div>
            ))}

            <style jsx>{`
                @media (max-width: 1100px) {
                    div[style*="column-count"] {
                        column-count: 2 !important;
                    }
                }
                @media (max-width: 700px) {
                    div[style*="column-count"] {
                        column-count: 1 !important;
                    }
                }
            `}</style>
        </div>
    );
}
