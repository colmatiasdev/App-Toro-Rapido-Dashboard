/**
 * Esquema de la hoja menú compuesto (registro principal de ítems).
 * config.js: menuCompuestoSheetName
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["menu-compuesto"] = {
        sheetName: "menu-toro-rapido-web-compuesto",
        configKey: "menuCompuestoSheetName",
        /** deprecated: "active" = hoja válida y en uso; "deprecated" = hoja en desuso. */
        deprecated: "active",
        fields: [
            "orden",
            "idmenu-unico",
            "Tipo Menu",
            "idmenu-variable",
            "Categoria",
            "Producto",
            "Descripcion Producto",
            "Descripcion",
            "Precio Actual",
            "Precio Regular",
            "Mostar Monto Descuento",
            "Mostar Descuento",
            "Porcentaje Descuento",
            "Imagen",
            "Es Destacado",
            "Producto Agotado",
            "STOCK",
            "Habilitado"
        ]
    };
})(typeof window !== "undefined" ? window : this);
