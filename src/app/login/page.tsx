import { LoginForm } from "@/app/login/form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex bg-white text-zinc-950 selection:bg-primary/20 selection:text-primary">
            {/* Left Side: Login Form (35% to 40% width on desktop) */}
            <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative z-10 border-r border-zinc-100 bg-white shadow-2xl">

                {/* Header / Back */}
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-400 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Voltar
                    </Link>
                </div>

                {/* Main Form Area */}
                <div className="w-full max-w-sm mx-auto mt-12 mb-auto">
                    <LoginForm />
                </div>

                {/* Footer */}
                <div className="text-xs font-medium text-zinc-400 tracking-wide mt-12">
                    &copy; {new Date().getFullYear()} COMPETIR. Todos os direitos reservados.
                </div>
            </div>

            {/* Right Side: Visual / Typographic Narrative (60% to 65% width) */}
            <div className="hidden lg:flex flex-1 relative bg-primary overflow-hidden items-end p-16">
                {/* Noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
                />

                {/* Decorative Geometric Shapes */}
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-br from-black/30 to-transparent opacity-50 transform skew-x-12 translate-x-32" />

                {/* Typography Block */}
                <div className="relative z-10 w-full mb-12 ml-4">
                    <h1 className="text-[clamp(4rem,7vw,10rem)] font-black leading-[0.9] text-white tracking-tighter">
                        competir<span className="text-white/60 text-[0.8em]">.pay</span>
                    </h1>

                    <div className="mt-8 max-w-lg">
                        <p className="text-2xl text-white/80 font-medium leading-relaxed">
                            Aonde você compete <br />
                            <span className="text-white font-bold">sem se preocupar.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
