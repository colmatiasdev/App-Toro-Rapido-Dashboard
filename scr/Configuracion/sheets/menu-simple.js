/**
 * Esquema de la hoja menú simple (menu-toro-rapido-web-simple).
 * config.js: menuSimpleSheetName
 * Esta hoja ya no existe; el esquema se mantiene por referencia. Al crear solo se registraban idmenu e idproducto.
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["menu-simple"] = {
        sheetName: "menu-toro-rapido-web-simple",
        configKey: "menuSimpleSheetName",
        /** deprecated: "active" = hoja válida y en uso; "deprecated" = hoja en desuso. */
        deprecated: "deprecated",
        /** Columnas que se envían al crear: solo idmenu e idproducto. */
        createFields: ["idmenu", "idproducto"],
        fields: [
            "idmenu",
            "idproducto",
            "Categoria",
            "Producto",
            "Descripcion",
            "Precio Actual",
            "Precio Regular",
            "Imagen",
            "Es Destacado",
            "Producto Agotado",
            "STOCK",
            "orden",
            "Habilitado",
            "Mostar Monto Descuento",
            "Mostar Descuento"
        ]
    };
})(typeof window !== "undefined" ? window : this);
