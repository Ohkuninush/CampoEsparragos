# 🌱 Cobro Campo · Espárragos

App web (PWA) para registrar los pagos diarios de los trabajadores del campo de espárragos y que cada trabajador pueda ver lo que ganó usando su DNI.

- **Jefes:** Mamá y Tío (se pueden agregar más)
- **Trabajadores:** Yomira, Waldo, Yulian y Aderico (se pueden agregar más)
- **Pagos:** se ingresan a mano y siempre en soles (S/)
- Funciona en **celular y tablet**, se puede **instalar como app** y abre **sin internet**

## Funciones

### 💰 Registro (encargado)
1. Elegir la **fecha** y el **jefe** (Mamá / Tío).
2. Poner el **monto** y, si quieres, la **labor** (cosecha, riego, deshierbe…).
3. Tocar **Pagar**. El pago pasa al reporte y la tarjeta se limpia.
   - Si todavía no se le pagó, marca **Pagar después**. Se guarda como *pendiente*.
   - **Pagar todos** registra de una vez todas las tarjetas que tienen monto.
   - **Montos de ayer** llena las tarjetas con lo del día anterior para revisarlos.
4. Abajo aparece **Registrado este día**. Ahí se puede cambiar Pagado/Pendiente o eliminar un registro.

### 📊 Reporte (cada trabajador con su DNI)
- Cada trabajador entra con su **DNI** y ve **solo su reporte**.
- Periodos: esta semana, semana pasada, quincena, este mes, todo (o fechas a mano).
- Filtro por jefe: **Todos / Mamá / Tío**.
- Muestra lo que ganó, lo pagado, lo que falta cobrar, los días trabajados y el detalle de cada día.
- Se puede enviar por **WhatsApp**, exportar a **Excel (CSV)** o **imprimir**.
- Con el **DNI del encargado** se ve el reporte de cualquier trabajador y se pueden marcar pagos.

### ⚙️ Ajustes
- Trabajadores: nombre, **DNI**, activar o desactivar.
- Jefes: nombre, activar o desactivar.
- DNI del encargado.
- Respaldo: descargar o cargar los datos en un archivo `.json`, o borrarlo todo.

## Estructura

```
cobro-campo/
├── index.html            # Pantallas (Registro, Reporte, Ajustes)
├── manifest.webmanifest  # Configuración para instalar como app
├── sw.js                 # Service worker (funciona sin internet)
├── css/styles.css        # Estilos responsive (móvil / tablet / PC)
├── icons/                # Íconos de la app
└── js/
    ├── utils.js          # Formato de soles, fechas, avisos, descargas
    ├── storage.js        # Capa de datos (hoy: localStorage)
    ├── registro.js       # Pantalla de registro de pagos
    ├── reporte.js        # Reporte por trabajador con DNI
    ├── ajustes.js        # Trabajadores, jefes, DNI y respaldo
    └── app.js            # Arranque y navegación
```

No usa frameworks ni compilación: es HTML, CSS y JavaScript simple.

## Probar en tu PC

Abre `index.html` con doble clic, o mejor levanta un servidor local (así también funciona el modo app):

```bash
cd cobro-campo
python -m http.server 8080
# abre http://localhost:8080
```

Para probarlo en el celular, que esté en la misma red Wi-Fi y abre `http://IP-DE-TU-PC:8080`.

## Publicar gratis (GitHub Pages)

```bash
git remote add origin https://github.com/TU_USUARIO/cobro-campo.git
git branch -M main
git push -u origin main
```

En GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
La app queda en `https://TU_USUARIO.github.io/cobro-campo/`.

**Instalar en el celular:**
- **iPhone (Safari):** Compartir → *Agregar a pantalla de inicio*
- **Android (Chrome):** menú ⋮ → *Instalar app*

> Cuando publiques cambios, sube el número de `VERSION` en `sw.js` para que los celulares descarguen la versión nueva.

## ⚠️ Importante sobre los datos

- Los datos se guardan **en el navegador del equipo** donde se registran (`localStorage`). No se comparten entre celulares.
- Si un trabajador abre la app en su propio celular, **no verá sus pagos**. Para eso hace falta una base de datos en la nube (ver "Siguientes pasos").
- Si se borran los datos del navegador, se pierde todo. **Descarga un respaldo seguido** desde Ajustes.
- El DNI separa los reportes, pero **no es una contraseña segura**.
- Los archivos de respaldo y los CSV tienen DNI y montos. Están en `.gitignore` para que **no se suban a GitHub**.

## Siguientes pasos sugeridos

- [ ] Base de datos en la nube (Supabase, Firebase o Cloudflare D1) para que cada trabajador vea su reporte desde su propio celular. Solo hay que cambiar `js/storage.js`.
- [ ] Clave (PIN) para las pestañas Registro y Ajustes.
- [ ] Adelantos y descuentos.
- [ ] Pago por kilos o por jornal con tarifa automática.
