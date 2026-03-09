"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { login } from "./actions";
import Link from "next/link";

export function LoginForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            try {
                const result = await login(formData);
                if (result?.error) {
                    setError(result.error);
                }
            } catch (e) {
                // Next.js redirect throws an error that we shouldn't catch
            }
        });
    };

    return (
        <div className="w-full">
            <div className="space-y-2 mb-8 text-center sm:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
                    Acessar Conta
                </h2>
                <p className="text-zinc-500 text-sm">
                    Insira seus dados para entrar no painel.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                        E-mail
                    </Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@exemplo.com"
                        required
                        disabled={isPending}
                        className="bg-white border-zinc-200"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
                            Senha
                        </Label>
                        <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                            Esqueceu a senha?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            disabled={isPending}
                            placeholder="••••••••"
                            className="bg-white border-zinc-200 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
                        disabled={isPending}
                    >
                        {isPending ? "Entrando..." : "Entrar"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
