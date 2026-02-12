# Carga de ítems desde productos-compuesto-detalle

En la página **Productos compuestos**, cuando no hay ítems en memoria (sessionStorage), se pide a Apps Script la hoja **productos-compuesto-detalle** y se filtran en el navegador solo las filas cuyo **idproducto** coincide con el de la página (ej. `PROD-COMPUESTO-mljsg9lrb3n5plbrcle9`).

## Si no se cargan los datos, revisá:

### 1. URL de Apps Script
- En **scr/Configuracion/config.js** debe estar definida `appsScriptMenuUrl` con la URL de despliegue del script (ej. `https://script.google.com/macros/s/.../exec`).
- Probá abrir en el navegador:  
  `https://script.google.com/.../exec?sheetName=productos-compuesto-detalle`  
  Deberías ver JSON con `headers` y `rows`. Si ves una página de login de Google, el despliegue debe ser **“Quién puede acceder: Cualquier persona”**.

### 2. CORS y origen (file:// vs HTTP)
- Si abrís el dashboard desde **file://** (archivo local), el navegador puede bloquear la petición por CORS y no traer datos.
- **Solución:** Servir la app por HTTP (ej. con Live Server, `npx serve`, o subirla a un hosting). Así el origen es una URL y la petición a script.google.com suele permitirse.

### 3. Nombre de la hoja
- En el Google Sheet debe existir una pestaña llamada exactamente **productos-compuesto-detalle** (o el nombre que tengas en `APP_CONFIG.productosCompuestoDetalleSheetName`).

### 4. Estructura de la hoja
- **Fila 1:** encabezados. Tiene que haber una columna **idproducto** (o "ID Producto"; se busca por nombre normalizado).
- En esa columna deben estar los valores tipo `PROD-COMPUESTO-xxxxx` que coincidan con el idproducto que se muestra en la página (párrafo “Producto compuesto PROD-COMPUESTO-xxx con N ítem(s)…”).

### 5. Consola del navegador (F12)
- Si la carga falla, en la página se muestra un mensaje en rojo con el motivo.
- En la consola (F12 → Console) aparecen mensajes `[productos-compuestos]` con más detalle (URL, respuesta, error de red o de la API).

### Resumen de requisitos
| Requisito | Dónde |
|-----------|--------|
| URL Apps Script | config.js → appsScriptMenuUrl |
| Despliegue “Cualquier persona” | Google Apps Script → Implementar como aplicación web |
| App servida por HTTP (no file://) | Entorno local o hosting |
| Hoja productos-compuesto-detalle | Google Sheet, nombre exacto |
| Columna idproducto | Fila 1 de la hoja |
| Valores PROD-COMPUESTO-xxx | En la columna idproducto |
