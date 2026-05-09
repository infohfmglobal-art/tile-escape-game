// AdMob integration for Tile Escape — iOS native only
// Uses Capacitor global plugin (no ES module import needed)

(function () {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;

  // ── Replace these with your real AdMob IDs from AdMob console ──
  var IOS_INTERSTITIAL_ID = 'ca-app-pub-3373361899592655/7016558429'; // REAL
  var IOS_BANNER_ID       = 'ca-app-pub-3373361899592655/5086575250'; // REAL
  // ────────────────────────────────────────────────────────────────

  var AdMob = null;
  var interstitialReady = false;
  var lastAdTime = 0;
  var MIN_AD_INTERVAL_MS = 3 * 60 * 1000; // minimum 3 min between interstitials

  function getAdMob() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  }

  function loadInterstitial() {
    AdMob = getAdMob();
    if (!AdMob) return;
    AdMob.prepareInterstitial({ adId: IOS_INTERSTITIAL_ID })
      .then(function () {
        interstitialReady = true;
        console.log('[AdMob] Interstitial ready');
      })
      .catch(function (e) {
        interstitialReady = false;
        console.warn('[AdMob] Preload failed:', e);
      });
  }

  function showInterstitial() {
    var now = Date.now();
    if (!interstitialReady || (now - lastAdTime) < MIN_AD_INTERVAL_MS) return;
    AdMob = getAdMob();
    if (!AdMob) return;
    AdMob.showInterstitial()
      .then(function () {
        lastAdTime = Date.now();
        interstitialReady = false;
        setTimeout(loadInterstitial, 2000);
      })
      .catch(function (e) { console.warn('[AdMob] Show error:', e); });
  }

  function initAdMob() {
    AdMob = getAdMob();
    if (!AdMob) {
      console.warn('[AdMob] Plugin not loaded');
      return;
    }

    AdMob.initialize({ requestTrackingAuthorization: true })
      .then(function () {
        console.log('[AdMob] Initialized');

        // Banner at bottom
        AdMob.showBanner({
          adId: IOS_BANNER_ID,
          adSize: 'BANNER',
          position: 'BOTTOM_CENTER',
          margin: 0
        }).catch(function (e) { console.warn('[AdMob] Banner error:', e); });

        // Preload first interstitial
        loadInterstitial();

        // Show interstitial every 3 minutes passively
        setInterval(showInterstitial, MIN_AD_INTERVAL_MS);

        // Also hook into level complete event if game fires it
        window.addEventListener('tile_escape_level_complete', showInterstitial);
        window.addEventListener('level_complete', showInterstitial);
      })
      .catch(function (e) { console.warn('[AdMob] Init error:', e); });
  }

  // Wait for Capacitor plugins to be ready
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initAdMob, 1500);
  });
})();
