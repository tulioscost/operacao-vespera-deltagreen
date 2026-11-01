/* Operação Véspera 1.0.7 — reparação opcional (a instalação já automatiza o processo). */
const mod = game.modules.get('operacao-vespera-deltagreen');
if (!game.user?.isGM) {
  ui.notifications.warn('Somente o Handler pode alterar o background das cenas.');
} else if (!mod?.active || !mod.api?.repairScenes) {
  ui.notifications.error('Atualize e ative o módulo Operação Véspera v1.0.7 ou superior.');
} else {
  await mod.api.repairScenes({force: true});
}
