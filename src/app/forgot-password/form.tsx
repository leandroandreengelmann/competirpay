"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from "lucide-react";
import { sendOtp, verifyOtp, updatePassword } from "./actions";
import Link from "next/link";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useRouter } from "next/navigation";

export function ForgotPasswordForm() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSendCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const res = await sendOtp(email);
            if (res.error) setError(res.error);
            else setStep(2);
        });
    };

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const res = await verifyOtp(email, code);
            if (res.error) setError(res.error);
            else setStep(3);
        });
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const res = await updatePassword(password);
            if (res.error) setError(res.error);
            else {
                // Success! Redirect to login or auto-dashboard
                router.push("/login?reset=success");
            }
        });
    };

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1 text-center relative">
                <Link href="/login" className="absolute left-4 top-6 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                    <ArrowLeft size={20} />
                </Link>
                <CardTitle className="text-2xl font-bold tracking-tight text-brand-900 dark:text-brand-300">
                    {step === 1 && "Esqueci minha senha"}
                    {step === 2 && "Código de Segurança"}
                    {step === 3 && "Nova Senha"}
                </CardTitle>
                <CardDescription>
                    {step === 1 && "Digite seu e-mail para receber um código de recuperação."}
                    {step === 2 && `Enviamos um código de 6 dígitos para o e-mail ${email}.`}
                    {step === 3 && "Escolha uma nova senha forte para acessar sua conta."}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-error-700 bg-error-50 dark:bg-error-900/30 dark:text-error-400 rounded-md">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form id="step1" onSubmit={handleSendCode} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nome@exemplo.com"
                                    className="pl-9"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form id="step2" onSubmit={handleVerifyCode} className="space-y-6 flex flex-col items-center">
                        <div className="space-y-2 text-center">
                            <Label htmlFor="code" className="sr-only">Código OTP</Label>
                            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={isPending}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        <div className="text-xs text-center text-gray-500 cursor-pointer hover:underline" onClick={() => setStep(1)}>
                            E-mail errado? Voltar e corrigir.
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form id="step3" onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Criar Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    className="pl-9"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    </form>
                )}
            </CardContent>

            <CardFooter>
                {step === 1 && (
                    <Button form="step1" type="submit" className="w-full bg-primary hover:bg-primary-hover text-white" disabled={isPending || !email}>
                        {isPending ? "Enviando..." : "Enviar Código"}
                    </Button>
                )}
                {step === 2 && (
                    <Button form="step2" type="submit" className="w-full bg-primary hover:bg-primary-hover text-white" disabled={isPending || code.length !== 6}>
                        {isPending ? "Verificando..." : "Validar Código"}
                    </Button>
                )}
                {step === 3 && (
                    <Button form="step3" type="submit" className="w-full bg-success-600 hover:bg-success-700 text-white" disabled={isPending || password.length < 6}>
                        {isPending ? "Atualizando..." : "Salvar Nova Senha"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
