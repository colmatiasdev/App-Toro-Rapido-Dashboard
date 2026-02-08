window.APP_CONFIG = {
    /** true: en index se muestran botones por cada versión de menú para pruebas */
    debug: true,
    /** Versiones de menú disponibles (usado cuando debug es true) */
    menuVersiones: ["menu-simple", "menu-compuesto"],
    /** Menú público activo cuando debug es false */
    menuActivo: "menu-simple",
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
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbzllzUCk1UqUV08XINHmy6Omvcl6JZ8_jRYY8k1WS2N_Kgnyec_mEp9CdVUdhrafC_B/exec",
    appsScriptMenuUrl: "https://script.google.com/macros/s/AKfycbwcAg7xpg1sHsnkEmY5gYEm8eeyi4qNEaptNtLogpTyYsRKcU4-tCgF5wRyvSYbsEIhYQ/exec",
    menuSimpleSheetName: "menu-toro-rapido-web-simple",
    /** Hoja del mismo Sheet para menú compuesto (columnas: orden, idmenu-normal, idproducto, Categoria, Producto, Descripcion, Precio Actual, etc.) */
    menuCompuestoSheetName: "menu-toro-rapido-web-compuesto",
    /** URL CSV de la hoja menu-toro-rapido-web-compuesto (mismo libro, otro gid). Opcional; si no está, se usa solo Apps Script. */
    googleSheetUrlMenuCompuesto: "",
    costoEnvioBase: 1500,
    montoMinimoEnvioGratis: 25000
};
