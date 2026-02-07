import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

import { useNoteEditor } from "./useNoteEditor";
import { Note } from "@/types";
import styles from "./NoteEditor.module.css";

import { NoteToolbar } from "./NoteToolbar";
import { NoteHeader } from "./NoteHeader";
import { TextEditor } from "./TextEditor";
import { ChecklistEditor } from "./ChecklistEditor";

interface NoteEditorProps {
    existingNote?: Note;
    initialAccountId?: string;
}

export default function NoteEditor(props: NoteEditorProps) {
    const {
        metadata,
        modeState,
        contentState,
        checklistState,
        actions
    } = useNoteEditor(props);

    const contentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: contentRef,
        documentTitle: metadata.title || "Note",
    });

    return (
        <div className={styles.container}>
            <NoteToolbar
                onSave={actions.save}
                onPrint={handlePrint}
                onDelete={props.existingNote ? actions.remove : undefined}
                isSaving={actions.isSaving}
                canSave={actions.canSave}
            />

            {actions.error && (
                <div className={styles.errorBanner}>
                    <span>{actions.error}</span>
                    <button onClick={actions.dismissError} className={styles.dismissError}>
                        Dismiss
                    </button>
                </div>
            )}

            <div className={`${styles.contentStack} print-content`} ref={contentRef}>
                <NoteHeader
                    title={metadata.title}
                    setTitle={metadata.setTitle}
                    accountId={metadata.accountId}
                    setAccountId={metadata.setAccountId}
                    isPinned={metadata.isPinned}
                    setIsPinned={metadata.setIsPinned}
                    accounts={metadata.accounts}
                    mode={modeState.mode}
                    setMode={modeState.setMode}
                />

                {modeState.mode === 'text' ? (
                    <TextEditor
                        content={contentState.content}
                        setContent={contentState.setContent}
                    />
                ) : (
                    <ChecklistEditor
                        items={checklistState.items}
                        onToggle={checklistState.toggleItem}
                        onUpdate={checklistState.updateItem}
                        onDelete={checklistState.deleteItem}
                        onAdd={checklistState.addItem}
                        onReorder={checklistState.reorderItems}
                    />
                )}
            </div>
        </div>
    );
}
