"use client";
import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Plus, X } from "lucide-react";
import styles from "./NoteEditor.module.css";
import { ChecklistItem } from "./note-utils";

interface ChecklistEditorProps {
    items: ChecklistItem[];
    onToggle: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
    onDelete: (id: string) => void;
    onAdd: (text: string) => void;
    onReorder: (items: ChecklistItem[]) => void;
}

export function ChecklistEditor({
    items,
    onToggle,
    onUpdate,
    onDelete,
    onAdd,
    onReorder
}: ChecklistEditorProps) {
    const [newItemText, setNewItemText] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        onAdd(newItemText);
        setNewItemText("");
    };

    return (
        <div className={styles.checklistContainer}>
            <Reorder.Group axis="y" values={items} onReorder={onReorder} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map(item => (
                    <DraggableChecklistItem
                        key={item.id}
                        item={item}
                        onToggle={onToggle}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                    />
                ))}
            </Reorder.Group>

            <form onSubmit={handleSubmit} className={styles.addItemForm}>
                <Plus size={16} />
                <input
                    type="text"
                    placeholder="Add item..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className={styles.addItemInput}
                />
            </form>
        </div>
    );
}

function DraggableChecklistItem({ item, onToggle, onUpdate, onDelete }: {
    item: ChecklistItem,
    onToggle: (id: string) => void,
    onUpdate: (id: string, text: string) => void,
    onDelete: (id: string) => void
}) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={controls}
            style={{ position: 'relative' }}
        >
            <div className={styles.checklistItem}>
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className={styles.dragHandle}
                >
                    <GripVertical size={16} />
                </div>
                <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggle(item.id)}
                    style={{ marginTop: '0.35rem', cursor: 'pointer' }}
                />
                <input
                    type="text"
                    value={item.text}
                    onChange={(e) => onUpdate(item.id, e.target.value)}
                    className={`${styles.checklistInput} ${item.checked ? styles.checklistInputChecked : ''}`}
                />
                <button
                    onClick={() => onDelete(item.id)}
                    className={styles.deleteItemButton}
                >
                    <X size={16} />
                </button>
            </div>
        </Reorder.Item>
    );
}
