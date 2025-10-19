# LojaRápida

Plataforma rápida e fácil para comprar e vender online.

## Tecnologias

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Backend & Autenticação:** Supabase
- **UI Components:** shadcn/ui

## Setup do Projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um novo projeto em [supabase.com](https://supabase.com)
2. Vá para Settings > API e copie:
   - Project URL
   - anon public key
3. Crie um arquivo `.env.local` na raiz do projeto:
   ```bash
   cp .env.example .env.local
   ```
4. Preencha as variáveis de ambiente no `.env.local`:
   ```
   VITE_SUPABASE_URL=sua_url_do_projeto
   VITE_SUPABASE_ANON_KEY=sua_chave_anon
   ```

### 3. Configurar Banco de Dados

1. No painel do Supabase, vá para SQL Editor
2. Execute o script do arquivo `database-setup.sql`
3. Isso criará a tabela `profiles` e configurará as políticas de segurança

### 4. Executar o projeto

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## Funcionalidades Implementadas

- ✅ Autenticação de usuários (Login/Registro)
- ✅ Sistema de papéis (Cliente/Vendedor)
- ✅ Proteção de dados com Row Level Security
- ✅ Interface responsiva com Tailwind CSS
- ✅ Context API para gerenciamento de estado

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos React
├── lib/               # Utilitários e configurações
├── pages/             # Páginas da aplicação
├── types/             # Tipos TypeScript
└── utils/             # Funções utilitárias
```

## Próximos Passos

- [ ] Implementar dashboard para vendedores
- [ ] Sistema de produtos
- [ ] Carrinho de compras
- [ ] Sistema de pagamentos