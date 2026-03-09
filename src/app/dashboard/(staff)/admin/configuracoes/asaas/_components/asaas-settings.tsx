"use client";

import { useState, useTransition, useEffect } from "react";
import { saveAsaasSettings, testAsaasConnection, registerAsaasWebhook, AsaasSettings } from "../actions";
import {
    Building2,
    Key,
    CheckCircle2,
    XOctagon,
    RefreshCw,
    Globe,
    ShieldAlert,
    ServerCog,
    Eye,
    EyeOff,
    AlertTriangle,
    Play,
    AlertCircle
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function AsaasSettingsClient({ initialData }: { initialData: any }) {
    const data: AsaasSettings = initialData;
    const [isPending, startTransition] = useTransition();

    const [environment, setEnvironment] = useState<"sandbox" | "production">(data.environment);
    const [apiKey, setApiKey] = useState(data.api_key_encrypted || "");
    const [accountLabel, setAccountLabel] = useState(data.account_label || "");
    const [webhookSecret, setWebhookSecret] = useState(data.webhook_secret || "");
    const [showApiKey, setShowApiKey] = useState(false);

    const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error', message: string }>({
        status: data.last_connection_test_status === 'success' ? 'success' : data.last_connection_test_status === 'error' ? 'error' : 'idle',
        message: data.last_connection_test_message || ""
    });

    const [webhookStatus, setWebhookStatus] = useState(data.webhook_status || "Não registrado");

    // Auto-generate webhook URL for preview, assuming current origin is what we want
    // In production, you might want this to be driven from env vars for the actual public domain
    const [webhookUrlPreview, setWebhookUrlPreview] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setWebhookUrlPreview(`${window.location.origin}/api/webhooks/asaas`);
        }
    }, []);

    const isConnected = testResult.status === 'success' && !!data.api_key_encrypted;

    const handleSave = (testAfterSave: boolean = false) => {
        if (environment === 'production' && data.environment !== 'production') {
            if (!confirm("Aviso: Mudar para o ambiente de Produção ativará transações reais. Tem certeza?")) {
                setEnvironment(data.environment);
                return;
            }
        }

        const formData = new FormData();
        formData.append("environment", environment);
        formData.append("api_key", apiKey);
        formData.append("account_label", accountLabel);

        formData.append("webhook_secret", webhookSecret);

        startTransition(async () => {
            const result = await saveAsaasSettings(formData);
            if (result.success) {
                if (testAfterSave) {
                    const test = await testAsaasConnection();
                    setTestResult({
                        status: test.success ? 'success' : 'error',
                        message: test.success ? (test.message || 'Sucesso') : test.error
                    });
                } else {
                    alert("Configurações salvas com sucesso!");
                }
            } else {
                alert("Erro ao salvar: " + result.error);
            }
        });
    };

    const handleTestConnection = () => {
        startTransition(async () => {
            setTestResult({ status: 'idle', message: 'Testando...' });
            const test = await testAsaasConnection();
            setTestResult({
                status: test.success ? 'success' : 'error',
                message: test.success ? (test.message || 'Sucesso') : test.error
            });
        });
    };

    const handleRegisterWebhook = () => {
        if (!webhookUrlPreview) return;
        startTransition(async () => {
            const res = await registerAsaasWebhook(webhookUrlPreview);
            if (res.success) {
                setWebhookStatus("Registrado");
                alert("Webhook registrado no Asaas com sucesso!");
            } else {
                setWebhookStatus("Erro ao registrar");
                alert("Erro ao registrar Webhook: " + res.error);
            }
        });
    };

    const getGeneralStatus = () => {
        if (!apiKey) return { label: "Não configurado", color: "bg-gray-100 text-gray-700 hover:bg-gray-200" };
        if (testResult.status === 'error') return { label: "Erro na conexão", color: "bg-red-100 text-red-800 hover:bg-red-200" };
        if (testResult.status === 'success') {
            return environment === 'production'
                ? { label: "Conectado em Produção", color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" }
                : { label: "Conectado em Sandbox", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" };
        }
        return { label: "Configuração incompleta", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" };
    };

    const statusBadge = getGeneralStatus();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Integração Asaas</h1>
                    <p className="text-gray-500 mt-1">Configure a conexão com o Asaas para cobranças via cartão de crédito e boleto.</p>
                </div>
                <Badge variant="outline" className={`${statusBadge.color} border-transparent text-sm py-1.5 px-3`}>
                    {statusBadge.label}
                </Badge>
            </div>

            {environment === 'sandbox' ? (
                <Alert className="bg-blue-50/50 border-blue-200 text-blue-800">
                    <ShieldAlert className="size-4 text-blue-600" />
                    <AlertTitle>Modo de Testes</AlertTitle>
                    <AlertDescription>Você está no ambiente Sandbox. Nenhuma cobrança real será processada.</AlertDescription>
                </Alert>
            ) : (
                <Alert className="bg-red-50/50 border-red-200 text-red-800">
                    <AlertTriangle className="size-4 text-red-600" />
                    <AlertTitle>Modo Real (Produção)</AlertTitle>
                    <AlertDescription>Atenção: Você está em ambiente real. Generar faturas terá efeito financeiro e cobrança real.</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                <div className="lg:col-span-8 space-y-6">
                    {/* Ambiente */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="size-5 text-gray-500" />
                                Ambiente de Operação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Ambiente</Label>
                                <Select value={environment} onValueChange={(v) => {
                                    setEnvironment(v as "sandbox" | "production");
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o ambiente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                                        <SelectItem value="production">Produção (Sistema Real)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Base URL da API</Label>
                                <Input disabled readOnly value={environment === 'production' ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3"} className="bg-gray-50 text-gray-500" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Credenciais */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Key className="size-5 text-gray-500" />
                                Credenciais da API
                            </CardTitle>
                            <CardDescription>
                                Obtenha sua API Key no painel do Asaas nas configurações da conta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Chave de Acesso (API Key) <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Input
                                        type={showApiKey ? "text" : "password"}
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                        placeholder="sk_..."
                                        className="pr-10 font-mono"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 text-gray-500"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                        {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Identificação da Conta (Opcional)</Label>
                                    <Input
                                        value={accountLabel}
                                        onChange={e => setAccountLabel(e.target.value)}
                                        placeholder="Ex: Conta Principal Competir"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Webhook Secret (Uso Interno)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="password"
                                            value={webhookSecret}
                                            onChange={e => setWebhookSecret(e.target.value)}
                                            placeholder="Token de segurança do webhook"
                                            className="bg-gray-50 font-mono text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setWebhookSecret(crypto.randomUUID().replace(/-/g, ''))}
                                            title="Gerar Token Aleatório"
                                        >
                                            <RefreshCw className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Webhook */}
                    <Card className={!isConnected ? "opacity-50 pointer-events-none" : ""}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="size-5 text-gray-500" />
                                    Webhook de Retorno
                                </div>
                                <Badge variant="outline" className={
                                    webhookStatus === "Registrado" ? "bg-emerald-50 text-emerald-700" :
                                        webhookStatus === "Erro ao registrar" ? "bg-red-50 text-red-700" :
                                            "bg-gray-100 text-gray-700"
                                }>
                                    {webhookStatus}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                O Webhook notifica seu sistema automaticamente quando um cliente paga uma cobrança.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {!isConnected && (
                                <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                    <AlertTriangle className="size-4" />
                                    <AlertDescription>
                                        Salve a API Key e teste a conexão antes de configurar o Webhook.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label>Endpoint URL (Seu domínio)</Label>
                                <Input disabled readOnly value={webhookUrlPreview || "Carregando..."} className="bg-gray-50 text-gray-500 font-mono text-sm" />
                                <p className="text-xs text-gray-500 mt-1">Essa URL será enviada para o Asaas automaticamente.</p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-sm font-semibold">Eventos Monitorados (Padrão)</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 border border-gray-100 rounded-md">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="c1" checked disabled />
                                        <Label htmlFor="c1" className="text-sm cursor-not-allowed font-medium text-gray-600">Pagamentos criados</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="c2" checked disabled />
                                        <Label htmlFor="c2" className="text-sm cursor-not-allowed font-medium text-gray-600">Pagamentos recebidos/conf.</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="c3" checked disabled />
                                        <Label htmlFor="c3" className="text-sm cursor-not-allowed font-medium text-gray-600">Pagamentos vencidos</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="c4" checked disabled />
                                        <Label htmlFor="c4" className="text-sm cursor-not-allowed font-medium text-gray-600">Falhas e Estornos</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Webhook events tracking from DB could go here */}
                            {data.last_webhook_received_at && (
                                <div className="text-xs text-gray-500 mt-4 bg-gray-50 py-2 border-t border-gray-100">
                                    Último evento processado: {new Date(data.last_webhook_received_at).toLocaleString('pt-BR')} ({data.last_webhook_event})
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-gray-50/50 border-t justify-end gap-3 rounded-b-lg">
                            <Button variant="outline" type="button" onClick={handleRegisterWebhook} disabled={isPending || !isConnected}>
                                <RefreshCw className={`size-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
                                Registrar Webhook no Asaas
                            </Button>
                        </CardFooter>
                    </Card>

                </div>


                {/* Sidebar Cards */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Connection Test */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-md flex items-center gap-2">
                                <ServerCog className="size-4 text-gray-500" />
                                Teste de Conexão
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            <div className="p-4 rounded-md border text-sm flex items-start gap-3 bg-white">
                                {testResult.status === 'success' ? (
                                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                ) : testResult.status === 'error' ? (
                                    <XOctagon className="size-5 text-red-500 shrink-0" />
                                ) : (
                                    <AlertCircle className="size-5 text-gray-400 shrink-0" />
                                )}

                                <div className="space-y-1">
                                    <p className={`font-medium ${testResult.status === 'success' ? 'text-emerald-700' :
                                        testResult.status === 'error' ? 'text-red-700' : 'text-gray-700'
                                        }`}>
                                        {testResult.status === 'success' ? "Conexão Estabelecida" :
                                            testResult.status === 'error' ? "Falha na Conexão" : "Aguardando Teste"}
                                    </p>
                                    {testResult.message && (
                                        <p className="text-gray-600 text-xs">{testResult.message}</p>
                                    )}
                                    {data.last_connection_test_at && (
                                        <p className="text-gray-400 text-xs mt-1 block">
                                            Último teste: {new Date(data.last_connection_test_at).toLocaleString('pt-BR')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                className="w-full"
                                onClick={handleTestConnection}
                                disabled={isPending || !apiKey}
                            >
                                <Play className="size-4 mr-2" />
                                Testar Acesso
                            </Button>

                            <p className="text-xs text-gray-500 text-center">
                                * Uma conexão válida é necessária para emitir cobranças.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Enabled Features */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-md">Recursos do Gateway</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                                <span className="font-medium text-gray-700">Conexão API</span>
                                {isConnected ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ativo</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500 bg-gray-50">Inativo</Badge>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                                <span className="font-medium text-gray-700">Webhook (Retorno)</span>
                                {webhookStatus === "Registrado" ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ativo</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100">Pendente</Badge>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                                <span className="font-medium text-gray-700">Cartão de Crédito</span>
                                {isConnected ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Pronto</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500 bg-gray-50">Bloqueado</Badge>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                                <span className="font-medium text-gray-700">Boleto e PIX</span>
                                {isConnected ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Pronto</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500 bg-gray-50">Bloqueado</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 mt-8 -mx-6 shadow-sm flex items-center justify-end gap-3">
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => window.location.reload()}
                    disabled={isPending}
                >
                    Cancelar Alterações
                </Button>
                <Button
                    variant="secondary"
                    type="button"
                    onClick={() => handleSave(false)}
                    disabled={isPending || !apiKey}
                >
                    Salvar Somente
                </Button>
                <Button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={isPending || !apiKey}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {isPending ? (
                        <RefreshCw className="size-4 mr-2 animate-spin" />
                    ) : (
                        <CheckCircle2 className="size-4 mr-2" />
                    )}
                    Salvar e Testar
                </Button>
            </div>
        </div>
    );
}
