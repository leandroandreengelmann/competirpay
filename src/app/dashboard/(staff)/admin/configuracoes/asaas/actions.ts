"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/auth-utils";
import { encrypt, decrypt } from "@/lib/encryption";

// Type definitions matching the DB
export interface AsaasSettings {
    id: string;
    provider: string;
    environment: "sandbox" | "production";
    api_key_encrypted: string | null;
    account_label: string | null;
    base_url: string | null;
    webhook_url: string | null;
    webhook_secret: string | null;
    webhook_status: string | null;
    last_connection_test_status: string | null;
    last_connection_test_message: string | null;
    last_connection_test_at: string | null;
    last_webhook_received_at: string | null;
    last_webhook_event: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Utility to partially mask the API Key
function maskApiKey(key: string | null): string {
    if (!key) return "";
    if (key.length <= 8) return "********";
    const start = key.substring(0, 4);
    const end = key.substring(key.length - 4);
    return `${start}******************${end}`;
}

export async function getAsaasSettings() {
    await ensureAdmin();
    const supabase = createAdminClient();

    // Create default if not exists
    const { data: existing, error: fetchError } = await supabase
        .from("payment_gateway_settings")
        .select("*")
        .eq("provider", "asaas")
        .maybeSingle();

    if (fetchError) {
        console.error("Error fetching asaas settings:", fetchError);
        return { success: false, error: fetchError.message };
    }

    if (!existing) {
        // Insert default
        const { data: newSettings, error: insertError } = await supabase
            .from("payment_gateway_settings")
            .insert([{ provider: "asaas", environment: "sandbox" }])
            .select()
            .single();

        if (insertError) {
            console.error("Error creating default asaas settings:", insertError);
            return { success: false, error: insertError.message };
        }

        return { success: true, data: { ...newSettings, api_key_encrypted: "" } };
    }

    return {
        success: true,
        data: {
            ...existing,
            api_key_encrypted: maskApiKey(decrypt(existing.api_key_encrypted))
        }
    };
}

export async function saveAsaasSettings(formData: FormData) {
    await ensureAdmin();
    const supabase = createAdminClient();

    const environment = formData.get("environment") as string;
    const apiKey = formData.get("api_key") as string;
    const accountLabel = formData.get("account_label") as string;
    const webhookSecret = formData.get("webhook_secret") as string;

    // We get current settings to compare environment and not override api_key if it's masked
    const { data: current } = await supabase
        .from("payment_gateway_settings")
        .select("*")
        .eq("provider", "asaas")
        .single();

    const isNewEnvironment = current && current.environment !== environment;

    // If apiKey contains asterisks, it means user didn't change it, keep the old one
    const isMaskedKey = apiKey.includes("***");
    const finalApiKey = isMaskedKey ? current?.api_key_encrypted : apiKey;

    const baseUrl = environment === "production" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";

    const updates: any = {
        environment,
        account_label: accountLabel,
        base_url: baseUrl,
        webhook_secret: webhookSecret,
        updated_at: new Date().toISOString()
    };

    if (!isMaskedKey && finalApiKey) {
        updates.api_key_encrypted = encrypt(finalApiKey);
    } else if (isNewEnvironment && current?.api_key_encrypted) {
        // Se mudou de ambiente, precisamos garantir que a chave antiga (provavelmente de outro ambiente) 
        // seja mantida se não foi informada uma nova, mas idealmente o user deve informar uma nova.
        updates.api_key_encrypted = current.api_key_encrypted;
    }

    if (isNewEnvironment) {
        // Clear test status on environment change
        updates.last_connection_test_status = null;
        updates.last_connection_test_message = null;
        updates.last_connection_test_at = null;
        updates.webhook_status = "Pendente de validação"; // Depending on business logic
    }

    const { error } = await supabase
        .from("payment_gateway_settings")
        .update(updates)
        .eq("provider", "asaas");

    if (error) {
        console.error("Error saving asaas settings:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin/configuracoes/asaas");
    return { success: true };
}

export async function testAsaasConnection() {
    await ensureAdmin();
    const supabase = createAdminClient();

    const { data: current } = await supabase
        .from("payment_gateway_settings")
        .select("api_key_encrypted, base_url, environment")
        .eq("provider", "asaas")
        .single();

    if (!current || !current.api_key_encrypted) {
        return { success: false, error: "API Key não configurada." };
    }

    try {
        const response = await fetch(`${current.base_url}/finance/balance`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access_token': decrypt(current.api_key_encrypted)
            }
        });

        const responseData = await response.json();

        const isSuccess = response.ok;
        const msg = isSuccess ? "Conexão realizada com sucesso" : (responseData.errors?.[0]?.description || "Erro inesperado");

        await supabase
            .from("payment_gateway_settings")
            .update({
                last_connection_test_status: isSuccess ? "success" : "error",
                last_connection_test_message: msg,
                last_connection_test_at: new Date().toISOString(),
                is_active: isSuccess // Auto-activate if connection works
            })
            .eq("provider", "asaas");

        revalidatePath("/dashboard/admin/configuracoes/asaas");
        return { success: isSuccess, message: isSuccess ? msg : undefined, error: !isSuccess ? msg : undefined };
    } catch (e: any) {
        const msg = e.message || "Erro inesperado ou Timeout";
        await supabase
            .from("payment_gateway_settings")
            .update({
                last_connection_test_status: "error",
                last_connection_test_message: msg,
                last_connection_test_at: new Date().toISOString()
            })
            .eq("provider", "asaas");
        revalidatePath("/dashboard/admin/configuracoes/asaas");
        return { success: false, error: msg };
    }
}

export async function registerAsaasWebhook(webhookUrl: string) {
    await ensureAdmin();
    const supabase = createAdminClient();

    const { data: current } = await supabase
        .from("payment_gateway_settings")
        .select("api_key_encrypted, base_url, webhook_secret")
        .eq("provider", "asaas")
        .single();

    if (!current || !current.api_key_encrypted) {
        return { success: false, error: "API Key não configurada." };
    }

    if (!webhookUrl) {
        return { success: false, error: "URL do Webhook não informada." };
    }

    if (!current.webhook_secret) {
        return { success: false, error: "Token de Webhook não configurado. Por favor, salve as configurações primeiro para gerar um token." };
    }

    try {
        const payload = {
            name: "Competir.pay Webhook",
            url: webhookUrl,
            email: "admin@competir.pay",
            sendType: "SEQUENTIAL",
            apiVersion: 3,
            enabled: true,
            interrupted: false,
            authToken: current.webhook_secret,
            events: [
                "PAYMENT_CREATED",
                "PAYMENT_UPDATED",
                "PAYMENT_CONFIRMED",
                "PAYMENT_RECEIVED",
                "PAYMENT_OVERDUE",
                "PAYMENT_DELETED",
                "PAYMENT_RESTORED",
                "PAYMENT_REFUNDED",
                "PAYMENT_CHARGEBACK_REQUESTED",
                "PAYMENT_CHARGEBACK_DISPUTE",
                "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
            ]
        };

        const response = await fetch(`${current.base_url}/webhooks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': decrypt(current.api_key_encrypted)
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        const isSuccess = response.ok;
        
        if (!isSuccess) {
            console.error("Asaas Webhook Registration Error Detail:", {
                status: response.status,
                data: responseData,
                payloadSent: { ...payload, authToken: '***' }
            });
        }

        const msg = isSuccess ? "Registrado com sucesso" : (responseData.errors?.[0]?.description || `Erro ${response.status}: Falha ao registrar`);

        await supabase
            .from("payment_gateway_settings")
            .update({
                webhook_status: isSuccess ? "Registrado" : "Erro ao registrar",
                webhook_url: webhookUrl
            })
            .eq("provider", "asaas");

        revalidatePath("/dashboard/admin/configuracoes/asaas");
        return { success: isSuccess, message: isSuccess ? msg : undefined, error: !isSuccess ? msg : undefined };
    } catch (e: any) {
        const msg = e.message || "Erro inesperado";
        await supabase
            .from("payment_gateway_settings")
            .update({
                webhook_status: "Erro ao registrar"
            })
            .eq("provider", "asaas");
        revalidatePath("/dashboard/admin/configuracoes/asaas");
        return { success: false, error: msg };
    }
}
