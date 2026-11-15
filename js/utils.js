/* Utilidades generales: DOM, formato de soles, fechas, avisos y descargas */
window.App = window.App || {};
(function (A) {
  'use strict';

  A.$ = (s) => document.querySelector(s);
  A.$$ = (s) => Array.from(document.querySelectorAll(s));

  A.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  A.redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;
  A.soles = (n) => 'S/ ' + A.redondear(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  A.leerMonto = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return n > 0 ? A.redondear(n) : 0; };
  A.soloDig = (s) => String(s ?? '').replace(/\D/g, '');
  A.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  A.inicial = (s) => A.esc(String(s || '?').charAt(0).toUpperCase());

  /* ---- Fechas (siempre en formato local AAAA-MM-DD) ---- */
  A.fmt = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  A.parse = (s) => { const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c); };
  A.hoy = () => A.fmt(new Date());
  A.sumarDias = (s, n) => { const d = A.parse(s); d.setDate(d.getDate() + n); return A.fmt(d); };
  A.largo = (s) => A.parse(s).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  A.corto = (s) => A.parse(s).toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  A.lunes = (s) => { const d = A.parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return A.fmt(d); };

  /* Rangos de los botones rápidos del reporte */
  A.rangoPreset = (p, fechasDisponibles) => {
    const h = A.hoy(), d = A.parse(h), y = d.getFullYear(), m = d.getMonth();
    switch (p) {
      case 'semana': { const l = A.lunes(h); return [l, A.sumarDias(l, 6)]; }
      case 'semana-ant': { const l = A.sumarDias(A.lunes(h), -7); return [l, A.sumarDias(l, 6)]; }
      case 'quincena': return d.getDate() <= 15
        ? [A.fmt(new Date(y, m, 1)), A.fmt(new Date(y, m, 15))]
        : [A.fmt(new Date(y, m, 16)), A.fmt(new Date(y, m + 1, 0))];
      case 'mes': return [A.fmt(new Date(y, m, 1)), A.fmt(new Date(y, m + 1, 0))];
      case 'todo': { const f = (fechasDisponibles || []).slice().sort(); return [f[0] || h, f[f.length - 1] || h]; }
      default: return [h, h];
    }
  };

  /* ---- Aviso flotante ---- */
  let toastT;
  A.toast = (m) => {
    const t = A.$('#toast'); if (!t) return;
    t.textContent = m; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2000);
  };

  /* ---- Descargas ---- */
  A.descargar = (nombre, contenido, tipo) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  A.csv = (filas) => {
    const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    return '﻿' + filas.map((f) => f.map(q).join(';')).join('\r\n');
  };
})(window.App);
