
// Script de Teste de Segurança:Simulação de Webhook Asaas
// Objetivo: Testar se o sistema aceita um payload de pagamento aprovado usando o token padrão.

async function testWebhookBypass() {
    const WEBHOOK_URL = "http://localhost:3000/api/webhooks/asaas"; // URL local para teste
    const DEFAULT_TOKEN = "default_competir_pay_secret_token";

    const payload = {
        event: "PAYMENT_RECEIVED",
        payment: {
            id: "pay_test_exploited_123",
            status: "RECEIVED",
            value: 500.00,
            netValue: 485.00,
            billingType: "CREDIT_CARD",
            paymentDate: new Date().toISOString()
        }
    };

    console.log("--- Iniciando Teste de Bypass de Webhook ---");
    console.log(`Alvo: ${WEBHOOK_URL}`);
    console.log(`Token Tentado: ${DEFAULT_TOKEN}`);

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "asaas-access-token": DEFAULT_TOKEN
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log(`Status da Resposta: ${response.status}`);
        console.log("Resposta do Servidor:", data);

        if (response.status === 200) {
            console.error("VULNERABILIDADE DETECTADA: O servidor aceitou o token padrão!");
        } else if (response.status === 401) {
            console.log("SUCESSO (Segurança): O servidor rejeitou o token padrão.");
        } else {
            console.log(`Resultado Inconclusivo (Status ${response.status}). Verifique os logs do servidor.`);
        }
    } catch (error) {
        console.error("Erro ao executar teste:", error.message);
    }
}

testWebhookBypass();
