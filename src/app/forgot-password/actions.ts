"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendOtp(email: string) {
    if (!email) return { error: "E-mail obrigatório." };

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function verifyOtp(email: string, token: string) {
    if (!email || !token) return { error: "E-mail e código são obrigatórios." };

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
    });

    if (error) {
        return { error: "Código inválido ou expirado." };
    }

    return { success: true };
}

export async function updatePassword(password: string) {
    if (!password || password.length < 6) return { error: "A nova senha deve ter no mínimo 6 caracteres." };

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
        password: password
    });

    if (error) {
        return { error: "Erro ao atualizar senha: " + error.message };
    }

    return { success: true };
}
