## v1.0.3
- Corrige publicação: inclui `lang/pt-BR.json` no ZIP.
- Verifica caminhos de cenas, retratos, manifesto e integridade do ZIP antes de publicar.
- Declara suporte ao sistema Delta Green em `relationships.systems`; mantém Dice Tray e Dice So Nice como dependências obrigatórias.

# Histórico de versões

## 1.0.2 — 31/10/2026
- Mapas aplicados ao background das nove cenas e reparo automático de cenas anteriores.
- Habilitado fog individual em Foundry VTT 14, com visão por token.
- Dice Tray e Dice So Nice declarados como dependências obrigatórias.
- Tradução pt-BR complementar de 193 chaves ausentes no Delta Green, preservando a tradução nativa.
- Workflow atualizado para incluir `lang/pt-BR.json` na release.

# Operação Véspera v1.0.1 — Correção de importação

## Correções

- Tabela de resultados: `type: 0` substituído por `type: 'text'` (Foundry 14).
- Resultados usam agora `name` e `description` em vez de `text`, conforme o esquema de TableResult no Foundry 14.
- Manifesto atualizado para versão 1.0.1.
- Valor padrão da versão do workflow alterado para `v1.0.1`.

## Atualização do GitHub sem apagar o mundo

1. Substitua `scripts/importer.mjs`, `module.json` e, opcionalmente, `.github/workflows/publicar-foundry.yml` na branch `main`.
2. Vá a Actions > Publicar modulo no Foundry > Run workflow, com o parâmetro `v1.0.1`.
3. Confira a Release `v1.0.1`, atualize o módulo no Foundry e reinicie o mundo.
4. Com o módulo ativo e o mundo aberto, execute no console (F12):

   `game.modules.get('operacao-vespera-deltagreen').api.openImporter()`

5. Clique em `Importar conteúdo` ou `Verificar e completar`. A tabela será criada, os demais documentos existentes não serão duplicados.

**Não exclua os atores, cenas ou diários já importados.**

**Nota:** esta correção foi validada por testes de sintaxe e simulação do importador, mas não em execução real no Foundry.
