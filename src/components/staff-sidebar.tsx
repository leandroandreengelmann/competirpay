"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    BarChart3,
    FileText,
    Settings,
    LogOut,
    Shield,
    Clock,
    ChevronRight,
    UserCircle2,
    Percent,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserRole = "admin" | "financeiro" | "analista_credito";

interface StaffSidebarProps {
    userRole: UserRole;
    userName: string;
    userEmail: string;
}

type NavItem = {
    label: string;
    href?: string;
    icon: React.ElementType;
    items?: { label: string; href: string }[];
};

const navByRole: Record<UserRole, NavItem[]> = {
    admin: [
        { label: "Visão Geral", href: "/dashboard/admin", icon: LayoutDashboard },
        { label: "Financeiro", href: "/dashboard/admin/financeiro", icon: BarChart3 },
        { label: "Todas as Solicitações", href: "/dashboard/admin/todas", icon: FileText },
        {
            label: "Usuários",
            icon: Users,
            items: [
                { label: "Ver Usuários", href: "/dashboard/usuarios" },
                { label: "Cadastrar Usuário", href: "/dashboard/usuarios/cadastrar" }
            ]
        },
        {
            label: "Clientes",
            icon: UserCircle2,
            items: [
                { label: "Ver Clientes", href: "/dashboard/clientes" },
                { label: "Cadastrar Cliente", href: "/dashboard/clientes/cadastrar" }
            ]
        },
        { label: "Taxas", href: "/dashboard/taxas", icon: Percent },
        {
            label: "Configurações",
            icon: Settings,
            items: [
                { label: "Asaas Integrado", href: "/dashboard/admin/configuracoes/asaas" }
            ]
        },
    ],
    financeiro: [
        { label: "Visão Geral", href: "/dashboard/financeiro", icon: LayoutDashboard },
        { label: "Financeiro", href: "/dashboard/admin/financeiro", icon: BarChart3 },
        { label: "Taxas", href: "/dashboard/taxas", icon: Percent },
    ],
    analista_credito: [
        { label: "Visão Geral", href: "/dashboard/analista", icon: LayoutDashboard },
    ],
};

const roleLabel: Record<UserRole, string> = {
    admin: "Administrador",
    financeiro: "Financeiro",
    analista_credito: "Analista de Crédito",
};

export function StaffSidebar({ userRole, userName, userEmail }: StaffSidebarProps) {
    const pathname = usePathname();
    const navItems = navByRole[userRole] ?? navByRole.admin;
    const initials = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

    return (
        <Sidebar collapsible="icon">
            {/* ── Header ─────────────────────────────────── */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-auto py-2">
                            <Link href={`/dashboard/${userRole === "analista_credito" ? "analista" : userRole}`}>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-lg font-black tracking-tight text-foreground leading-none">
                                        competir<span className="text-brand-600">.pay</span>
                                    </span>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {roleLabel[userRole]}
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* ── Navigation ─────────────────────────────── */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                {item.items ? (
                                    <Collapsible className="group/collapsible" asChild defaultOpen={item.items.some(sub => pathname === sub.href || pathname.startsWith(sub.href + "/"))}>
                                        <div className="flex flex-col w-full">
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip={item.label}>
                                                    <item.icon />
                                                    <span>{item.label}</span>
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.items.map((subItem) => (
                                                        <SidebarMenuSubItem key={subItem.href}>
                                                            <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                                                <Link href={subItem.href}>
                                                                    <span>{subItem.label}</span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </div>
                                    </Collapsible>
                                ) : (
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={item.label}
                                    >
                                        <Link href={item.href!}>
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                )}
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            {/* ── Footer (user menu) ─────────────────────── */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    {/* Avatar */}
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-xs shrink-0">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate text-sm font-semibold">{userName}</span>
                                        <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                                    </div>
                                    <ChevronRight className="ml-auto size-4 shrink-0" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56"
                                side="top"
                                align="end"
                            >
                                <div className="flex items-center gap-2 px-2 py-1.5">
                                    <div className="flex size-7 items-center justify-center rounded-md bg-brand-100 text-brand-700 font-bold text-xs">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-xs font-semibold truncate">{userName}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <form action="/auth/signout" method="post" className="w-full">
                                        <button type="submit" className="flex w-full items-center gap-2 text-sm text-destructive">
                                            <LogOut className="size-4" />
                                            Sair da conta
                                        </button>
                                    </form>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
