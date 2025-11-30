import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, History, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TextInput from "@/components/analyzer/TextInput";
import ResultsPanel from "@/components/analyzer/ResultsPanel";

export default function Analyzer() {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const analyzeText = async () => {
        setIsLoading(true);
        setResult(null);
        const startTime = Date.now();

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `You are HateShield, an AI system that detects toxic/hate speech and rewrites it safely.

Analyze this comment:
"${text}"

Provide your analysis in the following JSON format:
{
    "classification": "safe" | "offensive" | "hate_speech" | "toxic",
    "confidence": number (0-100),
    "emotions": {
        "anger": number (0-100),
        "fear": number (0-100),
        "sadness": number (0-100),
        "disgust": number (0-100),
        "joy": number (0-100)
    },
    "rewritten_text": "A respectful, constructive version of the message that conveys any legitimate underlying concern without toxicity. Keep it natural and conversational."
}

Classification guide:
- safe: Respectful, constructive, appropriate language
- offensive: Mildly inappropriate, rude, or disrespectful language
- hate_speech: Discriminatory language targeting groups based on identity
- toxic: Severely harmful, abusive, threatening, or bullying language

Be accurate and nuanced. Even if slightly negative, classify as safe if the criticism is constructive.`,
            response_json_schema: {
                type: "object",
                properties: {
                    classification: { type: "string", enum: ["safe", "offensive", "hate_speech", "toxic"] },
                    confidence: { type: "number" },
                    emotions: {
                        type: "object",
                        properties: {
                            anger: { type: "number" },
                            fear: { type: "number" },
                            sadness: { type: "number" },
                            disgust: { type: "number" },
                            joy: { type: "number" }
                        }
                    },
                    rewritten_text: { type: "string" }
                },
                required: ["classification", "confidence", "emotions", "rewritten_text"]
            }
        });

        const processingTime = Date.now() - startTime;

        const analysisResult = {
            original_text: text,
            classification: response.classification,
            confidence: response.confidence,
            emotions: response.emotions,
            rewritten_text: response.rewritten_text,
            processing_time_ms: processingTime
        };

        setResult(analysisResult);
        setIsLoading(false);

        // Save to database
        await base44.entities.Analysis.create(analysisResult);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
            {/* Header */}
            <header className="border-b border-slate-200/60 bg-white/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">HateShield</h1>
                                <p className="text-xs text-slate-500">AI-Powered Content Safety</p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <Link 
                                to={createPageUrl("History")}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <History className="w-4 h-4" />
                                History
                            </Link>
                            <Link 
                                to={createPageUrl("Dashboard")}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <BarChart3 className="w-4 h-4" />
                                Dashboard
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        AI-Powered Analysis
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                        Detect & Transform
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Toxic Content</span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Paste any comment or message below. HateShield will analyze it for toxicity, 
                        detect emotions, and provide a safe, respectful alternative.
                    </p>
                </div>

                {/* Input Section */}
                <div className="mb-12">
                    <TextInput 
                        text={text}
                        setText={setText}
                        onAnalyze={analyzeText}
                        isLoading={isLoading}
                    />
                </div>

                {/* Results Section */}
                <ResultsPanel result={result} />

                {/* Example Prompts */}
                {!result && !isLoading && (
                    <div className="mt-12">
                        <p className="text-sm text-slate-500 text-center mb-4">Try these examples:</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {[
                                "You're so dumb and useless!",
                                "I respectfully disagree with your point.",
                                "People like you don't belong here.",
                                "Great work on this project!"
                            ].map((example, i) => (
                                <button
                                    key={i}
                                    onClick={() => setText(example)}
                                    className="px-4 py-2 bg-white/80 hover:bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:text-slate-800 transition-all hover:shadow-md"
                                >
                                    "{example.slice(0, 30)}..."
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}