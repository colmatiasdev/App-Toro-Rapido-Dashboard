/**
 * Esquema de la hoja de opciones/agregados por producto.
 * config.js: menuOpcionesSheetName
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["opciones-base"] = {
        sheetName: "opciones-base",
        configKey: "menuOpcionesSheetName",
        /** deprecated: "active" = hoja válida y en uso; "deprecated" = hoja en desuso. */
        deprecated: "active",
        fields: [
            "idproducto",
            "Grupo",
            "Tipo",
            "Obligatorio",
            "Opcion",
            "Recargo"
        ]
    };
})(typeof window !== "undefined" ? window : this);
