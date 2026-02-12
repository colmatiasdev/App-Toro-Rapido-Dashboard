/**
 * Esquema de la hoja de horario de atención.
 * config.js: horarioSheetName
 */
(function (global) {
    global.SHEET_SCHEMAS = global.SHEET_SCHEMAS || {};
    global.SHEET_SCHEMAS["horario"] = {
        sheetName: "HORARIO-TORO-RAPIDO",
        configKey: "horarioSheetName",
        /** deprecated: "active" = hoja válida y en uso; "deprecated" = hoja en desuso. */
        deprecated: "active",
        fields: [
            "IDHORARIO",
            "DIA",
            "HORA DESDE",
            "MINUTO DESDE",
            "HORA HASTA",
            "MINUTO HASTA"
        ]
    };
})(typeof window !== "undefined" ? window : this);
