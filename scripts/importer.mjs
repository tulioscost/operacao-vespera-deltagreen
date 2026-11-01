/** OPERAÇÃO VÉSPERA | Foundry VTT 14, Delta Green 2.0.1 */
const MOD='operacao-vespera-deltagreen';
const asset=path=>`modules/${MOD}/${path}`;
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
async function makeScenes(data,dir,journals,actors,counts){
  const map=new Map();
  for(const entry of data.scenes){
    let scene=fromKey(game.scenes,entry.id);
    if(!scene){
      scene=await Scene.create({
        name:entry.name,folder:dir.id,flags:modFlag(entry.id),navigation:true,
        width:entry.width,height:entry.height,padding:0,
        background:{src:asset(entry.image)},
        grid:{type:entry.grid?1:0,size:64,distance:1.5,units:'m',alpha:0.12},
        tokenVision:false,fogExploration:false,darkness:0
      });
      counts.scenes++;
    }
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
async function makeMacro(counts){
  if(fromKey(game.macros,'importar-novamente'))return;
  await Macro.create({name:'VÉSPERA — Reabrir importador',type:'script',
    img:'icons/svg/book.svg',command:`game.modules.get('${MOD}').api.openImporter();`,
    flags:modFlag('importar-novamente'),ownership:{default:0}
  });counts.macros++;
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
  if(mod)mod.api={importAll,openImporter};
  if(!game.user?.isGM||game.system?.id!=='deltagreen')return;
  try{if(!game.settings.get(MOD,'imported'))await openImporter();}
  catch(error){console.warn('[VÉSPERA] Janela inicial não aberta:',error);}
});
