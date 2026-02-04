"use client";

import { Note } from "@/types";
import { Pin, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";

interface NoteCardProps {
    note: Note;
    onDelete?: (id: string) => void;
    onPin?: (id: string, isPinned: boolean) => void;
}

export default function NoteCard({ note, onDelete, onPin }: NoteCardProps) {
    // Simple preview generator
    // Simple preview generator with markdown stripping
    const getPreview = (content: string) => {
        const plainText = content
            .replace(/#{1,6}\s?/g, '') // Headers
            .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
            .replace(/(\*|_)(.*?)\1/g, '$2') // Italic
            .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Code
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
            .replace(/- \[(x| )\] /g, '• ') // Checkboxes
            .replace(/^>\s?/gm, ''); // Blockquotes

        const lines = plainText.split('\n').filter(line => line.trim() !== '').slice(0, 3);
        return lines.join('\n') + (content.split('\n').length > 3 ? '...' : '');
    };

    return (
        <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.25rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            height: '100%'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Link href={`/notes/edit?id=${note.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'var(--foreground)',
                        margin: 0,
                        cursor: 'pointer'
                    }}>
                        {note.title || 'Untitled Note'}
                    </h3>
                </Link>
                {note.isPinned && <Pin size={14} style={{ fill: 'var(--foreground)', opacity: 0.5 }} />}
            </div>

            <div style={{
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
                whiteSpace: 'pre-wrap',
                flex: 1,
                lineHeight: 1.5,
                opacity: 0.8
            }}>
                {getPreview(note.content)}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'auto',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.75rem'
            }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {new Date(note.updatedAt.seconds * 1000).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onPin?.(note.id, !note.isPinned);
                        }}
                        style={{
                            padding: '0.25rem',
                            opacity: 0.5,
                            cursor: 'pointer',
                            color: 'var(--foreground)',
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title={note.isPinned ? "Unpin" : "Pin"}
                    >
                        <Pin size={16} fill={note.isPinned ? "var(--foreground)" : "none"} />
                    </button>

                    <Link href={`/notes/edit?id=${note.id}`}>
                        <button style={{
                            padding: '0.25rem',
                            opacity: 0.5,
                            cursor: 'pointer',
                            color: 'var(--foreground)',
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Edit2 size={16} />
                        </button>
                    </Link>

                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(note.id);
                            }}
                            style={{
                                padding: '0.25rem',
                                opacity: 0.5,
                                cursor: 'pointer',
                                color: 'var(--destructive)', // Use destructive color for delete
                                background: 'none',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
