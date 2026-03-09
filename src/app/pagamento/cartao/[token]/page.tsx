import { getPaymentLinkData } from "./actions";
import { PaymentFlow } from "./_components/payment-flow";
import { notFound } from "next/navigation";
import { PaymentStatus } from "./_components/payment-status";

interface PageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function PublicPaymentPage({ params }: PageProps) {
    const { token } = await params;

    // 1. Fetch initial payment link data securely on the server
    const response = await getPaymentLinkData(token);

    if (!response.success || !response.data) {
        // Basic catch-all for missing or completely invalid tokens
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-red-600 bg-red-50">
                <h1 className="text-2xl font-bold mb-4">Erro ao carregar link</h1>
                <p>{response.error || "Link inválido ou não encontrado."}</p>
            </div>
        );
    }

    const data = response.data as any;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <PaymentFlow token={token} initialData={data} />
        </div>
    );
}
