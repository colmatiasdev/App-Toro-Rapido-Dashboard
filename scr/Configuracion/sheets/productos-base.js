/**
 * Esquema de la hoja productos-base (tabla de productos base).
 * config.js: menuProductosSheetName
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["productos-base"] = {
        sheetName: "productos-base",
        configKey: "menuProductosSheetName",
        /** deprecated: "active" = hoja válida y en uso; "deprecated" = hoja en desuso. */
        deprecated: "active",
        fields: [
            "ID Producto",
            "Categoria",
            "Producto",
            "Descripcion",
            "Precio Actual",
            "Precio Regular",
            "Imagen",
            "Es Destacado",
            "Producto Agotado",
            "STOCK",
            "Habilitado",
            "Mostar Monto Descuento",
            "Mostar Descuento"
        ]
    };
})(typeof window !== "undefined" ? window : this);
