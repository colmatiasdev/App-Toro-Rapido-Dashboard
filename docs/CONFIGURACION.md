# Configuración del proyecto

Referencia de **`config.js`** y relación con Google Sheets.

## Ubicación

El archivo de configuración está en la **raíz del proyecto**: `config.js`. Se carga en todas las páginas que incluyen `<script src="config.js"></script>` (o la ruta correspondiente).

Las opciones se exponen en `window.APP_CONFIG`. No hace falta crear archivos `.env`; todo se edita en `config.js`.

---

## Secciones de config.js

### General y debug

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `debug` | `boolean` | `true`: en la portada se muestran botones para probar menú simple y compuesto. `false`: solo el menú definido en `menuActivo`. |
| `menuVersiones` | `string[]` | Lista de versiones de menú (ej. `["menu-simple", "menu-compuesto"]`). Solo se usa si `debug` es true. |
| `menuActivo` | `string` | Menú que ve el usuario cuando `debug` es false. Debe ser uno de los valores de `menuVersiones` (ej. `"menu-compuesto"`). |
| `maxProductos` | `number` | Límite de productos por categoría en el menú. `0` = sin límite. También es el máximo de unidades por producto al agregar al carrito. |

### Contacto y redes

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `urlCorta` | `string` | URL corta para compartir en redes, WhatsApp o mensajes (ej. `"https://bit.ly/tororapido"`). Si está vacío no se usa. Ver [URL_CORTA.md](URL_CORTA.md). |
| `telefonoNegocio` | `string` | Número de WhatsApp con código de país, **sin** el símbolo `+` (ej. `"5493814130520"`). Se usa en el enlace de envío del pedido. |
| `instagram` | `object` | `name`: usuario; `url`: enlace al perfil. Se usa en el footer y en la portada si está enlazado. |
| `plataformas` | `object` | Enlaces a PedidosYa, Rappi, etc. para mostrar en el sitio. |

### Apps Script y fuentes de datos

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `appsScriptPedidosUrl` | `string` | URL del despliegue de Apps Script que recibe el envío del pedido (doPost). |
| `appsScriptMenuUrl` | `string` | URL del despliegue de Apps Script que sirve menú, horarios, feriados y opciones (doGet con `action=list&sheetName=...`). Puede ser la misma que `appsScriptPedidosUrl` si el mismo script hace todo. |

### Menú – hojas de cálculo

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `googleSheetUrl` | `string` | (Opcional) URL pública CSV del menú simple. Si está vacía o no se usa, el menú simple se carga vía Apps Script. |
| `menuSimpleSheetName` | `string` | Nombre de la **pestaña** del Sheet para menú simple (ej. `"menu-toro-rapido-web-simple"`). |
| `menuCompuestoSheetName` | `string` | Nombre de la pestaña del menú compuesto (ej. `"menu-toro-rapido-web-compuesto"`). |
| `googleSheetUrlMenuCompuesto` | `string` | (Opcional) URL CSV del menú compuesto. Si vacía, se usa solo Apps Script. |
| `menuCompuestoDetalleSheetName` | `string` | Nombre de la pestaña del **detalle** del menú compuesto (ej. `"menu-compuesto-detalle"`). |
| `googleSheetUrlMenuCompuestoDetalle` | `string` | (Opcional) URL CSV del detalle. Si vacía, se usa Apps Script. |
| `menuOpcionesSheetName` | `string` | Nombre de la pestaña de **opciones/agregados** por producto (ej. `"menu-opciones"`). Ver [MENU_OPCIONES_SHEET.md](MENU_OPCIONES_SHEET.md). |

### Horario de atención

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `horarioSheetName` | `string` | Nombre de la pestaña de horarios (ej. `"HORARIO-TORO-RAPIDO"`). |
| `minutosAntesApertura` | `number` | Minutos antes de abrir para mostrar “El local abre a las HH:MM”. |
| `minutosAntesCierre` | `number` | Minutos antes del cierre para mostrar “¡Pedí antes del cierre!”. |
| `minutosCuentaRegresiva` | `number` | Minutos antes del cierre para mostrar la cuenta regresiva (MM:SS) flotante. |
| `horasAntesAperturaParaReserva` | `number` | Horas antes de la apertura en las que se permite hacer reserva (local cerrado). |

### Badge flotante (menú)

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `mostrarBadgeFlotanteCerrado` | `boolean` | Mostrar badge “Local CERRADO” cuando está cerrado y no hay reserva. |
| `mostrarBadgeFlotanteReserva` | `boolean` | Mostrar badge cuando está cerrado pero con reserva habilitada. |
| `mostrarBadgeFlotanteAbierto` | `boolean` | Mostrar badge “Local ABIERTO” en el menú (si está implementado). |

### Feriados

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `feriadoSheetName` | `string` | Nombre de la pestaña de feriados (ej. `"FERIADO-TORO-RAPIDO"`). |
| `feriadoDiasAntes` | `number` | Días antes del feriado para mostrar la leyenda (cuando SE_ATIENDE = NO). |

### Delivery y pedidos

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `costoEnvioBase` | `number` | Costo de envío en pesos cuando el subtotal es menor que `montoMinimoEnvioGratis`. |
| `montoMinimoEnvioGratis` | `number` | Subtotal mínimo en pesos a partir del cual el envío es gratis. |

---

## Relación con Google Sheets

- Cada `*SheetName` debe coincidir **exactamente** con el nombre de una **pestaña** del libro de Google Sheets vinculado al Apps Script.
- El script usa `SpreadsheetApp.getActiveSpreadsheet()` por defecto (libro al que está asociado el script). Si el script está en otro proyecto, hay que usar `openById("ID_DEL_LIBRO")` y que ese libro contenga las hojas con esos nombres.

Para el detalle de columnas de cada hoja, ver [HOJAS_GOOGLE_SHEETS.md](HOJAS_GOOGLE_SHEETS.md).
