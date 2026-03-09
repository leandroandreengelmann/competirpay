import { CheckCircle2, XCircle, AlertCircle, Clock, Loader2, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PaymentStatusProps {
    status: "PROCESSING" | "PENDING_CONFIRMATION" | "APPROVED" | "REFUSED" | "ERROR" | "EXPIRED" | "USED" | "CANCELLED";
}

export function PaymentStatus({ status }: PaymentStatusProps) {
    const statusConfig = {
        PROCESSING: {
            icon: <Loader2 className="h-10 w-10 text-primary animate-spin" />,
            title: "Processando Pagamento",
            description: "Por favor, aguarde enquanto processamos seu pagamento. Não feche esta tela.",
        },
        PENDING_CONFIRMATION: {
            icon: <Clock className="h-10 w-10 text-amber-500 animate-pulse" />,
            title: "Aguardando Confirmação",
            description: "Estamos confirmando o status do seu pagamento com o banco.",
        },
        APPROVED: {
            icon: <CheckCircle2 className="h-10 w-10 text-green-500" />,
            title: "Pagamento Aprovado",
            description: "Seu pagamento foi aprovado com sucesso! Você já pode fechar esta tela.",
        },
        REFUSED: {
            icon: <XCircle className="h-10 w-10 text-destructive" />,
            title: "Pagamento Recusado",
            description: "Não foi possível processar seu pagamento. Verifique com a emissora do cartão ou tente outro.",
        },
        ERROR: {
            icon: <AlertCircle className="h-10 w-10 text-destructive" />,
            title: "Erro no Processamento",
            description: "Ocorreu um erro interno ao processar o pagamento. Tente novamente mais tarde.",
        },
        EXPIRED: {
            icon: <Clock className="h-10 w-10 text-muted-foreground" />,
            title: "Link Expirado",
            description: "O prazo para pagamento deste link expirou. Por favor, solicite um novo link.",
        },
        USED: {
            icon: <CheckCircle2 className="h-10 w-10 text-green-500" />,
            title: "Cobrança Paga",
            description: "Esta cobrança já foi paga anteriormente.",
        },
        CANCELLED: {
            icon: <Ban className="h-10 w-10 text-muted-foreground" />,
            title: "Cobrança Cancelada",
            description: "Esta cobrança foi cancelada e não pode mais ser paga.",
        },
    };

    const currentConfig = statusConfig[status];

    return (
        <Card className="shadow-lg border-none ring-1 ring-border/50 text-center py-6">
            <CardHeader>
                <div className="flex justify-center mb-4">{currentConfig.icon}</div>
                <CardTitle className="text-2xl">{currentConfig.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                    {currentConfig.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {status === "PROCESSING" || status === "PENDING_CONFIRMATION" ? (
                    <div className="mt-4 flex flex-col items-center">
                        {/* Progress indicator or any additional info */}
                        <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                            <div className="h-full bg-primary w-1/2 animate-progress-indeterminate rounded-full" />
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
