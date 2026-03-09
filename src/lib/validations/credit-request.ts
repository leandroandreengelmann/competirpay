import * as z from "zod";

export const creditRequestSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    cpf: z.string().min(11, "CPF inválido").regex(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$|^\d{11}$/, "Formato de CPF inválido"),
    phone: z.string().min(10, "Telefone inválido").regex(/^\(?\d{2}\)?\s?\d{4,5}\-?\d{4}$/, "Formato de telefone inválido"),
    championshipId: z.string().min(1, "Selecione um campeonato"),
    amount: z.number().min(10, "O valor mínimo é R$ 10,00"),
    paymentMethod: z.enum(["credit_card", "boleto"]),
    installments: z.number().min(1).optional(),
});

export type CreditRequestValues = z.infer<typeof creditRequestSchema>;
