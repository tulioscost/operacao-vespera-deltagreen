# OPERAÇÃO VÉSPERA — PUBLICAÇÃO NO GITHUB

**Repositório planejado:** `tulioscost/operacao-vespera-deltagreen`.
**Aviso:** os links do GitHub só ficarão acessíveis depois que você criar o repositório e publicar a release.

## Publicação com GitHub Actions (recomendada)

1. Entre em https://github.com/new com a conta `tulioscost`.
2. Nomeie o repositório `operacao-vespera-deltagreen`, selecione **Public** e crie-o (não inicialize com README para facilitar o envio).
3. Extraia `Operacao_Vespera_GitHub_Repositorio_v1.0.0.zip`. Envie **todo o conteúdo da pasta**, incluindo `.github`, para a **raiz** do repositório. O `module.json` deve aparecer na página inicial do repositório, não dentro de outra pasta.
4. Em **Actions**, abra **Publicar modulo no Foundry**, clique em **Run workflow**, selecione `main`, informe `v1.0.0` e execute. A action criará uma release e anexará `module.json` e `operacao-vespera-deltagreen.zip`.
5. Confira em **Releases** que os dois arquivos existem.
6. No Foundry VTT (tela inicial, **Add-on Modules > Install Module**), cole a URL do manifesto e instale:

   `https://github.com/tulioscost/operacao-vespera-deltagreen/releases/latest/download/module.json`

7. Abra um mundo **Delta Green**, habilite **Operação Véspera** em **Gerenciar Módulos** e clique em **Importar conteúdo**.

## Instalação via publicação manual (sem Actions)

1. Crie o repositório público como acima.
2. Envie os arquivos da pasta `Repositorio` ou inicialize o repositório com um README.
3. Em **Releases > Draft a new release**, crie a tag `v1.0.0`, escolha o ramo `main`, e anexe **ambos** os arquivos presentes em `Arquivos_para_release`: `module.json` e `operacao-vespera-deltagreen.zip`.
4. Publique (não marque como pre-release) e instale pelo mesmo URL de manifesto.

## URLs de instalação (depois da publicação)

- **Manifesto estável:** `https://github.com/tulioscost/operacao-vespera-deltagreen/releases/latest/download/module.json`
- **Download ZIP v1.0.0:** `https://github.com/tulioscost/operacao-vespera-deltagreen/releases/download/v1.0.0/operacao-vespera-deltagreen.zip`
- **Página do repositório:** `https://github.com/tulioscost/operacao-vespera-deltagreen`

## Atualizações

- Atualize o conteúdo no ramo `main`.
- Em **Actions > Publicar modulo no Foundry > Run workflow**, escolha a nova versão, por exemplo `v1.0.1`.
- O Foundry detectará a nova versão no mesmo URL estável do manifesto; verifique atualizações em **Add-on Modules**.
- Não publique novamente com a mesma tag: versões já lançadas devem permanecer imutáveis para que atualizações funcionem corretamente.

## Pontos de atenção

- Um arquivo ZIP adicionado como **código-fonte** ao repositório não instala automaticamente o módulo. A release precisa conter um `module.json` baixável e o ZIP real do módulo.
- O ZIP usado no Foundry deve conter `module.json` diretamente na sua raiz, ao lado de `assets/`, `data/`, `scripts/` e `styles/`.
- O repositório precisa ser **público** para instalação por URL sem autenticação.
- GitHub Actions pode precisar da permissão **Settings > Actions > General > Workflow permissions > Read and write permissions** se aparecer erro HTTP 403 ao publicar.
- O módulo exige Foundry VTT v14 e sistema `deltagreen` v2.0.1. Teste em mundo de homologação e faça backup antes de importar.
