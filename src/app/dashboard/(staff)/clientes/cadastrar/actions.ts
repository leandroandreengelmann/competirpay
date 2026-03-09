"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClientAccount(formData: FormData) {
    const supabaseAdmin = createAdminClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const cpf = formData.get("cpf") as string;
    const phone = formData.get("phone") as string;
    const cep = formData.get("cep") as string;
    const street = formData.get("street") as string;
    const addressNumber = formData.get("number") as string;
    const neighborhood = formData.get("neighborhood") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const role = "cliente";

    if (!email || !password || !fullName || !cpf || !phone) {
        return { error: "Os campos obrigatórios devem ser preenchidos." };
    }

    // 1. Create user using admin API (does not modify current admin session)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
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
            role: role,
        }
    });

    if (authError) {
        return { error: authError.message };
    }

    revalidatePath("/dashboard/clientes", "page");
    redirect("/dashboard/clientes");
}
