import { getAsaasSettings } from "./actions";
import AsaasSettingsClient from "./_components/asaas-settings";
import { AlertCircle } from "lucide-react";

export const metadata = {
    title: "Integração Asaas | Competir Pay",
    description: "Configurações da integração com o Asaas",
};

export default async function AsaasSettingsPage() {
    // Fetch current settings
    const { success, data, error } = await getAsaasSettings();

    if (!success) {
        return (
            <div className="p-6">
                <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start gap-3 border border-red-200">
                    <AlertCircle className="size-5 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-800">Erro ao carregar configurações</h3>
                        <p className="text-sm mt-1">{error || "Houve um problema ao se comunicar com o banco de dados."}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <AsaasSettingsClient initialData={data} />
        </div>
    );
}
