# OPERAÇÃO VÉSPERA — O SOL DEBAIXO DA PELE

Módulo de aventura **autoral não oficial** em português para **Foundry VTT 14** e sistema **Delta Green 2.0.1** (`deltagreen`).

## Conteúdo
- **9 cenas** com mapas ilustrados aprimorados (mais 9 mapas esquemáticos alternativos).
- **9 atores**: sete NPCs humanos (incluindo Isaac), um convertido e a cápsula alienígena. Três atores não humanos utilizam fichas `unnatural`.
- **5 agentes opcionais**: Maia Torres, Helena Brooks, Gabriel Park, Nadia Kessler e Caleb Ward (perícias e Vínculos preenchidos).
- **11 diários** com páginas de preparação, roteiro, segredos, progressão, mecânicas e handouts.
- **1 tabela aleatória** de sinais do Coro da Permanência.
- **Retratos e tokens** vinculados a todos os NPCs.
- **1 macro** no mundo que reabre o importador.
- **3 PDFs de referência**: NPCs, agentes prontos e Atlas do Handler.

## Instalação manual (ZIP)
1. Instale o sistema `Delta Green: The Role-Playing Game` versão 2.0.1 no Foundry VTT 14.
2. Extraia o ZIP preservando a pasta **operacao-vespera-deltagreen** no diretório `<Dados do Foundry>/Data/modules/`.
3. O arquivo `<Dados do Foundry>/Data/modules/operacao-vespera-deltagreen/module.json` deve existir.
4. Reinicie o Foundry, abra um **mundo criado com o sistema Delta Green**, acesse **Gerenciar Módulos** e ative **Operação Véspera**.
5. A janela de importação aparece ao entrar como GM; selecione **Importar**. Os itens aparecerão nas pastas **VÉSPERA · ...** das abas Cenas, Atores, Diários e Tabelas, além da macro em Macros.

## Depois da importação
- A cena **00** é um mapa de referência: sem grade e sem escala física. As cenas **01–08** usam grade de 64 px / 1,5 m, sem paredes ou luzes configuradas.
- Para colocar um mapa antigo esquemático, edite o fundo da cena para `modules/operacao-vespera-deltagreen/assets/maps/NOME_esquematico.webp` e ajuste dimensões/grade conforme preferir.
- As fichas NPC/Unnatural contêm segredos do Handler. Os diários HANDOUT começam privados (a menos que você os compartilhe manualmente).
- Os agentes opcionais usam retratos genéricos do Foundry; todos os NPCs têm imagem e token próprios.
- A importação preserva documentos existentes. Reexecutar o importador **só cria recursos faltantes**, identificados pelas flags do módulo.
- Se dispensar a janela inicial, pode abrir novamente pelo console: `game.modules.get('operacao-vespera-deltagreen').api.openImporter()`.
- Também pode executar a macro **VÉSPERA — Importar conteúdo** que é criada após a primeira importação.

## Compatibilidade e limitações
- Projetado para Foundry v14 e sistema Delta Green v2.0.1. **Não foi executado dentro de uma instância real do Foundry**, portanto a integração precisa de teste no seu mundo.
- O ZIP é **instalável manualmente**, mas uma **URL de manifesto** só funciona depois de publicar `module.json` e o ZIP em hospedagem permanente (por exemplo, um GitHub Release).
- Não inclui paredes, efeitos de áudio, luz dinâmica ou automações de combate específicas da criatura.
- O mecanismo inicial adiciona dados ao mundo com confirmação do GM. Não substitui o sistema nem altera seus arquivos.

## Publicação via GitHub (opcional)
Hospede o conteúdo da pasta do módulo em seu repositório e publique o ZIP como release; em `module.json`, acrescente os campos `manifest` e `download` com as URLs **reais** e estáveis de sua publicação. Não há URL de instalação remota até que os arquivos estejam hospedados.

## Fontes e direitos
Módulo de aventura autoral não oficial. Não inclui obras, texto de regras ou compêndios comerciais de Delta Green. Verifique direitos de uso antes de redistribuir assets além da sua mesa privada.


## Atualização 1.0.2 — cenas, fog e tradução

- Nas **nove cenas**, os mapas de `assets/maps/` são definidos automaticamente como imagem de fundo (`background.src`).
- **Visão por token** habilitada (`tokenVision: true`) e **exploração individual do fog** habilitada (`fog.mode: 1`) no Foundry 14. O mapa regional também recebe essas configurações.
- Na primeira abertura do mundo como Handler após a atualização, cenas já importadas com as flags do módulo são **migradas automaticamente**, preservando as explorações já registradas. Modificações manuais feitas após a migração não são substituídas nas próximas aberturas.
- Para reaplicar voluntariamente as configurações em todas as cenas próprias do módulo, execute no console do navegador como Handler: `await game.modules.get('operacao-vespera-deltagreen').api.repairScenes({force:true})`. Isso substitui os backgrounds dessas cenas.
- Os módulos **Dice Tray** (`dice-calculator`) e **Dice So Nice!** (`dice-so-nice`) são dependências obrigatórias declaradas no manifesto. Instale versões compatíveis com o Foundry v14 e habilite ambos no mundo.
- O sistema **Delta Green** já distribui pt-BR; o arquivo `lang/pt-BR.json` neste módulo **complementa 193 chaves ausentes** na tradução do sistema, sem sobrescrever seus arquivos. Em **Configuração → Configurações Básicas → Idioma**, selecione **Português (Brasil)** e recarregue a página. A tradução pode mudar se uma versão futura do sistema alterar suas chaves.
- **Fog ativo não significa paredes automáticas**: o campo de visão seguirá os tokens dos jogadores; adicione paredes/portas/iluminação se desejar impedir a visão através de ambientes fechados. Jogadores precisam controlar um token com visão habilitada; sem isso, a cena pode aparecer escura/oculta.



## Correção do instalador — v1.0.3

A release 1.0.2 foi produzida por um workflow antigo que não incluiu `lang/` no ZIP. A versão 1.0.3 corrige isso e executa verificações de integridade e caminhos antes de publicar. A dependência do sistema foi declarada em `relationships.systems`; Dice Tray e Dice So Nice continuam obrigatórios em `relationships.requires`.

Se o Foundry informar `PACKAGE.InstallFailed`, abra a release e confirme que `module.json` e `operacao-vespera-deltagreen.zip` estão publicados; teste a URL do manifesto pelo navegador e examine o console do Foundry e os logs do servidor para o código de erro detalhado. O aviso genérico, sozinho, não identifica a causa.

Instalação por URL: `https://github.com/tulioscost/operacao-vespera-deltagreen/releases/latest/download/module.json`.
