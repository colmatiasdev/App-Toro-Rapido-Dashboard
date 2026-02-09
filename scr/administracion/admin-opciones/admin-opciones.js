const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const SHEET_NAME = window.APP_CONFIG?.menuOpcionesSheetName || "opciones-base";

const state = { rows: [] };

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

const parseRecargo = (value) => {
    const raw = cleanText(value);
    if (!raw) return 0;
    const n = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const num = Number.parseFloat(n);
    return Number.isNaN(num) ? 0 : num;
};

const loadOpciones = async () => {
    const tbody = document.getElementById("opciones-body");
    if (!tbody) return;

    if (!MENU_SCRIPT_URL) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-loading">No hay Apps Script configurado (appsScriptMenuUrl en config.js).</td></tr>`;
        return;
    }

    try {
        const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
        const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(SHEET_NAME)}&_ts=${Date.now()}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar");
        const text = await response.text();
        let data = null;
        try { data = JSON.parse(text); } catch (e) { throw new Error("Respuesta inválida"); }
        if (data?.error || data?.result === "error") throw new Error(data?.message || "Error");

        const rawRows = rowsFromSheetData(data);
        if (!rawRows.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-loading">No hay opciones. Agregá una desde el botón superior.</td></tr>`;
            return;
        }

        const mapped = rawRows.map((row) => {
            const idproducto = cleanText(getValue(row, ["idproducto", "idproducto"]));
            const grupo = cleanText(getValue(row, ["Grupo", "grupo"]));
            const tipo = cleanText(getValue(row, ["Tipo", "tipo"])) || "uno";
            const obligatorio = cleanText(getValue(row, ["Obligatorio", "obligatorio"])) || "NO";
            const opcion = cleanText(getValue(row, ["Opcion", "opcion", "Opción"]));
            const recargo = parseRecargo(getValue(row, ["Recargo", "recargo"]));
            return { idproducto, grupo, tipo, obligatorio, opcion, recargo };
        }).filter((r) => r.idproducto || r.grupo || r.opcion);

        state.rows = mapped;
        tbody.innerHTML = mapped.map((row, idx) => `
            <tr>
                <td>${row.idproducto || "—"}</td>
                <td>${row.grupo || "—"}</td>
                <td>${row.tipo}</td>
                <td>${row.obligatorio}</td>
                <td>${row.opcion || "—"}</td>
                <td>$ ${Number(row.recargo).toLocaleString("es-AR")}</td>
                <td class="actions">
                    <button class="action-btn" data-action="edit" data-index="${idx}">Editar</button>
                </td>
            </tr>
        `).join("");
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="7" class="table-loading">No se pudo cargar las opciones.</td></tr>`;
    }
};

const initTableActions = () => {
    const tbody = document.getElementById("opciones-body");
    tbody?.addEventListener("click", (event) => {
        const btn = event.target.closest(".action-btn");
        if (!btn) return;
        const index = Number(btn.dataset.index);
        const row = state.rows[index];
        if (!row) return;
        if (btn.dataset.action === "edit") {
            const params = new URLSearchParams({
                idproducto: row.idproducto || "",
                grupo: row.grupo || "",
                opcion: row.opcion || ""
            });
            window.location.href = `admin-opciones-crear.html?${params.toString()}`;
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    initTableActions();
    loadOpciones();
});
