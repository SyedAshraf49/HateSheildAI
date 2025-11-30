import React from 'react';
import { cn } from "@/lib/utils";

const emotionConfig = {
    anger: { color: "bg-red-500", label: "Anger", emoji: "😠" },
    fear: { color: "bg-purple-500", label: "Fear", emoji: "😨" },
    sadness: { color: "bg-blue-500", label: "Sadness", emoji: "😢" },
    disgust: { color: "bg-green-500", label: "Disgust", emoji: "🤢" },
    joy: { color: "bg-yellow-500", label: "Joy", emoji: "😊" }
};

export default function EmotionChart({ emotions }) {
    if (!emotions) return null;

    const sortedEmotions = Object.entries(emotions)
        .sort(([, a], [, b]) => b - a);

    const dominantEmotion = sortedEmotions[0];

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Emotion Analysis</h3>
                {dominantEmotion && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Dominant:</span>
                        <span className="font-medium">
                            {emotionConfig[dominantEmotion[0]]?.emoji} {emotionConfig[dominantEmotion[0]]?.label}
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {sortedEmotions.map(([emotion, score]) => {
                    const config = emotionConfig[emotion];
                    if (!config) return null;

                    return (
                        <div key={emotion} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span>{config.emoji}</span>
                                    <span className="font-medium text-slate-700">{config.label}</span>
                                </div>
                                <span className="text-slate-500 font-medium">{Math.round(score)}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-700 ease-out", config.color)}
                                    style={{ width: `${score}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}