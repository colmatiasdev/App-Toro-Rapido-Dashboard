const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const MENU_SHEET_NAME = window.APP_CONFIG?.menuCompuestoSheetName || "menu-toro-rapido-web-compuesto";

const state = { rows: [] };

const normalizeKey = (value) => (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const cleanText = (value) => (value ?? "").toString().trim();

const parsePrice = (value) => {
    const raw = cleanText(value);
    if (!raw) return 0;
    const normalized = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const parseEnabled = (value) => {
    const raw = normalizeKey(value || "");
    if (raw === "si" || raw === "1") return true;
    if (raw === "no" || raw === "0" || raw === "false") return false;
    return true;
};

const getValue = (row, keyOrKeys) => {
    if (typeof keyOrKeys === "string") return row[keyOrKeys] ?? row[normalizeKey(keyOrKeys)] ?? "";
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    for (const k of Object.keys(row || {})) {
        const n = normalizeKey(k);
        if (keys.some((c) => normalizeKey(c) === n)) return row[k];
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

const loadMenu = async () => {
    const tbody = document.getElementById("menu-body");
    if (!tbody) return;

    if (!MENU_SCRIPT_URL) {
        tbody.innerHTML = `<tr><td colspan="9" class="table-loading">No hay Apps Script configurado (appsScriptMenuUrl en config.js).</td></tr>`;
        return;
    }

    try {
        const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
        const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(MENU_SHEET_NAME)}&_ts=${Date.now()}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar el menú");
        const text = await response.text();
        let data = null;
        try { data = JSON.parse(text); } catch (e) { throw new Error("Respuesta inválida"); }
        if (data?.error || data?.result === "error") throw new Error(data?.message || "Error en el servidor");

        const rawRows = rowsFromSheetData(data);
        if (!rawRows.length) {
            tbody.innerHTML = `<tr><td colspan="9" class="table-loading">No hay datos para mostrar.</td></tr>`;
            return;
        }

        const mapped = rawRows.map((row, index) => {
            const id = cleanText(getValue(row, ["idmenu-unico", "idmenuunico", "idproducto", "id"]));
            const order = cleanText(getValue(row, ["orden", "order"])) || index + 1;
            const tipoMenu = cleanText(getValue(row, ["Tipo Menu", "tipomenu", "tipo"])) || "MENU-SIMPLE";
            const category = cleanText(getValue(row, ["Categoria", "categoria"])) || "Otros";
            const name = cleanText(getValue(row, ["Producto", "producto", "nombre"]));
            const price = parsePrice(getValue(row, ["Precio Actual", "precioactual", "precio", "Precio"]));
            const stock = cleanText(getValue(row, ["Stock", "stock"]));
            const agotadoRaw = cleanText(getValue(row, ["Producto Agotado", "productoagotado", "agotado"]));
            const agotado = normalizeKey(agotadoRaw) === "si" ? "SI" : "NO";
            const enabled = parseEnabled(getValue(row, ["Habilitado", "habilitado"]));
            return {
                order,
                id,
                tipoMenu,
                category,
                name,
                price,
                stock,
                agotado,
                enabled
            };
        }).filter((row) => row.name && row.enabled);

        state.rows = mapped;
        tbody.innerHTML = mapped.length === 0
            ? `<tr><td colspan="9" class="table-loading">No hay ítems habilitados.</td></tr>`
            : mapped.map((item, idx) => `
                <tr>
                    <td>${item.order}</td>
                    <td>${item.id || "-"}</td>
                    <td>${item.tipoMenu}</td>
                    <td>${item.category}</td>
                    <td>${item.name}</td>
                    <td>$ ${Number(item.price).toLocaleString("es-AR")}</td>
                    <td>${item.stock || "-"}</td>
                    <td>
                        <span class="status ${item.agotado === "SI" ? "out" : "ok"}">
                            ${item.agotado === "SI" ? "AGOTADO" : "DISPONIBLE"}
                        </span>
                    </td>
                    <td class="actions">
                        <button class="action-btn" data-action="edit" data-index="${idx}">Editar</button>
                        <button class="action-btn danger" data-action="delete" data-index="${idx}">Deshabilitar</button>
                    </td>
                </tr>
            `).join("");
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="9" class="table-loading">No se pudo cargar el menú.</td></tr>`;
    }
};

const initTableActions = () => {
    const tbody = document.getElementById("menu-body");
    tbody?.addEventListener("click", async (event) => {
        const btn = event.target.closest(".action-btn");
        if (!btn) return;
        const index = Number(btn.dataset.index);
        const item = state.rows[index];
        if (!item) return;

        if (btn.dataset.action === "edit") {
            if (!item.id) {
                alert("Este ítem no tiene ID. No se puede editar.");
                return;
            }
            window.location.href = `admin-menu-compuesto-crear.html?id=${encodeURIComponent(item.id)}`;
        }

        if (btn.dataset.action === "delete") {
            if (!MENU_SCRIPT_URL) {
                alert("Falta configurar appsScriptMenuUrl en config.js.");
                return;
            }
            if (!item.id) {
                alert("Este ítem no tiene ID. No se puede deshabilitar.");
                return;
            }
            if (!confirm(`¿Deshabilitar ${item.name}?`)) return;
            try {
                await fetch(MENU_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    body: JSON.stringify({
                        action: "update",
                        sheetName: MENU_SHEET_NAME,
                        "idmenu-unico": item.id,
                        idmenuunico: item.id,
                        habilitado: "NO",
                        Habilitado: "NO"
                    })
                });
                alert("Ítem deshabilitado.");
                loadMenu();
                setTimeout(() => loadMenu(), 1200);
            } catch (error) {
                console.error(error);
                alert("No se pudo deshabilitar el ítem.");
            }
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    initTableActions();
    loadMenu();
});
