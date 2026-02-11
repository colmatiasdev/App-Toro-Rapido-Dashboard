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
        tbody.innerHTML = `<tr><td colspan="11" class="table-loading">No hay Apps Script configurado (appsScriptMenuUrl en config.js).</td></tr>`;
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
            tbody.innerHTML = `<tr><td colspan="11" class="table-loading">No hay productos. Agregá uno desde el botón superior.</td></tr>`;
            return;
        }

        const siNo = (v) => (cleanText(v) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const mapped = rawRows.map((row) => {
            const idproducto = cleanText(getValue(row, ["ID Producto", "idproducto"]));
            const categoria = cleanText(getValue(row, ["Categoria", "categoria", "Categoría"]));
            const producto = cleanText(getValue(row, ["Producto", "producto"]));
            const descripcion = cleanText(getValue(row, ["Descripcion", "descripcion", "Descripción"]));
            const precioActual = getValue(row, ["Precio Actual", "precioactual", "PrecioActual"]);
            const precioRegular = getValue(row, ["Precio Regular", "precioregular", "PrecioRegular"]);
            const imagen = cleanText(getValue(row, ["Imagen", "imagen"]));
            const esDestacado = siNo(getValue(row, ["Es Destacado", "esdestacado", "EsDestacado"]));
            const productoAgotado = siNo(getValue(row, ["Producto Agotado", "productoagotado", "ProductoAgotado"]));
            const stock = cleanText(getValue(row, ["STOCK", "stock"]));
            const habilitada = siNo(getValue(row, ["Habilitada", "habilitada", "Habilitado", "habilitado"]));
            const montoDescuentoRaw = getValue(row, ["Monto Descuento", "montodescuento", "MontoDescuento"]);
            const montoDescuento = (montoDescuentoRaw === "" || montoDescuentoRaw == null) ? NaN : Number(montoDescuentoRaw);
            return {
                idproducto, categoria, producto, descripcion, precioActual, precioRegular, imagen,
                esDestacado, productoAgotado, stock, habilitada, montoDescuento,
                raw: row
            };
        }).filter((r) => r.idproducto || r.producto);

        state.rows = mapped;
        const btnHabilitada = (h, idx) => {
            const isSi = h === "SI";
            const cls = isSi ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no";
            const title = isSi ? "Habilitada. Clic para deshabilitar" : "Deshabilitada. Clic para habilitar";
            const icon = isSi ? "fa-circle-check" : "fa-circle-xmark";
            return `<button type="button" class="${cls}" data-index="${idx}" title="${title}" aria-label="${title}"><i class="fa-solid ${icon}"></i></button>`;
        };
        const esc = (s) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
        const formatPrecio = (val) => {
            const n = val === "" || val == null ? NaN : Number(val);
            if (Number.isNaN(n)) return "—";
            return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        const precioNum = (val) => (val === "" || val == null) ? NaN : Number(val);
        const precioActualCell = (row) => {
            const actual = precioNum(row.precioActual);
            const regular = precioNum(row.precioRegular);
            const txt = formatPrecio(row.precioActual);
            if (Number.isNaN(actual) || Number.isNaN(regular)) return txt;
            if (actual > regular) return `<span class="precio-con-icono precio-subida" title="Precio mayor al regular"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></span> ${txt}`;
            if (actual < regular) return `<span class="precio-con-icono precio-promo" title="Promoción"><i class="fa-solid fa-tag" aria-hidden="true"></i></span> ${txt}`;
            return txt;
        };
        const descuentoCell = (row) => {
            const monto = row.montoDescuento;
            if (monto == null || Number.isNaN(monto) || monto === 0) return "—";
            return `<span class="descuento-monto">${formatPrecio(monto)}</span>`;
        };
        const stockNum = (s) => (s === "" || s == null) ? 0 : Number(s);
        const isAgotado = (row) => row.productoAgotado === "SI" || stockNum(row.stock) === 0;
        // Producto Agotado: STOCK 0 → AGOTADO (cualquier SI/NO); SI → NO DISPONIBLE; NO → Disponible
        const agotadoCell = (row) => {
            const stock = stockNum(row.stock);
            if (stock === 0) return `<span class="producto-agotado-badge">AGOTADO</span>`;
            if (row.productoAgotado === "NO") return `<span class="producto-disponible">Disponible</span>`;
            if (row.productoAgotado === "SI") return `<span class="producto-no-disponible">NO DISPONIBLE</span>`;
            return `<span class="producto-disponible">Disponible</span>`;
        };
        const stockCell = (row) => {
            const val = row.stock;
            const n = stockNum(val);
            const text = (val === "" || val == null) ? "0" : esc(String(val));
            if (n === 0) return `<span class="stock-cero" title="Sin stock">${text}</span>`;
            return esc(text) || "—";
        };
        const imgCell = (url) => {
            if (!url) return "—";
            return `<a href="${esc(url)}" target="_blank" rel="noopener" class="table-imagen-link"><img class="table-imagen-thumb" src="${esc(url)}" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';var s=this.nextElementSibling;if(s)s.classList.add('show');"><span class="table-imagen-fallback">Ver</span></a>`;
        };
        const byCategoria = {};
        mapped.forEach((row, idx) => {
            const cat = (row.categoria || "").trim() || "Sin categoría";
            if (!byCategoria[cat]) byCategoria[cat] = [];
            byCategoria[cat].push({ row, idx });
        });
        const categoriasOrdenadas = Object.keys(byCategoria).sort((a, b) => a.localeCompare(b, "es"));
        const filas = [];
        categoriasOrdenadas.forEach((nombreCat) => {
            filas.push({ type: "category", name: nombreCat });
            byCategoria[nombreCat].forEach((item) => filas.push({ type: "data", row: item.row, idx: item.idx }));
        });
        tbody.innerHTML = filas.map((item) => {
            if (item.type === "category") {
                return `<tr class="category-header-row"><td colspan="11" class="category-header-cell">${esc(item.name)}</td></tr>`;
            }
            const row = item.row;
            const idx = item.idx;
            const rowClass = stockNum(row.stock) === 0 ? "row-stock-cero" : "";
            const destacadoCell = row.esDestacado === "SI" ? `<span class="destacado-icon" title="Destacado"><i class="fa-solid fa-crown" aria-hidden="true"></i></span>` : "";
            return `<tr${rowClass ? " class=\"" + rowClass + "\"" : ""}>
                <td class="cell-destacado">${destacadoCell}</td>
                <td class="cell-imagen">${imgCell(row.imagen)}</td>
                <td>${esc(row.producto) || "—"}</td>
                <td class="cell-desc">${esc(row.descripcion) || "—"}</td>
                <td class="cell-precio">${precioActualCell(row)}</td>
                <td class="cell-precio">${formatPrecio(row.precioRegular)}</td>
                <td class="cell-descuento">${descuentoCell(row)}</td>
                <td class="cell-agotado">${agotadoCell(row)}</td>
                <td class="cell-stock">${stockCell(row)}</td>
                <td class="habilitada-cell">${btnHabilitada(row.habilitada, idx)}</td>
                <td class="actions">
                    <a class="action-btn" href="admin-productos-edit.html" data-action="edit" data-index="${idx}">Editar</a>
                </td>
            </tr>`;
        }).join("");
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="11" class="table-loading">No se pudo cargar los productos.</td></tr>`;
    }
};

const STORAGE_KEY = "productosEdit";

function setupProductosTableListeners() {
    const tbody = document.getElementById("productos-body");
    if (!tbody) return;
    tbody.addEventListener("click", async function (e) {
        const toggleBtn = e.target.closest(".habilitada-btn");
        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            const idx = parseInt(toggleBtn.getAttribute("data-index"), 10);
            const row = state.rows[idx];
            if (!row || !MENU_SCRIPT_URL) return;
            const newHabilitada = row.habilitada === "SI" ? "NO" : "SI";
            const isSi = newHabilitada === "SI";
            const newCls = isSi ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no";
            const newTitle = isSi ? "Habilitada. Clic para deshabilitar" : "Deshabilitada. Clic para habilitar";
            const newIcon = isSi ? "fa-circle-check" : "fa-circle-xmark";
            toggleBtn.className = newCls + " habilitada-btn-loading";
            toggleBtn.setAttribute("title", newTitle);
            toggleBtn.setAttribute("aria-label", newTitle);
            const iconEl = toggleBtn.querySelector("i.fa-solid");
            if (iconEl) iconEl.className = "fa-solid " + newIcon;
            toggleBtn.disabled = true;
            try {
                const baseUrl = MENU_SCRIPT_URL.replace(/\?.*$/, "").replace(/#.*$/, "");
                const sep = baseUrl.indexOf("?") >= 0 ? "&" : "?";
                const url = baseUrl + sep +
                    "action=updateHabilitada" +
                    "&sheetName=" + encodeURIComponent(SHEET_NAME) +
                    "&idproducto=" + encodeURIComponent(row.idproducto || "") +
                    "&habilitado=" + encodeURIComponent(newHabilitada) +
                    "&habilitada=" + encodeURIComponent(newHabilitada) +
                    "&_ts=" + Date.now();
                const res = await fetch(url, { method: "GET", cache: "no-store" });
                const text = await res.text();
                let result = null;
                try { result = JSON.parse(text); } catch (_) {}
                if (!res.ok || (result && (result.result === "error" || result.error))) {
                    const msg = (result && result.error) ? result.error : "Error al actualizar";
                    throw new Error(msg);
                }
                await loadProductos();
            } catch (err) {
                console.error(err);
                alert("No se pudo actualizar Habilitada. Revisá la consola.");
                toggleBtn.className = (row.habilitada === "SI" ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no");
                const prevTitle = row.habilitada === "SI" ? "Habilitada. Clic para deshabilitar" : "Deshabilitada. Clic para habilitar";
                toggleBtn.setAttribute("title", prevTitle);
                toggleBtn.setAttribute("aria-label", prevTitle);
                const prevIcon = row.habilitada === "SI" ? "fa-circle-check" : "fa-circle-xmark";
                if (iconEl) iconEl.className = "fa-solid " + prevIcon;
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
}

document.addEventListener("DOMContentLoaded", () => {
    setupProductosTableListeners();
    loadProductos();
});
