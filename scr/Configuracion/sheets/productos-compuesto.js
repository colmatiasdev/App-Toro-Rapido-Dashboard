/**
 * Esquema de la hoja productos-compuesto (registro principal por idproducto PROD-COMPUESTO-xxx).
 * config.js: productosCompuestoSheetName
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["productos-compuesto"] = {
        sheetName: "productos-compuesto",
        configKey: "productosCompuestoSheetName",
        deprecated: "active",
        fields: [
            "orden",
            "idproducto",
            "Categoria",
            "Producto",
            "Descripcion",
            "Precio Actual",
            "Precio Regular",
            "Mostar Monto Descuento",
            "Mostar Descuento",
            "Imagen",
            "Es Destacado",
            "Producto Agotado",
            "STOCK",
            "Habilitado"
        ]
    };
})(typeof window !== "undefined" ? window : this);
