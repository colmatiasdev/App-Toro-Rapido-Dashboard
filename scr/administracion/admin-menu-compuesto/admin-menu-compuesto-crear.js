const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
/** Hoja para el registro del menú compuesto (paso 3 al guardar MENU-SIMPLE). */
const MENU_SHEET_NAME = window.APP_CONFIG?.menuCompuestoSheetName || "menu-toro-rapido-web-compuesto";
/** Hoja para menú simple (opción MENU-SIMPLE del combo). Vacío si la hoja ya no existe. */
const MENU_SIMPLE_SHEET_NAME = (window.APP_CONFIG?.menuSimpleSheetName || "").toString().trim();
/** Hoja para ítems MENU-COMPUESTO (opción MENU-COMPUESTO del combo). */
const MENU_COMPUESTO_DETALLE_SHEET_NAME = window.APP_CONFIG?.menuCompuestoDetalleSheetName || "menu-compuesto-detalle";
const PRODUCTOS_SHEET_NAME = window.APP_CONFIG?.menuProductosSheetName || "productos-base";

/** Fila completa del producto seleccionado en productos-base (solo lectura, para debug). */
let selectedProductoBaseRow = null;

const normalizeKey = (value) => (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const cleanText = (value) => (value ?? "").toString().trim();

const ALPHANUM = "0123456789abcdefghijklmnopqrstuvwxyz";
const randomAlphanumeric = (len) => {
    let s = "";
    for (let i = 0; i < len; i++) s += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
    return s;
};

const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
};

/** Imagen por defecto cuando no hay URL o el enlace está roto (SVG "Sin imagen"). */
const DEFAULT_IMAGE_PLACEHOLDER = (() => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f1f5f9" width="400" height="300"/><text x="200" y="155" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="18">Sin imagen</text></svg>';
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

const fillCategoriaDatalist = (datalistId, rows, keys) => {
    const datalist = document.getElementById(datalistId);
    if (!datalist) return;
    const keyList = keys || ["Categoria", "categoria", "Categoría"];
    const seen = new Set();
    const categorias = [];
    for (const r of rows) {
        const c = cleanText(getValue(r, keyList));
        if (c && !seen.has(c)) {
            seen.add(c);
            categorias.push(c);
        }
    }
    categorias.sort((a, b) => a.localeCompare(b, "es"));
    datalist.innerHTML = categorias.map((c) => `<option value="${escapeHtml(c)}">`).join("");
};

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

const fetchSheetList = async () => {
    if (!MENU_SCRIPT_URL) return [];
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(MENU_SHEET_NAME)}&_ts=${Date.now()}`;
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

const fetchSheetListSimple = async () => {
    if (!MENU_SCRIPT_URL || !MENU_SIMPLE_SHEET_NAME) return [];
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(MENU_SIMPLE_SHEET_NAME)}&_ts=${Date.now()}`;
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

/** Lista de filas de la hoja menu-compuesto-detalle (para panel MENU-COMPUESTO: orden, categorías). */
const fetchSheetListCompuestoDetalle = async () => {
    if (!MENU_SCRIPT_URL) return [];
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(MENU_COMPUESTO_DETALLE_SHEET_NAME)}&_ts=${Date.now()}`;
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

const setAutoOrder = async () => {
    const input = document.getElementById("orden-input");
    if (!input) return;
    input.value = "";
    const rows = await fetchSheetListCompuestoDetalle();
    fillCategoriaDatalist("categoria-datalist-compuesto", rows);
    let max = 0;
    rows.forEach((row) => {
        const v = cleanText(getValue(row, ["orden", "order"]));
        const num = Number(v);
        if (!Number.isNaN(num)) max = Math.max(max, num);
    });
    input.value = max + 1;
};

const setAutoOrderSimple = async () => {
    const input = document.getElementById("orden-simple-input");
    if (!input) return;
    input.value = "";
    if (!MENU_SIMPLE_SHEET_NAME) {
        input.value = "1";
        return;
    }
    const rows = await fetchSheetListSimple();
    fillCategoriaDatalist("categoria-datalist-simple", rows);
    let max = 0;
    rows.forEach((row) => {
        const v = cleanText(getValue(row, ["orden", "order"]));
        const num = Number(v);
        if (!Number.isNaN(num)) max = Math.max(max, num);
    });
    input.value = max + 1;
};

const loadAndShowProductosBase = async () => {
    const listEl = document.getElementById("productos-base-list");
    const loadingEl = document.getElementById("productos-base-loading");
    const emptyEl = document.getElementById("productos-base-empty");
    if (!listEl || !loadingEl || !emptyEl) return;
    listEl.innerHTML = "";
    emptyEl.style.display = "none";
    loadingEl.style.display = "flex";
    const rows = await fetchProductosBase();
    loadingEl.style.display = "none";
    if (!rows.length) {
        emptyEl.style.display = "block";
        return;
    }
    listEl.appendChild(renderProductosBaseCards(rows));
};

const renderProductosBaseCards = (rows) => {
    const fragment = document.createDocumentFragment();
    const parsePrecio = (v) => {
        const raw = cleanText(v);
        if (!raw) return "";
        const n = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
        const num = Number.parseFloat(n);
        return Number.isNaN(num) ? raw : num.toLocaleString("es-AR");
    };
    rows.forEach((row) => {
        const idproducto = cleanText(getValue(row, ["ID Producto", "idproducto"]));
        const categoria = cleanText(getValue(row, ["Categoria", "categoria", "Categoría"]));
        const producto = cleanText(getValue(row, ["Producto", "producto"]));
        const descripcion = cleanText(getValue(row, ["Descripcion", "descripcion", "Descripción"]));
        const precio = parsePrecio(getValue(row, ["Precio", "Precio Actual", "precioactual"]));
        const imagen = cleanText(getValue(row, ["Imagen", "imagen"]));
        const card = document.createElement("button");
        card.type = "button";
        card.className = "producto-base-card";
        card.dataset.idproducto = idproducto;
        card.innerHTML = `
            <span class="producto-base-card-img-wrap">
                <img src="${imagen ? escapeHtml(imagen) : DEFAULT_IMAGE_PLACEHOLDER}" alt="${imagen ? "" : "Sin imagen"}" loading="lazy">
            </span>
            <span class="producto-base-card-id">${escapeHtml(idproducto)}</span>
            <span class="producto-base-card-cat">${escapeHtml(categoria)}</span>
            <span class="producto-base-card-name">${escapeHtml(producto)}</span>
            <span class="producto-base-card-desc">${escapeHtml(descripcion)}</span>
            <span class="producto-base-card-precio">${precio ? "$ " + precio : "—"}</span>
        `;
        const cardImg = card.querySelector(".producto-base-card-img-wrap img");
        if (cardImg) setImageFallback(cardImg);
        const esDestacado = (cleanText(getValue(row, ["Es Destacado", "esdestacado"])) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const productoAgotado = (cleanText(getValue(row, ["Producto Agotado", "productoagotado"])) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const stock = cleanText(getValue(row, ["Stock", "stock"]));
        card.addEventListener("click", () => selectProductoBase({ idproducto, categoria, producto, descripcion, precio: getValue(row, ["Precio", "Precio Actual", "precioactual"]), imagen, esDestacado, productoAgotado, stock }, row));
        fragment.appendChild(card);
    });
    return fragment;
};

const selectProductoBase = (item, rowFromSheet) => {
    selectedProductoBaseRow = rowFromSheet || null;
    const tipo = document.getElementById("tipomenu-select")?.value || "";

    if (tipo === "MENU-COMPUESTO") {
        fillFormFromProductoBaseCompuesto(item);
    } else {
        const idproductoInput = document.getElementById("idproducto-input");
        const catInput = document.getElementById("categoria-input-simple");
        const prodInput = document.getElementById("producto-input-simple");
        const descInput = document.getElementById("descripcion-input-simple");
        const precioInput = document.getElementById("precio-input-simple");
        const esDestacadoInput = document.getElementById("esdestacado-input-simple");
        const productoAgotadoInput = document.getElementById("productoagotado-input-simple");
        const stockInput = document.getElementById("stock-input-simple");
        const displayEsDestacado = document.getElementById("display-esdestacado-simple");
        const displayProductoAgotado = document.getElementById("display-productoagotado-simple");
        const displayStock = document.getElementById("display-stock-simple");
        if (idproductoInput) idproductoInput.value = item.idproducto || "";
        if (catInput) catInput.value = item.categoria || "";
        if (prodInput) prodInput.value = item.producto || "";
        if (descInput) descInput.value = (item.descripcion ?? item.desc) || "";
        const precioVal = (item.precio ?? "").toString().trim();
        if (precioInput) precioInput.value = precioVal.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".") || "";
        currentImageUrlSimple = item.imagen || "";
        const esDestacado = (item.esDestacado || "NO").toString().toUpperCase() === "SI" ? "SI" : "NO";
        const productoAgotado = (item.productoAgotado || "NO").toString().toUpperCase() === "SI" ? "SI" : "NO";
        const stock = (item.stock ?? "").toString().trim();
        if (esDestacadoInput) esDestacadoInput.value = esDestacado;
        if (productoAgotadoInput) productoAgotadoInput.value = productoAgotado;
        if (stockInput) stockInput.value = stock;
        if (displayEsDestacado) displayEsDestacado.textContent = esDestacado;
        if (displayProductoAgotado) displayProductoAgotado.textContent = productoAgotado;
        if (displayStock) displayStock.textContent = stock || "—";
    }

    document.querySelectorAll(".producto-base-card").forEach((c) => {
        c.classList.remove("selected");
        if ((c.dataset.idproducto || "") === (item.idproducto || "")) c.classList.add("selected");
    });
    updateDebugPayloadCompuesto();
};

const setProductoBaseReadonlyDisplay = (esDestacado, productoAgotado, stock) => {
    const d1 = document.getElementById("display-esdestacado-simple");
    const d2 = document.getElementById("display-productoagotado-simple");
    const d3 = document.getElementById("display-stock-simple");
    if (d1) d1.textContent = esDestacado ?? "—";
    if (d2) d2.textContent = productoAgotado ?? "—";
    if (d3) d3.textContent = (stock !== undefined && stock !== "") ? stock : "—";
};

/** Actualiza el bloque de solo lectura del panel MENU-COMPUESTO (labels). Igual que MENU-SIMPLE. */
const setProductoBaseReadonlyDisplayCompuesto = (categoria, producto, descripcion, precioActual, precioRegular, imagenUrl, esDestacado, productoAgotado, stock) => {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = (val !== undefined && val !== null && String(val).trim() !== "") ? String(val).trim() : "—";
    };
    set("display-categoria-compuesto", categoria);
    set("display-producto-compuesto", producto);
    set("display-descripcion-compuesto", descripcion);
    set("display-precioactual-compuesto", precioActual);
    set("display-precioregular-compuesto", precioRegular);
    set("display-esdestacado-compuesto", esDestacado);
    set("display-productoagotado-compuesto", productoAgotado);
    set("display-stock-compuesto", (stock !== undefined && stock !== null && String(stock).trim() !== "") ? stock : "—");
    const previewWrap = document.getElementById("image-preview-compuesto");
    const previewImg = document.getElementById("image-preview-img-compuesto");
    const sinImagen = document.getElementById("display-imagen-sin-compuesto");
    if (previewWrap && previewImg && sinImagen) {
        if (imagenUrl && String(imagenUrl).trim()) {
            previewWrap.style.display = "grid";
            sinImagen.style.display = "none";
            previewImg.src = imagenUrl;
            previewImg.alt = "";
            setImageFallback(previewImg);
        } else {
            previewWrap.style.display = "none";
            sinImagen.style.display = "inline";
        }
    }
};

/** Rellena el formulario compuesto con los datos del producto base seleccionado (misma lógica que MENU-SIMPLE). */
const fillFormFromProductoBaseCompuesto = (item) => {
    const form = document.getElementById("add-item-form");
    if (!form) return;
    const idproductoCompuestoInput = document.getElementById("idproducto-compuesto-input");
    const categoriaInput = document.getElementById("categoria-input-compuesto");
    const productoInput = document.getElementById("producto-input-compuesto");
    const descripcionInput = document.getElementById("descripcionproducto-input-compuesto");
    const precioActualInput = document.getElementById("precioactual-input-compuesto");
    const precioRegularInput = document.getElementById("precioregular-input-compuesto");
    const esDestacadoInput = document.getElementById("esdestacado-input-compuesto");
    const productoAgotadoInput = document.getElementById("productoagotado-input-compuesto");
    const stockInput = document.getElementById("stock-input-compuesto");
    if (idproductoCompuestoInput) idproductoCompuestoInput.value = item.idproducto || "";
    if (categoriaInput) categoriaInput.value = item.categoria || "";
    if (productoInput) productoInput.value = item.producto || "";
    if (descripcionInput) descripcionInput.value = (item.descripcion ?? item.desc) || "";
    const precioVal = (item.precio ?? "").toString().trim();
    const precioNum = precioVal.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    if (precioActualInput) precioActualInput.value = precioNum || "";
    if (precioRegularInput) precioRegularInput.value = precioNum || "";
    const esDestacado = (item.esDestacado || "NO").toString().toUpperCase() === "SI" ? "SI" : "NO";
    const productoAgotado = (item.productoAgotado || "NO").toString().toUpperCase() === "SI" ? "SI" : "NO";
    const stock = (item.stock ?? "").toString().trim();
    if (esDestacadoInput) esDestacadoInput.value = esDestacado;
    if (productoAgotadoInput) productoAgotadoInput.value = productoAgotado;
    if (stockInput) stockInput.value = stock;
    currentImageUrl = item.imagen || "";
    const precioDisplay = precioNum ? Number.parseFloat(precioNum).toLocaleString("es-AR") : "";
    setProductoBaseReadonlyDisplayCompuesto(item.categoria, item.producto, (item.descripcion ?? item.desc), precioDisplay, precioDisplay, currentImageUrl, esDestacado, productoAgotado, stock);
};

const setAutoIdSimple = () => {
    const idmenuInput = document.getElementById("idmenu-simple-input");
    const idproductoInput = document.getElementById("idproducto-input");
    const unique = () => Date.now().toString(36) + randomAlphanumeric(6);
    if (idmenuInput) idmenuInput.value = "MENU-SIMPLE-" + unique();
    if (idproductoInput) idproductoInput.value = "";
};

const setAutoId = () => {
    const input = document.getElementById("idmenu-unico-input");
    if (!input) return;
    input.value = "MENU-" + Date.now().toString(36) + randomAlphanumeric(8);
};

const switchPanelsByTipo = () => {
    const tipo = document.getElementById("tipomenu-select")?.value || "";
    const panelProductosBase = document.getElementById("form-panel-productos-base");
    const panelSimple = document.getElementById("form-panel-simple");
    const panelCompuesto = document.getElementById("form-panel-compuesto");
    const actionsWrap = document.getElementById("form-actions-wrap");

    if (panelProductosBase) panelProductosBase.style.display = "none";
    if (panelSimple) panelSimple.style.display = "none";
    if (panelCompuesto) panelCompuesto.style.display = "none";
    if (actionsWrap) actionsWrap.style.display = "none";

    if (tipo === "MENU-SIMPLE") {
        if (panelProductosBase) panelProductosBase.style.display = "block";
        if (panelSimple) panelSimple.style.display = "grid";
        if (actionsWrap) actionsWrap.style.display = "flex";
        setAutoIdSimple();
        setAutoOrderSimple();
        loadAndShowProductosBase();
        selectedProductoBaseRow = null;
    } else if (tipo === "MENU-COMPUESTO") {
        if (panelProductosBase) panelProductosBase.style.display = "block";
        if (panelCompuesto) panelCompuesto.style.display = "grid";
        if (actionsWrap) actionsWrap.style.display = "flex";
        setAutoId();
        setAutoOrder();
        loadAndShowProductosBase();
        selectedProductoBaseRow = null;
        setProductoBaseReadonlyDisplayCompuesto("—", "—", "—", "—", "—", "", "—", "—", "—");
    }
    updateDebugPayloadCompuesto();
};

const updateDebugPayloadCompuesto = () => {
    if (typeof window.renderDebugPayloadSection !== "function") return;
    const tipo = document.getElementById("tipomenu-select")?.value || "";
    const form = document.getElementById("add-item-form");
    if (!form) return;
    const data = new FormData(form);
    const blocks = [];
    if (tipo === "MENU-SIMPLE") {
        const payloadCompuesto = {
            action: "create",
            sheetName: MENU_SHEET_NAME,
            orden: "(siguiente al guardar)",
            "idmenu-unico": "(se generará al guardar)",
            "Tipo Menu": "MENU-SIMPLE",
            idproducto: cleanText(data.get("idproducto"))
        };
        blocks.push({
            title: "Paso 1 - Hoja productos-base (Datos de los Productos)",
            sheetName: PRODUCTOS_SHEET_NAME,
            actionType: "read",
            actionDescription: "Lectura de la hoja de Google Sheet. Se obtienen los productos base para que el usuario elija uno; con ese dato se rellenan automáticamente los campos del formulario.",
            payload: selectedProductoBaseRow || { "(ningún producto seleccionado)": "Elegí un producto de la lista arriba" }
        });
        if (MENU_SIMPLE_SHEET_NAME) {
            const payloadSimple = {
                action: "create",
                sheetName: MENU_SIMPLE_SHEET_NAME,
                idmenu: cleanText(data.get("idmenu_simple")),
                orden: cleanText(data.get("orden_simple")),
                idproducto: cleanText(data.get("idproducto")),
                Categoria: cleanText(data.get("categoria_simple")),
                Producto: cleanText(data.get("producto_simple")),
                Descripcion: cleanText(data.get("descripcion_simple")),
                Precio: cleanText(data.get("precio_simple")),
                Imagen: currentImageUrlSimple ? "(imagen)" : "",
                "Es Destacado": cleanText(data.get("esdestacado_simple")) || "NO",
                "Producto Agotado": cleanText(data.get("productoagotado_simple")) || "NO",
                stock: cleanText(data.get("stock_simple")),
                Habilitado: "SI"
            };
            blocks.push({
                title: "Paso 2 - Hoja menu-simple (Registro del menú)",
                sheetName: MENU_SIMPLE_SHEET_NAME,
                actionType: "create",
                actionDescription: "Escritura en la hoja de Google Sheet. Se crea un nuevo registro en el menú simple (idmenu, idproducto, categoría, producto, precio, etc.).",
                payload: payloadSimple
            });
            blocks.push({
                title: "Paso 3 - Hoja menu-toro-rapido-web-compuesto (Registro del Menú Compuesto)",
                sheetName: MENU_SHEET_NAME,
                actionType: "create",
                actionDescription: "Escritura en la hoja de Google Sheet. Se crea el registro del menú compuesto con orden, idmenu-unico y Tipo Menu (MENU-SIMPLE).",
                payload: payloadCompuesto
            });
        } else {
            blocks.push({
                title: "Paso 2 - Hoja menu-toro-rapido-web-compuesto (Registro del Menú Compuesto)",
                sheetName: MENU_SHEET_NAME,
                actionType: "create",
                actionDescription: "La hoja menu-simple ya no existe. Solo se escribe en menu-compuesto: orden, idmenu-unico, Tipo Menu (MENU-SIMPLE) e idproducto (referencia al producto base).",
                payload: payloadCompuesto
            });
        }
    } else if (tipo === "MENU-COMPUESTO") {
        const idproductoComp = cleanText(data.get("idproducto_compuesto"));
        const payloadDetalle = {
            action: "create",
            sheetName: MENU_COMPUESTO_DETALLE_SHEET_NAME,
            orden: cleanText(data.get("orden")),
            "idmenu-unico": cleanText(data.get("idmenu-unico")),
            "Tipo Menu": "MENU-COMPUESTO",
            "idmenu-variable": cleanText(data.get("idmenu-variable")),
            ...(idproductoComp ? { idproducto: idproductoComp } : {}),
            Categoria: cleanText(data.get("categoria")),
            Producto: cleanText(data.get("producto")),
            "Descripcion Producto": cleanText(data.get("descripcionproducto")),
            "Precio Actual": cleanText(data.get("precioactual")),
            "Precio Regular": cleanText(data.get("precioregular")),
            "Mostar Descuento": cleanText(data.get("mostrardescuento")) || "NO",
            Imagen: currentImageUrl ? "(imagen)" : "",
            "Es Destacado": cleanText(data.get("esdestacado")) || "NO",
            "Producto Agotado": cleanText(data.get("productoagotado")) || "NO",
            Stock: cleanText(data.get("stock")),
            Habilitado: "SI"
        };
        const payloadPaso3 = {
            action: "create",
            sheetName: MENU_SHEET_NAME,
            orden: "(siguiente al guardar)",
            "idmenu-unico": "(se generará al guardar)",
            "Tipo Menu": "MENU-COMPUESTO"
        };
        blocks.push({
            title: "Paso 1 - Hoja productos-base (Datos de los Productos)",
            sheetName: PRODUCTOS_SHEET_NAME,
            actionType: "read",
            actionDescription: "Lectura de la hoja de Google Sheet. Se obtienen los productos base para que el usuario elija uno; con ese dato se rellenan automáticamente los campos del formulario.",
            payload: selectedProductoBaseRow || { "(ningún producto seleccionado)": "Elegí un producto de la lista arriba" }
        });
        blocks.push({
            title: "Paso 2 - Hoja menu-compuesto-detalle (Registro del menú compuesto)",
            sheetName: MENU_COMPUESTO_DETALLE_SHEET_NAME,
            actionType: "create",
            actionDescription: "Escritura en la hoja de Google Sheet. Se crea un nuevo registro en el menú compuesto detalle (categoría, producto, precios, imagen, etc.).",
            payload: payloadDetalle
        });
        blocks.push({
            title: "Paso 3 - Hoja menu-toro-rapido-web-compuesto (Registro del Menú Compuesto)",
            sheetName: MENU_SHEET_NAME,
            actionType: "create",
            actionDescription: "Escritura en la hoja de Google Sheet. Se crea el registro del menú compuesto con orden, idmenu-unico y Tipo Menu (MENU-COMPUESTO).",
            payload: payloadPaso3
        });
    }
    window.renderDebugPayloadSection("debug-payload-wrap", blocks);
};

const setFormMode = (mode) => {
    const formMode = document.getElementById("form-mode");
    const submitBtn = document.getElementById("submit-btn");
    const cancelBtn = document.getElementById("cancel-edit");
    const uploadBlock = document.getElementById("upload-image-block");
    const changeBtn = document.getElementById("change-image-btn");
    if (formMode) formMode.value = mode;
    if (submitBtn) submitBtn.textContent = mode === "edit" ? "Actualizar" : "Guardar";
    if (cancelBtn) cancelBtn.style.display = mode === "edit" ? "inline-flex" : "none";
    if (uploadBlock) uploadBlock.style.display = mode === "edit" ? "none" : "grid";
    if (changeBtn) changeBtn.style.display = mode === "edit" ? "inline-flex" : "none";
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

let currentImageUrl = "";
let currentImageUrlSimple = "";

const setImagePreview = (url) => {
    const wrapper = document.getElementById("image-preview");
    const img = document.getElementById("image-preview-img");
    if (!wrapper || !img) return;
    wrapper.style.display = "grid";
    img.src = url || DEFAULT_IMAGE_PLACEHOLDER;
    img.alt = url ? "" : "Sin imagen";
    setImageFallback(img);
};

const setImagePreviewSimple = (url) => {
    const wrapper = document.getElementById("image-preview-simple");
    const img = document.getElementById("image-preview-img-simple");
    if (!wrapper || !img) return;
    wrapper.style.display = "grid";
    img.src = url || DEFAULT_IMAGE_PLACEHOLDER;
    img.alt = url ? "" : "Sin imagen";
    setImageFallback(img);
};

const fillForm = (item) => {
    const form = document.getElementById("add-item-form");
    if (!form) return;
    form.querySelector('[name="orden"]').value = item.order || "";
    form.querySelector('[name="idmenu-unico"]').value = item.id || "";
    form.querySelector('[name="tipomenu"]').value = item.tipoMenu || "MENU-SIMPLE";
    form.querySelector('[name="idmenu-variable"]').value = item.idmenuVariable || "";
    form.querySelector('[name="categoria"]').value = item.category || "";
    form.querySelector('[name="producto"]').value = item.name || "";
    form.querySelector('[name="descripcionproducto"]').value = item.desc || "";
    form.querySelector('[name="precioactual"]').value = item.precioActual || "";
    form.querySelector('[name="precioregular"]').value = item.precioRegular || "";
    form.querySelector('[name="mostrardescuento"]').value = item.mostrarDescuento || "NO";
    form.querySelector('[name="esdestacado"]').value = item.esDestacado || "NO";
    form.querySelector('[name="productoagotado"]').value = item.productoAgotado || "NO";
    form.querySelector('[name="stock"]').value = item.stock || "";
    currentImageUrl = item.image || "";
    setImagePreview(currentImageUrl);
};

const loadForEdit = async (id) => {
    if (!id) return;
    const rows = await fetchSheetListCompuestoDetalle();
    const row = rows.find((r) => cleanText(getValue(r, ["idmenu-unico", "idmenuunico", "idproducto"])) === id);
    if (!row) return;

    const parsePrice = (v) => {
        const raw = cleanText(v);
        if (!raw) return "";
        const n = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
        return Number.parseFloat(n);
    };
    const category = cleanText(getValue(row, ["Categoria", "categoria"]));
    const name = cleanText(getValue(row, ["Producto", "producto"]));
    const desc = cleanText(getValue(row, ["Descripcion Producto", "descripcionproducto", "Descripcion"]));
    const precioActual = parsePrice(getValue(row, ["Precio Actual", "precioactual"]));
    const precioRegular = parsePrice(getValue(row, ["Precio Regular", "precioregular"]));
    const image = cleanText(getValue(row, ["Imagen", "imagen"]));
    const esDestacado = cleanText(getValue(row, ["Es Destacado", "esdestacado"])) || "NO";
    const productoAgotado = cleanText(getValue(row, ["Producto Agotado", "productoagotado"])) || "NO";
    const stock = cleanText(getValue(row, ["Stock", "stock"]));
    const item = {
        order: cleanText(getValue(row, ["orden"])),
        id: cleanText(getValue(row, ["idmenu-unico", "idmenuunico"])),
        tipoMenu: cleanText(getValue(row, ["Tipo Menu", "tipomenu"])) || "MENU-SIMPLE",
        idmenuVariable: cleanText(getValue(row, ["idmenu-variable", "idmenuvariable"])),
        category,
        name,
        desc,
        precioActual,
        precioRegular,
        mostrarDescuento: cleanText(getValue(row, ["Mostar Descuento", "Mostrar Descuento", "mostrardescuento"])) || "NO",
        image,
        esDestacado,
        productoAgotado,
        stock
    };
    fillForm(item);
    const precioDisplayActual = precioActual !== "" && !Number.isNaN(Number(precioActual)) ? Number(precioActual).toLocaleString("es-AR") : "";
    const precioDisplayRegular = precioRegular !== "" && !Number.isNaN(Number(precioRegular)) ? Number(precioRegular).toLocaleString("es-AR") : "";
    setProductoBaseReadonlyDisplayCompuesto(category, name, desc, precioDisplayActual, precioDisplayRegular, image, esDestacado, productoAgotado, stock);
    document.getElementById("tipomenu-select").value = "MENU-COMPUESTO";
    switchPanelsByTipo();
    setFormMode("edit");
};

const initForm = () => {
    const form = document.getElementById("add-item-form");

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const tipo = document.getElementById("tipomenu-select")?.value || "";
        if (!tipo) {
            alert("Elegí el tipo de menú (MENU-SIMPLE o MENU-COMPUESTO) para continuar.");
            return;
        }
        if (!MENU_SCRIPT_URL) {
            alert("Falta configurar appsScriptMenuUrl en config.js.");
            return;
        }
        const submitBtn = document.getElementById("submit-btn");
        const originalSubmitText = submitBtn?.textContent || "Guardar";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Guardando...";
        }
        try {
        setDebug("Enviando datos al Apps Script...");

        const formMode = document.getElementById("form-mode")?.value || "create";
        const data = new FormData(form);
        const isCreate = formMode !== "edit";

        if (tipo === "MENU-SIMPLE") {
            const idproducto = cleanText(data.get("idproducto"));
            if (!idproducto) {
                alert("Elegí un producto de la lista de productos base.");
                return;
            }
            try {
                if (MENU_SIMPLE_SHEET_NAME) {
                    const imageUrl = currentImageUrlSimple;
                    const payload = {
                        action: "create",
                        sheetName: MENU_SIMPLE_SHEET_NAME,
                        idmenu: cleanText(data.get("idmenu_simple")),
                        orden: cleanText(data.get("orden_simple")),
                        idproducto: idproducto,
                        Categoria: cleanText(data.get("categoria_simple")),
                        Producto: cleanText(data.get("producto_simple")),
                        Descripcion: cleanText(data.get("descripcion_simple")),
                        Precio: cleanText(data.get("precio_simple")),
                        Imagen: imageUrl,
                        "Es Destacado": cleanText(data.get("esdestacado_simple")) || "NO",
                        "Producto Agotado": cleanText(data.get("productoagotado_simple")) || "NO",
                        stock: cleanText(data.get("stock_simple")),
                        habilitado: "SI",
                        Habilitado: "SI"
                    };
                    if (!payload.idmenu) {
                        alert("Falta ID Menú. Recargá la página y volvé a elegir MENU-SIMPLE.");
                        return;
                    }
                    await fetch(MENU_SCRIPT_URL, {
                        method: "POST",
                        mode: "no-cors",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify(payload)
                    });
                }
                const compuestoRows = await fetchSheetList();
                let nextOrden = 1;
                compuestoRows.forEach((row) => {
                    const v = cleanText(getValue(row, ["orden", "order"]));
                    const num = Number(v);
                    if (!Number.isNaN(num)) nextOrden = Math.max(nextOrden, num + 1);
                });
                const idmenuUnico = "MENU-" + Date.now().toString(36) + randomAlphanumeric(8);
                const payloadCompuesto = {
                    action: "create",
                    sheetName: MENU_SHEET_NAME,
                    orden: nextOrden,
                    "idmenu-unico": idmenuUnico,
                    "Tipo Menu": "MENU-SIMPLE",
                    idproducto: idproducto
                };
                await fetch(MENU_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payloadCompuesto)
                });
                setDebug(MENU_SIMPLE_SHEET_NAME
                    ? "Enviado a menú simple y a menú compuesto (idmenu-unico: " + idmenuUnico + ")."
                    : "Hoja menu-simple no existe. Enviado solo a menú compuesto (idmenu-unico: " + idmenuUnico + ", idproducto: " + idproducto + ").");
                alert(MENU_SIMPLE_SHEET_NAME
                    ? "Ítem creado en menú simple y en menú compuesto (idmenu-unico: " + idmenuUnico + ")."
                    : "Ítem creado en menú compuesto (idmenu-unico: " + idmenuUnico + "). La hoja menu-simple ya no existe.");
                form.reset();
                currentImageUrlSimple = "";
                setProductoBaseReadonlyDisplay("—", "—", "—");
                switchPanelsByTipo();
            } catch (error) {
                console.error(error);
                setDebug(`Error: ${error?.message || error}`);
                alert("No se pudo enviar. Revisá el Apps Script.");
            }
            return;
        }

        const fileInput = document.getElementById("imagen-file");
        let imageUrl = "";
        if (fileInput?.files?.[0]) {
            imageUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(fileInput.files[0]);
            });
            setImagePreview(imageUrl);
        }
        if (!imageUrl && formMode === "edit") imageUrl = currentImageUrl;
        if (!imageUrl && tipo === "MENU-COMPUESTO") imageUrl = currentImageUrl;

        const idproductoComp = cleanText(data.get("idproducto_compuesto"));
        const payload = {
            action: isCreate ? "create" : "update",
            sheetName: MENU_COMPUESTO_DETALLE_SHEET_NAME,
            orden: cleanText(data.get("orden")),
            "idmenu-unico": cleanText(data.get("idmenu-unico")),
            "Tipo Menu": cleanText(data.get("tipomenu")) || "MENU-COMPUESTO",
            "idmenu-variable": cleanText(data.get("idmenu-variable")),
            ...(idproductoComp ? { idproducto: idproductoComp } : {}),
            Categoria: cleanText(data.get("categoria")),
            Producto: cleanText(data.get("producto")),
            "Descripcion Producto": cleanText(data.get("descripcionproducto")),
            "Precio Actual": cleanText(data.get("precioactual")),
            "Precio Regular": cleanText(data.get("precioregular")),
            "Mostar Descuento": cleanText(data.get("mostrardescuento")) || "NO",
            Imagen: imageUrl,
            "Es Destacado": cleanText(data.get("esdestacado")) || "NO",
            "Producto Agotado": cleanText(data.get("productoagotado")) || "NO",
            Stock: cleanText(data.get("stock")),
            habilitado: isCreate ? "SI" : undefined,
            Habilitado: isCreate ? "SI" : undefined
        };

        if (!payload.Categoria || !payload.Producto || !payload["Precio Actual"]) {
            alert("Completá Categoría, Producto y Precio Actual.");
            return;
        }

        try {
            await fetch(MENU_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            if (isCreate) {
                const compuestoRows = await fetchSheetList();
                let nextOrden = 1;
                compuestoRows.forEach((row) => {
                    const v = cleanText(getValue(row, ["orden", "order"]));
                    const num = Number(v);
                    if (!Number.isNaN(num)) nextOrden = Math.max(nextOrden, num + 1);
                });
                const idmenuUnico = "MENU-" + Date.now().toString(36) + randomAlphanumeric(8);
                const payloadPaso3 = {
                    action: "create",
                    sheetName: MENU_SHEET_NAME,
                    orden: nextOrden,
                    "idmenu-unico": idmenuUnico,
                    "Tipo Menu": "MENU-COMPUESTO"
                };
                await fetch(MENU_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payloadPaso3)
                });
                setDebug("Enviado a menu-compuesto-detalle y a menú compuesto (idmenu-unico: " + idmenuUnico + ").");
                alert("Ítem creado en menu-compuesto-detalle y en menú compuesto (idmenu-unico: " + idmenuUnico + ").");
            } else {
                setDebug("Enviado. Revisá el Sheet para confirmar.");
                alert("Ítem enviado para actualizar.");
            }
            form.reset();
            if (fileInput) fileInput.value = "";
            setImagePreview("");
            currentImageUrl = "";
            const idproductoCompInput = document.getElementById("idproducto-compuesto-input");
            if (idproductoCompInput) idproductoCompInput.value = "";
            setFormMode("create");
            switchPanelsByTipo();
        } catch (error) {
            console.error(error);
            setDebug(`Error al enviar: ${error?.message || error}`);
            alert("No se pudo enviar el ítem. Revisá el Apps Script.");
        }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalSubmitText;
            }
        }
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    initForm();
    setFormMode("create");
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
        loadForEdit(id);
        switchPanelsByTipo();
    } else {
        const [rowsCompuesto, rowsSimple] = await Promise.all([fetchSheetListCompuestoDetalle(), fetchSheetListSimple()]);
        fillCategoriaDatalist("categoria-datalist-compuesto", rowsCompuesto);
        fillCategoriaDatalist("categoria-datalist-simple", rowsSimple);
        switchPanelsByTipo();
    }
    document.getElementById("tipomenu-select")?.addEventListener("change", switchPanelsByTipo);
    const form = document.getElementById("add-item-form");
    form?.addEventListener("input", updateDebugPayloadCompuesto);
    form?.addEventListener("change", updateDebugPayloadCompuesto);

    const fileInput = document.getElementById("imagen-file");
    const uploadBtn = document.getElementById("upload-image-btn");
    const changeBtn = document.getElementById("change-image-btn");
    uploadBtn?.addEventListener("click", () => fileInput?.click());
    changeBtn?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) {
            setImagePreview("");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    });

});
