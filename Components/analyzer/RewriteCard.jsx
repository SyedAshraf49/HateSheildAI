import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function RewriteCard({ originalText, rewrittenText }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(rewrittenText);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Original</h4>
                </div>
                <p className="text-slate-700 leading-relaxed line-through decoration-red-300/50">
                    {originalText}
                </p>
            </div>

            <div className="flex items-center justify-center py-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                <ArrowRight className="w-4 h-4 text-blue-500" />
            </div>

            <div className="p-6 bg-gradient-to-br from-emerald-50/50 to-blue-50/50">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h4 className="text-sm font-medium text-emerald-600 uppercase tracking-wide">
                        Safe Rewrite
                    </h4>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium mb-4">
                    {rewrittenText}
                </p>
                <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="bg-white/80 hover:bg-white border-emerald-200 text-emerald-700 hover:text-emerald-800"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Safe Version
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}