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

const loadForEdit = async () => {
    const params = new URLSearchParams(window.location.search);
    const idproducto = params.get("idproducto") || "";
    const grupo = params.get("grupo") || "";
    const opcion = params.get("opcion") || "";
    if (!idproducto && !grupo && !opcion) return false;

    const rows = await fetchOpcionesList();
    const row = rows.find((r) => {
        const rid = cleanText(getValue(r, ["idproducto"]));
        const rgrupo = cleanText(getValue(r, ["Grupo", "grupo"]));
        const ropcion = cleanText(getValue(r, ["Opcion", "opcion", "Opción"]));
        return rid === idproducto && rgrupo === grupo && ropcion === opcion;
    });
    if (!row) return false;

    const form = document.getElementById("opcion-form");
    if (!form) return false;
    form.querySelector('[name="idproducto"]').value = cleanText(getValue(row, ["idproducto"]));
    form.querySelector('[name="grupo"]').value = cleanText(getValue(row, ["Grupo", "grupo"]));
    form.querySelector('[name="tipo"]').value = (cleanText(getValue(row, ["Tipo", "tipo"])) || "uno").toLowerCase();
    form.querySelector('[name="obligatorio"]').value = (cleanText(getValue(row, ["Obligatorio", "obligatorio"])) || "NO").toUpperCase();
    form.querySelector('[name="opcion"]').value = cleanText(getValue(row, ["Opcion", "opcion", "Opción"]));
    const rec = getValue(row, ["Recargo", "recargo"]);
    form.querySelector('[name="recargo"]').value = rec !== "" ? Number(rec) || 0 : 0;

    document.getElementById("form-mode").value = "edit";
    document.getElementById("submit-btn").textContent = "Actualizar";
    var titleEl = document.getElementById("form-title-text");
    if (titleEl) titleEl.textContent = "Editar opción";
    return true;
};

const initForm = () => {
    const form = document.getElementById("opcion-form");
    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!MENU_SCRIPT_URL) {
            alert("Falta configurar appsScriptMenuUrl en config.js.");
            return;
        }
        setDebug("Enviando...");

        const formMode = document.getElementById("form-mode")?.value || "create";
        const data = new FormData(form);
        const idproducto = cleanText(data.get("idproducto"));
        const grupo = cleanText(data.get("grupo"));
        const opcion = cleanText(data.get("opcion"));
        if (!idproducto || !opcion) {
            alert("Completá ID Producto y Opción.");
            return;
        }

        const payload = {
            action: formMode === "edit" ? "update" : "create",
            sheetName: SHEET_NAME,
            idproducto: idproducto,
            Grupo: grupo,
            Tipo: (cleanText(data.get("tipo")) || "uno").toLowerCase(),
            Obligatorio: (cleanText(data.get("obligatorio")) || "NO").toUpperCase(),
            Opcion: opcion,
            Recargo: cleanText(data.get("recargo")) || "0"
        };

        if (formMode === "edit") {
            const params = new URLSearchParams(window.location.search);
            payload.idproductoOld = params.get("idproducto") || idproducto;
            payload.grupoOld = params.get("grupo") || grupo;
            payload.opcionOld = params.get("opcion") || opcion;
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
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    initForm();
    var isEdit = await loadForEdit();
    if (!isEdit) {
        document.getElementById("form-mode").value = "create";
    }
});
