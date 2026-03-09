"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "E-mail e senha são obrigatórios." };
    }

    // 1. Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError || !authData.user) {
        return { error: "Credenciais inválidas." };
    }

    // 2. Read the role directly from user metadata (set at signup, no extra DB query needed)
    const userRole = authData.user.user_metadata?.role as string | undefined;

    // 3. Redirect to the appropriate dashboard
    let redirectUrl = "/dashboard/cliente"; // safe default
    if (userRole === "admin") redirectUrl = "/dashboard/admin";
    else if (userRole === "financeiro") redirectUrl = "/dashboard/financeiro";
    else if (userRole === "analista_credito") redirectUrl = "/dashboard/analista";
    else if (userRole === "cliente") redirectUrl = "/dashboard/cliente";

    redirect(redirectUrl);
}
