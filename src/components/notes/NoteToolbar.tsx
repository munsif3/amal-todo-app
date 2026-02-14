"use client";
import { ArrowLeft, Save, Trash2, Printer } from "lucide-react";
import styles from "./NoteEditor.module.css";
import { useRouter } from "next/navigation";

interface NoteToolbarProps {
    onBack?: () => void;
    onSave: () => void;
    onDelete?: () => void;
    onPrint?: () => void;
    isSaving: boolean;
    canSave: boolean;
}

export function NoteToolbar({
    onBack,
    onSave,
    onDelete,
    onPrint,
    isSaving,
    canSave
}: NoteToolbarProps) {
    const router = useRouter();
    const handleBack = onBack || router.back;

    return (
        <div className={styles.toolbar}>
            <button onClick={handleBack} className={styles.backButton}>
                <ArrowLeft size={20} />
                Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {isSaving ? 'Saving...' : 'Saved'}
                </div>
                {onPrint && (
                    <button onClick={onPrint} className={styles.deleteButton} style={{ color: 'var(--foreground)' }} title="Print / Export PDF">
                        <Printer size={20} />
                    </button>
                )}
                {onDelete && (
                    <button onClick={onDelete} className={styles.deleteButton}>
                        <Trash2 size={20} />
                    </button>
                )}
                <button
                    onClick={onSave}
                    disabled={!canSave}
                    className={styles.saveButton}
                >
                    <Save size={18} />
                    Save
                </button>
            </div>
        </div>
    );
}
