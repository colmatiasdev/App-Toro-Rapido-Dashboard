/**
 * Esquema de la hoja de feriados.
 * config.js: feriadoSheetName
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["feriado"] = {
        sheetName: "FERIADO-TORO-RAPIDO",
        configKey: "feriadoSheetName",
        /** deprecated: "active" = hoja válida y en uso; "deprecated" = hoja en desuso. */
        deprecated: "active",
        fields: [
            "FECHA",
            "FECHA TEXTO",
            "NOMBRE",
            "SE_ATIENDE",
            "HORA DESDE",
            "MINUTO DESDE",
            "HORA HASTA",
            "MINUTO HASTA",
            "MOTIVO"
        ]
    };
})(typeof window !== "undefined" ? window : this);
