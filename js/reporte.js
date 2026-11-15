/* Pantalla de Reporte: cada trabajador entra con su DNI y ve solo lo suyo */
(function (A) {
  'use strict';
  const { $, esc, soles } = A;
  const est = { desde: null, hasta: null, jefe: 'todos', trab: null, admin: false };

  function init() {
    [est.desde, est.hasta] = A.rangoPreset('semana');

    $('#rep-dni').addEventListener('input', (e) => { e.target.value = A.soloDig(e.target.value).slice(0, 8); $('#rep-err').textContent = ''; });
    $('#rep-dni').addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
    $('#rep-entrar').onclick = entrar;
    $('#rep-salir').onclick = () => { salir(); render(); };
    $('#rep-trab-sel').onchange = (e) => { est.trab = e.target.value; render(); };

    $('#rep-presets').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      const fechas = A.db.registros.filter((r) => r.trab === est.trab).map((r) => r.fecha);
      [est.desde, est.hasta] = A.rangoPreset(b.dataset.p, fechas);
      A.$$('#rep-presets .chip').forEach((c) => c.classList.toggle('on', c === b));
      render();
    });
    $('#rep-desde').onchange = (e) => { est.desde = e.target.value; quitarPreset(); render(); };
    $('#rep-hasta').onchange = (e) => { est.hasta = e.target.value; quitarPreset(); render(); };
    $('#rep-jefes-seg').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-j]'); if (b) { est.jefe = b.dataset.j; render(); }
    });

    $('#rep-det').addEventListener('click', (e) => {
      const b = e.target.closest('.b-cobrar'); if (!b) return;
      const r = A.db.registros.find((x) => x.id === b.closest('.det-fila').dataset.r); if (!r) return;
      if (confirm(`¿Confirmas que recibiste ${soles(r.monto)} del ${A.corto(r.fecha)} (${A.jefe(r.jefe).nombre})?`)) {
        A.marcarPagado([r], true, true); render(); A.toast('✔ Cobro confirmado');
      }
    });
    $('#rep-det').addEventListener('change', (e) => {
      if (!est.admin || !e.target.classList.contains('d-pag')) return;
      const r = A.db.registros.find((x) => x.id === e.target.closest('.det-fila').dataset.r);
      if (r) { A.marcarPagado([r], e.target.checked); render(); }
    });
    $('#rep-pagar').onclick = () => {
      const pend = registros().filter((r) => !r.pagado), m = pend.reduce((a, r) => a + r.monto, 0);
      const msg = est.admin
        ? `¿Marcar como pagado ${soles(m)} a ${A.trab(est.trab).nombre}? (${pend.length} registro(s))`
        : `¿Confirmas que recibiste ${soles(m)}? (${pend.length} día(s) pendientes)`;
      if (confirm(msg)) { A.marcarPagado(pend, true, !est.admin); render(); A.toast(est.admin ? '✔ Pago registrado' : '✔ Cobro confirmado'); }
    };
    $('#rep-csv').onclick = exportarCsv;
  }

  function quitarPreset() { A.$$('#rep-presets .chip').forEach((c) => c.classList.remove('on')); }

  function entrar() {
    const d = A.soloDig($('#rep-dni').value);
    if (A.esAdmin(d)) {
      est.admin = true;
      est.trab = (A.trabActivos()[0] || A.db.trabajadores[0] || {}).id || null;
      if (!est.trab) { $('#rep-err').textContent = 'No hay trabajadores registrados'; return; }
    } else {
      if (d.length !== 8) { $('#rep-err').textContent = 'El DNI debe tener 8 dígitos'; return; }
      const t = A.db.trabajadores.find((x) => x.dni === d);
      if (!t) { $('#rep-err').textContent = 'DNI no registrado. Pídele al encargado que lo agregue.'; return; }
      est.admin = false; est.trab = t.id;
    }
    $('#rep-dni').value = '';
    render();
  }

  function salir() { est.trab = null; est.admin = false; }

  function registros() {
    let a = est.desde, b = est.hasta; if (a && b && a > b) [a, b] = [b, a];
    return A.db.registros
      .filter((r) => r.trab === est.trab && (!a || r.fecha >= a) && (!b || r.fecha <= b) && (est.jefe === 'todos' || r.jefe === est.jefe))
      .sort((x, y) => y.fecha.localeCompare(x.fecha) || String(y.creado).localeCompare(String(x.creado)));
  }

  const rangoTxt = () => (est.desde === est.hasta ? A.largo(est.desde) : `del ${A.corto(est.desde)} al ${A.corto(est.hasta)}`);

  function render() {
    const dentro = !!est.trab;
    $('#rep-login').hidden = dentro;
    $('#rep-cont').hidden = !dentro;
    if (!dentro) {
      const hay = A.db.trabajadores.some((t) => t.dni) || A.db.adminDni;
      $('#rep-hint').textContent = hay ? '' : 'Aún no hay DNI registrados. El encargado debe agregarlos en Ajustes.';
      return;
    }
    const t = A.trab(est.trab);
    $('#rep-nombre').innerHTML = `<span class="avatar">${A.inicial(t.nombre)}</span><div>${esc(t.nombre)}<small>${est.admin ? 'Vista de encargado' : 'DNI ••••' + esc((t.dni || '').slice(-4))}</small></div>`;
    $('#rep-admin').hidden = !est.admin;
    if (est.admin) {
      $('#rep-trab-sel').innerHTML = A.db.trabajadores
        .map((x) => `<option value="${x.id}" ${x.id === est.trab ? 'selected' : ''}>${esc(x.nombre)}${x.activo === false ? ' (inactivo)' : ''}</option>`).join('');
    }
    $('#rep-desde').value = est.desde || '';
    $('#rep-hasta').value = est.hasta || '';
    $('#rep-jefes-seg').innerHTML = [{ id: 'todos', nombre: 'Todos' }].concat(A.db.jefes)
      .map((j) => `<button data-j="${j.id}" class="${est.jefe === j.id ? 'on' : ''}">${esc(j.nombre)}</button>`).join('');

    const regs = registros(), k = A.totales(regs);
    $('#k-rep-total').textContent = soles(k.tot);
    $('#k-rep-pag').textContent = soles(k.pag);
    $('#k-rep-pend').textContent = soles(k.pend);
    $('#rep-resumen').textContent = `${k.dias} día(s) trabajados ${rangoTxt()} · ${est.jefe === 'todos' ? 'todos los jefes' : A.jefe(est.jefe).nombre}`;
    $('#rep-pagar').hidden = !(k.pend > 0.001);
    $('#rep-pagar').textContent = est.admin ? '✔ Pagar pendiente' : '✔ Confirmar cobro de todo';

    $('#rep-det').innerHTML = regs.length ? regs.map((r) => `
      <div class="det-fila" data-r="${r.id}">
        <span class="f">${A.corto(r.fecha)}</span>
        <span class="l">${esc(A.jefe(r.jefe).nombre)}${r.labor ? ' · ' + esc(r.labor) : ''}</span>
        <b>${soles(r.monto)}</b>
        ${est.admin
          ? `<label class="check ${r.pagado ? 'on' : ''}"><input type="checkbox" class="d-pag" ${r.pagado ? 'checked' : ''}></label>`
          : r.pagado ? `<span class="tag ok">${r.confirmado ? 'Cobrado ✓' : 'Pagado'}</span>`
                     : `<button class="btn chico b-cobrar">✔ Confirmar</button>`}
      </div>`).join('')
      : '<div class="vacio">No hay días registrados en este periodo.</div>';
  }

  function exportarCsv() {
    const regs = registros().slice().reverse();
    if (!regs.length) return A.toast('No hay datos para exportar');
    const filas = [['Fecha', 'Trabajador', 'Jefe', 'Labor', 'Monto (S/)', 'Estado', 'Fecha de pago']]
      .concat(regs.map((r) => [r.fecha, A.trab(r.trab).nombre, A.jefe(r.jefe).nombre, r.labor || '', r.monto.toFixed(2), r.pagado ? (r.confirmado ? 'Cobrado (confirmado)' : 'Pagado') : 'Pendiente', r.fechaPago || '']));
    A.descargar(`reporte_${A.trab(est.trab).nombre}_${est.desde}_a_${est.hasta}.csv`, A.csv(filas), 'text/csv;charset=utf-8');
  }

  A.reporte = { init, render, salir };
})(window.App);
