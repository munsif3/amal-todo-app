"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { createTask } from "@/lib/firebase/tasks";
import { ArrowLeft } from "lucide-react";
import TaskForm from "@/components/tasks/TaskForm";

export default function NewTaskPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        if (!user) return;
        setSubmitting(true);
        try {
            await createTask(user.uid, {
                ...data,
                status: 'next'
            });
            router.push("/today");
        } catch (error) {
            console.error("Error creating task:", error);
            setSubmitting(false);
        }
    };

    return (
        <div style={{ paddingTop: '1rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0 }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>New Action</h2>
            </header>

            {user && (
                <TaskForm
                    userId={user.uid}
                    onSubmit={handleSubmit}
                    submitLabel="Add to Next"
                    isSubmitting={submitting}
                />
            )}
        </div>
    );
}
