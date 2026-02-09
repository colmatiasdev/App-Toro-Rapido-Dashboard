/** Formato de moneda compartido en toda la app (es-AR). */
window.formatMoneda = (valor) => `$ ${Number(valor).toLocaleString("es-AR")}`;

window.APP_CONFIG = {
    // ========== GENERAL Y DEBUG ==========
    /** true: en la página principal (index) se muestran botones por cada versión de menú para pruebas. false: solo el menú activo. */
    debug: false,
    /** Lista de versiones de menú disponibles. Solo se usa cuando debug es true. */
    menuVersiones: ["menu-simple", "menu-compuesto"],
    /** Menú público activo cuando debug es false. Debe coincidir con un valor de menuVersiones. */
    menuActivo: "menu-compuesto",
    /** Límite máximo de productos a mostrar por categoría en el menú (0 = sin límite). */
    maxProductos: 10,

    // ========== CONTACTO Y REDES ==========
    /** URL corta para compartir en redes, WhatsApp o mensajes (ej. bit.ly/tororapido). Si está vacío no se usa. Ver docs/URL_CORTA.md */
    urlCorta: "",
    /** Número de WhatsApp del negocio (con código de país, sin +). Se usa para enlaces y envío de pedidos. */
    telefonoNegocio: "5493814130520",
    /** Datos de Instagram para mostrar en el sitio. */
    instagram: {
        name: "tororapido.delivery",
        url: "https://www.instagram.com/tororapido.delivery/"
    },
    /** Enlaces a plataformas de delivery externas (PedidosYa, Rappi, etc.). */
    plataformas: {
        pedidosYa: "https://www.pedidosya.com.ar",
        rappi: "https://www.rappi.com.ar"
    },

    // ========== APPS SCRIPT Y FUENTES DE DATOS ==========
    /** URL del despliegue de Google Apps Script para envío de pedidos. */
    appsScriptPedidosUrl: "https://script.google.com/macros/s/AKfycbxXjOn5ygjiIR7yBuoIcIvgLwF5U2ZgtQ-XGGA_YDP1Fkdk7N11QaMkOWxpKSUyw7hNKg/exec",
    /** URL del despliegue de Apps Script para consultar menú y horarios (puede ser la misma que appsScriptPedidosUrl). */
    appsScriptMenuUrl: "https://script.google.com/macros/s/AKfycbxXjOn5ygjiIR7yBuoIcIvgLwF5U2ZgtQ-XGGA_YDP1Fkdk7N11QaMkOWxpKSUyw7hNKg/exec",

    // ========== MENÚ – HOJAS DE CÁLCULO ==========
    /** URL CSV de la hoja del menú simple (opcional). Si no está, se usa Apps Script. */
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTNEWKO90itVxMNkeLNQn3wfoScs6t4mGHh9DKJz4fMsdCf4xOj72cSSJfkTKopOuIEfqJawOjbB8X/pub?gid=1924165913&single=true&output=csv",
    /** Nombre de la hoja en el Sheet para menú simple. */
    menuSimpleSheetName: "menu-toro-rapido-web-simple",
    /** Nombre de la hoja para menú compuesto. Columnas: orden, idmenu-unico, Tipo Menu, idmenu-variable, idproducto, Categoria, Producto, Descripcion Producto, Precio Actual, Precio Regular, Monto Descuento, Porcentaje Descuento, Mostar Descuento, Imagen, Es Destacado, Producto Agotado, Stock, Habilitado. */
    menuCompuestoSheetName: "menu-toro-rapido-web-compuesto",
    /** URL CSV de la hoja del menú compuesto (opcional). Si está vacío, se usa solo Apps Script. */
    googleSheetUrlMenuCompuesto: "",
    /** Nombre de la hoja de detalle del menú compuesto. Columnas: idmenu-compuesto-detalle, idmenu-variable, idproducto, Cantidad, Producto, Precio Unitario Actual, Precio Total Actual, Imagen, Es Destacado, Producto Agotado, Stock, Habilitado. */
    menuCompuestoDetalleSheetName: "menu-compuesto-detalle",
    /** URL CSV de la hoja menu-compuesto-detalle (opcional). Si está vacío, se usa solo Apps Script. */
    googleSheetUrlMenuCompuestoDetalle: "",
    /** Nombre de la hoja de opciones/agregados por producto. Columnas: idproducto, Grupo, Tipo, Obligatorio, Opcion, Recargo. Ver docs/MENU_OPCIONES_SHEET.md */
    menuOpcionesSheetName: "menu-opciones",

    // ========== HORARIO DE ATENCIÓN ==========
    /** Nombre de la hoja de horarios en el Sheet. Columnas: IDHORARIO, DIA, HORA DESDE, MINUTO DESDE, HORA HASTA, MINUTO HASTA. DIA: Lunes, Martes, etc. Horas 0-23, minutos 0-59. */
    horarioSheetName: "HORARIO-TORO-RAPIDO",
    /** Minutos antes de la hora de apertura para mostrar "El local abre a las HH:MM" cuando está cerrado. Ej: 20 = aviso hasta 20 min antes de abrir. */
    minutosAntesApertura: 20,
    /** Minutos antes del cierre para alertar "¡Pedí antes del cierre!" cuando está abierto. Ej: 30 = avisar cuando falten 30 min o menos. */
    minutosAntesCierre: 30,
    /** Minutos antes del cierre para mostrar la cuenta regresiva (MM:SS) flotante. Ej: 10 = contador cuando falten 10 min o menos. */
    minutosCuentaRegresiva: 10,
    /** Horas antes de la apertura en las que se permite hacer reserva (estando cerrado). Ej: 2 = puede reservar si faltan 2 h o menos para abrir. */
    horasAntesAperturaParaReserva: 2,

    // ========== BADGE FLOTANTE (MENÚ) ==========
    /** true = mostrar badge flotante "Local CERRADO" cuando el local está cerrado (sin reserva habilitada). false = no mostrar en esa situación. */
    mostrarBadgeFlotanteCerrado: true,
    /** true = mostrar badge flotante "Local CERRADO" cuando el local está cerrado pero con reserva habilitada (estilo amarillo). false = no mostrar en esa situación. */
    mostrarBadgeFlotanteReserva: true,
    /** true = mostrar badge flotante "Local ABIERTO" cuando el local está abierto (solo en menú, si está implementado). false = no mostrar. */
    mostrarBadgeFlotanteAbierto: false,

    // ========== FERIADOS ==========
    /** Nombre de la hoja de feriados. Columnas: FECHA (YYYY-MM-DD), FECHA TEXTO (opcional), NOMBRE, SE_ATIENDE (SI/NO), HORA DESDE, MINUTO DESDE, HORA HASTA, MINUTO HASTA, MOTIVO. */
    feriadoSheetName: "FERIADO-TORO-RAPIDO",
    /** Días antes de la FECHA del feriado para mostrar la leyenda (solo cuando SE_ATIENDE = NO). Ej: 2 = desde 2 días antes hasta el día del feriado. */
    feriadoDiasAntes: 2,

    // ========== DELIVERY Y PEDIDOS ==========
    /** Costo base de envío en pesos (se aplica si el subtotal no alcanza montoMinimoEnvioGratis). */
    costoEnvioBase: 1500,
    /** Subtotal mínimo en pesos a partir del cual el envío es gratis. */
    montoMinimoEnvioGratis: 25000
};
