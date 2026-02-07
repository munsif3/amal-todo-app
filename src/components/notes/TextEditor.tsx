import styles from "./NoteEditor.module.css";

interface TextEditorProps {
    content: string;
    setContent: (s: string) => void;
}

export function TextEditor({ content, setContent }: TextEditorProps) {
    return (
        <textarea
            placeholder="Write your note here... (Markdown supported)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textArea}
        />
    );
}
