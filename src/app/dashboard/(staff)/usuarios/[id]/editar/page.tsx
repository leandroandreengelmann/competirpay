import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditStaffForm } from "./form";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
    title: "Editar Usuário | COMPETIR PAY",
};

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");
    if (user.user_metadata?.role !== "admin") redirect("/dashboard/admin");

    const supabaseAdmin = createAdminClient();

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
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Editar Membro da Equipe</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Atualize as informações e o perfil de acesso deste membro.
                </p>
            </div>

            <EditStaffForm user={adminUser.user} />
        </div>
    );
}
