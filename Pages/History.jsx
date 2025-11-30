import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
    Shield, ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, 
    Search, Filter, Trash2, ChevronDown, Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const classificationConfig = {
    safe: { label: "Safe", icon: ShieldCheck, color: "bg-emerald-100 text-emerald-700" },
    offensive: { label: "Offensive", icon: ShieldAlert, color: "bg-amber-100 text-amber-700" },
    hate_speech: { label: "Hate Speech", icon: ShieldX, color: "bg-red-100 text-red-700" },
    toxic: { label: "Toxic", icon: ShieldX, color: "bg-rose-100 text-rose-700" }
};

export default function History() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);

    const { data: analyses, isLoading, refetch } = useQuery({
        queryKey: ['analyses'],
        queryFn: () => base44.entities.Analysis.list('-created_date', 100),
        initialData: []
    });

    const filteredAnalyses = analyses.filter(a => {
        const matchesSearch = a.original_text?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || a.classification === filterType;
        return matchesSearch && matchesFilter;
    });

    const handleDelete = async (id) => {
        await base44.entities.Analysis.delete(id);
        refetch();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
            {/* Header */}
            <header className="border-b border-slate-200/60 bg-white/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link 
                                to={createPageUrl("Analyzer")}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800">Analysis History</h1>
                                    <p className="text-xs text-slate-500">{analyses.length} total analyses</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search analyses..."
                            className="pl-10 bg-white/80 border-slate-200 rounded-xl"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-white/80 border-slate-200 rounded-xl">
                                <Filter className="w-4 h-4 mr-2" />
                                {filterType === 'all' ? 'All Types' : classificationConfig[filterType]?.label}
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType('safe')}>Safe</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType('offensive')}>Offensive</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType('hate_speech')}>Hate Speech</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType('toxic')}>Toxic</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Results List */}
                <div className="space-y-4">
                    {isLoading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="bg-white/80 rounded-2xl border border-slate-200 p-6">
                                <Skeleton className="h-4 w-3/4 mb-3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        ))
                    ) : filteredAnalyses.length === 0 ? (
                        <div className="text-center py-16 bg-white/50 rounded-2xl border border-slate-200">
                            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-700 mb-2">No analyses found</h3>
                            <p className="text-slate-500">Start analyzing content to see history here.</p>
                        </div>
                    ) : (
                        filteredAnalyses.map((analysis) => {
                            const config = classificationConfig[analysis.classification] || classificationConfig.safe;
                            const Icon = config.icon;

                            return (
                                <div 
                                    key={analysis.id}
                                    onClick={() => setSelectedAnalysis(analysis)}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-800 font-medium mb-2 truncate">
                                                {analysis.original_text}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm">
                                                <Badge className={cn("font-medium", config.color)}>
                                                    <Icon className="w-3 h-3 mr-1" />
                                                    {config.label}
                                                </Badge>
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(analysis.created_date), "MMM d, yyyy h:mm a")}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(analysis.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Detail Dialog */}
            <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
 