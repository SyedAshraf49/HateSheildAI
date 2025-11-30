import React from 'react';
import { Shield, ShieldAlert, ShieldX, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const classificationConfig = {
    safe: {
        label: "Safe",
        icon: ShieldCheck,
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-700",
        iconColor: "text-emerald-500",
        description: "This comment is respectful and appropriate"
    },
    offensive: {
        label: "Offensive",
        icon: ShieldAlert,
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-700",
        iconColor: "text-amber-500",
        description: "Contains potentially offensive language"
    },
    hate_speech: {
        label: "Hate Speech",
        icon: ShieldX,
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        iconColor: "text-red-500",
        description: "Contains hate speech or discriminatory content"
    },
    toxic: {
        label: "Toxic",
        icon: ShieldX,
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
        textColor: "text-rose-700",
        iconColor: "text-rose-500",
        description: "Contains toxic or harmful language"
    }
};

export default function ClassificationBadge({ classification, confidence }) {
    const config = classificationConfig[classification] || classificationConfig.safe;
    const Icon = config.icon;

    return (
        <div className={cn(
            "rounded-2xl border p-6 transition-all duration-500",
            config.bgColor,
 