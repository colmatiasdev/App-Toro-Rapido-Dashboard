/**
 * Índice de todas las hojas/tablas del proyecto.
 * Cargar después de config.js y de cada sheet-*.js para tener SHEET_SCHEMAS completo.
 *
 * Uso:
 *   - SHEET_SCHEMAS[key] = { sheetName, configKey, deprecated, fields }
 *   - deprecated: "active" = válida/activa, "deprecated" = en desuso
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};

    /** Clave de esquema → nombre de hoja en config (APP_CONFIG[configKey]) */
    var CONFIG_KEYS = {
        "productos-base": "menuProductosSheetName",
        "menu-simple": "menuSimpleSheetName",
        "menu-compuesto": "menuCompuestoSheetName",
        "menu-compuesto-detalle": "menuCompuestoDetalleSheetName",
        "productos-compuesto": "productosCompuestoSheetName",
        "productos-compuesto-detalle": "productosCompuestoDetalleSheetName",
        "opciones-base": "menuOpcionesSheetName",
        "horario": "horarioSheetName",
        "feriado": "feriadoSheetName"
    };

    /**
     * Devuelve el nombre real de la hoja según config (APP_CONFIG) para una clave de esquema.
     * @param {string} schemaKey - Clave en SHEET_SCHEMAS (ej. "productos-base", "menu-simple")
     * @returns {string} Nombre de la hoja o cadena vacía
     */
    global.getSheetNameBySchema = function (schemaKey) {
        var configKey = CONFIG_KEYS[schemaKey];
        if (!configKey || !global.APP_CONFIG) return "";
        return (global.APP_CONFIG[configKey] || "").toString().trim();
    };

    /**
     * Devuelve el esquema por clave de config (ej. menuProductosSheetName).
     * @param {string} configKey - Clave en APP_CONFIG
     * @returns {object|undefined} Esquema { sheetName, configKey, deprecated, fields }
     */
    global.getSchemaByConfigKey = function (configKey) {
        if (!global.SHEET_SCHEMAS) return undefined;
        for (var k in CONFIG_KEYS) {
            if (CONFIG_KEYS[k] === configKey) return global.SHEET_SCHEMAS[k];
        }
        return undefined;
    };

    /**
     * Lista todas las hojas activas (deprecated !== "deprecated").
     * @returns {string[]} Claves de esquema activas
     */
    global.getActiveSheetSchemaKeys = function () {
        var out = [];
        if (!global.SHEET_SCHEMAS) return out;
        for (var k in global.SHEET_SCHEMAS) {
            if ((global.SHEET_SCHEMAS[k].deprecated || "active") !== "deprecated") {
                out.push(k);
            }
        }
        return out;
    };

    /**
     * Mapa completo: clave de esquema → nombre de hoja actual (según config).
     * @returns {Object.<string, string>}
     */
    global.getSheetNamesMap = function () {
        var map = {};
        for (var schemaKey in CONFIG_KEYS) {
            map[schemaKey] = global.getSheetNameBySchema(schemaKey);
        }
        return map;
    };
})(typeof window !== "undefined" ? window : this);
