# 5GNETT — React + Vite

Projeto convertido do HTML/CSS/JavaScript original para uma aplicação React usando Vite.

## Estrutura

- `src/App.jsx` — monta a interface no React.
- `src/legacy.js` — lógica original de atendimentos, Supabase, gerência, relatórios e bonificação.
- `src/style.css` — estilos originais, com o caminho da imagem ajustado.
- `src/main.jsx` — entrada do React.
- `public/fundo-5gnett.jpg` — imagem de fundo.
- `vite.config.js` — configuração do Vite.

## Executar

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado pelo Vite.

## Gerar versão de produção

```bash
npm run build
npm run preview
```

## Publicar na Vercel

Importe o repositório na Vercel usando a pasta raiz como diretório do projeto.
O `vercel.json` já configura o comando `npm run build` e a pasta de saída
`dist`; não é necessário instalar dependências manualmente na Vercel.

A conexão existente com o Supabase foi preservada na conversão.

## Ordem de serviço nos atendimentos

Antes de usar o novo campo de OS, aplique a migração
[`supabase/migrations/20261104210900_add_teve_os_to_atendimentos.sql`](./supabase/migrations/20261104210900_add_teve_os_to_atendimentos.sql)
no banco Supabase. Ela cria a coluna `teve_os`; registros anteriores ficam sem
informação e são exibidos como “—” até serem editados. Novos atendimentos
exigem a seleção de Sim ou Não, e a lista pode ser filtrada por essa resposta.

O canal exibido como ChatISP mantém o valor legado no banco para compatibilidade.
O protocolo é salvo no campo de texto já existente e aparece na lista sem link clicável.

A resolutividade é definida automaticamente pela resposta de OS: sem OS fica
“Resolvido internamente”; com OS fica “Resolvido parcialmente”. Os indicadores
consideram apenas “Resolvido” e “Resolvido internamente” como resolvidos.

Na lista de atendimentos, os indicadores de OS mostram os totais com e sem OS
após os demais filtros, sem incluir registros antigos cuja informação de OS
está vazia. O filtro de clientes recorrentes considera recorrente o código de
cliente com mais de um atendimento registrado; o indicador conta clientes
únicos recorrentes entre os resultados filtrados.
