const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const SHEET_NAME = window.APP_CONFIG?.menuProductosSheetName || "productos-base";

const state = { rows: [] };
let cachedTbody = null;
const getProductosBody = () => {
    if (!cachedTbody) cachedTbody = document.getElementById("productos-body");
    return cachedTbody;
};

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
    const tbody = getProductosBody();
    if (!tbody) return;

    if (!MENU_SCRIPT_URL) {
        tbody.innerHTML = "<tr><td colspan=\"13\" class=\"table-loading\">No hay Apps Script configurado (appsScriptMenuUrl en config.js).</td></tr>";
        return;
    }

    try {
        const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
        const url = MENU_SCRIPT_URL + sep + "action=list&sheetName=" + encodeURIComponent(SHEET_NAME) + "&_ts=" + Date.now();
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar");
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { throw new Error("Respuesta inválida"); }
        if (data && (data.error || data.result === "error")) throw new Error(data.message || "Error");

        const rawRows = rowsFromSheetData(data);
        if (!rawRows.length) {
            tbody.innerHTML = `<tr><td colspan="13" class="table-loading">No hay productos. Agregá uno desde el botón superior.</td></tr>`;
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
            const habilitado = siNo(getValue(row, ["Habilitado", "habilitado", "Habilitada", "habilitada"]));
            const mostarMontoDescuento = siNo(getValue(row, ["Mostar Monto Descuento", "mostarmontodescuento", "MostarMontoDescuento"]));
            const mostarDescuento = siNo(getValue(row, ["Mostar Descuento", "mostardescuento", "MostarDescuento"]));
            return {
                idproducto, categoria, producto, descripcion, precioActual, precioRegular, imagen,
                esDestacado, productoAgotado, stock, habilitado, mostarMontoDescuento, mostarDescuento,
                raw: row
            };
        }).filter((r) => r.idproducto || r.producto);

        state.rows = mapped;
        const btnHabilitado = (h, idx) => {
            const isSi = h === "SI";
            const cls = isSi ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no";
            const title = isSi ? "Habilitado. Clic para deshabilitar" : "Deshabilitado. Clic para habilitar";
            const icon = isSi ? "fa-circle-check" : "fa-circle-xmark";
            return `<button type="button" class="${cls}" data-index="${idx}" title="${title}" aria-label="${title}"><i class="fa-solid ${icon}"></i></button>`;
        };
        const btnSiNo = (value, idx, fieldKey, fieldLabel) => {
            const isSi = value === "SI";
            const cls = isSi ? "toggle-si-no-btn toggle-si-no-si" : "toggle-si-no-btn toggle-si-no-no";
            const title = isSi ? `${fieldLabel}: SI. Clic para cambiar a NO` : `${fieldLabel}: NO. Clic para cambiar a SI`;
            const text = isSi ? "SI" : "NO";
            return `<button type="button" class="${cls}" data-index="${idx}" data-field="${esc(fieldKey)}" title="${esc(title)}" aria-label="${esc(title)}">${text}</button>`;
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
            const regular = precioNum(row.precioRegular);
            const actual = precioNum(row.precioActual);
            if (Number.isNaN(regular) || Number.isNaN(actual) || actual >= regular) return "—";
            const monto = regular - actual;
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
                return `<tr class="category-header-row"><td colspan="13" class="category-header-cell">${esc(item.name)}</td></tr>`;
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
                <td class="cell-toggle">${btnSiNo(row.mostarMontoDescuento, idx, "Mostar Monto Descuento", "Mostar monto descuento")}</td>
                <td class="cell-toggle">${btnSiNo(row.mostarDescuento, idx, "Mostar Descuento", "Mostar descuento")}</td>
                <td class="cell-agotado">${agotadoCell(row)}</td>
                <td class="cell-stock">${stockCell(row)}</td>
                <td class="habilitada-cell">${btnHabilitado(row.habilitado, idx)}</td>
                <td class="actions">
                    <a class="action-btn" href="admin-productos-edit.html" data-action="edit" data-index="${idx}">Editar</a>
                </td>
            </tr>`;
        }).join("");
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="13" class="table-loading">No se pudo cargar los productos.</td></tr>`;
    }
};

const STORAGE_KEY = "productosEdit";

function setupProductosTableListeners() {
    const tbody = getProductosBody();
    if (!tbody) return;
    tbody.addEventListener("click", function (e) {
        const toggleSiNoBtn = e.target.closest(".toggle-si-no-btn");
        if (toggleSiNoBtn) {
            e.preventDefault();
            e.stopPropagation();
            const idx = parseInt(toggleSiNoBtn.getAttribute("data-index"), 10);
            const fieldKey = toggleSiNoBtn.getAttribute("data-field");
            const row = state.rows[idx];
            if (!row || !fieldKey || !MENU_SCRIPT_URL) return;
            const currentValue = fieldKey === "Mostar Monto Descuento" ? row.mostarMontoDescuento : row.mostarDescuento;
            const newValue = (currentValue === "SI" ? "NO" : "SI");
            const isSi = newValue === "SI";
            toggleSiNoBtn.className = "toggle-si-no-btn " + (isSi ? "toggle-si-no-si" : "toggle-si-no-no");
            toggleSiNoBtn.textContent = newValue;
            if (fieldKey === "Mostar Monto Descuento") row.mostarMontoDescuento = newValue; else row.mostarDescuento = newValue;
            toggleSiNoBtn.disabled = true;
            const payload = {
                action: "update",
                sheetName: SHEET_NAME,
                idproductoOld: row.idproducto || row.raw?.["ID Producto"] || "",
                idproducto: row.idproducto || row.raw?.["ID Producto"] || ""
            };
            payload[fieldKey] = newValue;
            fetch(MENU_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(() => { toggleSiNoBtn.disabled = false; }).catch((err) => {
                console.error(err);
                toggleSiNoBtn.className = "toggle-si-no-btn " + (currentValue === "SI" ? "toggle-si-no-si" : "toggle-si-no-no");
                toggleSiNoBtn.textContent = currentValue;
                if (fieldKey === "Mostar Monto Descuento") row.mostarMontoDescuento = currentValue; else row.mostarDescuento = currentValue;
                toggleSiNoBtn.disabled = false;
                alert("No se pudo actualizar. Revisá la consola.");
            });
            return;
        }
        const toggleBtn = e.target.closest(".habilitada-btn");
        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            const idx = parseInt(toggleBtn.getAttribute("data-index"), 10);
            const row = state.rows[idx];
            if (!row || !MENU_SCRIPT_URL) return;
            const prevHabilitado = row.habilitado;
            const newHabilitado = prevHabilitado === "SI" ? "NO" : "SI";
            const isSi = newHabilitado === "SI";
            const newCls = isSi ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no";
            const newTitle = isSi ? "Habilitado. Clic para deshabilitar" : "Deshabilitado. Clic para habilitar";
            const newIcon = isSi ? "fa-circle-check" : "fa-circle-xmark";
            toggleBtn.className = newCls;
            toggleBtn.setAttribute("title", newTitle);
            toggleBtn.setAttribute("aria-label", newTitle);
            const iconEl = toggleBtn.querySelector("i.fa-solid");
            if (iconEl) iconEl.className = "fa-solid " + newIcon;
            row.habilitado = newHabilitado;
            toggleBtn.disabled = true;
            const baseUrl = MENU_SCRIPT_URL.replace(/\?.*$/, "").replace(/#.*$/, "");
            const sep = baseUrl.indexOf("?") >= 0 ? "&" : "?";
            const url = baseUrl + sep +
                "action=updateHabilitada" +
                "&sheetName=" + encodeURIComponent(SHEET_NAME) +
                "&idproducto=" + encodeURIComponent(row.idproducto || "") +
                "&habilitado=" + encodeURIComponent(newHabilitado) +
                "&_ts=" + Date.now();
            fetch(url, { method: "GET", cache: "no-store" })
                .then((res) => res.text())
                .then((text) => {
                    let result = null;
                    try { result = JSON.parse(text); } catch (_) {}
                    if (result && (result.result === "error" || result.error)) throw new Error(result.error || "Error");
                    toggleBtn.disabled = false;
                })
                .catch((err) => {
                    console.error(err);
                    row.habilitado = prevHabilitado;
                    toggleBtn.className = (prevHabilitado === "SI" ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no");
                    toggleBtn.setAttribute("title", prevHabilitado === "SI" ? "Habilitado. Clic para deshabilitar" : "Deshabilitado. Clic para habilitar");
                    toggleBtn.setAttribute("aria-label", toggleBtn.getAttribute("title"));
                    if (iconEl) iconEl.className = "fa-solid " + (prevHabilitado === "SI" ? "fa-circle-check" : "fa-circle-xmark");
                    toggleBtn.disabled = false;
                    alert("No se pudo actualizar Habilitado. Revisá la consola.");
                });
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
}, { passive: true });
