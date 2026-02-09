# Toro Rápido – Web de pedidos y menú

Sitio web para negocio de comidas: portada, menú con productos desde Google Sheets, detalle de producto con opciones/agregados, carrito, envío por WhatsApp y horarios de atención.

## Características

- **Portada** con estado del local (abierto/cerrado), horarios y enlace al menú
- **Menú simple o compuesto** cargado desde Google Sheets vía Apps Script
- **Productos con ofertas**: precio actual, precio anterior, % descuento y monto ahorrado
- **Opciones y agregados** por producto (aderezo, tamaño, agregados extra, guarnición) con recargos
- **Carrito** con resumen, envío y total; confirmación redirige a WhatsApp con el pedido
- **Horarios de atención** y **feriados** desde hojas de cálculo
- **Reserva** cuando el local está cerrado pero dentro del horario permitido
- Diseño responsive y orientado a móviles

## Tecnologías

- HTML5, CSS3, JavaScript (vanilla)
- Google Sheets como base de datos (menú, opciones, horarios, feriados)
- Google Apps Script para leer/escribir hojas y enviar pedidos

## Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Cuenta de Google para Sheets y Apps Script
- Para producción: alojamiento estático (GitHub Pages, Netlify, Vercel, etc.)

## Instalación rápida

1. Cloná o descargá el repositorio.
2. Configurá `config.js` con tu WhatsApp, URLs de Apps Script y nombres de hojas (ver [docs/CONFIGURACION.md](docs/CONFIGURACION.md)).
3. Creá las hojas en Google Sheets según [docs/HOJAS_GOOGLE_SHEETS.md](docs/HOJAS_GOOGLE_SHEETS.md).
4. Desplegá el script de Apps Script (ver [docs/APPS_SCRIPT_HORARIO_FERIADO.md](docs/APPS_SCRIPT_HORARIO_FERIADO.md) y [docs/APPS_SCRIPT_COMPLETO.gs](docs/APPS_SCRIPT_COMPLETO.gs)).
5. Serví los archivos por HTTP (por ejemplo con `npx serve .` o subiendo a GitHub Pages).

## Configuración

Todo se controla desde **`config.js`** en la raíz del proyecto:

| Sección | Qué configura |
|--------|----------------|
| **General** | Modo debug, menú activo (simple/compuesto), máximo de productos por categoría |
| **Contacto** | Teléfono WhatsApp, Instagram, enlaces a PedidosYa/Rappi |
| **Apps Script** | URLs para menú/horarios y para envío de pedidos |
| **Hojas** | Nombres de hojas: menú simple, menú compuesto, detalle, opciones, horario, feriados |
| **Horario** | Minutos antes de apertura/cierre, cuenta regresiva, reserva |
| **Delivery** | Costo de envío y monto mínimo para envío gratis |

Detalle completo en [docs/CONFIGURACION.md](docs/CONFIGURACION.md).

## Estructura del proyecto

- **Página de inicio del sitio**: `index.html` redirige al **panel de administración** (`scr/administracion/dashboard.html`). Si no hay sesión se muestra el login; si hay sesión, el dashboard.
- **Página pública (portada para clientes)**: `inicio-publico.html` — portada con carrusel, horarios, enlace al menú y redes.

```
├── config.js              # Configuración central
├── index.html             # Entrada: redirige a administración (login/dashboard)
├── inicio-publico.html    # Portada pública (clientes)
├── index.js / index.css   # Lógica y estilos de la portada pública
├── README.md              # Este archivo
├── docs/                  # Documentación
│   ├── INDICE.md          # Índice de la documentación
│   ├── INSTALACION.md     # Pasos de instalación
│   ├── CONFIGURACION.md   # Referencia de config.js y Sheets
│   ├── HOJAS_GOOGLE_SHEETS.md  # Columnas de cada hoja
│   ├── MENU_OPCIONES_SHEET.md  # Opciones/agregados por producto
│   ├── APPS_SCRIPT_COMPLETO.gs # Código doGet/doPost
│   └── APPS_SCRIPT_HORARIO_FERIADO.md
├── imagenes/portada/      # Imágenes del carousel
└── scr/
    ├── menu/              # Menú (simple y compuesto), carrito, horario
    ├── producto/          # Detalle de producto y opciones
    ├── pedidos/           # Formulario y envío a WhatsApp
    ├── confirmacion/      # Página post-pedido
    ├── footer/            # Pie de página
    └── administracion/    # Login, dashboard y gestión (menú simple/compuesto)
```

## Documentación

- [Índice de documentación](docs/INDICE.md)
- [Instalación paso a paso](docs/INSTALACION.md)
- [Configuración (config.js y Google Sheets)](docs/CONFIGURACION.md)
- [Hojas de Google Sheets – columnas](docs/HOJAS_GOOGLE_SHEETS.md)
- [Opciones/agregados por producto](docs/MENU_OPCIONES_SHEET.md)
- [Apps Script – horarios y feriados](docs/APPS_SCRIPT_HORARIO_FERIADO.md)

## Licencia

Proyecto de uso interno / comercial. Ajustar según necesidad.
