/** OPERAÇÃO VÉSPERA — Aplicar mapas aos backgrounds das cenas
 * Foundry VTT v14 | Executar como macro do tipo Script (Handler/GM).
 * Não altera outros mundos/cenas, não apaga tokens, paredes, notas ou fog explorado.
 */
(async () => {
  const MODULE_ID = "operacao-vespera-deltagreen";
  if (!game.user?.isGM) {
    ui.notifications.warn("Apenas o Handler pode executar esta macro.");
    return;
  }
  if (game.system?.id !== "deltagreen") {
    ui.notifications.error("Abra um mundo com o sistema Delta Green.");
    return;
  }
  const mod = game.modules.get(MODULE_ID);
  if (!mod?.active) {
    ui.notifications.error("Ative o módulo Operação Véspera neste mundo.");
    return;
  }
  let data;
  try {
    const response = await fetch(`modules/${MODULE_ID}/data/vespera.json`, {cache:"no-store"});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    ui.notifications.error(`Não foi possível carregar o índice dos mapas: ${error.message}`);
    return;
  }
  const targets = data.scenes.map(entry => ({
    entry,
    scene: game.scenes.contents.find(s => s.getFlag(MODULE_ID, "key") === entry.id)
  })).filter(x => x.scene);
  if (!targets.length) {
    ui.notifications.warn("Não foram encontradas cenas importadas pela Operação Véspera; importe a aventura primeiro.");
    return;
  }
  const changed = targets.filter(({entry, scene}) => scene.background?.src !== `modules/${MODULE_ID}/${entry.image}`);
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: {title:"VÉSPERA — Aplicar mapas às cenas"},
    content: `<p>Encontradas <strong>${targets.length}</strong> cenas da Operação Véspera.</p>
      <p><strong>${changed.length}</strong> background(s) serão substituídos pelos mapas originais do módulo.</p>
      <p>Também serão ativadas visão por tokens e exploração individual do fog.</p>
      <p>Não altera tokens, paredes, notas, outras cenas ou histórico de fog já explorado.</p>
      <p><strong>Aplicar agora?</strong></p>`,
    yes: {label:"Aplicar mapas e fog"}, no: {label:"Cancelar"},
    modal:true, rejectClose:false
  });
  if (!confirmed) return;
  let updated=0, failed=[];
  for (const {entry,scene} of targets) {
    const expected=`modules/${MODULE_ID}/${entry.image}`;
    const changes={};
    if (scene.background?.src!==expected) changes["background.src"]=expected;
    if (scene.tokenVision!==true) changes.tokenVision=true;
    if (scene.fog?.mode!==1) changes["fog.mode"]=1;
    if (!Object.keys(changes).length) continue;
    try {
      await scene.update(changes);
      updated++;
    } catch(err) {
      console.error(`[VÉSPERA] Falha na cena ${scene.name}:`,err);
      failed.push(scene.name);
    }
  }
  if (failed.length) ui.notifications.error(`VÉSPERA: ${failed.length} cena(s) não atualizada(s): ${failed.join(", ")}`);
  else ui.notifications.info(`VÉSPERA: ${updated} cena(s) atualizada(s), ${targets.length-updated} já estavam corretas.`);
  console.info("[VÉSPERA] Backgrounds verificados:",targets.map(x=>({name:x.scene.name,background:x.scene.background?.src,fog:x.scene.fog?.mode})));
})();
