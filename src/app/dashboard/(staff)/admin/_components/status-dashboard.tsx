"use client";

import { useState, useMemo } from "react";
import { CreditRequest, STATUS_CONFIG } from "./request-card";
import { RequestCard } from "./request-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, AlertCircle, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusDashboardProps {
    requests: CreditRequest[];
}

export function StatusDashboard({ requests }: StatusDashboardProps) {
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const stats = useMemo(() => {
        const counts = {
            all: requests.length,
            pending: 0,
            in_service: 0,
            approved: 0,
            refused: 0,
            withdrawn: 0,
        };

        requests.forEach((req) => {
            if (counts.hasOwnProperty(req.status)) {
                counts[req.status as keyof typeof counts]++;
            }
        });

        return counts;
    }, [requests]);

    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            const matchesStatus = filterStatus ? req.status === filterStatus : true;
            const matchesSearch = searchQuery
                ? req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.cpf.includes(searchQuery)
                : true;
            return matchesStatus && matchesSearch;
        });
    }, [requests, filterStatus, searchQuery]);

    const newPendingCount = useMemo(() => {
        // Simple logic: pending requests created in the last 24h
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        return requests.filter(req => req.status === 'pending' && new Date(req.created_at) > oneDayAgo).length;
    }, [requests]);

    return (
        <div className="space-y-8">
            {/* Notifications Area */}
            {newPendingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-3 text-amber-800">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <AlertCircle className="size-5" />
                        </div>
                        <div>
                            <p className="font-bold">Atenção! Novas solicitações</p>
                            <p className="text-sm opacity-90">Você tem {newPendingCount} {newPendingCount === 1 ? 'nova solicitação pendente' : 'novas solicitações pendentes'} nas últimas 24 horas.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className="bg-amber-200 hover:bg-amber-300 text-amber-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors shrink-0"
                    >
                        Ver agora
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-b-4",
                        !filterStatus ? "border-b-gray-900 bg-gray-50 ring-1 ring-gray-200" : "border-b-transparent hover:bg-gray-50/50"
                    )}
                    onClick={() => setFilterStatus(null)}
                >
                    <CardContent className="p-4 text-center">
                        <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
                        <p className="text-2xl font-black text-gray-900">{stats.all}</p>
                    </CardContent>
                </Card>

                {(Object.entries(STATUS_CONFIG) as [string, (typeof STATUS_CONFIG)[string]][]).map(([status, config]) => (
                    <Card
                        key={status}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-md border-b-4",
                            filterStatus === status ? config.borderClass.replace('border-l', 'border-b') + " bg-muted/30 ring-1 ring-border" : "border-b-transparent hover:bg-muted/10",
                            config.borderClass.replace('border-l', 'border-b')
                        )}
                        onClick={() => setFilterStatus(status)}
                    >
                        <CardContent className="p-4 text-center">
                            <p className="text-sm font-medium text-gray-500 mb-1">{config.label}</p>
                            <p className="text-2xl font-black text-gray-900">
                                {stats[status as keyof typeof stats] || 0}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou CPF..."
                        className="pl-9 bg-muted/30 focus-visible:bg-white transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {filterStatus && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterStatus(null)}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <FilterX className="size-4 mr-2" />
                        Limpar Filtros
                    </Button>
                )}
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-gray-900">
                        {filterStatus ? STATUS_CONFIG[filterStatus]?.label : "Todas as Solicitações"}
                        <Badge variant="outline" className="ml-2 font-normal">
                            {filteredRequests.length} resultados
                        </Badge>
                    </h2>
                </div>

                {filteredRequests.map((req) => (
                    <RequestCard key={req.id} request={req} />
                ))}

                {filteredRequests.length === 0 && (
                    <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border rounded-2xl">
                        <div className="bg-muted/20 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhum resultado encontrado</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                            Não encontramos solicitações que correspondam à sua busca ou filtro atual.
                        </p>
                        {(filterStatus || searchQuery) && (
                            <Button
                                variant="outline"
                                className="mt-6"
                                onClick={() => {
                                    setFilterStatus(null);
                                    setSearchQuery("");
                                }}
                            >
                                Limpar todos os filtros
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
