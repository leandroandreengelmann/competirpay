import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditClientForm } from "./form";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
    title: "Editar Cliente | COMPETIR PAY",
};

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");
    if (user.user_metadata?.role !== "admin") redirect("/dashboard/admin");

    const supabaseAdmin = createAdminClient();

    // Obter user completo do admin api para ter acesso ao raw_user_meta_data completo
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.getUserById(id);

    if (adminError || !adminUser.user) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-4">
                Erro ao carregar usuário ou usuário não encontrado.
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto w-full space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Editar Cliente</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Atualize as informações cadastrais e endereço deste cliente.
                </p>
            </div>

            <EditClientForm user={adminUser.user} />
        </div>
    );
}
