/** OPERAÇÃO VÉSPERA | Foundry VTT 14, Delta Green 2.0.1 */
const MOD='operacao-vespera-deltagreen';
const asset=path=>`modules/${MOD}/${path}`;
// Foundry VTT v14: modo INDIVIDUAL (1) mantém o fog explorado por usuário.
const FOG_MODE=1;
const SCENE_CONFIG_VERSION=3;
let busy=false;
Hooks.once('init',()=>game.settings.register(MOD,'imported',{name:'VÉSPERA: conteúdo instalado',scope:'world',config:false,type:Boolean,default:false}));
const modFlag=key=>({[MOD]:{key}});
const fromKey=(collection,key)=>collection.contents.find(d=>d.getFlag(MOD,'key')===key)||null;
async function folder(type,key,name,parent=null){
  const id=`${type}:${key}`;
  const old=fromKey(game.folders,id);
  return old || await Folder.create({name,type,folder:parent?.id||null,flags:modFlag(id),sorting:'a'});
}
async function loadData(){
  const resp=await fetch(asset('data/vespera.json'),{cache:'no-store'});
  if(!resp.ok)throw Error(`Falha ao carregar dados (HTTP ${resp.status})`);
  return resp.json();
}
async function makeJournals(data,dir,counts){
  const out=new Map();
  for(const entry of data.journals){
    let doc=fromKey(game.journal,entry.key);
    if(!doc){
      doc=await JournalEntry.create({name:entry.name,folder:dir.id,flags:modFlag(entry.key),ownership:{default:0},pages:entry.pages.map((p,i)=>({
        name:p.title,type:'text',text:{format:1,content:p.html},sort:i*10
      }))});counts.journals++;
    }
    out.set(entry.key,doc);
  }
  return out;
}
async function makeActors(data,npcDir,pjDir,counts){
  const map=new Map();
  for(const entry of [...data.npcs,...data.agents]){
    let actor=fromKey(game.actors,entry.key);
    if(!actor){
      const isAgent=entry.type==='agent';
      const portrait=entry.img.startsWith('assets/')?asset(entry.img):entry.img;
      const token=entry.token.startsWith('assets/')?asset(entry.token):entry.token;
      actor=await Actor.create({
        name:entry.name,type:entry.type,folder:isAgent?pjDir.id:npcDir.id,
        img:portrait,system:foundry.utils.deepClone(entry.system),
        flags:modFlag(entry.key),
        prototypeToken:{
          name:entry.name,actorLink:isAgent,width:1,height:1,
          texture:{src:token},displayName:20,disposition:isAgent?1:0,
          sight:{enabled:isAgent}
        }
      });
      // Specializations, Bonds, motivations and inventory are embedded Delta Green documents.
      if(entry.items?.length){
        const already=new Set(actor.items.map(d=>d.name));
        const items=entry.items.filter(d=>!already.has(d.name));
        if(items.length)await actor.createEmbeddedDocuments('Item',items);
      }
      if(isAgent)counts.agents++;else counts.npcs++;
    }
    map.set(entry.key,actor);
  }
  return map;
}
function scenePage(id,journals){
  if(id==='00_regiao_ashford')return journals.get('handout-mapa')?.pages.contents[0]||null;
  let prefix='';
  if(id.startsWith('01_'))prefix='Cena A';
  else if(id.startsWith('02_'))prefix='Cena B';
  else if(id.startsWith('03_'))prefix='Cena D';
  else if(id.startsWith('08_'))prefix='Cena E';
  else prefix='Cena C';
  return journals.get('cenas')?.pages.contents.find(p=>p.name.startsWith(prefix))||null;
}
/** Configuração v14: fundos das cenas pertencem aos Levels, não ao Scene.background.
 * Migração idempotente: atua somente em cenas identificadas pelo módulo.
 * Não remove níveis, tokens, paredes, diários nem a exploração já registrada.
 */
function desiredSceneSettings(entry) {
  return {
    image: asset(entry.image),
    tokenVision: true,
    fogMode: FOG_MODE
  };
}

function sceneLevel(scene) {
  return scene.initialLevel ?? scene.levels?.contents?.[0] ?? null;
}

/** Garante um Level com background sem alterar os demais Levels do mundo. */
async function ensureSceneLevel(scene, image) {
  let level = sceneLevel(scene);
  if (level) return level;

  const created = await scene.createEmbeddedDocuments('Level', [{
    name: 'Superfície — Operação Véspera',
    elevation: {bottom: 0, top: 20},
    background: {src: image}
  }]);
  level = created?.[0] ?? null;
  if (!level) throw Error(`Não foi possível criar um nível na cena "${scene.name}".`);
  // A propriedade initialLevel é o ID do nível, diferentemente do getter
  // scene.initialLevel, que retorna o documento.
  if (!scene.initialLevel) await scene.update({initialLevel: level.id});
  return level;
}

async function updateSceneSettings(scene, entry, {force=false}={}) {
  if (!scene || scene.getFlag(MOD, 'key') !== entry.id) return false;

  const expected = desiredSceneSettings(entry);
  const version = Number(scene.getFlag(MOD, 'sceneConfigVersion') || 0);
  let updated = false;

  const level = await ensureSceneLevel(scene, expected.image);
  const current = level.background?.src ?? '';
  // Atualiza sempre se estiver vazio; migra automaticamente versões anteriores;
  // após migrar, preserva qualquer fundo personalizado não vazio do Handler.
  if (current !== expected.image && (force || version < SCENE_CONFIG_VERSION || !current)) {
    await level.update({'background.src': expected.image});
    updated = true;
  }

  const patch = {};
  if (scene.tokenVision !== true && (force || version < SCENE_CONFIG_VERSION))
    patch.tokenVision = true;
  if (scene.fog?.mode !== expected.fogMode && (force || version < SCENE_CONFIG_VERSION))
    patch['fog.mode'] = expected.fogMode;
  if (Object.keys(patch).length) {
    await scene.update(patch);
    updated = true;
  }

  // Validação após a gravação: não marca a migração se a imagem continuar ausente.
  const actual = sceneLevel(scene)?.background?.src;
  if (actual !== expected.image && (!actual || force || version < SCENE_CONFIG_VERSION)) {
    throw Error(`Background da cena "${scene.name}" não foi gravado no nível (${actual || 'vazio'}).`);
  }
  if (version < SCENE_CONFIG_VERSION)
    await scene.setFlag(MOD, 'sceneConfigVersion', SCENE_CONFIG_VERSION);
  return updated;
}

async function repairScenes({force=false}={}) {
  if (!game.user?.isGM) throw Error('Somente o Handler pode atualizar as cenas.');
  if (game.system?.id !== 'deltagreen') throw Error('Requer um mundo Delta Green.');
  const data = await loadData();
  let updated = 0, checked = 0;
  const failures = [];
  for (const entry of data.scenes) {
    const scene = fromKey(game.scenes, entry.id);
    if (!scene) continue;
    checked++;
    try {
      if (await updateSceneSettings(scene, entry, {force})) updated++;
    } catch (error) {
      console.error('[VÉSPERA] Erro ao atualizar Level/background:', scene.name, error);
      failures.push(`${scene.name}: ${error.message}`);
    }
  }
  if (updated) ui.notifications.info(`VÉSPERA: ${updated} cena(s) receberam os fundos automaticamente.`);
  if (failures.length) ui.notifications.error(`VÉSPERA: ${failures.length} cena(s) não puderam ser corrigidas. Consulte F12.`);
  console.info('[VÉSPERA] Verificação automática dos Levels:', {updated, checked, failures});
  return {updated, checked, failures};
}
async function makeScenes(data,dir,journals,actors,counts){
  const map=new Map();
  for(const entry of data.scenes){
    let scene=fromKey(game.scenes,entry.id);
    if(!scene){
      scene=await Scene.create({
        name:entry.name,folder:dir.id,flags:modFlag(entry.id),navigation:true,
        width:entry.width,height:entry.height,padding:0,
        // Em Foundry v14 a imagem precisa estar em um Level; o reparo abaixo
        // também funciona caso o core crie automaticamente um nível vazio.
        grid:{type:entry.grid?1:0,size:64,distance:1.5,units:'m',alpha:0.12},
        tokenVision:true,fog:{mode:FOG_MODE}
      });
      counts.scenes++;
    }
    // Cenas novas e antigas recebem um Level com o mapa como background.
    await updateSceneSettings(scene,entry);
    map.set(entry.id,scene);
    const page=scenePage(entry.id,journals);
    if(page&&!scene.notes.some(n=>n.getFlag(MOD,'key')===`note:${entry.id}`)){
      try{
        await scene.createEmbeddedDocuments('Note',[{
          x:Math.floor(entry.width*.90),y:Math.floor(entry.height*.09),
          entryId:page.parent.id,pageId:page.id,icon:'icons/svg/book.svg',
          iconSize:32,text:'NOTA DO HANDLER',flags:modFlag(`note:${entry.id}`)
        }]);
      }catch(error){console.warn('[VÉSPERA] Nota opcional:',entry.id,error);}
    }
  }
  const tokens=[
    ['02_clinica','npc-04',.62,.55],['02_clinica','npc-07',.48,.24],
    ['03_igreja','npc-05',.5,.25],['04_fazenda_exterior','npc-02',.50,.65],
    ['04_fazenda_exterior','npc-03',.55,.66],['05_casa_hale_interior','npc-01',.57,.65],
    ['08_subsolo_capsula','npc-09',.65,.48]
  ];
  for(const [sceneId,key,nx,ny] of tokens){
    const scene=map.get(sceneId), actor=actors.get(key);
    if(!scene||!actor||scene.tokens.some(t=>t.getFlag(MOD,'key')===`token:${sceneId}:${key}`))continue;
    try{
      await scene.createEmbeddedDocuments('Token',[{
        name:actor.name,actorId:actor.id,actorLink:false,
        x:Math.floor(scene.width*nx/64)*64,y:Math.floor(scene.height*ny/64)*64,
        width:1,height:1,hidden:true,texture:{src:actor.prototypeToken.texture.src},
        flags:modFlag(`token:${sceneId}:${key}`)
      }]);
    }catch(err){console.warn('[VÉSPERA] Token opcional:',sceneId,key,err);}
  }
  return map;
}
async function makeTables(data,dir,counts){
  for(const table of data.tables){
    if(fromKey(game.tables,table.key))continue;
    await RollTable.create({
      name:table.name,folder:dir.id,formula:table.formula,replacement:true,displayRoll:true,
      flags:modFlag(table.key),results:table.entries.map((v,i)=>({
        type:'text',name:`Sinal ${i+1} — Permanência`,description:`<p>${v}</p>`,
        weight:1,range:[i+1,i+1],drawn:false,img:'icons/svg/d20-black.svg'
      }))
    });counts.tables++;
  }
}

/** Reaplicar todos os backgrounds do módulo; não toca em cenas alheias. */
async function openMapBackgrounds(){
  if(!game.user?.isGM){ui.notifications.warn('Somente o Handler pode editar os mapas.');return;}
  if(game.system?.id!=='deltagreen'){ui.notifications.warn('Requer um mundo Delta Green.');return;}
  const data=await loadData();
  const targets=data.scenes.map(entry=>({entry,scene:fromKey(game.scenes,entry.id)})).filter(x=>x.scene);
  if(!targets.length){ui.notifications.warn('Importe primeiro as cenas da Operação Véspera.');return;}
  const changed=targets.filter(({entry,scene})=>sceneLevel(scene)?.background?.src!==asset(entry.image));
  const ok=await foundry.applications.api.DialogV2.confirm({
    window:{title:'VÉSPERA — Aplicar mapas e fog'},modal:true,rejectClose:false,
    content:`<p><strong>${targets.length}</strong> cenas identificadas; <strong>${changed.length}</strong> background(s) diferentes do mapa oficial.</p>
      <p>A macro aplicará os mapas da aventura, visão por tokens e fog individual sem apagar tokens, paredes, notas ou exploração anterior.</p><p>Continuar?</p>`,
    yes:{label:'Aplicar mapas'},no:{label:'Cancelar'}
  });
  if(!ok)return;
  let updated=0,failed=[];
  for(const {entry,scene} of targets){
    try{if(await updateSceneSettings(scene,entry,{force:true}))updated++;}
    catch(err){console.error(`[VÉSPERA] Erro na cena ${scene.name}`,err);failed.push(scene.name);}
  }
  if(failed.length)ui.notifications.error(`VÉSPERA: falha em ${failed.length} cena(s): ${failed.join(', ')}`);
  else ui.notifications.info(`VÉSPERA: ${updated} cena(s) atualizada(s); ${targets.length-updated} já estavam corretas.`);
  return {updated,checked:targets.length,failed};
}
/** Orientação de idioma com troca explícita, nunca automática. */
async function checkLanguage(){
  const current=game.i18n?.lang||'desconhecido';
  if(current==='pt-BR'){
    ui.notifications.info('VÉSPERA: idioma pt-BR já está ativo. Reabra a ficha; se necessário recarregue o Foundry.');
    return;
  }
  const supported=CONFIG?.supportedLanguages && Object.hasOwn(CONFIG.supportedLanguages,'pt-BR');
  const ok=await foundry.applications.api.DialogV2.confirm({
    window:{title:'VÉSPERA — Idioma das fichas'},modal:true,rejectClose:false,
    content:`<p>Idioma atual: <strong>${current}</strong>.</p><p>As fichas são traduzidas quando o Foundry está configurado para <strong>Português (Brasil)</strong>.</p>
      <p>${supported?'Português (Brasil) está disponível.':'Se a opção pt-BR estiver ausente, instale e ative o módulo Translation [Core]: Português Brasileiro.'}</p>
      <p>Deseja mudar a preferência deste cliente para pt-BR? O Foundry poderá solicitar recarga.</p>`,
    yes:{label:'Usar português (Brasil)'},no:{label:'Agora não'}
  });
  if(!ok)return;
  try{
    await game.settings.set('core','language','pt-BR');
    ui.notifications.info('Preferência de idioma atualizada. Recarregue a interface e reabra as fichas.');
  }catch(err){
    console.warn('[VÉSPERA] Alteração de idioma não permitida neste cliente:',err);
    ui.notifications.warn('Selecione Português (Brasil) em Game Settings → Configure Settings → Language Preference.');
  }
}

async function makeMacro(counts){
  const macros=[
    {key:'importar-novamente',name:'VÉSPERA — Reabrir importador',image:'icons/svg/book.svg',command:`game.modules.get('${MOD}').api.openImporter();`},
    {key:'aplicar-mapas-background',name:'VÉSPERA — Aplicar mapas e fog',image:'icons/svg/direction.svg',command:`game.modules.get('${MOD}').api.openMapBackgrounds();`},
    {key:'configurar-idioma-br',name:'VÉSPERA — Idioma português (Brasil)',image:'icons/svg/scroll.svg',command:`game.modules.get('${MOD}').api.checkLanguage();`}
  ];
  for(const item of macros){
    if(fromKey(game.macros,item.key))continue;
    await Macro.create({name:item.name,type:'script',img:item.image,command:item.command,
      flags:modFlag(item.key),ownership:{default:0}});
    counts.macros++;
  }
}
async function importAll(){
  if(!game.user?.isGM)throw Error('Somente o Handler pode importar.');
  if(game.system?.id!=='deltagreen')throw Error('Abra primeiro um mundo do sistema Delta Green.');
  if(busy){ui.notifications.warn('Importação já em andamento.');return;}
  busy=true;
  const counts={scenes:0,npcs:0,agents:0,journals:0,tables:0,macros:0};
  try{
    ui.notifications.info('VÉSPERA: importação iniciada...');
    const data=await loadData();
    const allActors=await folder('Actor','root','VÉSPERA · Personagens');
    const npcs=await folder('Actor','npcs','VÉSPERA · NPCs e ameaças',allActors);
    const agents=await folder('Actor','agents','VÉSPERA · Agentes opcionais',allActors);
    const journalDir=await folder('JournalEntry','journals','VÉSPERA · Dossiês e handouts');
    const sceneDir=await folder('Scene','scenes','VÉSPERA · Cenas');
    const tableDir=await folder('RollTable','tables','VÉSPERA · Eventos');
    const journals=await makeJournals(data,journalDir,counts);
    const actors=await makeActors(data,npcs,agents,counts);
    await makeScenes(data,sceneDir,journals,actors,counts);
    await makeTables(data,tableDir,counts);
    await makeMacro(counts);
    await game.settings.set(MOD,'imported',true);
    ui.notifications.info('VÉSPERA: conteúdo pronto nas abas Cenas, Atores, Diários e Tabelas.');
    console.info('[VÉSPERA] Recursos criados:',counts);
    return counts;
  }catch(error){
    console.error('[VÉSPERA] Erro:',error);
    ui.notifications.error(`VÉSPERA: ${error.message} — a importação pode ser repetida sem duplicações.`);
    throw error;
  }finally{busy=false;}
}
async function openImporter(){
  if(!game.user?.isGM){ui.notifications.warn('Apenas o Handler pode importar.');return;}
  if(game.system?.id!=='deltagreen'){ui.notifications.error('Requer mundo do sistema Delta Green.');return;}
  const info=await loadData();
  const previous=game.settings.get(MOD,'imported');
  const ok=await foundry.applications.api.DialogV2.confirm({
    window:{title:'DELTA GREEN — OPERAÇÃO VÉSPERA'},modal:true,rejectClose:false,
    content:`<div class="vespera-import-confirm"><h2>O Sol Debaixo da Pele</h2>
      <p>Aventura autoral não oficial. <strong>${info.scenes.length} cenas, ${info.npcs.length} NPCs,
      ${info.agents.length} agentes, ${info.journals.length} diários e ${info.tables.length} tabela.</strong></p>
      <p>Importação segura: não apaga ou altera seus documentos; novas execuções criam apenas recursos faltantes.</p>
      <p>Os NPCs e handouts ficam privados até o Handler compartilhar. Todas as miniaturas iniciais de NPCs nas cenas estão ocultas.</p>
      ${previous?'<p>Importação anterior detectada. Você pode restaurar elementos ausentes.</p>':''}
      <p>Importar agora?</p></div>`,
    yes:{label:previous?'Verificar e completar':'Importar conteúdo'},no:{label:'Agora não'}
  });
  if(ok)await importAll();
}
Hooks.once('ready',async()=>{
  const mod=game.modules.get(MOD);
  if(mod)mod.api={importAll,openImporter,repairScenes,openMapBackgrounds,checkLanguage};
  if(!game.user?.isGM||game.system?.id!=='deltagreen')return;
  try{
    // Migra inclusive campanhas importadas antes desta versão, sem recriar atores.
    const migration = await repairScenes();
    if (migration.failures?.length) console.warn('[VÉSPERA] Algumas cenas ainda precisam de correção:', migration.failures);
    // Disponibiliza as novas macros também para mundos importados em versões antigas.
    await makeMacro({macros:0});
    if(game.i18n?.lang!=='pt-BR')ui.notifications.warn('VÉSPERA: as fichas estão em inglês? Selecione Português (Brasil) em Configurar Configurações → Idioma; use a macro VÉSPERA — Idioma português (Brasil).');
    if(!game.settings.get(MOD,'imported'))await openImporter();
  }catch(error){console.warn('[VÉSPERA] Inicialização/migração:',error);}
});
