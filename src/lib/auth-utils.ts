import { createClient } from "./supabase/server";

export async function getUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

export async function ensureAuthenticated() {
    const user = await getUser();
    if (!user) {
        throw new Error("Não autenticado. Por favor, faça login.");
    }
    return user;
}

export async function ensureAdmin() {
    const user = await ensureAuthenticated();
    const supabase = await createClient();

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error || !profile || profile.role !== "admin") {
        throw new Error("Acesso negado: Somente administradores podem realizar esta ação.");
    }

    return user;
}
