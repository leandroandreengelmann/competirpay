# Relatório Consolidado de Segurança - competir.pay

Este documento reúne os resultados da análise profunda de segurança e o plano de remediação proposto.

---

## 🛡️ PARTE 1: Relatório de Descobertas (Security Findings)

**Data**: 2026-03-07
**Severidade Global Estimada**: 🔴 CRÍTICA

### 🚨 Descobertas Críticas

#### 1. Bypass Total de Autorização em Server Actions (A01:2025)
*   **Localização**: `src/app/dashboard/(staff)/admin/actions.ts`, `src/app/dashboard/(staff)/admin/configuracoes/asaas/actions.ts`.
*   **Descrição**: Funções administrativas usam `service_role` sem verificar a sessão ou role do usuário.
*   **Impacto**: Qualquer usuário pode alterar status de crédito, deletar notas ou mudar chaves de API do Asaas.
*   **Remediação**: Implementar `ensureAdmin()` em todas as Server Actions sensíveis.

#### 2. Validação Fraca de Webhook do Asaas (A07:2025)
*   **Localização**: `src/app/api/webhooks/asaas/route.ts`
*   **Descrição**: A rota aceita qualquer payload se o segredo não estiver configurado no banco.
*   **Impacto**: Falsificação de confirmações de pagamento.
*   **Remediação**: Tornar a verificação de token obrigatória (401 se falhar).

### ⚠️ Descobertas de Alta Severidade

#### 3. Exposição de Dados Sensíveis via getPublicUrl (A01:2025)
*   **Descrição**: Comprovantes e carnês estão em URLs públicas.
*   **Remediação**: Usar `createSignedUrl` com expiração curta.

#### 4. Armazenamento de Segredos em Texto Simples (A04:2025)
*   **Descrição**: As chaves de API do Asaas não estão criptografadas no banco.
*   **Remediação**: Implementar criptografia em repouso.

#### 5. Manipulação de Preço no Lado do Cliente (A06:2025)
*   **Descrição**: O valor final com juros é calculado no frontend e aceito pelo servidor sem validação.
*   **Remediação**: Recalcular e validar todos os valores financeiros no backend.

---

## 🛠️ PARTE 2: Plano de Remediação (Correção)

### 1. Sistema de Proteção de Server Actions
Criar `src/lib/auth-utils.ts` com helpers `ensureAdmin()` e `ensureAuthenticated()`. Integrar estes helpers no início de cada Server Action.

### 2. Blindagem do Webhook Asaas
Modificar a rota do webhook para exigir o token do Asaas e falhar explicitamente se não houver correspondência com o banco.

### 3. Integridade nos Cálculos Financeiros
Refatorar `createCreditRequest` para ignorar o `final_amount` vindo do formulário e realizar o cálculo das taxas diretamente no servidor usando as tabelas de crédito.

### 4. Proteção de Documentos
Substituir chamadas de `getPublicUrl` por URLs assinadas para garantir que apenas usuários logados acessem documentos financeiros.

---

## 🔍 PARTE 3: Resultados do Teste de Penetração E2E (Asaas & Pagamentos)

**Foco**: API, Integração Asaas e Cartão de Crédito.
**Resultado**: Vulnerabilidades Críticas Identificadas; Fortificações Efetivas Confirmadas.

### 🔴 Descobertas Críticas do Pentest

#### 1. Token "Default" no Registro de Webhook
*   **Vulnerabilidade**: O sistema utiliza a string `default_competir_pay_secret_token` como fallback se o segredo não estiver preenchido.
*   **Impacto**: Falsificação total de confirmação de pagamento.
*   **Estado**: **EXPLORÁVEL**.

#### 2. Fraqueza no Modelo de Confiança (Auth Metadados)
*   **Vulnerabilidade**: `ensureAdmin()` confia nos `user_metadata`, que podem ser manipulados no registro se a política do Supabase for a padrão.
*   **Estado**: **ALTO RISCO**.

### ✅ Fortificações Confirmadas
*   **Cálculo de Crédito**: A Server Action `createCreditRequest` agora ignora o valor vindo do cliente e recalcula tudo no backend. Tentativas de manipular juros/markup via browser agora falham silenciosamente.
*   **Entropy de Links**: Os tokens de pagamento gerados são UUIDs criptográficos, inviabilizando ataques de enumeração.

---

## ✅ PARTE 4: Status da Remediação

**Data de Atualização**: 2026-03-07
**Status**: 🟢 TODAS AS MELHORIAS CRÍTICAS IMPLEMENTADAS

1.  **Webhook Asaas**: Blindado. Fallback removido. Geração manual obrigatória.
2.  **Autorização**: Migrada para tabela `profiles`. Bypass via metadados eliminado.
3.  **Criptografia**: Ativa para todas as API Keys do Asaas.
4.  **Storage**: Bucket privatizado. URLs assinadas com validade de 2 horas.

---

**Auditor Final**: `@penetration-tester`
