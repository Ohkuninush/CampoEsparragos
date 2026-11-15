/* Pantalla de Registro: se pone el monto, se toca "Pagar", pasa al reporte y la tarjeta se limpia */
(function (A) {
  'use strict';
  const { $, esc, soles } = A;
  let fecha, jefe;

  function init() {
    fecha = A.hoy();
    jefe = (A.jefesActivos()[0] || {}).id;

    $('#dia-fecha').addEventListener('change', (e) => { if (e.target.value) { fecha = e.target.value; render(); } });
    $('#dia-prev').onclick = () => { fecha = A.sumarDias(fecha, -1); render(); };
    $('#dia-next').onclick = () => { fecha = A.sumarDias(fecha, 1); render(); };
    $('#dia-hoy').onclick = () => { fecha = A.hoy(); render(); };
    $('#dia-jefes').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-j]'); if (b) { jefe = b.dataset.j; render(); }
    });

    const lista = $('#dia-lista');
    lista.addEventListener('click', (e) => { const b = e.target.closest('.b-pagar'); if (b) pagar(b.closest('.trab')); });
    lista.addEventListener('change', (e) => { if (e.target.classList.contains('c-pend')) textoBoton(e.target.closest('.trab')); });
    lista.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('.c-monto, .c-labor')) { e.preventDefault(); pagar(e.target.closest('.trab')); }
    });

    $('#dia-pagar-todo').onclick = pagarTodos;
    $('#dia-copiar').onclick = montosDeAyer;

    $('#dia-hechos').addEventListener('click', (e) => {
      const fila = e.target.closest('.hecho'); if (!fila) return;
      const r = A.db.registros.find((x) => x.id === fila.dataset.r); if (!r) return;
      if (e.target.closest('.x')) {
        if (confirm(`¿Eliminar ${soles(r.monto)} de ${A.trab(r.trab).nombre}?`)) { A.eliminarRegistro(r.id); renderHechos(); A.toast('Registro eliminado'); }
      } else if (e.target.closest('.tag')) {
        A.marcarPagado([r], !r.pagado); renderHechos();
        A.toast(r.pagado ? '✔ Marcado como pagado' : 'Marcado como pendiente');
      }
    });
  }

  function render() {
    if (!A.jefesActivos().some((j) => j.id === jefe)) jefe = (A.jefesActivos()[0] || {}).id;
    $('#dia-fecha').value = fecha;
    $('#dia-fecha-txt').textContent = A.largo(fecha) + (fecha === A.hoy() ? ' · hoy' : '');
    $('#dia-jefes').innerHTML = A.jefesActivos()
      .map((j) => `<button data-j="${j.id}" class="${j.id === jefe ? 'on' : ''}">${esc(j.nombre)}</button>`).join('');
    $('#dia-sub').textContent = '· ' + A.jefe(jefe).nombre;

    const ts = A.trabActivos();
    $('#dia-lista').innerHTML = ts.length
      ? ts.map(tarjeta).join('')
      : '<div class="vacio">No hay trabajadores activos. Agrégalos en Ajustes.</div>';
    renderHechos();
  }

  function tarjeta(t) {
    return `<div class="trab" data-t="${t.id}">
      <div class="nombre"><span class="avatar">${A.inicial(t.nombre)}</span><div>${esc(t.nombre)}<small class="ya"></small></div></div>
      <label class="check"><input type="checkbox" class="c-pend"> Pagar después</label>
      <div class="campos">
        <div class="monto-wrap"><span>S/</span><input type="number" class="c-monto" inputmode="decimal" min="0" step="0.5" placeholder="0.00"></div>
        <input type="text" class="labor c-labor" list="labores" placeholder="Labor">
      </div>
      <button class="btn prim b-pagar">💰 Pagar</button>
    </div>`;
  }

  function textoBoton(card) {
    const pend = card.querySelector('.c-pend').checked, b = card.querySelector('.b-pagar');
    b.textContent = pend ? '⏳ Guardar como pendiente' : '💰 Pagar';
    b.classList.toggle('pend', pend);
    card.querySelector('.check').classList.toggle('on', pend);
  }

  /* Guarda el pago de una tarjeta y la limpia. Devuelve el registro o null */
  function pagar(card, silencioso) {
    const t = card.dataset.t, inp = card.querySelector('.c-monto'), monto = A.leerMonto(inp.value);
    if (!monto) {
      if (!silencioso) { A.toast('Ingresa el monto de ' + A.trab(t).nombre); inp.focus(); }
      return null;
    }
    const pend = card.querySelector('.c-pend').checked;
    const r = A.agregarRegistro({ fecha, jefe, trab: t, monto, labor: card.querySelector('.c-labor').value.trim(), pagado: !pend });
    limpiar(card);
    if (!silencioso) A.toast(`${pend ? '⏳' : '✔'} ${A.trab(t).nombre}: ${soles(monto)} ${pend ? 'pendiente' : 'pagado'} → reporte`);
    renderHechos();
    return r;
  }

  function limpiar(card) {
    card.querySelector('.c-monto').value = '';
    card.querySelector('.c-labor').value = '';
    card.querySelector('.c-pend').checked = false;
    textoBoton(card);
    card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
  }

  function pagarTodos() {
    const cards = A.$$('#dia-lista .trab').filter((c) => A.leerMonto(c.querySelector('.c-monto').value));
    if (!cards.length) return A.toast('Pon el monto de al menos un trabajador');
    const total = cards.reduce((a, c) => a + A.leerMonto(c.querySelector('.c-monto').value), 0);
    if (!confirm(`¿Registrar ${cards.length} pago(s) por ${soles(total)} con ${A.jefe(jefe).nombre}?`)) return;
    cards.forEach((c) => pagar(c, true));
    A.toast(`✔ ${cards.length} pago(s) registrados → reporte`);
  }

  function montosDeAyer() {
    const ayer = A.sumarDias(fecha, -1);
    const prev = A.db.registros.filter((r) => r.fecha === ayer && r.jefe === jefe);
    if (!prev.length) return A.toast('El día anterior no tiene pagos con ' + A.jefe(jefe).nombre);
    let n = 0;
    A.$$('#dia-lista .trab').forEach((c) => {
      const suma = prev.filter((r) => r.trab === c.dataset.t).reduce((a, r) => a + r.monto, 0);
      const inp = c.querySelector('.c-monto');
      if (suma && !inp.value) { inp.value = A.redondear(suma); n++; }
    });
    A.toast(n ? `↺ ${n} monto(s) puestos. Revisa y toca Pagar.` : 'Las tarjetas ya tienen montos');
  }

  /* Lista de lo ya registrado en la fecha y jefe actuales */
  function renderHechos() {
    const regs = A.db.registros.filter((r) => r.fecha === fecha && r.jefe === jefe)
      .sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
    const k = A.totales(regs);
    $('#k-dia-total').textContent = soles(k.tot);
    $('#k-dia-pag').textContent = soles(k.pag);
    $('#k-dia-pend').textContent = soles(k.pend);
    $('#dia-hechos-sub').textContent = '· ' + A.jefe(jefe).nombre;
    $('#dia-hechos').innerHTML = regs.length ? regs.map((r) => `
      <div class="hecho" data-r="${r.id}">
        <span class="avatar">${A.inicial(A.trab(r.trab).nombre)}</span>
        <span><span class="n">${esc(A.trab(r.trab).nombre)}</span> <span class="l">${r.labor ? '· ' + esc(r.labor) : ''}</span></span>
        <b>${soles(r.monto)}</b>
        <span class="tag ${r.pagado ? 'ok' : 'pend'}" title="Tocar para cambiar">${r.pagado ? 'Pagado' : 'Pendiente'}</span>
        <button class="x" title="Eliminar" aria-label="Eliminar">✕</button>
      </div>`).join('')
      : '<div class="vacio">Todavía no hay pagos en este día.</div>';

    // "Ya registrado" en cada tarjeta
    A.$$('#dia-lista .trab').forEach((c) => {
      const s = regs.filter((r) => r.trab === c.dataset.t).reduce((a, r) => a + r.monto, 0);
      c.querySelector('.ya').textContent = s ? '✓ Lleva ' + soles(s) : '';
    });
  }

  A.registro = { init, render };
})(window.App);
