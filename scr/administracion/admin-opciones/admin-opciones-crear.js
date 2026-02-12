const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const SHEET_NAME = window.APP_CONFIG?.menuOpcionesSheetName || "opciones-base";

const normalizeKey = (value) => (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const cleanText = (value) => (value ?? "").toString().trim();

const getValue = (row, keys) => {
    if (!row || typeof row !== "object") return "";
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const k of Object.keys(row)) {
        const n = normalizeKey(k);
        if (keyList.some((c) => normalizeKey(c) === n)) return row[k];
    }
    return "";
};

const rowsFromSheetData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.headers && Array.isArray(data.rows)) {
        const headers = data.headers.map((h) => (h != null ? String(h).trim() : ""));
        return data.rows.map((row) => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = row[i]; });
            return obj;
        });
    }
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const fetchOpcionesList = async () => {
    if (!MENU_SCRIPT_URL) return [];
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(SHEET_NAME)}&_ts=${Date.now()}`;
    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        if (data?.error || data?.result === "error") return [];
        return rowsFromSheetData(data);
    } catch (e) {
        console.error(e);
        return [];
    }
};

const fillGrupoDatalist = (rows) => {
    const datalist = document.getElementById("grupo-datalist");
    if (!datalist) return;
    const seen = new Set();
    const grupos = [];
    for (const r of rows) {
        const g = cleanText(getValue(r, ["Grupo", "grupo"]));
        if (g && !seen.has(g)) {
            seen.add(g);
            grupos.push(g);
        }
    }
    grupos.sort((a, b) => a.localeCompare(b, "es"));
    datalist.innerHTML = grupos.map((g) => `<option value="${escapeHtml(g)}">`).join("");
};

const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
};

const setDebug = (message) => {
    const box = document.getElementById("script-debug");
    if (!box) return;
    if (!message) {
        box.style.display = "none";
        box.textContent = "";
        return;
    }
    box.style.display = "block";
    box.textContent = message;
};

const VALIDATION = {
    idOpcionesMaxLen: 50,
    grupoMaxLen: 100,
    nombreOpcionMaxLen: 150,
    recargoMax: 999999.99
};

const showValidationErrors = (errors, form) => {
    const box = document.getElementById("form-validation-errors");
    if (!box) return;
    if (form) form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    if (!errors || errors.length === 0) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
    }
    box.innerHTML = "<strong>Revisá los siguientes datos:</strong><ul>" +
        errors.map((e) => "<li>" + e.message + "</li>").join("") + "</ul>";
    box.style.display = "block";
    if (form && errors[0].field) {
        const input = form.querySelector("[name=\"" + errors[0].field + "\"]");
        if (input) {
            input.classList.add("invalid");
            input.focus();
        }
    }
};

const clearValidationErrors = (form) => {
    const box = document.getElementById("form-validation-errors");
    if (box) { box.style.display = "none"; box.innerHTML = ""; }
    form?.querySelectorAll(".invalid")?.forEach((el) => el.classList.remove("invalid"));
};

const validateForm = (form) => {
    const data = new FormData(form);
    const idopciones = cleanText(data.get("idopciones"));
    const grupo = cleanText(data.get("grupo"));
    const tipo = (cleanText(data.get("tipo")) || "uno").toLowerCase();
    const obligatorio = (cleanText(data.get("obligatorio")) || "NO").toUpperCase();
    const opcion = cleanText(data.get("opcion"));
    const recargoRaw = cleanText(data.get("recargo"));
    const recargo = recargoRaw === "" ? 0 : parseFloat(recargoRaw.replace(",", "."));
    const errors = [];

    if (!idopciones) errors.push({ field: "idopciones", message: "ID Opciones es obligatorio." });
    else if (idopciones.length > VALIDATION.idOpcionesMaxLen) {
        errors.push({ field: "idopciones", message: "ID Opciones no puede superar " + VALIDATION.idOpcionesMaxLen + " caracteres." });
    }

    if (!grupo) errors.push({ field: "grupo", message: "Grupo es obligatorio." });
    else if (grupo.length > VALIDATION.grupoMaxLen) {
        errors.push({ field: "grupo", message: "Grupo no puede superar " + VALIDATION.grupoMaxLen + " caracteres." });
    }

    if (tipo !== "uno" && tipo !== "varios") {
        errors.push({ field: "tipo", message: "Tipo debe ser \"uno\" o \"varios\"." });
    }

    if (obligatorio !== "NO" && obligatorio !== "SI") {
        errors.push({ field: "obligatorio", message: "Obligatorio debe ser \"SI\" o \"NO\"." });
    }

    if (!opcion) errors.push({ field: "opcion", message: "Nombre de la Opción es obligatorio." });
    else if (opcion.length > VALIDATION.nombreOpcionMaxLen) {
        errors.push({ field: "opcion", message: "Nombre de la Opción no puede superar " + VALIDATION.nombreOpcionMaxLen + " caracteres." });
    }

    if (Number.isNaN(recargo) || recargo < 0) {
        errors.push({ field: "recargo", message: "Recargo debe ser un número mayor o igual a 0." });
    } else if (recargo > VALIDATION.recargoMax) {
        errors.push({ field: "recargo", message: "Recargo no puede superar " + VALIDATION.recargoMax + "." });
    }

    return { valid: errors.length === 0, errors };
};

const loadForEdit = async () => {
    const params = new URLSearchParams(window.location.search);
    const idopciones = params.get("idopciones") ?? "";
    const grupo = params.get("grupo") ?? "";
    const opcion = params.get("opcion") ?? "";
    if (!idopciones && !grupo && !opcion) return false;

    const hint = document.getElementById("edit-loading-hint");
    if (hint) { hint.textContent = "Cargando datos para editar..."; hint.style.display = "block"; }

    const rows = await fetchOpcionesList();
    fillGrupoDatalist(rows);
    const idNorm = cleanText(idopciones);
    const grupoNorm = cleanText(grupo);
    const opcionNorm = cleanText(opcion);
    const row = rows.find((r) => {
        const rid = cleanText(getValue(r, ["ID Opciones", "idopciones", "idproducto"]));
        const rgrupo = cleanText(getValue(r, ["Grupo", "grupo"]));
        const ropcion = cleanText(getValue(r, ["Opcion", "opcion", "Opción"]));
        return rid === idNorm && rgrupo === grupoNorm && ropcion === opcionNorm;
    });

    if (hint) hint.style.display = "none";
    const notFoundMsg = document.getElementById("edit-not-found-msg");
    if (!row) {
        if ((idopciones || grupo || opcion) && notFoundMsg) {
            notFoundMsg.style.display = "block";
            notFoundMsg.textContent = "No se encontró esta opción en la hoja opciones-base. Puede que haya sido eliminada.";
        }
        return false;
    }
    if (notFoundMsg) notFoundMsg.style.display = "none";

    const form = document.getElementById("opcion-form");
    if (!form) return false;
    form.querySelector('[name="idopciones"]').value = cleanText(getValue(row, ["ID Opciones", "idopciones", "idproducto"]));
    form.querySelector('[name="grupo"]').value = cleanText(getValue(row, ["Grupo", "grupo"]));
    form.querySelector('[name="tipo"]').value = (cleanText(getValue(row, ["Tipo", "tipo"])) || "uno").toLowerCase();
    form.querySelector('[name="obligatorio"]').value = (cleanText(getValue(row, ["Obligatorio", "obligatorio"])) || "NO").toUpperCase();
    form.querySelector('[name="opcion"]').value = cleanText(getValue(row, ["Opcion", "opcion", "Opción"]));
    const rec = getValue(row, ["Recargo", "recargo"]);
    form.querySelector('[name="recargo"]').value = rec !== "" ? Number(rec) || 0 : 0;

    document.getElementById("form-mode").value = "edit";
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) submitBtn.textContent = "Actualizar";
    const titleEl = document.getElementById("form-title-text");
    if (titleEl) titleEl.textContent = "Editar opción";
    const headerDesc = document.getElementById("form-header-desc");
    if (headerDesc) headerDesc.textContent = "Modificá los datos de la opción. Se actualiza en la hoja opciones-base.";
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) pageTitle.textContent = "Editar opción - Toro Rápido";
    const footerHint = document.getElementById("form-footer-hint");
    if (footerHint) footerHint.textContent = "Hoja: opciones-base.";
    return true;
};

const updateDebugPayloadOpciones = () => {
    if (typeof window.renderDebugPayloadSection !== "function") return;
    const form = document.getElementById("opcion-form");
    if (!form) return;
    const data = new FormData(form);
    const formMode = document.getElementById("form-mode")?.value || "create";
    const idopciones = cleanText(data.get("idopciones"));
    const grupo = cleanText(data.get("grupo"));
    const opcion = cleanText(data.get("opcion"));
    const payload = {
        action: formMode === "edit" ? "update" : "create",
        sheetName: SHEET_NAME,
        idopciones,
        "ID Opciones": idopciones,
        Grupo: grupo,
        Tipo: (cleanText(data.get("tipo")) || "uno").toLowerCase(),
        Obligatorio: (cleanText(data.get("obligatorio")) || "NO").toUpperCase(),
        Opcion: opcion,
        Recargo: cleanText(data.get("recargo")) || "0"
    };
    if (formMode === "edit") {
        const params = new URLSearchParams(window.location.search);
        payload.idopcionesOld = params.get("idopciones") ?? idopciones;
        payload.grupoOld = params.get("grupo") ?? grupo;
        payload.opcionOld = params.get("opcion") ?? opcion;
    }
    const actionType = formMode === "edit" ? "update" : "create";
    const actionDescription = formMode === "edit"
        ? "Actualización de un registro existente en la hoja de Google Sheet (opciones/agregados por producto)."
        : "Escritura en la hoja de Google Sheet. Se crea un nuevo registro de opción (grupo, tipo, obligatorio, opción, recargo).";
    window.renderDebugPayloadSection("debug-payload-wrap", [{ sheetName: SHEET_NAME, actionType, actionDescription, payload }]);
};

const initForm = () => {
    const form = document.getElementById("opcion-form");
    form?.addEventListener("input", updateDebugPayloadOpciones);
    form?.addEventListener("change", updateDebugPayloadOpciones);
    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearValidationErrors(form);
        if (!MENU_SCRIPT_URL) {
            alert("Falta configurar appsScriptMenuUrl en config.js.");
            return;
        }
        const validation = validateForm(form);
        if (!validation.valid) {
            showValidationErrors(validation.errors, form);
            return;
        }
        const submitBtn = document.getElementById("submit-btn");
        const originalSubmitText = submitBtn?.textContent || "Guardar";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Guardando...";
        }
        try {
        setDebug("Enviando...");

        const formMode = document.getElementById("form-mode")?.value || "create";
        const data = new FormData(form);
        const idopciones = cleanText(data.get("idopciones"));
        const grupo = cleanText(data.get("grupo"));
        const opcion = cleanText(data.get("opcion"));

        const payload = {
            action: formMode === "edit" ? "update" : "create",
            sheetName: SHEET_NAME,
            idopciones: idopciones,
            "ID Opciones": idopciones,
            Grupo: grupo,
            Tipo: (cleanText(data.get("tipo")) || "uno").toLowerCase(),
            Obligatorio: (cleanText(data.get("obligatorio")) || "NO").toUpperCase(),
            Opcion: opcion,
            Recargo: cleanText(data.get("recargo")) || "0"
        };

        if (formMode === "edit") {
            const params = new URLSearchParams(window.location.search);
            payload.idopcionesOld = params.get("idopciones") ?? idopciones;
            payload.grupoOld = params.get("grupo") ?? grupo;
            payload.opcionOld = params.get("opcion") ?? opcion;
        }

        try {
            await fetch(MENU_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            setDebug("Enviado. Revisá el Sheet.");
            alert(formMode === "edit" ? "Opción enviada para actualizar." : "Opción enviada para crear.");
            window.location.href = "admin-opciones.html";
        } catch (error) {
            console.error(error);
            setDebug("Error: " + (error?.message || error));
            alert("No se pudo enviar. Revisá el Apps Script.");
        }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalSubmitText;
            }
        }
    });
};

const generateNextIdOpciones = (rows) => {
    const idKeys = ["ID Opciones", "idopciones"];
    let maxNum = 0;
    for (const r of rows) {
        const raw = cleanText(getValue(r, idKeys));
        const match = /^OPC-?(\d+)$/i.exec(raw);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
    return "OPC-" + String(maxNum + 1).padStart(3, "0");
};

const setCreateModeId = async () => {
    const input = document.getElementById("id-opciones-input");
    if (!input) return;
    input.readOnly = true;
    const rows = await fetchOpcionesList();
    fillGrupoDatalist(rows);
    input.value = generateNextIdOpciones(rows);
};

document.addEventListener("DOMContentLoaded", async () => {
    initForm();
    const isEdit = await loadForEdit();
    if (isEdit) {
        const input = document.getElementById("id-opciones-input");
        if (input) input.readOnly = true;
    } else {
        document.getElementById("form-mode").value = "create";
        await setCreateModeId();
    }
    updateDebugPayloadOpciones();
});
