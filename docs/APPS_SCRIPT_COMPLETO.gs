/**
 * Apps Script para Toro Rápido (menú simple, menú compuesto, opciones, productos, etc.).
 * Publicar como "Aplicación web": Ejecutar como "Yo", Quién puede acceder "Cualquier persona".
 *
 * doGet:
 *   - action=updateHabilitada & sheetName & (idproducto | idopciones | idmenu-unico) & habilitado: actualiza columna Habilitado/Habilitada.
 *   - Sin action o listar: ?sheetName=... devuelve { headers, rows } de la hoja.
 *
 * doPost (body JSON):
 *   - action=delete: marca Habilitado/Habilitada = NO en la fila del ID.
 *   - action=update: actualiza la fila (productos por idproductoOld; opciones por idopcionesOld+grupoOld+opcionOld; menú por idmenu-unico).
 *   - action=create: agrega una fila nueva. Acepta cualquier hoja (productos-base, opciones-base, menu-toro-rapido-web-compuesto, menu-compuesto-detalle, etc.).
 *     La hoja menu-toro-rapido-web-simple ya no se usa; si sheetName apunta a una hoja inexistente, el Script devuelve error "Hoja no encontrada".
 */

// ========== doGet ==========
function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = (params.action || "").toString().toLowerCase();

    if (action === "updatehabilitada") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetName = (params.sheetName || "productos-base").toString().trim();
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return jsonOut({ result: "error", error: "Hoja no encontrada: " + sheetName });
      var idVal = (params.idproducto || params.idproductoOld || params.idopciones || params.idopcionesOld || params["idmenu-unico"] || params.idmenuunico || params.idmenu || "").toString().trim();
      if (!idVal) return jsonOut({ result: "error", error: "Falta idproducto, idopciones, idmenu o idmenu-unico" });
      var valorHabilitado = (params.habilitado || params.habilitada || "NO").toString().toUpperCase();
      var habilitadaVal = (valorHabilitado === "SI") ? "SI" : "NO";
      var headers = getHeaders(sheet);
      var rowIndex = findRowById(sheet, headers, idVal);
      if (rowIndex === -1) return jsonOut({ result: "error", error: "ID no encontrado: " + idVal });
      var colH = findHeaderIndex(headers, "habilitado");
      if (colH === -1) colH = findHeaderIndex(headers, "habilitada");
      if (colH === -1) return jsonOut({ result: "error", error: "No existe columna Habilitado/Habilitada en la hoja" });
      sheet.getRange(rowIndex, colH + 1).setValue(habilitadaVal);
      SpreadsheetApp.flush();
      return jsonOut({ result: "success" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (params.sheetName || "menu-toro-rapido-web").toString().trim();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonOut({ result: "error", error: "Hoja no encontrada: " + sheetName });

    var headers = getHeaders(sheet);
    var lastRow = sheet.getLastRow();
    var rows = lastRow > 1
      ? sheet.getRange(2, 1, lastRow, sheet.getLastColumn()).getValues()
      : [];

    return jsonOut({ headers: headers, rows: rows });
  } catch (err) {
    return jsonOut({ result: "error", error: err.toString() });
  }
}

// ========== doPost: create / update / delete ==========
function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return jsonOut({ result: "error", error: "Servidor ocupado. Reintentá en unos segundos." });
  }
  try {
    if (!e.postData || !e.postData.contents) return jsonOut({ result: "error", error: "Sin datos" });
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonOut({ result: "error", error: "JSON inválido: " + parseErr.toString() });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (data.sheetName || "menu-toro-rapido-web").toString().trim();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonOut({ result: "error", error: "Hoja no encontrada: " + sheetName });

    var headers = getHeaders(sheet);
    var action = (data.action || "create").toString().toLowerCase();

    if (action === "delete") {
      var rowIndex = findRowById(sheet, headers, data);
      if (rowIndex === -1) return jsonOut({ result: "error", error: "ID no encontrado para eliminar" });
      var habilitadoCol = findHeaderIndex(headers, "habilitado");
      if (habilitadoCol === -1) habilitadoCol = findHeaderIndex(headers, "habilitada");
      if (habilitadoCol === -1) return jsonOut({ result: "error", error: "No existe columna Habilitado/Habilitada" });
      sheet.getRange(rowIndex, habilitadoCol + 1).setValue("NO");
      SpreadsheetApp.flush();
      return jsonOut({ result: "success" });
    }

    if (action === "update") {
      var rowIndex = -1;
      var idOpcionesOld = data.idopcionesOld !== undefined ? data.idopcionesOld : null;
      var grupoOld = data.grupoOld !== undefined ? data.grupoOld : null;
      var opcionOld = data.opcionOld !== undefined ? data.opcionOld : null;
      if (idOpcionesOld !== null && grupoOld !== null && opcionOld !== null) {
        rowIndex = findRowOpciones(sheet, headers, idOpcionesOld, grupoOld, opcionOld);
      } else {
        var idOld = data.idopcionesOld !== undefined ? data.idopcionesOld
          : data.idproductoOld !== undefined ? data.idproductoOld
          : data["idmenu-unico"] !== undefined ? data["idmenu-unico"]
          : data.idmenuunico !== undefined ? data.idmenuunico
          : (data.idproducto || data.idopciones || data.idmenu || data["idmenu-unico"] || data.idmenuunico);
        if (idOld !== undefined && idOld !== null && idOld !== "") {
          rowIndex = findRowById(sheet, headers, idOld);
        } else {
          rowIndex = findRowById(sheet, headers, data);
        }
      }
      if (rowIndex === -1) return jsonOut({ result: "error", error: "Fila no encontrada para actualizar" });
      var skipKeys = ["sheetName", "action", "idopcionesOld", "idproductoOld", "grupoOld", "opcionOld"];
      for (var i = 0; i < headers.length; i++) {
        var key = findKeyInsensitive(data, headers[i]);
        if (key !== null && skipKeys.indexOf(key) === -1) {
          sheet.getRange(rowIndex, i + 1).setValue(safeCellValue(data[key]));
        }
      }
      SpreadsheetApp.flush();
      return jsonOut({ result: "success" });
    }

    // CREATE: una fila por cada header, valor desde data (insensible a mayúsculas/espacios/guiones)
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var key = findKeyInsensitive(data, headers[i]);
      var val = "";
      if (key !== null && key !== "sheetName" && key !== "action") {
        val = safeCellValue(data[key]);
      }
      row.push(val);
    }
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return jsonOut({ result: "success" });

  } catch (err) {
    return jsonOut({ result: "error", error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Fila 1 como array de strings (evita problemas con tipos en la hoja)
function getHeaders(sheet) {
  var raw = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return raw.map(function (h) {
    return h != null ? String(h).trim() : "";
  });
}

// Escribe en celda: nunca undefined/null; números y booleanos se mantienen, el resto a string
function safeCellValue(v) {
  if (v === undefined || v === null) return "";
  if (typeof v === "number" && !isNaN(v)) return v;
  if (typeof v === "boolean") return v ? "SI" : "NO";
  return String(v);
}

// Busca fila por id: idproducto, idopciones, idmenu (menu-simple), idmenu-unico, idmenuunico o "id".
function findRowById(sheet, headers, idProductoOrData) {
  var idValue;
  if (typeof idProductoOrData === "object") {
    idValue = idProductoOrData.idproducto || idProductoOrData.idopciones || idProductoOrData["idmenu-unico"] || idProductoOrData.idmenuunico || idProductoOrData.idmenu || idProductoOrData.id;
  } else {
    idValue = idProductoOrData;
  }
  if (idValue === undefined || idValue === null || idValue === "") return -1;
  idValue = String(idValue).trim();
  if (!idValue) return -1;

  var idCol = findHeaderIndex(headers, "idproducto");
  if (idCol === -1) idCol = findHeaderIndex(headers, "idopciones");
  if (idCol === -1) idCol = findHeaderIndex(headers, "idmenu-unico");
  if (idCol === -1) idCol = findHeaderIndex(headers, "idmenuunico");
  if (idCol === -1) idCol = findHeaderIndex(headers, "idmenu");
  if (idCol === -1) idCol = findHeaderIndex(headers, "id");
  if (idCol === -1) return -1;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var values = sheet.getRange(2, idCol + 1, lastRow, idCol + 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === idValue) return i + 2;
  }
  return -1;
}

function findRowOpciones(sheet, headers, idproducto, grupo, opcion) {
  var colId = findHeaderIndex(headers, "idopciones");
  if (colId === -1) colId = findHeaderIndex(headers, "idproducto");
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
    if (obj.hasOwnProperty(k) && normalize(k) === target) return k;
  }
  return null;
}

function normalize(value) {
  var s = String(value || "").toLowerCase();
  try {
    if (typeof s.normalize === "function") s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (err) {}
  return s.replace(/\s+/g, "").replace(/-/g, "").replace(/_/g, "");
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
