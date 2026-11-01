# Operação Véspera — atualização corretiva v1.0.1

Esta versão corrige o erro de validação dos resultados da RollTable no Foundry VTT 14.

## Atualização recomendada (GitHub Actions)

1. Na branch `main` do repositório `tulioscost/operacao-vespera-deltagreen`, substitua `scripts/importer.mjs` pela versão corrigida.
2. Opcionalmente, atualize `module.json` para v1.0.1 e `.github/workflows/publicar-foundry.yml` para que o padrão seja `v1.0.1`.
3. Abra `Actions > Publicar modulo no Foundry > Run workflow` e informe a nova tag `v1.0.1`.
4. Após a execução, confira que a release `v1.0.1` contém `module.json` e `operacao-vespera-deltagreen.zip`.
5. Em Foundry Setup > Add-on Modules, verifique as atualizações e atualize o módulo. Reinicie o mundo.
6. O importador abre automaticamente se a importação anterior ficou incompleta. Caso necessário, use o console do navegador (F12):

   ```js
   game.modules.get('operacao-vespera-deltagreen').api.openImporter()
   ```

O módulo verifica flags de seus próprios documentos para completar itens faltantes sem duplicar os anteriores. Não é necessário excluir o mundo.

## URL de instalação/atualização

`https://github.com/tulioscost/operacao-vespera-deltagreen/releases/latest/download/module.json`

## Instalação manual alternativa

O arquivo `operacao-vespera-deltagreen-v1.0.1.zip` deste pacote contém os arquivos do módulo com `module.json` na raiz. Para publicar manualmente, crie uma release GitHub `v1.0.1` e anexe **dois arquivos**: o ZIP, renomeado para `operacao-vespera-deltagreen.zip`, e o `module.json` atualizado.

**Compatibilidade:** Foundry VTT 14 e Delta Green 2.0.1. Faça backup do mundo antes de atualizar módulos.
