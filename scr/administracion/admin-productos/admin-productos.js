const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const SHEET_NAME = window.APP_CONFIG?.menuProductosSheetName || "productos-base";

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
        const headers = data.headers.map((h, i) => (h != null && String(h).trim() !== "" ? String(h).trim() : "Columna" + (i + 1)));
        return data.rows.map((row) => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = i < row.length ? row[i] : ""; });
            return obj;
        });
    }
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const loadProductos = async () => {
    const tbody = document.getElementById("productos-body");
    if (!tbody) return;

    if (!MENU_SCRIPT_URL) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-loading">No hay Apps Script configurado (appsScriptMenuUrl en config.js).</td></tr>`;
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
            tbody.innerHTML = `<tr><td colspan="4" class="table-loading">No hay productos. Agregá uno desde el botón superior.</td></tr>`;
            return;
        }

        const habilitadaVal = (v) => (cleanText(v) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const mapped = rawRows.map((row) => {
            const idproducto = cleanText(getValue(row, ["ID Producto", "idproducto", "ID PRODUCTO"]));
            const nombre = cleanText(getValue(row, ["Nombre", "nombre", "NOMBRE", "Producto", "producto", "Columna2"]));
            const habilitada = habilitadaVal(getValue(row, ["Habilitada", "habilitada", "HABILITADA", "Columna3"]));
            return { idproducto, nombre, habilitada };
        }).filter((r) => r.idproducto || r.nombre);

        state.rows = mapped;
        const STORAGE_KEY = "productosEdit";
        const btnHabilitada = (h, idx) => {
            const isSi = h === "SI";
            const cls = isSi ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no";
            const title = isSi ? "Habilitada. Clic para deshabilitar" : "Deshabilitada. Clic para habilitar";
            const icon = isSi ? "fa-circle-check" : "fa-circle-xmark";
            return `<button type="button" class="${cls}" data-index="${idx}" title="${title}" aria-label="${title}"><i class="fa-solid ${icon}"></i></button>`;
        };
        tbody.innerHTML = mapped.map((row, idx) => `
            <tr>
                <td>${row.idproducto || "—"}</td>
                <td>${row.nombre || "—"}</td>
                <td class="habilitada-cell">${btnHabilitada(row.habilitada, idx)}</td>
                <td class="actions">
                    <a class="action-btn" href="admin-productos-edit.html" data-action="edit" data-index="${idx}">Editar</a>
                </td>
            </tr>`).join("");

        tbody.addEventListener("click", async function (e) {
            const toggleBtn = e.target.closest(".habilitada-btn");
            if (toggleBtn) {
                e.preventDefault();
                const idx = parseInt(toggleBtn.getAttribute("data-index"), 10);
                const row = state.rows[idx];
                if (!row || !MENU_SCRIPT_URL) return;
                const newHabilitada = row.habilitada === "SI" ? "NO" : "SI";
                toggleBtn.disabled = true;
                toggleBtn.classList.add("habilitada-btn-loading");
                try {
                    const payload = {
                        action: "update",
                        sheetName: SHEET_NAME,
                        idproductoOld: row.idproducto || "",
                        idproducto: row.idproducto || "",
                        "ID Producto": row.idproducto || "",
                        Nombre: row.nombre || "",
                        Habilitada: newHabilitada
                    };
                    await fetch(MENU_SCRIPT_URL, {
                        method: "POST",
                        mode: "no-cors",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify(payload)
                    });
                    await loadProductos();
                } catch (err) {
                    console.error(err);
                    alert("No se pudo actualizar Habilitada. Revisá la consola.");
                } finally {
                    toggleBtn.disabled = false;
                    toggleBtn.classList.remove("habilitada-btn-loading");
                }
                return;
            }
            const link = e.target.closest(".action-btn[data-action='edit']");
            if (!link) return;
            const idx = parseInt(link.getAttribute("data-index"), 10);
            const row = state.rows[idx];
            if (!row) return;
            e.preventDefault();
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                    idproducto: row.idproducto || ""
                }));
            } catch (err) {
                console.warn("sessionStorage no disponible", err);
            }
            window.location.href = "admin-productos-edit.html";
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" class="table-loading">No se pudo cargar los productos.</td></tr>`;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadProductos();
});
