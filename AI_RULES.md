# Regras de Desenvolvimento do CrowdMatch

Este documento descreve a pilha de tecnologia (tech stack) e as regras de uso de bibliotecas para garantir a consistência, manutenibilidade e elegância do código.

## 1. Visão Geral da Pilha de Tecnologia

O CrowdMatch é construído com as seguintes tecnologias:

*   **Framework:** React (com Hooks e Componentes Funcionais).
*   **Linguagem:** TypeScript (uso obrigatório para tipagem e segurança).
*   **Roteamento:** React Router (usando `react-router-dom`).
*   **Estilização:** Tailwind CSS (abordagem mobile-first e responsiva).
*   **Componentes UI:** shadcn/ui (biblioteca primária para componentes de interface).
*   **Ícones:** Lucide React (`lucide-react`).
*   **Gerenciamento de Estado:** React Context API (`context/AppContext.tsx`).
*   **Dados/Backend:** Atualmente utiliza serviços de dados mockados e o SDK Google GenAI para geração de conteúdo.
*   **Estrutura de Arquivos:** Componentes em `src/components/` e Páginas em `src/pages/`.

## 2. Regras de Uso de Bibliotecas

Para manter a consistência, siga estas regras ao implementar novos recursos:

| Propósito | Biblioteca/Tecnologia | Regra de Uso |
| :--- | :--- | :--- |
| **Estilização** | Tailwind CSS | **Obrigatório.** Use classes utilitárias do Tailwind para todo o layout, cores e responsividade. |
| **Componentes UI** | shadcn/ui | **Prioridade Máxima.** Use componentes pré-construídos do shadcn/ui sempre que possível (ex: Button, Card, Dialog). Não edite os arquivos base do shadcn/ui; crie wrappers se precisar de personalização. |
| **Ícones** | Lucide React | **Exclusivo.** Use apenas ícones importados de `lucide-react`. |
| **Roteamento** | React Router | Use `useNavigate`, `useParams`, `NavLink` e `Routes`/`Route` para navegação e gerenciamento de URL. |
| **Estado Global** | React Context API | Use o `useAppContext` para acessar e modificar o estado global da aplicação. |
| **Notificações** | (A ser definido) | Se for necessário adicionar notificações (toasts), instale e use uma biblioteca padrão (ex: `react-hot-toast`). |
| **Estrutura** | React/TypeScript | Crie um novo arquivo para cada novo componente ou hook. Mantenha os componentes pequenos e focados. |