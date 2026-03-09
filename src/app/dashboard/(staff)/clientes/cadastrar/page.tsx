import { RegisterClientForm } from "./form";

export const metadata = {
    title: "Cadastrar Cliente | COMPETIR PAY",
};

export default function CadastrarClientePage() {
    return (
        <div className="max-w-3xl mx-auto w-full space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Cadastrar Novo Cliente</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Crie uma conta para um novo atleta ou responsável.
                </p>
            </div>

            <RegisterClientForm />
        </div>
    );
}
