import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

const ColorSwatch = ({ name, hex, className }: { name: string; hex: string; className: string }) => (
    <div className="flex flex-col gap-1">
        <div className={`h-12 w-full rounded-md border border-gray-200 dark:border-gray-800 ${className}`} />
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{name}</span>
        <span className="text-[10px] text-gray-400 font-mono">{hex}</span>
    </div>
);

export default function ExamplePage() {
    return (
        <div className="min-h-screen bg-background p-8 md:p-16">
            <div className="mx-auto max-w-5xl space-y-16">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Paleta oficial — COMPETIR PAY</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Guia de estilos e cores oficiais para o sistema COMPETIR PAY.
                    </p>
                </div>

                {/* Brand Colors */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-foreground border-b border-gray-200 dark:border-gray-800 pb-2">Marca (Brand) — Fúcsia</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4">
                        <ColorSwatch name="25" hex="#FEFAFF" className="bg-brand-25" />
                        <ColorSwatch name="50" hex="#FDF4FF" className="bg-brand-50" />
                        <ColorSwatch name="100" hex="#FBE8FF" className="bg-brand-100" />
                        <ColorSwatch name="200" hex="#F6D0FE" className="bg-brand-200" />
                        <ColorSwatch name="300" hex="#EEAAFD" className="bg-brand-300" />
                        <ColorSwatch name="400" hex="#E478FA" className="bg-brand-400" />
                        <ColorSwatch name="500" hex="#D444F1" className="bg-brand-500" />
                        <ColorSwatch name="600" hex="#BA24D5" className="bg-brand-600" />
                        <ColorSwatch name="700" hex="#9F1AB1" className="bg-brand-700" />
                        <ColorSwatch name="800" hex="#821890" className="bg-brand-800" />
                        <ColorSwatch name="900" hex="#6F1877" className="bg-brand-900" />
                        <ColorSwatch name="950" hex="#47104C" className="bg-brand-950" />
                    </div>
                </section>

                {/* Gray Scale */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-foreground border-b border-gray-200 dark:border-gray-800 pb-2">Cinzas (Grays)</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4">
                        <ColorSwatch name="25" hex="Var" className="bg-gray-25" />
                        <ColorSwatch name="50" hex="Var" className="bg-gray-50" />
                        <ColorSwatch name="100" hex="Var" className="bg-gray-100" />
                        <ColorSwatch name="200" hex="Var" className="bg-gray-200" />
                        <ColorSwatch name="300" hex="Var" className="bg-gray-300" />
                        <ColorSwatch name="400" hex="Var" className="bg-gray-400" />
                        <ColorSwatch name="500" hex="Var" className="bg-gray-500" />
                        <ColorSwatch name="600" hex="Var" className="bg-gray-600" />
                        <ColorSwatch name="700" hex="Var" className="bg-gray-700" />
                        <ColorSwatch name="800" hex="Var" className="bg-gray-800" />
                        <ColorSwatch name="900" hex="Var" className="bg-gray-900" />
                        <ColorSwatch name="950" hex="Var" className="bg-gray-950" />
                    </div>
                </section>

                {/* Semantic States */}
                <div className="grid md:grid-cols-3 gap-12">
                    {/* Success */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-medium text-success-700 flex items-center gap-2">
                            <CheckCircle size={20} /> Sucesso
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="h-10 rounded bg-success-50" />
                            <div className="h-10 rounded bg-success-200" />
                            <div className="h-10 rounded bg-success-500" />
                            <div className="h-10 rounded bg-success-800" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Usado para estados positivos e confirmações.</p>
                    </section>

                    {/* Warning */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-medium text-warning-700 flex items-center gap-2">
                            <AlertTriangle size={20} /> Aviso
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="h-10 rounded bg-warning-50" />
                            <div className="h-10 rounded bg-warning-200" />
                            <div className="h-10 rounded bg-warning-500" />
                            <div className="h-10 rounded bg-warning-800" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Usado para alertas e atenção necessária.</p>
                    </section>

                    {/* Error */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-medium text-error-700 flex items-center gap-2">
                            <XCircle size={20} /> Erro
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="h-10 rounded bg-error-50" />
                            <div className="h-10 rounded bg-error-200" />
                            <div className="h-10 rounded bg-error-500" />
                            <div className="h-10 rounded bg-error-800" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Usado para estados críticos e falhas.</p>
                    </section>
                </div>

                {/* Typography & Components */}
                <section className="space-y-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <h2 className="text-2xl font-semibold text-foreground">Tipografia & Componentes</h2>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-400 italic">Texto Gray 900 / dark Gray 50</p>
                                <h4 className="text-3xl font-bold text-foreground underline decoration-brand-500 underline-offset-4">Título Principal</h4>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-400 italic">Texto Gray 700 / dark Gray 300</p>
                                <p className="text-lg text-gray-700 dark:text-gray-300">
                                    Este é um exemplo de texto secundário usado em descrições e parágrafos de destaque.
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-400 italic">Texto Gray 600 / dark Gray 500</p>
                                <p className="text-sm text-gray-600 dark:text-gray-500">
                                    Texto "muted" usado para ajuda, placeholders e letras miúdas.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-4">
                                <Button variant="default" className="bg-primary hover:bg-primary-hover active:bg-primary-active">
                                    Primário Oficial
                                </Button>
                                <Button variant="outline" className="border-primary text-primary hover:bg-brand-50 dark:hover:bg-brand-950/20">
                                    Contorno Marca
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <Button className="bg-success-600 hover:bg-success-700 text-white">Botão Sucesso</Button>
                                <Button className="bg-error-600 hover:bg-error-700 text-white">Botão Erro</Button>
                            </div>

                            <div className="p-4 rounded-lg bg-brand-50 dark:bg-brand-950/10 border border-brand-200 dark:border-brand-900/30 flex gap-3 text-brand-900 dark:text-brand-300">
                                <Info className="flex-shrink-0" />
                                <p className="text-sm">
                                    Este é um card de informação usando a paleta de cores da marca (Brand 50 e 200).
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
