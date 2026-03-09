

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { PaymentFormData, paymentSchema } from "../schema";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CreditCard, User, MapPin } from "lucide-react";

interface PaymentFormProps {
    onSubmit: (data: PaymentFormData) => Promise<void>;
    isLoading: boolean;
    defaultValues?: Partial<PaymentFormData>;
}

export function PaymentForm({ onSubmit, isLoading, defaultValues }: PaymentFormProps) {
    const form = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            holderName: defaultValues?.holderName || "",
            number: defaultValues?.number || "",
            expiryMonth: defaultValues?.expiryMonth || "",
            expiryYear: defaultValues?.expiryYear || "",
            ccv: defaultValues?.ccv || "",
            name: defaultValues?.name || "",
            cpfCnpj: defaultValues?.cpfCnpj || "",
            email: defaultValues?.email || "",
            phone: defaultValues?.phone || "",
            postalCode: defaultValues?.postalCode || "",
            addressNumber: defaultValues?.addressNumber || "",
            address: defaultValues?.address || "",
            city: defaultValues?.city || "",
            state: defaultValues?.state || "",
            complement: defaultValues?.complement || "",
            province: defaultValues?.province || "",
        },
    });

    const handleSubmit = async (data: PaymentFormData) => {
        await onSubmit(data);
    };

    return (
        <Card className="shadow-lg border-none ring-1 ring-border/50">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Dados do Cartão
                </CardTitle>
                <CardDescription>
                    Preencha os dados impressos no cartão de crédito.
                </CardDescription>
            </CardHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <CardContent className="pt-6 space-y-4">
                        {/* Card Details Block */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="number"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Número do Cartão</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0000 0000 0000 0000" disabled={isLoading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="holderName"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Nome Impresso no Cartão</FormLabel>
                                        <FormControl>
                                            <Input placeholder="NOME DO TITULAR" disabled={isLoading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="expiryMonth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mês</FormLabel>
                                            <FormControl>
                                                <Input placeholder="MM" maxLength={2} disabled={isLoading} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expiryYear"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ano</FormLabel>
                                            <FormControl>
                                                <Input placeholder="AAAA" maxLength={4} disabled={isLoading} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ccv"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CVV</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123" maxLength={4} disabled={isLoading} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-border/50" />

                        {/* Holder Details Block */}
                        <div className="flex items-center gap-2 mb-2 font-semibold text-lg">
                            <User className="w-5 h-5 text-muted-foreground" />
                            <h3 className="tracking-tight text-foreground">Titular do Cartão</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Nome Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome Completo do Titular" disabled={isLoading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cpfCnpj"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPF / CNPJ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="000.000.000-00" disabled={isLoading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Celular</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(00) 00000-0000" disabled={isLoading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input placeholder="seu@email.com" type="email" disabled={isLoading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <hr className="my-6 border-border/50" />

                        {/* Address Block */}
                        <div className="flex items-center gap-2 mb-2 font-semibold text-lg">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                            <h3 className="tracking-tight text-foreground">Endereço de Cobrança</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CEP</FormLabel>
                                        <FormControl>
                                            <Input placeholder="00000-000" disabled={isLoading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="addressNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123" disabled={isLoading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Optional Fields minimal for now to not clutter unless requested. 
                  Users can expand or just leave optional as the backend handles address resolution if required */}
                            <span className="text-xs text-muted-foreground sm:col-span-2">
                                Outros dados como rua e bairro podem ser preenchidos se desejar, mas CEP e Número são obrigatórios.
                            </span>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full text-lg font-bold py-6" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    "Pagar com cartão"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Form>
        </Card>
    );
}
