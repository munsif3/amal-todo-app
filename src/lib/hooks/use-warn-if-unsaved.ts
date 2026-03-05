"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A hook that warns the user before unloading the window (refreshing or closing tab).
 * 
 * Note: Next.js App Router does not natively support intercepting client-side router 
 * navigation (e.g. clicking a <Link>). The best effort here is intercepting the native
 * browser events (beforeunload) for accidental reloads, tabs closing, or back button hits
 * that cause unmounts.
 */
export function useWarnIfUnsavedChanges(unsaved: boolean, warningMessage: string = "You have unsaved changes. Are you sure you want to leave?") {
    useEffect(() => {
        // 1. Handle browser tab close / refresh
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (unsaved) {
                e.preventDefault();
                e.returnValue = warningMessage; // Legacy support
                return warningMessage;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        // 2. Handle Next.js client-side navigation via <Link>
        // Next.js router intercepts clicks on <a> tags. We can catch the click event in the capture phase
        // (before Next.js gets it) and block it if unsaved.
        const handleAnchorClick = (e: MouseEvent) => {
            if (!unsaved) return;

            // Find the closest anchor tag that the user clicked
            const target = (e.target as HTMLElement).closest('a');
            if (!target) return;

            // Optional: check if it's an external link or a download link, etc.
            if (target.target === '_blank' || target.hasAttribute('download')) return;

            // Block navigation and show confirmation
            if (!window.confirm(warningMessage)) {
                e.preventDefault();
                e.stopPropagation(); // Stop Next.js Link from seeing the click
            }
        };

        // Use capture phase (true) to run *before* React/Next.js onClick handlers
        document.addEventListener("click", handleAnchorClick, { capture: true });

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("click", handleAnchorClick, { capture: true });
        };
    }, [unsaved, warningMessage]);
}
