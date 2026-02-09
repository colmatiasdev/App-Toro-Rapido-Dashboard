// Módulo de edición de productos: lee y actualiza registros en la hoja productos-base (solo por ID).
const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const SHEET_NAME = window.APP_CONFIG?.menuProductosSheetName || "productos-base";

const cleanText = (value) => (value ?? "").toString().trim();

const normalizeKey = (value) => (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

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

const fetchProductosList = async () => {
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

const VALIDATION = {
    idProductoMaxLen: 50,
    nombreMaxLen: 200
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
    const idproducto = cleanText(data.get("idproducto"));
    const nombre = cleanText(data.get("nombre"));
    const errors = [];

    if (!idproducto) errors.push({ field: "idproducto", message: "ID Producto es obligatorio." });
    else if (idproducto.length > VALIDATION.idProductoMaxLen) {
        errors.push({ field: "idproducto", message: "ID Producto no puede superar " + VALIDATION.idProductoMaxLen + " caracteres." });
    }
    if (!nombre) errors.push({ field: "nombre", message: "Nombre es obligatorio." });
    else if (nombre.length > VALIDATION.nombreMaxLen) {
        errors.push({ field: "nombre", message: "Nombre no puede superar " + VALIDATION.nombreMaxLen + " caracteres." });
    }
    return { valid: errors.length === 0, errors };
};

const STORAGE_KEY = "productosEdit";

const getEditParams = () => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            sessionStorage.removeItem(STORAGE_KEY);
            const data = JSON.parse(stored);
            return { idproducto: data.idproducto ?? "" };
        }
    } catch (e) {
        console.warn("Error leyendo sessionStorage", e);
    }
    const params = new URLSearchParams(window.location.search || "");
    return { idproducto: params.get("idproducto") ?? "" };
};

let editKeyIdProducto = "";

const loadRecordAndShowForm = async () => {
    const params = getEditParams();
    const idproducto = params.idproducto ?? "";

    const hint = document.getElementById("edit-loading-hint");
    const notFoundMsg = document.getElementById("edit-not-found-msg");
    const form = document.getElementById("producto-form");

    if (!idproducto) {
        if (hint) hint.style.display = "none";
        if (notFoundMsg) {
            notFoundMsg.innerHTML = "Faltan parámetros para editar. <a href=\"admin-productos.html\">Volver al listado de productos</a>.";
            notFoundMsg.style.display = "block";
        }
        if (form) form.style.display = "none";
        return;
    }

    if (hint) { hint.textContent = "Cargando datos del registro..."; hint.style.display = "block"; }
    if (notFoundMsg) notFoundMsg.style.display = "none";

    const rows = await fetchProductosList();
    const idNorm = cleanText(idproducto);
    const row = rows.find((r) => cleanText(getValue(r, ["ID Producto", "idproducto"])) === idNorm);

    if (hint) hint.style.display = "none";

    if (!row) {
        if (notFoundMsg) {
            notFoundMsg.innerHTML = "No se encontró este producto en la hoja productos-base. <a href=\"admin-productos.html\">Volver al listado</a>.";
            notFoundMsg.style.display = "block";
        }
        if (form) form.style.display = "none";
        return;
    }

    if (notFoundMsg) notFoundMsg.style.display = "none";
    if (!form) return;

    editKeyIdProducto = idNorm;

    form.querySelector('[name="idproducto"]').value = cleanText(getValue(row, ["ID Producto", "idproducto"]));
    form.querySelector('[name="nombre"]').value = cleanText(getValue(row, ["Nombre", "nombre"]));
    const habilitada = (cleanText(getValue(row, ["Habilitada", "habilitada"])) || "NO").toUpperCase();
    form.querySelector('[name="habilitada"]').value = habilitada === "SI" ? "SI" : "NO";

    const idInput = document.getElementById("id-producto-input");
    if (idInput) idInput.readOnly = true;

    form.style.display = "";
};

const initForm = () => {
    const form = document.getElementById("producto-form");
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
        setDebug("Enviando...");

        const data = new FormData(form);
        const idproducto = cleanText(data.get("idproducto"));
        const nombre = cleanText(data.get("nombre"));
        const habilitada = (cleanText(data.get("habilitada")) || "SI").toUpperCase();

        const payload = {
            action: "update",
            sheetName: SHEET_NAME,
            idproductoOld: editKeyIdProducto || idproducto,
            idproducto: idproducto,
            "ID Producto": idproducto,
            Nombre: nombre,
            Habilitada: habilitada === "SI" ? "SI" : "NO"
        };

        try {
            await fetch(MENU_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            setDebug("Enviado. Revisá el Sheet.");
            alert("Producto actualizado.");
            window.location.href = "admin-productos.html";
        } catch (error) {
            console.error(error);
            setDebug("Error: " + (error?.message || error));
            alert("No se pudo enviar. Revisá el Apps Script.");
        }
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    initForm();
    await loadRecordAndShowForm();
});
