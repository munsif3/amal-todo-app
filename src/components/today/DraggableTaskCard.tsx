"use client";

import { useDragControls, Reorder } from "framer-motion";
import TaskCard from "./TaskCard";
import { Task } from "@/types";

interface DraggableTaskCardProps {
    task: Task;
    areaColor?: string;
    onStatusChange: (status: Task['status']) => void;
    isBlocked?: boolean;
}

export default function DraggableTaskCard({ task, areaColor, onStatusChange, isBlocked }: DraggableTaskCardProps) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={task}
            dragListener={false}
            dragControls={controls}
            style={{ position: 'relative' }} // ensure z-index context if needed
        >
            <TaskCard
                task={task}
                areaColor={areaColor}
                onStatusChange={onStatusChange}
                isBlocked={isBlocked}
                dragControls={controls}
            />
        </Reorder.Item>
    );
}
