import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
    try {
        const signature = request.headers.get("asaas-access-token");
        const payload = await request.json();

        const supabase = createAdminClient();

        // 1. Verify token (Mandatory)
        const { data: settings } = await supabase
            .from("payment_gateway_settings")
            .select("webhook_secret")
            .eq("provider", "asaas")
            .single();

        if (!settings?.webhook_secret || signature !== settings.webhook_secret) {
            console.warn("Asaas webhook rejected: Invalid or missing token.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Process Event
        const eventType = payload.event;
        const payment = payload.payment;

        // Diagnostic Logging for Vercel
        console.log(`Asaas Webhook: Received event ${eventType} for payment ${payment?.id || 'none'}`);

        // Handle Asaas "Ping" or validation - if it's a test or doesn't have payment data yet
        if (!payment || !payment.id) {
            console.log("Asaas Webhook: Identification ping or empty payload received. Returning 200.");
            return NextResponse.json({ success: true, message: "Ping received" });
        }

        // 3. Update dashboard last webhook status
        await supabase
            .from("payment_gateway_settings")
            .update({
                last_webhook_received_at: new Date().toISOString(),
                last_webhook_event: eventType,
            })
            .eq("provider", "asaas");

        // 4. Update Installment
        const statusMap: Record<string, string> = {
            "PAYMENT_CREATED": "PENDING",
            "PAYMENT_CONFIRMED": "RECEIVED",
            "PAYMENT_RECEIVED": "RECEIVED",
            "PAYMENT_OVERDUE": "OVERDUE",
            "PAYMENT_DELETED": "DELETED",
            "PAYMENT_RESTORED": "PENDING",
            "PAYMENT_REFUNDED": "REFUNDED",
            "PAYMENT_REFUND_IN_PROGRESS": "REFUND_REQUESTED",
            "PAYMENT_RECEIVED_IN_CASH_UNDONE": "PENDING",
            "PAYMENT_CHARGEBACK_REQUESTED": "CHARGEBACK_REQUESTED",
            "PAYMENT_CHARGEBACK_DISPUTE": "CHARGEBACK_DISPUTE",
            "PAYMENT_AWAITING_CHARGEBACK_REVERSAL": "AWAITING_CHARGEBACK_REVERSAL",
            "PAYMENT_DUNNING_RECEIVED": "DUNNING_RECEIVED",
            "PAYMENT_DUNNING_REQUESTED": "DUNNING_REQUESTED",
            "PAYMENT_BANK_SLIP_VIEWED": "PENDING",
            "PAYMENT_CHECKOUT_VIEWED": "PENDING"
        };

        const localStatus = statusMap[eventType] || payment.status || "PENDING";

        const updateData: any = {
            status: localStatus,
        };

        if (payment.paymentDate || payment.clientPaymentDate) {
            updateData.payment_date = new Date(payment.paymentDate || payment.clientPaymentDate).toISOString();
        }

        const { error } = await supabase
            .from("payment_installments")
            .update(updateData)
            .eq("asaas_payment_id", payment.id);

        if (error) {
            console.error("Webhook Dabase update error:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ success: true, received: true });

    } catch (e: any) {
        console.error("Webhook processing error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
