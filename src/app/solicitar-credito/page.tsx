import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAvailableChampionships } from "./actions";
import { CreditRequestForm } from "./components/credit-request-form";

export const metadata = {
    title: "Solicitação de Crédito - COMPETIR",
    description: "Formulário para solicitar crédito de campeonatos na plataforma COMPETIR.",
};

export default async function SolicitarCreditoPage() {
    const championships = await getAvailableChampionships();

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            {/* Left Col: Brand Primary Narrative */}
            <div className="w-full md:w-[40%] flex flex-col justify-center p-8 sm:p-12 lg:p-16 relative bg-primary overflow-hidden shadow-2xl z-10">
                {/* Noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
                />

                {/* Decorative Geometric Shapes */}
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-br from-black/30 to-transparent opacity-50 transform skew-x-12 translate-x-32" />

                {/* Back Button */}
                <Link
                    href="/"
                    className="absolute top-8 left-8 sm:top-12 sm:left-12 flex items-center gap-2 text-white/70 hover:text-white transition-colors group z-20"
                >
                    <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold uppercase tracking-widest text-xs">Voltar</span>
                </Link>

                {/* Typography Block */}
                <div className="relative z-10 w-full mb-12">
                    <h1 className="text-[clamp(2.5rem,3.8vw,5.5rem)] font-black leading-[0.9] text-white tracking-tighter break-words">
                        simule o valor<br />
                        <span className="text-white/60 text-[0.8em]">da inscrição</span>
                    </h1>

                    <div className="mt-8 max-w-lg">
                        <p className="text-xl md:text-2xl text-white/80 font-medium leading-relaxed">
                            <span className="text-white font-bold">Como funciona?</span><br />
                            Você informa o valor que precisa e nós facilitamos o parcelamento.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Col: Clean Form */}
            <div className="w-full md:w-[60%] flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                <div className="w-full max-w-lg relative z-10">
                    <CreditRequestForm championships={championships} />
                </div>
            </div>
        </div>
    );
}
