"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/auth-utils";
import { decrypt } from "@/lib/encryption";

export async function updateRequestStatus(requestId: string, status: string) {
    await ensureAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("credit_requests")
        .update({ status })
        .eq("id", requestId);

    if (error) {
        console.error("Erro ao atualizar status:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/todas");
    return { success: true };
}

export async function addRequestNoteWithAttachments(formData: FormData) {
    await ensureAdmin();
    const supabase = createAdminClient();
    const requestId = formData.get("requestId") as string;
    const content = formData.get("content") as string;
    const files = formData.getAll("attachments") as File[];

    if (!requestId) return { success: false, error: "ID da requisição Ausente" };

    const attachments: { url: string; name: string; type: string }[] = [];

    for (const file of files) {
        if (file && file.size > 0) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${requestId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const { error: uploadError } = await supabase.storage
                .from("credit-request-attachments")
                .upload(fileName, file);

            if (uploadError) {
                console.error("Erro ao fazer upload do arquivo:", uploadError);
                return { success: false, error: "Erro no upload de arquivo." };
            }

            const { data: signedUrlData, error: signError } = await supabase.storage
                .from("credit-request-attachments")
                .createSignedUrl(fileName, 7200); // 2 hours

            if (signError) {
                console.error("Erro ao gerar URL assinada:", signError);
                return { success: false, error: "Erro ao gerar link de acesso ao arquivo." };
            }

            attachments.push({
                url: signedUrlData.signedUrl,
                name: file.name,
                type: file.type
            });
        }
    }

    const payload: any = { request_id: requestId, content };
    if (attachments.length > 0) {
        payload.attachments = attachments;
    }

    const { error } = await supabase
        .from("credit_request_notes")
        .insert(payload);

    if (error) {
        console.error("Erro ao adicionar nota:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/todas");
    return { success: true };
}

export async function updateRequestNoteWithAttachments(formData: FormData) {
    await ensureAdmin();
    const supabase = createAdminClient();
    const noteId = formData.get("noteId") as string;
    const content = formData.get("content") as string;
    const newFiles = formData.getAll("newAttachments") as File[];
    const keptAttachmentsRaw = formData.get("keptAttachments") as string | null;

    // Parses existing kept attachments
    let finalAttachments: { url: string; name: string; type: string }[] = [];
    if (keptAttachmentsRaw) {
        try {
            finalAttachments = JSON.parse(keptAttachmentsRaw);
        } catch (e) {
            console.error("Failed to parse kept attachments", e);
        }
    }

    if (!noteId) return { success: false, error: "ID da nota Ausente" };

    for (const file of newFiles) {
        if (file && file.size > 0) {
            const fileName = `update-${noteId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const { error: uploadError } = await supabase.storage
                .from("credit-request-attachments")
                .upload(fileName, file);

            if (uploadError) {
                console.error("Erro ao fazer upload de arquivo:", uploadError);
                return { success: false, error: "Erro no upload de arquivo." };
            }

            const { data: signedUrlData, error: signError } = await supabase.storage
                .from("credit-request-attachments")
                .createSignedUrl(fileName, 7200); // 2 hours

            if (signError) {
                console.error("Erro ao gerar URL assinada:", signError);
                return { success: false, error: "Erro ao gerar link de acesso ao arquivo." };
            }

            finalAttachments.push({
                url: signedUrlData.signedUrl,
                name: file.name,
                type: file.type
            });
        }
    }

    const payload: any = { content, attachments: finalAttachments.length > 0 ? finalAttachments : null };

    const { error } = await supabase
        .from("credit_request_notes")
        .update(payload)
        .eq("id", noteId);

    if (error) {
        console.error("Erro ao atualizar nota:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/todas");
    return { success: true };
}

export async function deleteRequestNote(noteId: string) {
    await ensureAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("credit_request_notes")
        .delete()
        .eq("id", noteId);

    if (error) {
        console.error("Erro ao excluir nota:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/todas");
    return { success: true };
}

export async function deleteNoteAttachment(noteId: string, attachmentUrl: string) {
    await ensureAdmin();
    const supabase = createAdminClient();

    const { data: note } = await supabase
        .from("credit_request_notes")
        .select("attachments")
        .eq("id", noteId)
        .single();

    if (!note) return { success: false, error: "Nota não encontrada" };

    const attachments = note.attachments || [];
    const newAttachments = attachments.filter((a: any) => a.url !== attachmentUrl);

    const { error } = await supabase
        .from("credit_request_notes")
        .update({ attachments: newAttachments.length > 0 ? newAttachments : null })
        .eq("id", noteId);

    if (error) {
        console.error("Erro ao deletar anexo da nota:", error);
        return { success: false, error: error.message };
    }


    // Also delete from storage
    const fileName = attachmentUrl.split('/').pop();
    if (fileName) {
        await supabase.storage.from("credit-request-attachments").remove([fileName]);
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/todas");
    return { success: true };
}

export async function generatePaymentLink(requestId: string, amount: number, installments: number | null) {
    await ensureAdmin();
    const supabase = createAdminClient();
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // 3 days expiry

    const { data, error } = await supabase
        .from("payment_links")
        .insert({
            token,
            credit_request_id: requestId,
            amount,
            installments: installments || 1,
            expires_at: expiresAt.toISOString(),
            status: "ACTIVE"
        })
        .select("token")
        .single();

    if (error) {
        console.error("Erro ao gerar link:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/todas");
    return { success: true, token: data.token };
}

export async function generateBoletoBatch(requestId: string, firstDueDate: string) {
    await ensureAdmin();
    const supabase = createAdminClient();

    // 1. Fetch Request, Gateway Settings, and potential existing batch
    const { data: request, error: reqError } = await supabase
        .from("credit_requests")
        .select(`
            *,
            payment_batches(id, asaas_installment_id)
        `)
        .eq("id", requestId)
        .single();

    if (reqError || !request) {
        console.error("Error fetching credit_request:", reqError);
        return { success: false, error: "Solicitação não encontrada." };
    }
    if (request.status !== "approved") return { success: false, error: "A solicitação precisa estar aprovada para gerar boletos." };
    if (request.payment_method !== "boleto") return { success: false, error: "Método de pagamento não é boleto." };

    // Check if a batch was already generated
    if (request.payment_batches && request.payment_batches.length > 0) {
        return { success: true, batchId: request.payment_batches[0].id };
    }

    const { data: asaasSettings } = await supabase
        .from("payment_gateway_settings")
        .select("api_key_encrypted, base_url")
        .eq("provider", "asaas")
        .single();

    if (!asaasSettings || !asaasSettings.api_key_encrypted) {
        return { success: false, error: "Configurações do Asaas não encontradas." };
    }

    const API_KEY = decrypt(asaasSettings.api_key_encrypted);
    const BASE_URL = asaasSettings.base_url;

    try {
        // 2. Ensure Customer exists in Asaas
        let asaasCustomerId = "";
        const cpfDigits = request.cpf.replace(/\D/g, "");
        const searchRes = await fetch(`${BASE_URL}/customers?cpfCnpj=${cpfDigits}`, {
            headers: { 'access_token': API_KEY }
        });
        const searchData = await searchRes.json();

        if (searchData.data && searchData.data.length > 0) {
            asaasCustomerId = searchData.data[0].id;
        } else {
            const createCustomerRes = await fetch(`${BASE_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'access_token': API_KEY },
                body: JSON.stringify({
                    name: request.name,
                    cpfCnpj: cpfDigits,
                    phone: request.phone.replace(/\D/g, "")
                })
            });
            const createCustomerData = await createCustomerRes.json();
            if (!createCustomerRes.ok) throw new Error(createCustomerData.errors?.[0]?.description || "Erro ao criar cliente no Asaas");
            asaasCustomerId = createCustomerData.id;
        }

        // 3. Call Asaas to generate installments
        const isInstallment = request.installments > 1;
        const finalAmount = request.final_amount ?? request.amount;
        const installmentPayload: any = {
            customer: asaasCustomerId,
            billingType: "BOLETO",
            dueDate: firstDueDate,
            description: `Parcelamento de Crédito - ${request.name}`,
            postalService: false
        };

        if (isInstallment) {
            installmentPayload.installmentCount = request.installments;
            installmentPayload.installmentValue = Number(finalAmount) / request.installments;
        } else {
            installmentPayload.value = Number(finalAmount);
        }

        const installmentRes = await fetch(`${BASE_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': API_KEY },
            body: JSON.stringify(installmentPayload)
        });

        const installmentData = await installmentRes.json();

        if (!installmentRes.ok) {
            console.error("Asaas Error:", installmentData);
            return { success: false, error: installmentData.errors?.[0]?.description || "Erro ao gerar parcelamento no gateway." };
        }

        // 4. Save to Database
        // Create the Batch
        const { data: batch, error: batchError } = await supabase
            .from("payment_batches")
            .insert({
                credit_request_id: requestId,
                asaas_installment_id: installmentData.installment || null,
                first_due_date: firstDueDate,
                total_amount: Number(finalAmount),
                installment_count: request.installments,
                status: "ACTIVE"
            })
            .select()
            .single();

        if (batchError) throw new Error("Erro ao salvar lote de boletos no banco.");

        // Fetch the individual payments created by this installment call
        let createdPayments = [];
        if (isInstallment && installmentData.installment) {
            const paymentsQueryRes = await fetch(`${BASE_URL}/payments?installment=${installmentData.installment}`, {
                headers: { 'access_token': API_KEY }
            });
            const paymentsQueryData = await paymentsQueryRes.json();
            createdPayments = paymentsQueryData.data || [];
        } else {
            createdPayments = [installmentData];
        }

        if (createdPayments.length > 0) {
            const installmentInserts = createdPayments.map((p: any) => ({
                batch_id: batch.id,
                installment_number: p.installmentNumber || 1,
                due_date: p.dueDate,
                amount: p.value,
                asaas_payment_id: p.id,
                asaas_bank_slip_url: p.bankSlipUrl,
                status: "PENDING"
            }));

            const { error: insError } = await supabase.from("payment_installments").insert(installmentInserts);
            if (insError) console.error("Erro ao salvar parcelas individuais:", insError);
        }

        revalidatePath("/dashboard/admin");
        revalidatePath("/dashboard/admin/todas");
        return { success: true, batchId: batch.id };

    } catch (e: any) {
        console.error("Error generating boleto batch:", e);
        return { success: false, error: e.message || "Erro inesperado ao gerar boletos." };
    }
}

export async function generateCarnet(batchId: string) {
    await ensureAdmin();
    const supabase = createAdminClient();

    const { data: batch, error: batchError } = await supabase
        .from("payment_batches")
        .select("asaas_installment_id")
        .eq("id", batchId)
        .single();

    if (batchError || !batch) return { success: false, error: "Lote não encontrado." };

    const { data: asaasSettings } = await supabase
        .from("payment_gateway_settings")
        .select("api_key_encrypted, base_url")
        .eq("provider", "asaas")
        .single();

    if (!asaasSettings) return { success: false, error: "Configurações do Asaas não encontradas." };

    const API_KEY = decrypt(asaasSettings.api_key_encrypted);
    const BASE_URL = asaasSettings.base_url;

    try {
        const res = await fetch(`${BASE_URL}/installments/${batch.asaas_installment_id}/paymentBook`, {
            headers: { 'access_token': API_KEY }
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.errors?.[0]?.description || "Erro ao gerar carnê no Asaas");
        }

        // The response is a PDF. Covert to array buffer, then upload.
        const arrayBuffer = await res.arrayBuffer();

        const fileName = `carnet-${batch.asaas_installment_id}-${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from("credit-request-attachments") // Re-using existing bucket
            .upload(fileName, arrayBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error("Erro ao salvar PDF do carnê. " + uploadError.message);
        }

        const { data: signedUrlData, error: signError } = await supabase.storage
            .from("credit-request-attachments")
            .createSignedUrl(fileName, 7200); // 2 hours

        if (signError) throw new Error("Erro ao gerar link assinado para o carnê.");

        const pdfUrl = signedUrlData.signedUrl;

        // Update DB with the URL
        await supabase.from("payment_batches").update({ asaas_payment_book_url: pdfUrl }).eq("id", batchId);

        return { success: true, pdfUrl };
    } catch (e: any) {
        console.error("Error generating carnet:", e);
        return { success: false, error: e.message };
    }
}

export async function getPaymentInstallments(batchId: string) {
    await ensureAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("payment_installments")
        .select("*")
        .eq("batch_id", batchId)
        .order("installment_number", { ascending: true });

    if (error) {
        console.error("Error fetching installments:", error);
        return { success: false, error: error.message };
    }

    return { success: true, installments: data };
}

export async function updateInstallmentDueDate(installmentId: string, newDueDate: string) {
    await ensureAdmin();
    const supabase = createAdminClient();

    // 1. Get the installment and Asaas ID
    const { data: installment, error: fetchError } = await supabase
        .from("payment_installments")
        .select("asaas_payment_id")
        .eq("id", installmentId)
        .single();

    if (fetchError || !installment) {
        return { success: false, error: "Parcela não encontrada." };
    }

    // 2. Get API Key
    const { data: settings } = await supabase
        .from("payment_gateway_settings")
        .select("api_key_encrypted, base_url")
        .eq("provider", "asaas")
        .single();

    if (!settings || !settings.api_key_encrypted) {
        return { success: false, error: "Gateway não configurado." };
    }

    try {
        // 3. Update Asaas
        const res = await fetch(`${settings.base_url}/payments/${installment.asaas_payment_id}`, {
            method: 'POST', // Asaas uses POST to payments/id to update
            headers: {
                'Content-Type': 'application/json',
                'access_token': decrypt(settings.api_key_encrypted)
            },
            body: JSON.stringify({
                dueDate: newDueDate
            })
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Asaas update error:", data);
            return { success: false, error: data.errors?.[0]?.description || "Erro ao atualizar no Asaas." };
        }

        // 4. Update Database
        await supabase
            .from("payment_installments")
            .update({ due_date: newDueDate })
            .eq("id", installmentId);

        revalidatePath("/dashboard/admin");
        revalidatePath("/dashboard/admin/todas");

        return { success: true };

    } catch (e: any) {
        console.error("Update due date error:", e);
        return { success: false, error: e.message || "Erro inesperado." };
    }
}

export async function getInstallmentPixQrCode(installmentId: string) {
    await ensureAdmin();
    const supabase = createAdminClient();

    const { data: installment, error: fetchError } = await supabase
        .from("payment_installments")
        .select("asaas_payment_id")
        .eq("id", installmentId)
        .single();

    if (fetchError || !installment) {
        return { success: false, error: "Parcela não encontrada." };
    }

    const { data: settings } = await supabase
        .from("payment_gateway_settings")
        .select("api_key_encrypted, base_url")
        .eq("provider", "asaas")
        .single();

    if (!settings || !settings.api_key_encrypted) {
        return { success: false, error: "Gateway não configurado." };
    }

    try {
        const res = await fetch(`${settings.base_url}/payments/${installment.asaas_payment_id}/pixQrCode`, {
            headers: {
                'access_token': decrypt(settings.api_key_encrypted)
            }
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Asaas PIX QR Code error:", data);
            return { success: false, error: data.errors?.[0]?.description || "Erro ao obter QR Code do Asaas." };
        }

        return { success: true, pix: data };

    } catch (e: any) {
        console.error("PIX QR Code error:", e);
        return { success: false, error: e.message || "Erro inesperado ao gerar PIX." };
    }
}

export async function markAsPaidToOrganizer(formData: FormData) {
    await ensureAdmin();
    const supabase = createAdminClient();
    const requestId = formData.get("requestId") as string;
    const file = formData.get("proof") as File;

    if (!requestId) return { success: false, error: "ID da requisição ausente." };
    if (!file || file.size === 0) return { success: false, error: "Arquivo de comprovante ausente." };

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `organizer-payment-${requestId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("credit-request-attachments")
            .upload(fileName, file);

        if (uploadError) {
            console.error("Erro ao fazer upload do comprovante:", uploadError);
            return { success: false, error: "Erro no upload do arquivo." };
        }

        const { data: signedUrlData, error: signError } = await supabase.storage
            .from("credit-request-attachments")
            .createSignedUrl(fileName, 7200); // 2 hours

        if (signError) {
            console.error("Erro ao gerar URL assinada:", signError);
            return { success: false, error: "Erro ao gerar link do comprovante." };
        }

        const { error: updateError } = await supabase
            .from("credit_requests")
            .update({
                organizer_payment_status: 'PAID',
                organizer_payment_date: new Date().toISOString(),
                organizer_payment_proof_url: signedUrlData.signedUrl
            })
            .eq("id", requestId);

        if (updateError) {
            console.error("Erro ao atualizar status de pagamento:", updateError);
            return { success: false, error: "Erro ao salvar informações de pagamento no banco." };
        }

        revalidatePath("/dashboard/admin");
        revalidatePath("/dashboard/admin/todas");
        revalidatePath("/dashboard/admin/financeiro");
        return { success: true };

    } catch (e: any) {
        console.error("Erro inesperado em markAsPaidToOrganizer:", e);
        return { success: false, error: e.message || "Erro inesperado." };
    }
}
