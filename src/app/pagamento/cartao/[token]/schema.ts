import { z } from "zod";

export const paymentSchema = z.object({
    // Card
    holderName: z.string().min(3, "Nome no cartão é obrigatório"),
    number: z.string().min(13, "Número do cartão inválido").max(19, "Número do cartão inválido"),
    expiryMonth: z.string().length(2, "Mês com 2 dígitos"),
    expiryYear: z.string().length(4, "Ano com 4 dígitos"),
    ccv: z.string().min(3, "CVV inválido").max(4, "CVV inválido"),
    // Holder
    name: z.string().min(3, "Nome do titular é obrigatório"),
    cpfCnpj: z.string().refine((val) => val.replace(/\D/g, "").length === 11 || val.replace(/\D/g, "").length === 14, "CPF/CNPJ inválido"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    postalCode: z.string().min(8, "CEP inválido"),
    addressNumber: z.string().min(1, "Número é obrigatório"),
    // Optionals
    address: z.string().optional(),
    province: z.string().optional(),
    complement: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
