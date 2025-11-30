import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, Sparkles } from "lucide-react";

export default function TextInput({ text, setText, onAnalyze, isLoading }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onAnalyze();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste or type a comment to analyze..."
                    className="min-h-[160px] text-base resize-none bg-white/80 backdrop-blur-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-2xl p-5 pr-12 shadow-sm transition-all duration-300 placeholder:text-slate-400"
                />
                <div className="absolute top-4 right-4">
                    <Shield className="w-5 h-5 text-slate-300" />
                </div>
            </div>
            
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {text.length} characters
                </p>
                <Button
                    type="submit"
                    disabled={!text.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Analyze & Shield
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}