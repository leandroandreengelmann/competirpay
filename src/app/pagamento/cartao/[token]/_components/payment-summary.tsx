import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface PaymentSummaryProps {
    name: string;
    championshipName: string;
    totalAmount: number;
    installments: number;
    paymentMethod: string;
}

export function PaymentSummary({
    name,
    championshipName,
    totalAmount,
    installments,
    paymentMethod,
}: PaymentSummaryProps) {
    const formattedAmount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(totalAmount);

    const installmentValue = installments > 0 ? (totalAmount / installments) : totalAmount;

    const formattedInstallment = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(installmentValue);

    return (
        <Card className="shadow-lg mb-6 border-none ring-1 ring-border/50">
            <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl">Resumo do Pagamento</CardTitle>
                <CardDescription>
                    Confira os detalhes da sua solicitação antes de pagar.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Cliente</span>
                        <span className="font-medium text-right">{name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Campeonato</span>
                        <span className="font-medium text-right">{championshipName}</span>
                    </div>
                    <div className="flex justify-between items-start py-2">
                        <span className="text-muted-foreground text-sm mt-1">Plano</span>
                        <div className="text-right">
                            <p className="font-bold text-xl text-primary leading-tight">
                                {installments > 1 ? `${installments}x de ${formattedInstallment}` : "À vista"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {paymentMethod === "credit_card" ? "Cartão de Crédito" : "Boleto"}
                            </p>
                        </div>
                    </div>
                    <hr className="my-2 border-border/50" />
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Total a Pagar</span>
                        <div className="text-right">
                            <span className="font-medium text-sm text-foreground">{formattedAmount}</span>
                            {installments > 1 && (
                                <p className="text-xs text-muted-foreground/90 font-medium">
                                    Total com parcelamento
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
