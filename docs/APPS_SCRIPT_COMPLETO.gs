/**
 * Apps Script para Toro Rápido (menú, opciones, horarios, etc.)
 * Publicar como "Aplicación web": Ejecutar como "Yo", Quién puede acceder "Cualquier persona".
 * doGet: listar hojas. doPost: create / update / delete (menú simple, menú compuesto, opciones).
 */

// ========== doGet: listar cualquier hoja por nombre ==========
// Parámetros: sheetName. Ejemplo: ?sheetName=HORARARIO-TORO-RAPIDO o ?action=list&sheetName=opciones-base
// Respuesta OK: { headers: [...], rows: [[...], ...] }
// Respuesta error: { result: "error", error: "..." } — el front también reconoce data.error
// Usa la fila 1 para determinar cuántas columnas leer (así no se pierden columnas si solo hay datos en la primera).
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (e.parameter.sheetName || "menu-toro-rapido-web").trim();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonOut({ result: "error", error: "Hoja no encontrada: " + sheetName });

    var maxCols = sheet.getMaxColumns();
    var headerRow = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
    var numCols = 0;
    for (var c = 0; c < headerRow.length; c++) {
      var v = headerRow[c];
      if (v !== null && v !== undefined && String(v).trim() !== "") numCols = c + 1;
    }
    if (numCols === 0) numCols = 1;
    numCols = Math.max(numCols, sheet.getLastColumn());

    var headers = [];
    for (var i = 0; i < numCols; i++) {
      var h = headerRow[i];
      headers.push(h != null && String(h).trim() !== "" ? String(h).trim() : "Columna" + (i + 1));
    }

    var lastRow = sheet.getLastRow();
    var rows = [];
    if (lastRow > 1) {
      var rawRows = sheet.getRange(2, 1, lastRow, numCols).getValues();
      for (var r = 0; r < rawRows.length; r++) {
        var row = rawRows[r];
        var outRow = [];
        for (var col = 0; col < numCols; col++) {
          outRow.push(col < row.length && row[col] !== null && row[col] !== undefined ? row[col] : "");
        }
        rows.push(outRow);
      }
    }

    return jsonOut({ headers: headers, rows: rows });
  } catch (err) {
    return jsonOut({ result: "error", error: err.toString() });
  }
}

// ========== doPost: create / update / delete (menú, opciones, etc.) ==========
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!e.postData || !e.postData.contents) return jsonOut({ result: "error", error: "Sin datos" });
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (data.sheetName || "menu-toro-rapido-web").trim();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonOut({ result: "error", error: "Hoja no encontrada: " + sheetName });

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var action = (data.action || "create").toLowerCase();

    if (action === "delete") {
      var rowIndex = findRowById(sheet, headers, data);
      if (rowIndex === -1) return jsonOut({ result: "error", error: "ID no encontrado" });
      var habilitadoCol = findHeaderIndex(headers, "habilitado");
      if (habilitadoCol === -1) return jsonOut({ result: "error", error: "No existe columna habilitado" });
      sheet.getRange(rowIndex, habilitadoCol + 1).setValue("NO");
      return jsonOut({ result: "success" });
    }

    if (action === "update") {
      var rowIndex = -1;
      var idOld = data.idopcionesOld !== undefined ? data.idopcionesOld : data.idproductoOld;
      // Hoja opciones-base: buscar por idopcionesOld + grupoOld + opcionOld.
      if (idOld !== undefined && data.grupoOld !== undefined && data.opcionOld !== undefined) {
        rowIndex = findRowOpciones(sheet, headers, idOld, data.grupoOld, data.opcionOld);
      } else if (idOld !== undefined) {
        // Hoja productos-base (u otras): buscar solo por ID.
        rowIndex = findRowById(sheet, headers, idOld);
      } else {
        rowIndex = findRowById(sheet, headers, data);
      }
      if (rowIndex === -1) return jsonOut({ result: "error", error: "Fila no encontrada para actualizar" });
      for (var i = 0; i < headers.length; i++) {
        var key = findKeyInsensitive(data, headers[i]);
        if (key !== null && key !== "sheetName" && key !== "action" &&
            key !== "idopcionesOld" && key !== "idproductoOld" && key !== "grupoOld" && key !== "opcionOld") {
          sheet.getRange(rowIndex, i + 1).setValue(data[key] !== undefined ? data[key] : "");
        }
      }
      return jsonOut({ result: "success" });
    }

    // CREATE
    var row = headers.map(function (h) {
      var key = findKeyInsensitive(data, h);
      if (key !== null && key !== "sheetName" && key !== "action") return data[key] !== undefined ? data[key] : "";
      return "";
    });
    sheet.appendRow(row);
    return jsonOut({ result: "success" });

  } catch (err) {
    return jsonOut({ result: "error", error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Busca fila por idproducto o idmenu-unico (menú simple / menú compuesto). Segundo argumento puede ser objeto data o string id.
function findRowById(sheet, headers, idProductoOrData) {
  var idValue;
  if (typeof idProductoOrData === "object") {
    idValue = idProductoOrData.idproducto || idProductoOrData.idopciones || idProductoOrData["idmenu-unico"] || idProductoOrData.idmenuunico;
  } else {
    idValue = idProductoOrData;
  }
  if (!idValue) return -1;
  var idCol = findHeaderIndex(headers, "idproducto");
  if (idCol === -1) idCol = findHeaderIndex(headers, "idopciones");
  if (idCol === -1) idCol = findHeaderIndex(headers, "idmenu-unico");
  if (idCol === -1) idCol = findHeaderIndex(headers, "idmenuunico");
  if (idCol === -1) return -1;
  var col = idCol + 1;
  var values = sheet.getRange(2, col, sheet.getLastRow(), col).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(idValue).trim()) return i + 2;
  }
  return -1;
}

// Busca fila en hoja de opciones (opciones-base) por ID Opciones + Grupo + Opcion.
// La columna ID puede llamarse "ID Opciones", "idopciones" o "idproducto" en la hoja.
function findRowOpciones(sheet, headers, idproducto, grupo, opcion) {
  var colId = findHeaderIndex(headers, "idproducto");
  if (colId === -1) colId = findHeaderIndex(headers, "idopciones");
  var colGrupo = findHeaderIndex(headers, "grupo");
  var colOpcion = findHeaderIndex(headers, "opcion");
  if (colId === -1 || colGrupo === -1 || colOpcion === -1) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var rngId = sheet.getRange(2, colId + 1, lastRow, colId + 1).getValues();
  var rngGrupo = sheet.getRange(2, colGrupo + 1, lastRow, colGrupo + 1).getValues();
  var rngOpcion = sheet.getRange(2, colOpcion + 1, lastRow, colOpcion + 1).getValues();
  var idStr = String(idproducto || "").trim();
  var grupoStr = String(grupo || "").trim();
  var opcionStr = String(opcion || "").trim();
  for (var i = 0; i < rngId.length; i++) {
    if (String(rngId[i][0]).trim() === idStr &&
        String(rngGrupo[i][0]).trim() === grupoStr &&
        String(rngOpcion[i][0]).trim() === opcionStr) {
      return i + 2;
    }
  }
  return -1;
}

function findHeaderIndex(headers, name) {
  var target = normalize(name);
  for (var i = 0; i < headers.length; i++) {
    if (normalize(headers[i]) === target) return i;
  }
  return -1;
}

function findKeyInsensitive(obj, key) {
  var target = normalize(key);
  for (var k in obj) {
    if (normalize(k) === target) return k;
  }
  return null;
}

function normalize(value) {
  var s = String(value || "").toLowerCase();
  try {
    if (typeof s.normalize === "function") s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (err) {}
  return s.replace(/\s+/g, "").replace(/-/g, "");
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
