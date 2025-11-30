import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
    Shield, ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, 
    TrendingUp, Activity, Zap, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const classificationColors = {
    safe: "#10b981",
    offensive: "#f59e0b",
    hate_speech: "#ef4444",
    toxic: "#f43f5e"
};

export default function Dashboard() {
    const { data: analyses, isLoading } = useQuery({
        queryKey: ['analyses-dashboard'],
        queryFn: () => base44.entities.Analysis.list('-created_date', 500),
        initialData: []
    });

    // Calculate stats
    const stats = {
        total: analyses.length,
        safe: analyses.filter(a => a.classification === 'safe').length,
        flagged: analyses.filter(a => a.classification !== 'safe').length,
        avgConfidence: analyses.length ? Math.round(analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length) : 0
    };

    // Distribution data for pie chart
    const distributionData = [
        { name: 'Safe', value: analyses.filter(a => a.classification === 'safe').length, color: classificationColors.safe },
        { name: 'Offensive', value: analyses.filter(a => a.classification === 'offensive').length, color: classificationColors.offensive },
        { name: 'Hate Speech', value: analyses.filter(a => a.classification === 'hate_speech').length, color: classificationColors.hate_speech },
        { name: 'Toxic', value: analyses.filter(a => a.classification === 'toxic').length, color: classificationColors.toxic },
    ].filter(d => d.value > 0);

    // Emotion averages for bar chart
    const emotionAverages = analyses.length ? {
        Anger: Math.round(analyses.reduce((sum, a) => sum + (a.emotions?.anger || 0), 0) / analyses.length),
        Fear: Math.round(analyses.reduce((sum, a) => sum + (a.emotions?.fear || 0), 0) / analyses.length),
        Sadness: Math.round(analyses.reduce((sum, a) => sum + (a.emotions?.sadness || 0), 0) / analyses.length),
        Disgust: Math.round(analyses.reduce((sum, a) => sum + (a.emotions?.disgust || 0), 0), 0) / analyses.length,
        Joy: Math.round(analyses.reduce((sum, a) => sum + (a.emotions?.joy || 0), 0) / analyses.length)
    } : {};

    const emotionData = Object.entries(emotionAverages).map(([name, value]) => ({
        name,
        value: Math.round(value),
        fill: name === 'Joy' ? '#fbbf24' : name === 'Anger' ? '#ef4444' : name === 'Fear' ? '#8b5cf6' : name === 'Sadness' ? '#3b82f6' : '#22c55e'
    }));

    const StatCard = ({ title, value, icon: Icon, trend, color }) => (
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-slate-800">{value}</p>
                        {trend && (
                            <p className="text-sm text-emerald-600 flex items-center gap-1 mt-2">
                                <TrendingUp className="w-4 h-4" />
                                {trend}
                            </p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-xl", color)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
            {/* Header */}
            <header className="border-b border-slate-200/60 bg-white/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
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
                                    <h1 className="text-xl font-bold text-slate-800">Analytics Dashboard</h1>
                                    <p className="text-xs text-slate-500">Content Safety Insights</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        {Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="bg-white/80">
                                <CardContent className="p-6">
                                    <Skeleton className="h-4 w-24 mb-3" />
                                    <Skeleton className="h-8 w-16" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-4 gap-6 mb-8">
                            <StatCard 
                                title="Total Analyses" 
                                value={stats.total} 
                                icon={Activity}
                                color="bg-gradient-to-br from-blue-500 to-indigo-500"
                            />
                            <StatCard 
                                title="Safe Content" 
                                value={stats.safe} 
                                icon={ShieldCheck}
                                color="bg-gradient-to-br from-emerald-500 to-green-500"
                            />
                            <StatCard 
                                title="Flagged Content" 
                                value={stats.flagged} 
                                icon={ShieldAlert}
                                color="bg-gradient-to-br from-amber-500 to-orange-500"
                            />
                            <StatCard 
                                title="Avg Confidence" 
                                value={`${stats.avgConfidence}%`} 
                                icon={Zap}
                                color="bg-gradient-to-br from-purple-500 to-pink-500"
                            />
                        </div>

                        {/* Charts Grid */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Classification Distribution */}
                            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BarChart3 className="w-5 h-5 text-slate-500" />
                                        Classification Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {distributionData.length > 0 ? (
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={distributionData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {distributionData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
 