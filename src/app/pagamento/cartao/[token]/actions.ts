"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { PaymentFormData, paymentSchema } from "./schema";
import { decrypt } from "@/lib/encryption";

const getAdminSupabase = () => createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getPaymentLinkData(token: string) {
    const supabase = getAdminSupabase();

    // Fetch the payment_link by token
    const { data: link, error } = await supabase
        .from("payment_links")
        .select(`
            id,
            token,
            amount,
            installments,
            status,
            expires_at,
            credit_requests (
                id,
                name,
                cpf,
                email,
                championship_id,
                payment_method,
                phone,
                credit_tables (name)
            )
        `)
        .eq("token", token)
        .single();

    if (error || !link) {
        return { success: false, error: "Cobrança não encontrada ou inválida." };
    }

    return { success: true, data: link };
}

export async function processPayment(token: string, formData: PaymentFormData) {
    const supabase = getAdminSupabase();

    // 1. Validate Form Data
    const parsed = paymentSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: "Dados do formulário inválidos.", details: parsed.error.issues };
    }

    // 2. Fetch Payment Link
    const linkData = await getPaymentLinkData(token);
    if (!linkData || !linkData.success || !("data" in linkData) || !linkData.data) {
        return { success: false, error: "Link de pagamento inválido." };
    }

    const link = linkData.data as any;

    if (link.status !== "ACTIVE") {
        return { success: false, error: `Link de pagamento indisponível. Status: ${link.status}` };
    }

    // 3. Create Payment Attempt (PENDING_CONFIRMATION)
    const { data: attempt, error: attemptError } = await supabase
        .from("payment_attempts")
        .insert({
            payment_link_id: link.id,
            status: "PROCESSING",
        })
        .select()
        .single();

    if (attemptError) {
        return { success: false, error: "Erro ao iniciar processamento de pagamento." };
    }

    // 4. Asaas API Integration
    const { data: asaasSettings } = await supabase
        .from("payment_gateway_settings")
        .select("api_key_encrypted, base_url")
        .eq("provider", "asaas")
        .single();

    if (!asaasSettings || !asaasSettings.api_key_encrypted) {
        await supabase.from("payment_attempts").update({ status: "ERROR" }).eq("id", attempt.id);
        return { success: false, error: "Gateway de pagamento não configurado." };
    }

    const { api_key_encrypted, base_url: BASE_URL } = asaasSettings;
    const API_KEY = decrypt(api_key_encrypted);

    try {
        let customerId = "";

        const cpfDigits = formData.cpfCnpj.replace(/\D/g, '');
        const phoneDigits = link.credit_requests.phone.replace(/\D/g, '');

        const searchRes = await fetch(`${BASE_URL}/customers?cpfCnpj=${cpfDigits}`, {
            headers: { 'access_token': API_KEY }
        });
        const searchData = await searchRes.json();

        if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;
        } else {
            const createCustomerRes = await fetch(`${BASE_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'access_token': API_KEY },
                body: JSON.stringify({
                    name: formData.name,
                    cpfCnpj: cpfDigits,
                    phone: phoneDigits
                })
            });
            const createCustomerData = await createCustomerRes.json();
            if (!createCustomerRes.ok) throw new Error(createCustomerData.errors?.[0]?.description || "Erro ao criar cliente no Asaas");
            customerId = createCustomerData.id;
        }

        // const [month, year] = formData.expiryDate.split('/');

        const payload = {
            customer: customerId,
            billingType: "CREDIT_CARD",
            value: Number(link.amount),
            dueDate: new Date().toISOString().split('T')[0],
            description: `Solicitação de Crédito - ${link.credit_requests.name}`,
            installmentCount: link.installments > 1 ? link.installments : undefined,
            installmentValue: link.installments > 1 ? Number(link.amount) / link.installments : undefined,
            creditCard: {
                holderName: formData.holderName,
                number: formData.number.replace(/\D/g, ''),
                expiryMonth: formData.expiryMonth,
                expiryYear: formData.expiryYear,
                ccv: formData.ccv
            },
            creditCardHolderInfo: {
                name: formData.name,
                email: formData.email,
                cpfCnpj: cpfDigits,
                postalCode: formData.postalCode.replace(/\D/g, ''),
                addressNumber: formData.addressNumber,
                phone: formData.phone.replace(/\D/g, '') || phoneDigits
            }
        };

        const paymentRes = await fetch(`${BASE_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': API_KEY },
            body: JSON.stringify(payload)
        });

        const paymentData = await paymentRes.json();

        if (!paymentRes.ok) {
            console.error("Asaas Error:", paymentData);
            const msg = paymentData.errors?.[0]?.description || "Pagamento recusado pelo gateway.";
            await supabase.from("payment_attempts").update({
                status: "REFUSED",
                gateway_response_summary: msg
            }).eq("id", attempt.id);
            return { success: false, error: msg };
        }

        const newStatus = (paymentData.status === "CONFIRMED" || paymentData.status === "RECEIVED") ? "APPROVED" : "PENDING_CONFIRMATION";

        await supabase.from("payment_attempts").update({
            status: newStatus,
            asaas_customer_id: customerId,
            asaas_payment_id: paymentData.id
        }).eq("id", attempt.id);

        if (newStatus === "APPROVED") {
            await supabase.from("payment_links").update({ status: "USED" }).eq("id", link.id);
        }

        return { success: true, data: { status: newStatus } };

    } catch (e: any) {
        console.error("Error processing Asaas payment:", e);
        await supabase.from("payment_attempts").update({ status: "ERROR", gateway_response_summary: e.message }).eq("id", attempt.id);
        return { success: false, error: "Erro de comunicação com o gateway de pagamento." };
    }
}

export async function getPaymentStatus(token: string) {
    const supabase = getAdminSupabase();

    const { data: link, error } = await supabase
        .from("payment_links")
        .select("id, status")
        .eq("token", token)
        .single();

    if (error || !link) {
        return { success: false, error: "Não localizado." };
    }

    // get the latest attempt
    const { data: attempt } = await supabase
        .from("payment_attempts")
        .select("status")
        .eq("payment_link_id", link.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    return {
        success: true,
        linkStatus: link.status,
        attemptStatus: attempt ? attempt.status : "READY"
    };
}
