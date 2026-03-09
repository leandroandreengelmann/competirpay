"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStaffAccount(formData: FormData) {
    const supabaseAdmin = createAdminClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const role = formData.get("role") as string;

    if (!email || !password || !fullName || !role) {
        return { error: `Todos os campos são obrigatórios. Recebido: email=${email}, nome=${fullName}, perfil=${role}` };
    }

    // Apenas permitir cargos de staff
    if (!["admin", "financeiro", "analista_credito"].includes(role)) {
        return { error: `Perfil inválido para membros da equipe: '${role}'` };
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: role,
        }
    });

    if (authError) {
        return { error: `Erro ao criar conta: ${authError.message} (código: ${authError.status})` };
    }

    // Garantia: upsert manual no profiles caso o trigger falhe
    if (authData?.user?.id) {
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: authData.user.id,
                full_name: fullName,
                role: role,
                email: email,
            }, { onConflict: "id" });

        if (profileError) {
            // Não bloqueia se o trigger já criou o perfil
            console.error("Profile upsert error (non-critical):", profileError.message);
        }
    }

    revalidatePath("/dashboard/usuarios", "page");
    redirect("/dashboard/usuarios");
}
