# Design System — competir.pay

Este documento descreve a fundação visual, os componentes e as regras de uso do Design System do projeto **competir.pay**, garantindo consistência, acessibilidade e uma estética premium.

---

## 1. Fundação (Tokens)

As variáveis globais estão definidas em `src/app/globals.css`.

### Cores
- **Primária (Brand)**: `#004EEB` (Azul Oficial). 
  - Variantes: `brand-25` até `brand-950`.
- **Semânticas**:
  - **Success**: Verde (tokens `success-*`).
  - **Warning**: Âmbar (tokens `warning-*`).
  - **Error/Destructive**: Vermelho (tokens `error-*`).
- **Neutras (Grays)**: Escala de cinzas otimizada para legibilidade em Light e Dark mode.

### Tipografia
- **Fonte Principal**: `Inter` (Sans-serif).
- **Pesos**: Regular (400), Medium (500), SemiBold (600), Bold (700), Black (900).

### Geometria e Efeitos
- **Radius**: Padrão de `0.5rem` (8px). 
  - Variantes: `radius-sm` (4px), `radius-md` (6px), `radius-lg` (8px).
- **Shadows**: `shadow-sm`, `shadow-md`, `shadow-lg` definidos com opacidades suaves.
- **Focus Ring**: Utiliza `primary` com opacidade para foco visível.

---

## 2. Componentes Base

Localizados em `src/components/ui`.

### Button
Componente principal de ação.
- **Variantes**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
- **Propriedades Especiais**:
  - `loading`: Exibe um spinner (Loader2) e desabilita o botão.
- **Exemplo**:
  ```tsx
  <Button variant="default" loading={isLoading}>
    Salvar Alterações
  </Button>
  ```

### Badge & Alert
Sinalização e feedback.
- **Variantes**: `default`, `destructive`, `outline`, `success`, `warning`.
- **Uso**:
  ```tsx
  <Badge variant="success">Pago</Badge>
  <Alert variant="warning">
    <AlertTitle>Atenção</AlertTitle>
    <AlertDescription>Seu limite está próximo.</AlertDescription>
  </Alert>
  ```

### Formulários
- **Input / Textarea**: Estilo limpo, com transições de foco suaves. Suporte a `aria-invalid`.
- **Switch**: Toggle animado com cor primária.
- **Select**: Interface de seleção com suporte a grupos e separadores.
- **Checkbox / RadioGroup**: Seleções binárias e múltiplas com marcação na cor primária.

---

## 3. Regras de Consistência

1.  **Não Hardcodar Cores**: Sempre utilize as classes utilitárias do Tailwind (ex: `text-primary`, `bg-brand-500`, `border-border`).
2.  **Modo Escuro**: Todos os componentes devem ser testados em `.dark`. Utilize variáveis CSS que se adaptam automaticamente.
3.  **Acessibilidade**: Mantenha o `focus-visible` e os atributos `aria` corretos.
4.  **Espaçamento**: Siga a escala padrão do Tailwind (múltiplos de 4px).

---

## 4. Expansão do Sistema

Para adicionar novos componentes:
1.  Use a estrutura do `shadcn/ui` como base.
2.  Adapte o estilo para usar o raio `0.5rem` e a cor primária `#004EEB`.
3.  Garanta que o componente utilize os **Semantic Tokens** definidos no `globals.css`.

---
> [!IMPORTANT]
> O Design System é a única fonte da verdade visual. Alterações estruturais devem ser feitas primeiro no `globals.css`.
