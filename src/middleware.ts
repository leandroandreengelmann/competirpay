import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Maps each role to its base dashboard path
const roleToDashboard: Record<string, string> = {
    admin: "/dashboard/admin",
    financeiro: "/dashboard/financeiro",
    analista_credito: "/dashboard/analista",
    cliente: "/dashboard/cliente",
};

function getDashboardForRole(role: string | undefined): string {
    return roleToDashboard[role ?? ""] ?? "/dashboard/cliente";
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Get user from JWT — no DB query, no RLS issues
    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    // ── Protect /dashboard routes ────────────────────────────────────────────
    if (path.startsWith("/dashboard")) {
        if (!user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Read role directly from JWT metadata
        const role = user.user_metadata?.role as string | undefined;
        const correctDashboard = getDashboardForRole(role);

        // If the current path doesn't start with the user's correct dashboard, redirect
        if (!path.startsWith(correctDashboard)) {
            // Admin secondary access
            const adminSecondaryAccess =
                role === "admin" &&
                (
                    path.startsWith("/dashboard/financeiro") ||
                    path.startsWith("/dashboard/analista") ||
                    path.startsWith("/dashboard/usuarios") ||
                    path.startsWith("/dashboard/clientes") ||
                    path.startsWith("/dashboard/taxas")
                );

            // Financeiro secondary access
            const financeiroSecondaryAccess =
                role === "financeiro" && path.startsWith("/dashboard/taxas");

            if (!adminSecondaryAccess && !financeiroSecondaryAccess) {
                return NextResponse.redirect(new URL(correctDashboard, request.url));
            }
        }
    }

    // ── Prevent logged-in users from seeing /login or /register ─────────────
    if (user && (path === "/login" || path === "/register")) {
        const role = user.user_metadata?.role as string | undefined;
        return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
