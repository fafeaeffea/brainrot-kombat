'use strict';
// Запуск: масштабирование, SDK, демо-бой на фоне меню
function fit() {
  const st = document.getElementById('stage');
  const vw = window.innerWidth, vh = window.innerHeight;
  let w = vw, h = vw * 9 / 16;
  if (h > vh) { h = vh; w = vh * 16 / 9; }
  st.style.width = Math.floor(w) + 'px'; st.style.height = Math.floor(h) + 'px';
  st.style.fontSize = (w / 48) + 'px';
}
addEventListener('resize', fit);
document.addEventListener('visibilitychange', () => {
  Sound.mute('hidden', document.hidden);
  if (document.hidden && Game.state === 'match' && !Game.demo && !Game.paused && Game.phase !== 'victory' && !UI.cur) Game.pause(true);
});
(async function boot() {
  fit();
  Input.init();
  const bar = document.getElementById('loadbar');
  // прогрев: собираем арены и портреты заранее, чтобы не было рывков
  const steps = STAGES.length + 2; let n = 0;
  const tickBar = () => { n++; if (bar) bar.style.width = Math.round(n / steps * 100) + '%'; return new Promise(r => setTimeout(r, 0)); };
  await YA.init(); await tickBar();
  for (let i = 0; i < STAGES.length; i++) { Stage.set(i); await tickBar(); }
  UI.init(); await tickBar();
  Game.init();
  document.getElementById('loading').remove();
  Game.startDemo();
  UI.show(Settings.device ? 'menu' : 'device');
  YA.loaded();
  setInterval(() => {
    const f = Game.finisher, show = Game.phase === 'finish' && f && !Game.ai[f.idx] && Game.cfg && Game.cfg.mode !== 'demo' && usePhone();
    if (UI.fatBtn) UI.fatBtn.style.display = show ? '' : 'none';
    UI.updTouch();
  }, 200);
})();
