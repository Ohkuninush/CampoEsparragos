/* Arranque de la app y navegación entre pestañas */
(function (A) {
  'use strict';

  A.cargar();
  A.registro.init();
  A.reporte.init();
  A.ajustes.init();

  const vistas = { dia: A.registro, reporte: A.reporte, ajustes: A.ajustes };

  A.irA = (tab) => {
    A.$$('nav.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    A.$$('.vista').forEach((v) => v.classList.toggle('on', v.id === 'v-' + tab));
    if (tab !== 'reporte') A.reporte.salir(); // al salir del reporte se cierra la sesión del DNI
    vistas[tab].render();
    window.scrollTo(0, 0);
  };

  A.$$('nav.tabs button').forEach((b) => b.addEventListener('click', () => A.irA(b.dataset.tab)));
  A.irA('dia');

  // App instalable y sin internet (solo cuando se sirve por http/https)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})(window.App);
