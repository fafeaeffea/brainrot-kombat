'use strict';
// Обёртка Yandex Games SDK v2. Без SDK (локально) игра работает как обычно.
const YA = {
  sdk: null, playing: false,
  init() {
    return new Promise(res => {
      let done = false; const fin = () => { if (!done) { done = true; res(); } };
      try {
        if (typeof YaGames === 'undefined') return fin();
        YaGames.init().then(s => {
          this.sdk = s;
          try { s.on && s.on('game_api_pause', () => { Sound.mute('ya', true); if (Game.state === 'match' && !Game.demo && Game.phase === 'fight') Game.pause(true); }); } catch (e) { }
          try { s.on && s.on('game_api_resume', () => Sound.mute('ya', false)); } catch (e) { }
          fin();
        }).catch(fin);
      } catch (e) { fin(); }
      setTimeout(fin, 4000);
    });
  },
  loaded() { try { this.sdk.features.LoadingAPI.ready(); } catch (e) { } },
  gameStart() { if (this.playing) return; this.playing = true; try { this.sdk.features.GameplayAPI.start(); } catch (e) { } },
  gameStop() { if (!this.playing) return; this.playing = false; try { this.sdk.features.GameplayAPI.stop(); } catch (e) { } },
  showAd(cb) {
    if (!this.sdk || !this.sdk.adv) { cb && cb(); return; }
    let done = false;
    const fin = () => { if (done) return; done = true; Sound.mute('ad', false); Game.adPause = false; cb && cb(); };
    try {
      this.gameStop();
      this.sdk.adv.showFullscreenAdv({ callbacks: {
        onOpen: () => { Sound.mute('ad', true); Game.adPause = true; },
        onClose: () => fin(), onError: () => fin(), onOffline: () => fin()
      } });
    } catch (e) { fin(); }
  }
};
