/* Pantalla de Ajustes (solo encargado, con DNI): trabajadores, jefes, DNI del encargado y respaldo */
(function (A) {
  'use strict';
  const { $, esc } = A;
  const coleccion = (tipo) => (tipo === 't' ? A.db.trabajadores : A.db.jefes);
  let abierto = false; // se pide el DNI del encargado cada vez que se entra

  function init() {
    const v = $('#v-ajustes');

    $('#aj-dni-in').addEventListener('input', (e) => { e.target.value = A.soloDig(e.target.value).slice(0, 8); $('#aj-err').textContent = ''; });
    $('#aj-dni-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
    $('#aj-entrar').onclick = entrar;
    $('#aj-salir').onclick = () => { cerrar(); render(); };

    v.addEventListener('change', (e) => {
      const it = e.target.closest('.aj-item'); if (!it) return;
      const o = coleccion(it.dataset.tipo).find((x) => x.id === it.dataset.id); if (!o) return;

      if (e.target.classList.contains('aj-dni')) {
        const d = A.soloDig(e.target.value);
        if (!d) { delete o.dni; A.guardar(); return A.toast('DNI quitado'); }
        if (!dniValido(d, o.id)) { e.target.value = o.dni || ''; return; }
        o.dni = d; A.guardar(); return A.toast('✓ DNI de ' + o.nombre + ' guardado');
      }
      if (e.target.classList.contains('aj-nombre')) {
        const nombre = e.target.value.trim();
        if (!nombre) { e.target.value = o.nombre; return; }
        o.nombre = nombre; A.guardar(); A.toast('Nombre actualizado');
      }
    });

    v.addEventListener('click', (e) => {
      if (!e.target.classList.contains('aj-toggle')) return;
      const it = e.target.closest('.aj-item');
      const o = coleccion(it.dataset.tipo).find((x) => x.id === it.dataset.id);
      if (it.dataset.tipo === 'j' && o.activo !== false && A.jefesActivos().length <= 1) return A.toast('Debe quedar al menos un jefe activo');
      o.activo = o.activo === false; A.guardar(); render();
    });

    $('#aj-trab-add').onclick = () => agregar('t', $('#aj-trab-nuevo'));
    $('#aj-jefe-add').onclick = () => agregar('j', $('#aj-jefe-nuevo'));
    $('#aj-trab-nuevo').onkeydown = (e) => { if (e.key === 'Enter') agregar('t', e.target); };
    $('#aj-jefe-nuevo').onkeydown = (e) => { if (e.key === 'Enter') agregar('j', e.target); };

    $('#aj-admin-dni').addEventListener('change', (e) => {
      const d = A.soloDig(e.target.value);
      if (d === A.db.adminDni) return;
      if (d.length < 6) { A.toast('El DNI del encargado debe tener de 6 a 8 dígitos'); e.target.value = A.db.adminDni; return; }
      if (!dniValido(d, 'admin') || !confirm(`¿Cambiar el DNI del encargado a ${d}? Desde ahora Ajustes se abrirá con ese DNI.`)) { e.target.value = A.db.adminDni; return; }
      A.db.adminDni = d; A.guardar(); A.toast('✓ DNI de encargado guardado');
    });

    $('#aj-exp').onclick = () => A.descargar(`respaldo_cobro_campo_${A.hoy()}.json`, JSON.stringify(A.db, null, 1), 'application/json');
    $('#aj-imp').onclick = () => $('#aj-imp-file').click();
    $('#aj-imp-file').onchange = importar;
    $('#aj-borrar').onclick = () => {
      if (!confirm('¿Borrar TODOS los registros y volver a la configuración inicial?')) return;
      if (!confirm('Esto no se puede deshacer. ¿Seguro?')) return;
      A.db = A.base(); A.guardar(); render(); A.toast('Datos borrados');
    };
  }

  function entrar() {
    const d = A.soloDig($('#aj-dni-in').value);
    if (!A.esAdmin(d)) { $('#aj-err').textContent = 'Este DNI no tiene permiso para editar.'; return; }
    $('#aj-dni-in').value = ''; abierto = true; render();
  }
  function cerrar() { abierto = false; }

  function render() {
    $('#aj-login').hidden = abierto;
    $('#aj-cont').hidden = !abierto;
    if (!abierto) return;
    const item = (o, tipo) => `<div class="aj-item ${o.activo === false ? 'inactivo' : ''}" data-id="${o.id}" data-tipo="${tipo}">
        <input type="text" value="${esc(o.nombre)}" class="aj-nombre" aria-label="Nombre">
        ${tipo === 't' ? `<input type="text" class="aj-dni" inputmode="numeric" maxlength="8" placeholder="DNI" value="${esc(o.dni || '')}" aria-label="DNI">` : ''}
        <button class="btn chico aj-toggle">${o.activo === false ? 'Activar' : 'Desactivar'}</button>
      </div>`;
    $('#aj-trab').innerHTML = A.db.trabajadores.map((t) => item(t, 't')).join('') || '<div class="vacio">Sin trabajadores</div>';
    $('#aj-jefes').innerHTML = A.db.jefes.map((j) => item(j, 'j')).join('');
    $('#aj-admin-dni').value = A.db.adminDni || '';
  }

  function dniValido(d, excluir) {
    if (excluir !== 'admin' && d.length !== 8) { A.toast('El DNI debe tener 8 dígitos'); return false; }
    const usado = (A.db.adminDni === d && excluir !== 'admin') || A.db.trabajadores.some((t) => t.dni === d && t.id !== excluir);
    if (usado) { A.toast('Ese DNI ya está usado'); return false; }
    return true;
  }

  function agregar(tipo, input) {
    const v = input.value.trim(); if (!v) return;
    const col = coleccion(tipo);
    if (col.some((x) => x.nombre.toLowerCase() === v.toLowerCase())) return A.toast('Ese nombre ya existe');
    col.push({ id: tipo + A.uid(), nombre: v, activo: true });
    A.guardar(); input.value = ''; render(); A.toast('✓ Agregado');
  }

  function importar(e) {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (!A.validarDb(d)) throw new Error('formato');
        if (!confirm(`El respaldo tiene ${d.registros.length} registros. Reemplazará los datos actuales. ¿Continuar?`)) return;
        A.db = d; A.guardar(); A.cargar(); render(); A.toast('✓ Respaldo cargado');
      } catch (x) { alert('El archivo no es un respaldo válido.'); }
      finally { e.target.value = ''; }
    };
    rd.readAsText(f);
  }

  A.ajustes = { init, render, cerrar };
})(window.App);
