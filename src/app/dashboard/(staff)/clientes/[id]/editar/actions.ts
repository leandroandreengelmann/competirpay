"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateClientAccount(userId: string, formData: FormData) {
    const supabaseAdmin = createAdminClient();

    const fullName = formData.get("fullName") as string;
    const cpf = formData.get("cpf") as string;
    const phone = formData.get("phone") as string;
    const cep = formData.get("cep") as string;
    const street = formData.get("street") as string;
    const addressNumber = formData.get("number") as string;
    const neighborhood = formData.get("neighborhood") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;

    if (!fullName || !cpf || !phone) {
        return { error: "Nome, CPF e Celular são obrigatórios." };
    }

    // Update user metadata in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
            full_name: fullName,
            cpf,
            phone,
            cep,
            street,
            address_number: addressNumber,
            neighborhood,
            city,
            state,
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
            cpf,
            phone,
        })
        .eq("id", userId);

    if (profileError) {
        return { error: profileError.message };
    }

    revalidatePath("/dashboard/clientes", "page");
    redirect("/dashboard/clientes");
}
