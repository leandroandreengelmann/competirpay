import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type UserRole = "admin" | "financeiro" | "analista_credito";

const roleConfig: Record<UserRole, { label: string; color: string }> = {
    admin: { label: "Administrador", color: "bg-red-100 text-red-700 border-red-200" },
    financeiro: { label: "Financeiro", color: "bg-blue-100 text-blue-700 border-blue-200" },
    analista_credito: { label: "Analista de Crédito", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

export default async function UsuariosPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");
    if (user.user_metadata?.role !== "admin") redirect("/dashboard/admin");

    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["admin", "financeiro", "analista_credito"])
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                Erro ao carregar usuários: {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
                <h1 className="text-2xl font-black tracking-tight text-gray-900">Usuários</h1>
                <p className="text-sm text-muted-foreground">
                    Equipe interna — Administradores, Financeiro e Analistas de Crédito.
                </p>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="w-10 text-center font-semibold text-gray-600">#</TableHead>
                            <TableHead className="font-semibold text-gray-600">Nome</TableHead>
                            <TableHead className="font-semibold text-gray-600">E-mail</TableHead>
                            <TableHead className="font-semibold text-gray-600">Perfil</TableHead>
                            <TableHead className="font-semibold text-gray-600">ID</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-sm text-gray-400 italic py-10">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                        {profiles?.map((profile, idx) => {
                            const role = profile.role as UserRole;
                            const config = roleConfig[role];
                            return (
                                <TableRow key={profile.id} className="hover:bg-gray-50/50">
                                    <TableCell className="text-center text-xs text-gray-400 font-mono">{idx + 1}</TableCell>
                                    <TableCell className="font-semibold text-gray-900">
                                        {profile.full_name || "—"}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 font-mono">
                                        {profile.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${config?.color}`}>
                                            {config?.label ?? role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500 font-mono">
                                        {profile.id}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600" asChild>
                                            <Link href={`/dashboard/usuarios/${profile.id}/editar`}>
                                                <Edit2 size={16} />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
