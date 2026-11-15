/*
 * Capa de datos. Hoy guarda en localStorage (en el mismo equipo).
 * Para pasar a la nube (Supabase, Firebase, Cloudflare D1...) solo hay que
 * reemplazar cargar() y guardar() manteniendo la misma forma de A.db.
 *
 * A.db = {
 *   version, adminDni,
 *   jefes:        [{ id, nombre, activo }],
 *   trabajadores: [{ id, nombre, dni, activo }],
 *   registros:    [{ id, creado, fecha, jefe, trab, monto, labor, pagado, fechaPago, confirmado }]
 *   confirmado = true cuando el trabajador confirmó el cobro desde su reporte
 * }
 */
(function (A) {
  'use strict';
  const KEY = 'cobro_campo_esparragos_v1';
  const VERSION = 3;
  const ADMIN_DNI = '72691095'; // DNI del encargado para entrar a Ajustes (se puede cambiar en Ajustes)

  A.base = () => ({
    version: VERSION,
    adminDni: ADMIN_DNI,
    jefes: [
      { id: 'j1', nombre: 'Mamá', activo: true },
      { id: 'j2', nombre: 'Tío', activo: true }
    ],
    trabajadores: ['Yomira', 'Waldo', 'Yulian', 'Aderico'].map((n, i) => ({ id: 't' + (i + 1), nombre: n, activo: true })),
    registros: []
  });

  A.validarDb = (d) => !!d && Array.isArray(d.registros) && Array.isArray(d.trabajadores) && Array.isArray(d.jefes);

  A.cargar = () => {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    A.db = A.validarDb(d) ? d : A.base();
    // Migración v1 -> v2: agrega fecha de creación a registros antiguos
    A.db.registros.forEach((r) => { if (!r.creado) r.creado = r.fecha + 'T12:00:00'; });
    if (!A.db.adminDni) A.db.adminDni = ADMIN_DNI;
    A.db.version = VERSION;
  };

  A.guardar = () => {
    try { localStorage.setItem(KEY, JSON.stringify(A.db)); }
    catch (e) { A.toast('⚠ No se pudo guardar en este navegador'); }
  };

  /* ---- Consultas ---- */
  A.jefe = (id) => A.db.jefes.find((j) => j.id === id) || { nombre: '¿?' };
  A.trab = (id) => A.db.trabajadores.find((t) => t.id === id) || { nombre: '¿?' };
  A.jefesActivos = () => A.db.jefes.filter((j) => j.activo !== false);
  A.trabActivos = () => A.db.trabajadores.filter((t) => t.activo !== false);

  A.totales = (regs) => {
    const tot = regs.reduce((a, r) => a + r.monto, 0);
    const pag = regs.filter((r) => r.pagado).reduce((a, r) => a + r.monto, 0);
    return { tot, pag, pend: tot - pag, dias: new Set(regs.map((r) => r.fecha)).size };
  };

  /* ---- Cambios ---- */
  A.agregarRegistro = (o) => {
    const r = Object.assign({ id: A.uid(), creado: new Date().toISOString(), labor: '', pagado: true, fechaPago: null }, o);
    if (r.pagado && !r.fechaPago) r.fechaPago = A.hoy();
    A.db.registros.push(r);
    A.guardar();
    return r;
  };
  A.eliminarRegistro = (id) => { A.db.registros = A.db.registros.filter((r) => r.id !== id); A.guardar(); };
  A.esAdmin = (dni) => dni === (A.db.adminDni || ADMIN_DNI);
  A.marcarPagado = (regs, valor, porTrabajador) => {
    regs.forEach((r) => {
      r.pagado = valor; r.fechaPago = valor ? A.hoy() : null;
      r.confirmado = !!(valor && porTrabajador);
    });
    A.guardar();
  };
})(window.App);
