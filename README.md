# Biolinks do Departamento de Matemática da UFDPar

## Orientações 

### 1. Instale as dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

### 2. Execute o servidor em modo desenvolvedor:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

### 3. Abra o endereço [http://localhost:3000](http://localhost:3000) e veja as suas atualizações em tempo real.

### 4. Para editar a página principal, edite o arquivo `app/page.jsx`. 
Para adicionar botões, adicione o componente `<LinkButton> </LinkButton>` no arquivo `app/page.jsx`. Adicionando as propriedades *href* e o texto do botão.

Por exemplo, para adicionar um novo botão com link para o site do Google, adicione o componente com essas propriedades:

```Arquivo LinkButton.jsx
<LinkButton href="https://google.com">
Google
</LinkButton>
```

### 5. Deploy na Vercel
Atualize usando sua conta no Github.

Notes:

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

### 6. Emails

    feat: otimiza envio de e-mails em massa e geração de certificados

    - Implementa processamento em lotes (15/req) no frontend para evitar timeout na Vercel
    - Adiciona indicador de progresso dinâmico no botão de disparo
    - Libera o painel de e-mail para o ambiente de produção
    - Fixa o remetente oficial como "Congresso GEEMat 2026" na API
    - Força cor preta absoluta (#000000) nos PDFs gerados (sobrescrevendo estilos do Tiptap)
