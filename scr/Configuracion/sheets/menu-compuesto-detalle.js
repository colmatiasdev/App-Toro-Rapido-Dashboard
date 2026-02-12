/**
 * Esquema de la hoja detalle del menú compuesto (subítems por idmenu-variable).
 * config.js: menuCompuestoDetalleSheetName
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["menu-compuesto-detalle"] = {
        sheetName: "menu-compuesto-detalle",
        configKey: "menuCompuestoDetalleSheetName",
        /** deprecated: "active" = hoja válida y en uso; "deprecated" = hoja en desuso. */
        deprecated: "active",
        fields: [
            "idmenu-compuesto-detalle",
            "idmenu-variable",
            "idproducto",
            "Cantidad",
            "Producto",
            "Precio Unitario Actual",
            "Precio Total Actual",
            "Imagen",
            "Es Destacado",
            "Producto Agotado",
            "STOCK",
            "Habilitado"
        ]
    };
})(typeof window !== "undefined" ? window : this);
