"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getNote } from "@/lib/firebase/notes";
import { Note } from "@/types";
import NoteEditor from "@/components/notes/NoteEditor";

function EditNoteContent() {
    const searchParams = useSearchParams();
    const noteId = searchParams.get('id');
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!noteId) return;
        getNote(noteId).then(n => {
            setNote(n);
            setLoading(false);
        });
    }, [noteId]);

    if (loading) return <div>Loading...</div>;
    if (!note) return <div>Note not found</div>;

    return <NoteEditor existingNote={note} />;
}

export default function EditNotePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditNoteContent />
        </Suspense>
    );
}
