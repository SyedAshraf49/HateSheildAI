import React from 'react';
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import ClassificationBadge from "./ClassificationBadge";
import EmotionChart from "./EmotionChart";
import RewriteCard from "./RewriteCard";

export default function ResultsPanel({ result }) {
    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Processing Time */}
            <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Processed in {result.processing_time_ms}ms</span>
            </div>

            {/* Classification */}
            <ClassificationBadge 
                classification={result.classification} 
                confidence={result.confidence} 
            />

            {/* Two Column Layout for Emotions and Rewrite */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Emotion Analysis */}
                <EmotionChart emotions={result.emotions} />

                {/* Rewrite Card - Only show if not safe */}
                {result.classification !== 'safe' && result.rewritten_text && (
                    <RewriteCard 
                        originalText={result.original_text}
                        rewrittenText={result.rewritten_text}
                    />
                )}

                {/* Safe message */}
                {result.classification === 'safe' && (
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-4xl mb-3">✨</div>
                            <h4 className="font-semibold text-emerald-700 mb-1">No Rewrite Needed</h4>
                            <p className="text-sm text-emerald-600">This comment is already safe and respectful!</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}