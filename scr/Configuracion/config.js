/** Formato de moneda compartido en toda la app (es-AR). Ej: $ 1.461.879,79 */
window.formatMoneda = (valor) => {
    const n = Number(valor);
    if (Number.isNaN(n)) return "—";
    return `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

window.APP_CONFIG = {
    // ========== GENERAL Y DEBUG ==========
    /** true: en la página pública (inicio-publico.html) se muestran botones por cada versión de menú para pruebas. false: solo el menú activo. */
    debug: true,
    /** true: la sección de vista previa debug (pasos de envío) se muestra expandida. false: hay que expandir cada paso manualmente. */
    debugFull: true,
    /** Lista de versiones de menú disponibles. Solo se usa cuando debug es true. (Hoja menu-simple ya no existe.) */
    menuVersiones: ["menu-compuesto"],
    /** Menú público activo cuando debug es false. Debe coincidir con un valor de menuVersiones. */
    menuActivo: "menu-compuesto",
    /** Límite máximo de productos a mostrar por categoría en el menú (0 = sin límite). */
    maxProductos: 10,

    // ========== CONTACTO Y REDES ==========
    /** URL del sitio web público. Se usa en el panel de administración para el enlace "Ver web pública". */
    urlWebPublica: "https://colmatiasdev.github.io/App-Toro-Rapido-Delivery/",
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
    appsScriptPedidosUrl: "https://script.google.com/macros/s/AKfycbzzCRn0wQHHNg9PRQAprtyFXdAvRJT0iTFv_x3GlzZ5PFNpEcFzfvNJJBM5SxNL6TH4xw/exec",
    /** URL del despliegue de Apps Script para menú, opciones, horarios, productos. */
    appsScriptMenuUrl: "https://script.google.com/macros/s/AKfycbxh_ucFIx-ws6qOxNKg4HKgIuEjTtBfkq-G_A0imelISxakGRQAi9Doiz61wL48fMNmNA/exec",

    // ========== MENÚ – HOJAS DE CÁLCULO ==========
    /** URL CSV de la hoja del menú simple (opcional). La hoja menu-simple ya no existe; dejar vacío o usar solo menú compuesto. */
    googleSheetUrl: "",
    /** Nombre de la hoja en el Sheet para menú simple. Ya no existe; dejar vacío. Si está vacío, en menú compuesto no se escribe en esta hoja. */
    menuSimpleSheetName: "",
    /** Nombre de la hoja para el registro del menú compuesto (paso 3 al guardar MENU-SIMPLE). Columnas: orden, idmenu-unico, Tipo Menu, etc. */
    menuCompuestoSheetName: "menu-toro-rapido-web-compuesto",
    /** URL CSV de la hoja del menú compuesto (opcional). Si está vacío, se usa solo Apps Script. */
    googleSheetUrlMenuCompuesto: "",
    /** Nombre de la hoja de detalle del menú compuesto. Columnas: idmenu-compuesto-detalle, idmenu-variable, idproducto, Cantidad, Producto, Precio Unitario Actual, Precio Total Actual, Imagen, Es Destacado, Producto Agotado, Stock, Habilitado. */
    menuCompuestoDetalleSheetName: "menu-compuesto-detalle",
    /** URL CSV de la hoja menu-compuesto-detalle (opcional). Si está vacío, se usa solo Apps Script. */
    googleSheetUrlMenuCompuestoDetalle: "",
    /** Nombre de la hoja de opciones/agregados por producto (ej. "menu-opciones" o "opciones-base"). Columnas: idproducto, Grupo, Tipo, Obligatorio, Opcion, Recargo. Ver docs/MENU_OPCIONES_SHEET.md */
    menuOpcionesSheetName: "opciones-base",
    /** Nombre de la hoja de productos. Columnas: ID Producto, Categoria, Producto, Descripcion, Precio Actual, Precio Regular, Imagen, Es Destacado, Producto Agotado, STOCK, Habilitado, Mostar Monto Descuento, Mostar Descuento. */
    menuProductosSheetName: "productos-base",
    /** Nombre de la hoja del producto compuesto (registro principal por idproducto PROD-COMPUESTO-xxx). Se completa desde admin-productos-compuestos tras agregar ítems en productos-compuesto-detalle. */
    productosCompuestoSheetName: "productos-compuesto",
    /** Nombre de la hoja donde se guardan los ítems del producto compuesto (módulo menú con subproductos). idproducto = PROD-COMPUESTO- + único aleatorio; idproducto-base = ID del producto seleccionado (productos-base). Columnas: idproducto, idproducto-base, Cantidad, Producto, Precio Unitario Actual, Precio Total Actual, Imagen, Es Destacado, Producto Agotado, STOCK, Habilitado. */
    productosCompuestoDetalleSheetName: "productos-compuesto-detalle",
    /** Máximo de ítems que se pueden cargar en el resumen de subproductos (menú con subproductos). Al llegar al máximo se muestra una leyenda y se deshabilitan los checks restantes. */
    menuSubproductosMaxItems: 5,

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
    montoMinimoEnvioGratis: 25000,

    // ========== SESIÓN DE PEDIDO (CIRCUITO PÚBLICO) ==========
    /** Minutos de inactividad tras los cuales se limpia el carrito/resumen y se redirige a la página pública (inicio-publico.html). 0 = desactivado. Ej: 30 */
    sesionPedidoTimeoutMinutos: 1
};
