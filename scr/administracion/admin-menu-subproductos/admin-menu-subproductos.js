/**
 * Módulo Menú con subproductos.
 * Tabla de productos-base con check para agregar ítems; resumen dinámico de lo seleccionado.
 */
const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const PRODUCTOS_SHEET_NAME = window.APP_CONFIG?.menuProductosSheetName || "productos-base";
/** Hoja donde se guardan los ítems del producto compuesto (sin idmenu-variable). */
const PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME = window.APP_CONFIG?.productosCompuestoDetalleSheetName || "productos-compuesto-detalle";
/** Máximo de ítems en el resumen (configurable en APP_CONFIG.menuSubproductosMaxItems). Al llegar al máximo se muestra leyenda y se deshabilitan los checks no seleccionados. */
const MAX_ITEMS_RESUMEN = Math.max(1, parseInt(window.APP_CONFIG?.menuSubproductosMaxItems, 10) || 5);

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

const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
};

const DEFAULT_IMAGE_PLACEHOLDER = (() => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect fill="#f1f5f9" width="48" height="48"/><text x="24" y="26" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10">Sin img</text></svg>';
    return "data:image/svg+xml," + encodeURIComponent(svg);
})();

const setImageFallback = (img) => {
    if (!img) return;
    img.onerror = function () {
        this.onerror = null;
        this.src = DEFAULT_IMAGE_PLACEHOLDER;
        this.alt = "Sin imagen";
    };
};

const fetchProductosBase = async () => {
    if (!MENU_SCRIPT_URL) return [];
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(PRODUCTOS_SHEET_NAME)}&_ts=${Date.now()}`;
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

/** Ítems seleccionados para el menú (orden de selección). Cada elemento es { row, cantidad } con cantidad 1-10. */
let selectedSubproductos = [];
/** Última lista de filas de productos-base cargada (para mantener checkboxes en sync). */
let currentProductosBaseRows = [];

const cell = (content) => {
    const td = document.createElement("td");
    const val = (content !== undefined && content !== null && String(content).trim() !== "") ? String(content).trim() : "—";
    td.textContent = val;
    return td;
};

const COLSPAN_SUBPRODUCTOS = 6;

const imageCell = (imagenUrl) => {
    const td = document.createElement("td");
    td.className = "cell-imagen";
    if (imagenUrl && String(imagenUrl).trim()) {
        const wrap = document.createElement("div");
        wrap.className = "subproductos-img-wrap";
        const img = document.createElement("img");
        img.src = imagenUrl;
        img.alt = "";
        img.loading = "lazy";
        setImageFallback(img);
        wrap.appendChild(img);
        td.appendChild(wrap);
    } else {
        const span = document.createElement("span");
        span.className = "subproductos-img-sin";
        span.textContent = "Sin img";
        td.appendChild(span);
    }
    return td;
};

const destacadoCell = (esDestacado) => {
    const td = document.createElement("td");
    td.className = "cell-destacado";
    if (esDestacado === "SI") {
        const span = document.createElement("span");
        span.className = "destacado-icon";
        span.title = "Destacado";
        span.setAttribute("aria-hidden", "true");
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-crown";
        span.appendChild(icon);
        td.appendChild(span);
    }
    return td;
};

const habilitadoCell = (habilitado) => {
    const td = document.createElement("td");
    td.className = "cell-habilitado";
    const span = document.createElement("span");
    span.className = habilitado === "SI" ? "habilitado-icon habilitado-si" : "habilitado-icon habilitado-no";
    span.title = habilitado === "SI" ? "Habilitado" : "No habilitado (no se puede agregar)";
    span.setAttribute("aria-hidden", "true");
    const icon = document.createElement("i");
    icon.className = habilitado === "SI" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark";
    span.appendChild(icon);
    td.appendChild(span);
    return td;
};

const renderProductosBaseTable = (rows) => {
    const tbody = document.getElementById("productos-base-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    selectedSubproductos = selectedSubproductos.map((r) => {
        const item = typeof r.row !== "undefined" ? r : { row: r, cantidad: 1 };
        item.cantidad = Math.min(10, Math.max(1, item.cantidad || 1));
        return item;
    });
    selectedSubproductos = selectedSubproductos.filter((r) => (cleanText(getValue(r.row, ["Habilitado", "habilitado"])) || "SI").toUpperCase() === "SI");
    renderResumen();
    const selectedIds = new Set(selectedSubproductos.map((r) => cleanText(getValue(r.row, ["ID Producto", "idproducto"]))));

    /* Solo mostrar filas que tengan ID de producto (de la tabla). */
    const rowsConId = rows.filter((row) => !!cleanText(getValue(row, ["ID Producto", "idproducto"])));

    const byCategoria = {};
    rowsConId.forEach((row) => {
        const cat = (cleanText(getValue(row, ["Categoria", "categoria", "Categoría"])) || "Sin categoría").trim() || "Sin categoría";
        if (!byCategoria[cat]) byCategoria[cat] = [];
        byCategoria[cat].push(row);
    });
    const categoriasOrdenadas = Object.keys(byCategoria).sort((a, b) => a.localeCompare(b, "es"));

    categoriasOrdenadas.forEach((nombreCat) => {
        const headerTr = document.createElement("tr");
        headerTr.className = "category-header-row";
        const headerTd = document.createElement("td");
        headerTd.className = "category-header-cell";
        headerTd.colSpan = COLSPAN_SUBPRODUCTOS;
        headerTd.textContent = nombreCat;
        headerTr.appendChild(headerTd);
        tbody.appendChild(headerTr);

        byCategoria[nombreCat].forEach((row) => {
            const idproducto = cleanText(getValue(row, ["ID Producto", "idproducto"]));
            const producto = cleanText(getValue(row, ["Producto", "producto"]));
            const descripcion = cleanText(getValue(row, ["Descripcion", "descripcion", "Descripción"]));
            const imagen = cleanText(getValue(row, ["Imagen", "imagen"]));
            const esDestacado = (cleanText(getValue(row, ["Es Destacado", "esdestacado"])) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
            const habilitado = (cleanText(getValue(row, ["Habilitado", "habilitado"])) || "SI").toUpperCase() === "SI" ? "SI" : "NO";

            const tr = document.createElement("tr");
            if (habilitado === "NO") tr.classList.add("row-deshabilitado");
            const thCheck = document.createElement("td");
            thCheck.className = "th-check";
            const atMax = selectedSubproductos.length >= MAX_ITEMS_RESUMEN;
            const isSelected = selectedIds.has(idproducto);
            const disablePorMax = habilitado === "SI" && atMax && !isSelected;
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = habilitado === "SI" && isSelected;
            checkbox.disabled = habilitado === "NO" || disablePorMax;
            let ariaLabel = "Producto no habilitado, no se puede agregar";
            if (habilitado === "SI") ariaLabel = disablePorMax ? "Máximo de " + MAX_ITEMS_RESUMEN + " ítems alcanzado, no se pueden agregar más" : "Agregar " + (producto || idproducto) + " al menú";
            checkbox.setAttribute("aria-label", ariaLabel);
            checkbox.dataset.idproducto = idproducto;
            thCheck.appendChild(checkbox);
            tr.appendChild(thCheck);
            tr.appendChild(destacadoCell(esDestacado));
            tr.appendChild(imageCell(imagen));
            tr.appendChild(cell(producto));
            tr.appendChild(cell(descripcion));
            tr.appendChild(habilitadoCell(habilitado));
            tbody.appendChild(tr);

            if (habilitado === "SI") {
                checkbox.addEventListener("change", () => {
                    if (checkbox.checked) {
                        if (selectedSubproductos.length >= MAX_ITEMS_RESUMEN) {
                            const alreadyIn = selectedSubproductos.some((r) => cleanText(getValue(r.row, ["ID Producto", "idproducto"])) === idproducto);
                            if (!alreadyIn) {
                                checkbox.checked = false;
                                updateLeyendaMax();
                                updateCheckboxesFromSelection();
                                return;
                            }
                        }
                        const existing = selectedSubproductos.find((r) => cleanText(getValue(r.row, ["ID Producto", "idproducto"])) === idproducto);
                        if (existing) {
                            existing.cantidad = Math.min(existing.cantidad + 1, 10);
                        } else {
                            selectedSubproductos.push({ row, cantidad: 1 });
                        }
                    } else {
                        selectedSubproductos = selectedSubproductos.filter(
                            (r) => cleanText(getValue(r.row, ["ID Producto", "idproducto"])) !== idproducto
                        );
                    }
                    renderResumen();
                    updateLeyendaMax();
                    updateCheckboxesFromSelection();
                });
            }
        });
    });
    currentProductosBaseRows = rows;
    updateLeyendaMax();
};

const updateLeyendaMax = () => {
    const el = document.getElementById("subproductos-max-leyenda");
    const texto = document.getElementById("subproductos-max-leyenda-texto");
    if (!el || !texto) return;
    if (selectedSubproductos.length >= MAX_ITEMS_RESUMEN) {
        texto.textContent = "Se alcanzó el máximo de " + MAX_ITEMS_RESUMEN + " ítems en el resumen. No se pueden agregar más.";
        el.style.display = "flex";
    } else {
        el.style.display = "none";
    }
};

const updateCheckboxesFromSelection = () => {
    const selectedIds = new Set(selectedSubproductos.map((r) => cleanText(getValue(r.row, ["ID Producto", "idproducto"]))));
    const atMax = selectedSubproductos.length >= MAX_ITEMS_RESUMEN;
    document.querySelectorAll("#productos-base-tbody input[type=checkbox]").forEach((cb) => {
        const id = cb.dataset.idproducto || "";
        const isSelected = selectedIds.has(id);
        cb.checked = isSelected;
        const disabledPorHab = cb.closest("tr")?.classList.contains("row-deshabilitado");
        if (disabledPorHab) {
            cb.disabled = true;
            cb.setAttribute("aria-label", "Producto no habilitado, no se puede agregar");
        } else {
            cb.disabled = atMax && !isSelected;
            cb.setAttribute("aria-label", cb.disabled
                ? "Máximo de " + MAX_ITEMS_RESUMEN + " ítems alcanzado, no se pueden agregar más"
                : (isSelected ? "Quitar del menú" : "Agregar al menú"));
        }
    });
};

const cantidadCell = (index, idproducto) => {
    const td = document.createElement("td");
    td.className = "cell-cantidad";
    const item = selectedSubproductos[index];
    if (!item) return td;

    const wrap = document.createElement("div");
    wrap.className = "cantidad-controls";

    const btnMenos = document.createElement("button");
    btnMenos.type = "button";
    const esQuitar = item.cantidad === 1;
    btnMenos.className = "btn-cantidad btn-cantidad-menos" + (esQuitar ? " btn-cantidad-quitar" : "");
    btnMenos.title = esQuitar ? "Quitar del resumen" : "Disminuir cantidad";
    btnMenos.setAttribute("aria-label", esQuitar ? "Quitar del resumen" : "Disminuir cantidad");
    const iconMenos = document.createElement("i");
    iconMenos.className = esQuitar ? "fa-solid fa-trash" : "fa-solid fa-minus";
    btnMenos.appendChild(iconMenos);

    const span = document.createElement("span");
    span.className = "cantidad-valor";
    span.textContent = String(item.cantidad);

    const btnMas = document.createElement("button");
    btnMas.type = "button";
    btnMas.className = "btn-cantidad btn-cantidad-mas";
    btnMas.title = "Aumentar cantidad (máximo 10)";
    btnMas.setAttribute("aria-label", "Aumentar cantidad");
    const iconMas = document.createElement("i");
    iconMas.className = "fa-solid fa-plus";
    btnMas.appendChild(iconMas);

    btnMas.disabled = item.cantidad >= 10;

    btnMenos.addEventListener("click", () => {
        if (item.cantidad > 1) {
            item.cantidad--;
            renderResumen();
        } else {
            selectedSubproductos = selectedSubproductos.filter(
                (r) => cleanText(getValue(r.row, ["ID Producto", "idproducto"])) !== idproducto
            );
            renderResumen();
            updateLeyendaMax();
            updateCheckboxesFromSelection();
        }
    });

    btnMas.addEventListener("click", () => {
        if (item.cantidad < 10) {
            item.cantidad++;
            renderResumen();
        }
    });

    wrap.appendChild(btnMenos);
    wrap.appendChild(span);
    wrap.appendChild(btnMas);
    td.appendChild(wrap);
    return td;
};

const renderResumen = () => {
    const wrap = document.getElementById("subproductos-resumen-wrap");
    const tbody = document.getElementById("subproductos-resumen-tbody");
    const countEl = document.getElementById("subproductos-resumen-count");
    if (!wrap || !tbody) return;
    tbody.innerHTML = "";
    const totalCantidad = selectedSubproductos.reduce((sum, r) => sum + (r.cantidad || 1), 0);
    if (countEl) countEl.textContent = String(totalCantidad);
    if (selectedSubproductos.length === 0) {
        wrap.style.display = "none";
        updateDebugPayload();
        return;
    }
    wrap.style.display = "block";

    /* Lista plana por orden de selección, con cantidad 1-10 por ítem. */
    selectedSubproductos.forEach((item, index) => {
        const row = item.row;
        const num = index + 1;
        const idproducto = cleanText(getValue(row, ["ID Producto", "idproducto"]));
        const producto = cleanText(getValue(row, ["Producto", "producto"]));
        const descripcion = cleanText(getValue(row, ["Descripcion", "descripcion", "Descripción"]));
        const imagen = cleanText(getValue(row, ["Imagen", "imagen"]));
        const esDestacado = (cleanText(getValue(row, ["Es Destacado", "esdestacado"])) || "NO").toUpperCase() === "SI" ? "SI" : "NO";

        const tr = document.createElement("tr");
        tr.appendChild(cell(String(num)));
        tr.appendChild(destacadoCell(esDestacado));
        tr.appendChild(imageCell(imagen));
        tr.appendChild(cantidadCell(index, idproducto));
        tr.appendChild(cell(producto));
        tr.appendChild(cell(descripcion));
        tbody.appendChild(tr);
    });
    updateDebugPayload();
};

/** Actualiza la sección debug (vista previa de envío) según APP_CONFIG.debug y APP_CONFIG.debugFull. */
const updateDebugPayload = () => {
    if (typeof window.renderDebugPayloadSection !== "function") return;
    const blocks = selectedSubproductos.map((item, index) => {
        const row = item.row;
        const cantidad = item.cantidad || 1;
        const idproducto = cleanText(getValue(row, ["ID Producto", "idproducto"]));
        const producto = cleanText(getValue(row, ["Producto", "producto"]));
        const precioStr = cleanText(getValue(row, ["Precio Actual", "precioactual", "Precio Unitario Actual"]));
        const precioUnit = parseFloat(String(precioStr).replace(",", ".")) || 0;
        const precioTotal = precioUnit * cantidad;
        const payload = {
            action: "create",
            sheetName: PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME,
            idproducto,
            Cantidad: cantidad,
            Producto: producto,
            "Precio Unitario Actual": precioStr || precioUnit,
            "Precio Total Actual": precioTotal,
            Imagen: cleanText(getValue(row, ["Imagen", "imagen"])),
            "Es Destacado": (cleanText(getValue(row, ["Es Destacado", "esdestacado"])) || "NO").toUpperCase() === "SI" ? "SI" : "NO",
            "Producto Agotado": (cleanText(getValue(row, ["Producto Agotado", "productoagotado"])) || "NO").toUpperCase() === "SI" ? "SI" : "NO",
            STOCK: cleanText(getValue(row, ["STOCK", "stock"])),
            Habilitado: (cleanText(getValue(row, ["Habilitado", "habilitado"])) || "SI").toUpperCase() === "SI" ? "SI" : "NO"
        };
        return {
            title: "Ítem " + (index + 1) + " → " + PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME,
            sheetName: PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME,
            actionType: "create",
            actionDescription: "Se enviará este registro a la hoja productos-compuesto-detalle al hacer clic en «Agregar ítem al producto compuesto».",
            payload
        };
    });
    window.renderDebugPayloadSection("debug-payload-wrap", blocks);
};

/** Guarda los ítems del resumen en productos-compuesto-detalle y redirige a admin-productos-compuestos. */
const saveSubproductosToDetalleAndGo = async () => {
    if (!selectedSubproductos.length) {
        alert("No hay ítems en el resumen. Agregá al menos un producto.");
        return;
    }
    const btn = document.getElementById("btn-agregar-item-compuesto");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Guardando...";
    }
    const sheetName = PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME;

    try {
        for (const item of selectedSubproductos) {
            const row = item.row;
            const cantidad = item.cantidad || 1;
            const idproducto = cleanText(getValue(row, ["ID Producto", "idproducto"]));
            const producto = cleanText(getValue(row, ["Producto", "producto"]));
            const precioStr = cleanText(getValue(row, ["Precio Actual", "precioactual", "Precio Unitario Actual"]));
            const precioUnit = parseFloat(String(precioStr).replace(",", ".")) || 0;
            const precioTotal = precioUnit * cantidad;

            const payload = {
                action: "create",
                sheetName,
                idproducto,
                Cantidad: cantidad,
                Producto: producto,
                "Precio Unitario Actual": precioStr || precioUnit,
                "Precio Total Actual": precioTotal,
                Imagen: cleanText(getValue(row, ["Imagen", "imagen"])),
                "Es Destacado": (cleanText(getValue(row, ["Es Destacado", "esdestacado"])) || "NO").toUpperCase() === "SI" ? "SI" : "NO",
                "Producto Agotado": (cleanText(getValue(row, ["Producto Agotado", "productoagotado"])) || "NO").toUpperCase() === "SI" ? "SI" : "NO",
                STOCK: cleanText(getValue(row, ["STOCK", "stock"])),
                Habilitado: (cleanText(getValue(row, ["Habilitado", "habilitado"])) || "SI").toUpperCase() === "SI" ? "SI" : "NO"
            };

            await fetch(MENU_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
        }
        const scriptDebug = document.getElementById("script-debug");
        if (scriptDebug) {
            scriptDebug.textContent = "Guardado. Redirigiendo...";
            scriptDebug.classList.remove("script-debug-error");
            scriptDebug.classList.add("script-debug-success");
        }
        window.location.href = "../admin-productos-compuestos/admin-productos-compuestos.html";
    } catch (err) {
        console.error(err);
        const scriptDebug = document.getElementById("script-debug");
        if (scriptDebug) {
            scriptDebug.textContent = "Error: " + (err?.message || err);
            scriptDebug.classList.remove("script-debug-success");
            scriptDebug.classList.add("script-debug-error");
        }
        alert("No se pudieron guardar los ítems: " + (err?.message || err));
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-save" aria-hidden="true"></i> Agregar ítem al producto compuesto';
        }
    }
};

const loadAndShowProductosBase = async () => {
    const tbody = document.getElementById("productos-base-tbody");
    const loadingEl = document.getElementById("productos-base-loading");
    const emptyEl = document.getElementById("productos-base-empty");
    const tableWrap = document.getElementById("productos-base-table-wrap");
    if (!tbody || !loadingEl || !emptyEl || !tableWrap) return;
    tbody.innerHTML = "";
    emptyEl.style.display = "none";
    tableWrap.style.display = "none";
    loadingEl.style.display = "flex";
    let rows = await fetchProductosBase();
    /* Solo considerar filas que tengan ID de producto (de la tabla). */
    rows = rows.filter((row) => !!cleanText(getValue(row, ["ID Producto", "idproducto"])));
    loadingEl.style.display = "none";
    if (!rows.length) {
        emptyEl.style.display = "block";
        return;
    }
    tableWrap.style.display = "block";
    renderProductosBaseTable(rows);
    renderResumen();
};

document.addEventListener("DOMContentLoaded", () => {
    loadAndShowProductosBase();
    const btnAgregar = document.getElementById("btn-agregar-item-compuesto");
    if (btnAgregar) {
        btnAgregar.addEventListener("click", saveSubproductosToDetalleAndGo);
    }
});
