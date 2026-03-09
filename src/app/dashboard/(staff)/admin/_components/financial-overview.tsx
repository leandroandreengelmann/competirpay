"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
    DollarSign,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    Filter,
    Calendar as CalendarIcon,
    TrendingUp
} from "lucide-react";
import { format, isSameDay, isWithinInterval, startOfMonth, endOfMonth, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CreditRequest } from "./request-card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

interface FinancialOverviewProps {
    requests: CreditRequest[];
}

type Period = "today" | "week" | "month" | "all";

export function FinancialOverview({ requests }: FinancialOverviewProps) {
    const [period, setPeriod] = useState<Period>("month");

    const filteredRequests = useMemo(() => {
        const now = new Date();
        return requests.filter((req) => {
            const date = new Date(req.created_at);
            if (period === "today") return isSameDay(date, now);
            if (period === "week") {
                return isWithinInterval(date, {
                    start: subDays(now, 7),
                    end: now,
                });
            }
            if (period === "month") {
                return isWithinInterval(date, {
                    start: startOfMonth(now),
                    end: endOfMonth(now),
                });
            }
            return true;
        });
    }, [requests, period]);

    const stats = useMemo(() => {
        const totalRecebido = filteredRequests
            .filter(r => r.status === "approved")
            .reduce((acc, r) => acc + (r.final_amount ?? r.amount), 0);

        const totalRepasse = filteredRequests
            .filter(r => r.organizer_payment_status === "PAID")
            .reduce((acc, r) => acc + r.amount, 0);

        const aPagar = filteredRequests
            .filter(r => r.status === "approved" && r.organizer_payment_status === "PENDING")
            .reduce((acc, r) => acc + r.amount, 0);

        const pendencias = filteredRequests.filter(r => ["pending", "in_service"].includes(r.status)).length;

        return { totalRecebido, totalRepasse, aPagar, pendencias };
    }, [filteredRequests]);

    const chartData = useMemo(() => {
        const now = new Date();
        let start: Date;
        let end: Date = now;

        if (period === "today") {
            start = startOfDay(now);
        } else if (period === "week") {
            start = subDays(now, 7);
        } else if (period === "month") {
            start = startOfMonth(now);
            end = endOfMonth(now);
        } else {
            // "all" - find min date
            const minDate = requests.length > 0
                ? new Date(Math.min(...requests.map(r => new Date(r.created_at).getTime())))
                : subDays(now, 30);
            start = minDate;
        }

        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dayRequests = requests.filter(r => isSameDay(new Date(r.created_at), day));

            const entradas = dayRequests
                .filter(r => r.status === "approved")
                .reduce((acc, r) => acc + (r.final_amount ?? r.amount), 0);

            const saidas = dayRequests
                .filter(r => r.organizer_payment_status === "PAID")
                .reduce((acc, r) => acc + r.amount, 0);

            return {
                name: format(day, "dd/MM"),
                date: day,
                entradas,
                saidas
            };
        });
    }, [requests, period]);

    return (
        <div className="space-y-6">
            {/* Period Filter */}
            <div className="flex items-center justify-between">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(["today", "week", "month", "all"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                period === p
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {p === "today" && "Hoje"}
                            {p === "week" && "Semana"}
                            {p === "month" && "Mês"}
                            {p === "all" && "Tudo"}
                        </button>
                    ))}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <CalendarIcon className="size-4" />
                    <span>{period === "all" ? "Todo o histórico" : `Período: ${format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}`}</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Recebido */}
                <Card className="p-5 border-l-4 border-l-emerald-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-1">Total Recebido</p>
                            <h3 className="text-2xl font-black text-gray-900">
                                R$ {stats.totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <ArrowDownLeft className="size-6" />
                        </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-2 font-bold uppercase tracking-wider">Bruto total (Clientes)</p>
                </Card>

                {/* Total Repasse */}
                <Card className="p-5 border-l-4 border-l-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-1">Repasses Pagos</p>
                            <h3 className="text-2xl font-black text-gray-900">
                                R$ {stats.totalRepasse.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <ArrowUpRight className="size-6" />
                        </div>
                    </div>
                    <p className="text-[10px] text-blue-600 mt-2 font-bold uppercase tracking-wider">Pago aos organizadores</p>
                </Card>

                {/* A Repassar */}
                <Card className="p-5 border-l-4 border-l-amber-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-1">A Repassar (Total)</p>
                            <h3 className="text-2xl font-black text-gray-900">
                                R$ {stats.aPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                            <Clock className="size-6" />
                        </div>
                    </div>
                    <p className="text-[10px] text-amber-600 mt-2 font-bold uppercase tracking-wider">Liberações pendentes</p>
                </Card>

                {/* Pendências */}
                <Card className="p-5 border-l-4 border-l-rose-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-1">Pendências</p>
                            <h3 className="text-2xl font-black text-gray-900">
                                {stats.pendencias}
                            </h3>
                        </div>
                        <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                            <Filter className="size-6" />
                        </div>
                    </div>
                    <p className="text-[10px] text-rose-600 mt-2 font-bold uppercase tracking-wider">Fila de atendimento</p>
                </Card>
            </div>

            {/* Daily Chart & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 bg-white shadow-sm overflow-hidden">
                    <h4 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="size-5 text-emerald-600" />
                        Fluxo de Caixa (Entradas vs Saídas)
                    </h4>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `R$ ${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`R$ ${Number(value || 0).toFixed(2)}`, ""]}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Area
                                    type="monotone"
                                    dataKey="entradas"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorEntradas)"
                                    name="Recebimentos"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="saidas"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSaidas)"
                                    name="Repasses Pagos"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 bg-white shadow-sm flex flex-col">
                    <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="size-5 text-brand-600" />
                        Últimos Repasses
                    </h4>
                    <div className="space-y-4 flex-1 overflow-auto">
                        {filteredRequests
                            .filter(r => r.organizer_payment_status === "PAID")
                            .slice(0, 10)
                            .map(r => (
                                <div key={r.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 hover:bg-gray-50/50 transition-colors p-1 rounded-md">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800 line-clamp-1">{r.name}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">{format(new Date(r.organizer_payment_date!), "dd/MM/yyyy")}</span>
                                    </div>
                                    <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">R$ {r.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        {filteredRequests.filter(r => r.organizer_payment_status === "PAID").length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                                <DollarSign className="size-8 text-gray-100" />
                                <span className="italic">Nenhum repasse no período.</span>
                            </div>
                        )}
                    </div>
                    <a href="/dashboard/admin/todas" className="mt-4 py-2 bg-gray-50 rounded-lg text-xs text-brand-600 font-black hover:bg-gray-100 transition-colors text-center border border-gray-100">
                        VER HISTÓRICO COMPLETO →
                    </a>
                </Card>
            </div>
        </div>
    );
}
