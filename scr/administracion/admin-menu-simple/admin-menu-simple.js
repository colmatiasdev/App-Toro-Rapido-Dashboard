const URL_CSV = window.APP_CONFIG?.googleSheetUrl || "";
const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const MENU_SHEET_NAME = window.APP_CONFIG?.menuSimpleSheetName || "menu-toro-rapido-web-simple";

const state = {
    rows: []
};

const normalizeKey = (value) => value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const cleanText = (value) => (value ?? "").toString().trim();

const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            row.push(current);
            current = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") {
                i += 1;
            }
            row.push(current);
            if (row.some((cell) => cell.trim() !== "")) {
                rows.push(row);
            }
            row = [];
            current = "";
        } else {
            current += char;
        }
    }

    if (current.length || row.length) {
        row.push(current);
        if (row.some((cell) => cell.trim() !== "")) {
            rows.push(row);
        }
    }

    return rows;
};

const parsePrice = (value) => {
    const raw = cleanText(value);
    if (!raw) return 0;
    let normalized = raw.replace(/[^\d,.-]/g, "");
    normalized = normalized.replace(/\./g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const parseAvailability = (agotadoValue, stockValue) => {
    const agotadoRaw = normalizeKey(agotadoValue || "");
    const stockRaw = normalizeKey(stockValue || "");

    if (agotadoRaw === "si") return false;
    if (agotadoRaw === "no") return true;

    if (stockRaw) {
        const amount = Number.parseFloat(stockRaw);
        if (!Number.isNaN(amount)) return amount > 0;
    }

    return true;
};

const parseEnabled = (value) => {
    const clean = cleanText(value).toUpperCase();
    if (!clean) return true;
    if (clean === "SI") return true;
    if (clean === "NO") return false;
    const raw = normalizeKey(value || "");
    if (raw === "si") return true;
    if (raw === "no") return false;
    return !["0", "false", "inactivo", "deshabilitado"].includes(raw);
};

const loadMenu = async () => {
    const tbody = document.getElementById("menu-body");
    if (!tbody) return;
    if (!URL_CSV) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-loading">No hay URL de Google Sheet configurada.</td></tr>`;
        return;
    }

    try {
        const sep = URL_CSV.includes("?") ? "&" : "?";
        const response = await fetch(`${URL_CSV}${sep}_ts=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("CSV no disponible");
        const csvText = await response.text();
        const rows = parseCsv(csvText);
        if (rows.length < 2) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-loading">No hay datos para mostrar.</td></tr>`;
            return;
        }

        const headers = rows.shift().map((header) => normalizeKey(header));
        const findIndex = (candidates) => headers.findIndex((header) => candidates.includes(header));

        const idxCategory = findIndex(["categoria", "categorias", "category", "cat", "rubro", "tipo"]);
        const idxName = findIndex(["producto", "nombre", "product", "name", "titulo", "item"]);
        const idxPrice = findIndex(["precio", "price", "valor", "importe", "costo"]);
        const idxAgotado = findIndex(["productoagotado", "agotado"]);
        const idxStock = findIndex(["stock"]);
        const idxId = findIndex(["idproducto", "idprod", "id", "codigo", "sku"]);
        const idxOrder = findIndex(["orden", "order", "posicion", "position"]);
        const idxEnabled = findIndex(["habilitado", "activo", "visible", "mostrar"]);
        const idxDesc = findIndex(["descripcion", "desc", "detalle", "detalleproducto", "descripcionproducto"]);
        const idxImg = findIndex(["imagen", "img", "image", "foto", "url", "urlimagen", "imagenurl"]);
        const idxDestacado = findIndex(["esdestacado", "destacado"]);

        const mapped = rows.map((row, index) => {
            const category = idxCategory === -1 ? "Otros" : cleanText(row[idxCategory]) || "Otros";
            const name = idxName === -1 ? "" : cleanText(row[idxName]);
            const price = idxPrice === -1 ? 0 : parsePrice(row[idxPrice]);
            const id = idxId === -1 ? "" : cleanText(row[idxId]);
            const order = idxOrder === -1 ? "" : cleanText(row[idxOrder]);
            const stock = idxStock === -1 ? "" : cleanText(row[idxStock]);
            const agotadoValue = idxAgotado === -1 ? "" : row[idxAgotado];
            const available = parseAvailability(agotadoValue, stock);
            const desc = idxDesc === -1 ? "" : cleanText(row[idxDesc]);
            const image = idxImg === -1 ? "" : cleanText(row[idxImg]);
            const destacado = idxDestacado === -1 ? "" : cleanText(row[idxDestacado]);
            const enabledValue = idxEnabled === -1 ? "" : row[idxEnabled];
            const enabled = parseEnabled(enabledValue);
            return {
                order: order === "" ? index + 1 : order,
                id,
                category,
                name,
                price,
                stock,
                agotado: available ? "NO" : "SI",
                desc,
                image,
                destacado,
                enabled
            };
        }).filter((row) => row.name && row.enabled);

        state.rows = mapped;
        tbody.innerHTML = mapped.map((item, idx) => `
            <tr>
                <td>${item.order}</td>
                <td>${item.id || "-"}</td>
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
        tbody.innerHTML = `<tr><td colspan="7" class="table-loading">No se pudo cargar el menú.</td></tr>`;
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
            window.location.href = `admin-menu-simple-crear.html?id=${encodeURIComponent(item.id)}`;
        }

        if (btn.dataset.action === "delete") {
            if (!MENU_SCRIPT_URL) {
                alert("Falta configurar appsScriptMenuUrl en config.js.");
                return;
            }
            if (!item.id) {
                alert("Este ítem no tiene ID. No se puede borrar.");
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
                        idproducto: item.id,
                        habilitado: "NO",
                        Habilitado: "NO"
                    })
                });
                alert("Ítem deshabilitado.");
                const rowEl = btn.closest("tr");
                if (rowEl) rowEl.remove();
                state.rows.splice(index, 1);
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
