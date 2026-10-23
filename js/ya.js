'use strict';
// Обёртка площадок: Yandex Games SDK v2 или VK Bridge (VK Игры). Без них (локально) игра работает как обычно.
// VK открывает игру по ссылке с параметрами запуска (vk_app_id, sign...), по ним и узнаём площадку.
// ПК-версия для Steam (Electron): рекламы нет, в меню есть «ВЫХОД»
const IS_DESKTOP = /Electron/.test(navigator.userAgent);
const IS_VK = /[?&](vk_app_id|vk_platform|sign)=/.test(location.search);
const YA = {
  sdk: null, vk: null, playing: false, adT: -1e9,
  initVK(fin) {
    const s = document.createElement('script'); s.src = 'js/vk-bridge.min.js';
    s.onload = () => {
      const b = window.vkBridge; if (!b) return fin();
      b.send('VKWebAppInit').then(() => { this.vk = b; fin(); }).catch(fin);
      b.subscribe(e => {
        const t = e && e.detail && e.detail.type;
        if (t === 'VKWebAppViewHide') { Sound.mute('ya', true); if (Game.state === 'match' && !Game.demo && Game.phase === 'fight') Game.pause(true); }
        else if (t === 'VKWebAppViewRestore') Sound.mute('ya', false);
      });
    };
    s.onerror = fin; document.head.appendChild(s);
  },
  init() {
    return new Promise(res => {
      let done = false; const fin = () => { if (!done) { done = true; res(); } };
      try {
        if (IS_VK) { this.initVK(fin); setTimeout(fin, 4000); return; }
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
  showVKAd(cb) {
    // межстраничная реклама VK не чаще раза в минуту; если её нет, просто продолжаем
    const now = Date.now(); if (now - this.adT < 60000) { cb && cb(); return; }
    let done = false;
    const fin = () => { if (done) return; done = true; Sound.mute('ad', false); Game.adPause = false; cb && cb(); };
    const b = this.vk;
    b.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' }).then(r => {
      if (!r || !r.result) return fin();
      this.adT = now; this.gameStop(); Sound.mute('ad', true); Game.adPause = true;
      return b.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' }).then(fin, fin);
    }).catch(fin);
    setTimeout(fin, 30000);
  },
  showAd(cb) {
    if (this.vk) return this.showVKAd(cb);
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
