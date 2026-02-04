export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export function parseChecklist(content: string): ChecklistItem[] {
    if (!content) return [];

    // Simple basic parsing compatible with the original implementation
    return content.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- [ ] ')) {
            return { id: crypto.randomUUID(), text: line.replace('- [ ] ', ''), checked: false };
        } else if (trimmed.startsWith('- [x] ')) {
            return { id: crypto.randomUUID(), text: line.replace('- [x] ', ''), checked: true };
        } else if (trimmed.length > 0) {
            // Treat plain text lines as unchecked items if just switching
            return { id: crypto.randomUUID(), text: line, checked: false };
        }
        return null;
    }).filter((item): item is ChecklistItem => item !== null);
}

export function serializeChecklist(items: ChecklistItem[]): string {
    return items.map(item =>
        `- [${item.checked ? 'x' : ' '}] ${item.text}`
    ).join('\n');
}
