# Esquemas de hojas (Sheets)

Cada archivo JS define el esquema de una hoja/tabla del Google Sheet en formato tipo JSON:

- **sheetName**: nombre de la hoja tal como aparece en el Sheet / config.
- **configKey**: clave en `APP_CONFIG` (config.js) que guarda el nombre de la hoja.
- **deprecated**: `"active"` = válida y en uso; `"deprecated"` = en desuso. Por defecto todas están activas.
- **fields**: array con los nombres de columna tal como aparecen en la hoja.

## Archivos

| Archivo | Hoja / configKey |
|---------|------------------|
| productos-base.js | productos-base / menuProductosSheetName |
| menu-simple.js | menu-toro-rapido-web-simple / menuSimpleSheetName |
| menu-compuesto.js | menu-toro-rapido-web-compuesto / menuCompuestoSheetName |
| menu-compuesto-detalle.js | menu-compuesto-detalle / menuCompuestoDetalleSheetName |
| opciones-base.js | opciones-base / menuOpcionesSheetName |
| horario.js | HORARIO-TORO-RAPIDO / horarioSheetName |
| feriado.js | FERIADO-TORO-RAPIDO / feriadoSheetName |
| index.js | Helpers y mapeo con todas las hojas |

## Orden de carga (si se usan los esquemas en una página)

1. `config.js`
2. Los `*.js` de cada hoja que necesites (o todos).
3. `sheets/index.js`

Tras cargar, `window.SHEET_SCHEMAS` tendrá todas las claves definidas. El índice expone:

- `getSheetNameBySchema(schemaKey)` – nombre de la hoja según config.
- `getSchemaByConfigKey(configKey)` – esquema según clave de config.
- `getActiveSheetSchemaKeys()` – claves con `deprecated !== "deprecated"`.
- `getSheetNamesMap()` – mapa schemaKey → nombre de hoja.
