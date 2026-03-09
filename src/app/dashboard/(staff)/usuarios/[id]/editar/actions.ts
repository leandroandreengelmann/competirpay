"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateStaffAccount(userId: string, formData: FormData) {
    const supabaseAdmin = createAdminClient();

    const fullName = formData.get("fullName") as string;
    const role = formData.get("role") as string;

    if (!fullName || !role) {
        return { error: "Nome e Perfil são obrigatórios." };
    }

    if (!["admin", "financeiro", "analista_credito"].includes(role)) {
        return { error: "Perfil inválido para membros da equipe." };
    }

    // Update user metadata in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
            full_name: fullName,
            role: role,
        }
    });

    if (authError) {
        return { error: authError.message };
    }

    // Also update public.profiles
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
            full_name: fullName,
            role: role,
        })
        .eq("id", userId);

    if (profileError) {
        return { error: profileError.message };
    }

    revalidatePath("/dashboard/usuarios", "page");
    redirect("/dashboard/usuarios");
}
