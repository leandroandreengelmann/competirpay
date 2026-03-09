import { RegisterStaffForm } from "./form";

export const metadata = {
    title: "Cadastrar Usuário | COMPETIR PAY",
};

export default function CadastrarUsuarioPage() {
    return (
        <div className="max-w-3xl mx-auto w-full space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Cadastrar Membro da Equipe</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Crie uma conta para um novo Administrador, Financeiro ou Analista de Crédito.
                </p>
            </div>

            <RegisterStaffForm />
        </div>
    );
}
