"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote, Heading1, Heading2, Code } from 'lucide-react';
import { useState } from 'react';

interface RichTextAreaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    style?: React.CSSProperties;
    minHeight?: string;
}

export default function RichTextArea({ value, onChange, placeholder, style, minHeight = "120px" }: RichTextAreaProps) {
    const [, forceUpdate] = useState(0);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            // Only output if there's actual text, otherwise empty string
            const html = editor.isEmpty ? "" : editor.getHTML();
            onChange(html);
        },
        onTransaction: () => {
            // Force React to re-render toolbar state immediately on any selection/formatting change
            forceUpdate(n => n + 1);
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content',
                style: `min-height: ${minHeight}; padding: 0.75rem 1rem; outline: none;`,
            },
        },
    });

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({ onClick, isActive, disabled = false, children, title }: any) => (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            title={title}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.1s',
            }}
        >
            {children}
        </button>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', ...style }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.15rem',
                padding: '0.35rem 0.5rem',
                backgroundColor: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap'
            }}>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    title="Bold"
                >
                    <Bold size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    title="Italic"
                >
                    <Italic size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    disabled={!editor.can().chain().focus().toggleUnderline().run()}
                    title="Underline"
                >
                    <UnderlineIcon size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                >
                    <Strikethrough size={14} />
                </ToolbarButton>

                <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 0.25rem' }} />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={14} />
                </ToolbarButton>

                <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 0.25rem' }} />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    title="Code Block"
                >
                    <Code size={14} />
                </ToolbarButton>
            </div>

            {/* Editor Content Area */}
            <div className="markdown-preview" style={{ flex: 1, backgroundColor: 'var(--card-bg)' }}>
                <EditorContent editor={editor} />
            </div>
            {/* Inject minimal TipTap styles directly or rely on our globals.css .markdown-preview */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .tiptap-editor-content p.is-editor-empty:first-child::before {
                    color: var(--muted-foreground);
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .tiptap-editor-content *:focus {
                    outline: none;
                }
            `}} />
        </div>
    );
}
