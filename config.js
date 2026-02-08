window.APP_CONFIG = {
    /** true: en index se muestran botones por cada versión de menú para pruebas */
    debug: false,
    /** Versiones de menú disponibles (usado cuando debug es true) */
    menuVersiones: ["menu-simple", "menu-compuesto"],
    /** Menú público activo cuando debug es false */
    menuActivo: "menu-compuesto",
    maxProductos: 10,
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTNEWKO90itVxMNkeLNQn3wfoScs6t4mGHh9DKJz4fMsdCf4xOj72cSSJfkTKopOuIEfqJawOjbB8X/pub?gid=1924165913&single=true&output=csv",
    telefonoNegocio: "5493814130520",
    instagram: {
        name: "tororapido.delivery",
        url: "https://www.instagram.com/tororapido.delivery/"
    },
    plataformas: {
        pedidosYa: "https://www.pedidosya.com.ar",
        rappi: "https://www.rappi.com.ar"
    },
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbxXjOn5ygjiIR7yBuoIcIvgLwF5U2ZgtQ-XGGA_YDP1Fkdk7N11QaMkOWxpKSUyw7hNKg/exec",
    appsScriptMenuUrl: "https://script.google.com/macros/s/AKfycbxXjOn5ygjiIR7yBuoIcIvgLwF5U2ZgtQ-XGGA_YDP1Fkdk7N11QaMkOWxpKSUyw7hNKg/exec",
    menuSimpleSheetName: "menu-toro-rapido-web-simple",
    /** Hoja del mismo Sheet para menú compuesto. Columnas: orden, idmenu-unico, Tipo Menu, idmenu-variable, idproducto, Categoria, Producto, Descripcion Producto, Precio Actual, Precio Regular, Monto Descuento, Porcentaje Descuento, Mostar Descuento, Imagen, Es Destacado, Producto Agotado, Stock, Habilitado */
    menuCompuestoSheetName: "menu-toro-rapido-web-compuesto",
    /** URL CSV de la hoja menu-toro-rapido-web-compuesto (mismo libro, otro gid). Opcional; si no está, se usa solo Apps Script. */
    googleSheetUrlMenuCompuesto: "",
    /** Hoja de detalle del menú compuesto. Columnas: idmenu-compuesto-detalle, idmenu-variable, idproducto, Cantidad, Producto, Precio Unitario Actual, Precio Total Actual, Imagen, Es Destacado, Producto Agotado, Stock, Habilitado. idmenu-variable relaciona con la misma columna de menu-toro-rapido-web-compuesto. */
    menuCompuestoDetalleSheetName: "menu-compuesto-detalle",
    /** Hoja de horarios. Columnas: IDHORARIO, DIA, HORA DESDE, MINUTO DESDE, HORA HASTA, MINUTO HASTA. DIA: Lunes, Martes, etc. Horas en 0-23, minutos en 0-59. Se muestra en formato 24h (ej. 07:00 - 15:00). */
    horarioSheetName: "HORARIO-TORO-RAPIDO",
    /** Hoja de feriados. Columnas: FECHA (YYYY-MM-DD), FECHA TEXTO (opcional; si existe se muestra tal cual, ej. "24 de diciembre"), NOMBRE, SE_ATIENDE (SI/NO), HORA DESDE, MINUTO DESDE, HORA HASTA, MINUTO HASTA, MOTIVO. */
    feriadoSheetName: "FERIADO-TORO-RAPIDO",
    /** Días antes de la FECHA del feriado para mostrar la leyenda (solo cuando SE_ATIENDE = NO). Ej: 2 = desde 2 días antes hasta el día del feriado. */
    feriadoDiasAntes: 2,
    /** URL CSV de la hoja menu-compuesto-detalle (opcional). Si no está, se usa solo Apps Script. */
    googleSheetUrlMenuCompuestoDetalle: "",
    costoEnvioBase: 1500,
    montoMinimoEnvioGratis: 25000
};
