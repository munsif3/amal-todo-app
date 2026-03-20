import React from 'react';

interface ActivityRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    trackColor?: string;
}

export default function ActivityRing({ 
    progress = 0, 
    size = 40, 
    strokeWidth = 4, 
    color = "var(--primary)", 
    trackColor = "var(--bg-subtle)" 
}: ActivityRingProps) {
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    // Calculate safely bounded offset
    const boundedProgress = Math.min(Math.max(progress, 0), 100);
    const offset = circumference - (boundedProgress / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={trackColor}
                strokeWidth={strokeWidth}
            />
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
        </svg>
    );
}
