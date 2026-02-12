/**
 * Esquema de la hoja productos-compuesto-detalle (ítems del producto compuesto, sin idmenu-variable).
 * config.js: productosCompuestoDetalleSheetName
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["productos-compuesto-detalle"] = {
        sheetName: "productos-compuesto-detalle",
        configKey: "productosCompuestoDetalleSheetName",
        deprecated: "active",
        fields: [
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
