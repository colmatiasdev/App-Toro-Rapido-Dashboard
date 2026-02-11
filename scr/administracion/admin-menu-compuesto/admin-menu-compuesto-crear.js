const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const MENU_SHEET_NAME = window.APP_CONFIG?.menuCompuestoSheetName || "menu-toro-rapido-web-compuesto";
const MENU_SIMPLE_SHEET_NAME = window.APP_CONFIG?.menuSimpleSheetName || "menu-toro-rapido-web-simple";
const PRODUCTOS_SHEET_NAME = window.APP_CONFIG?.menuProductosSheetName || "productos-base";

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
    if (!MENU_SCRIPT_URL) return [];
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
    const rows = await fetchSheetList();
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
        card.addEventListener("click", () => selectProductoBase({ idproducto, categoria, producto, descripcion, precio: getValue(row, ["Precio", "Precio Actual", "precioactual"]), imagen, esDestacado, productoAgotado, stock }));
        fragment.appendChild(card);
    });
    return fragment;
};

const selectProductoBase = (item) => {
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
    document.querySelectorAll(".producto-base-card").forEach((c) => {
        c.classList.remove("selected");
        if ((c.dataset.idproducto || "") === (item.idproducto || "")) c.classList.add("selected");
    });
};

const setProductoBaseReadonlyDisplay = (esDestacado, productoAgotado, stock) => {
    const d1 = document.getElementById("display-esdestacado-simple");
    const d2 = document.getElementById("display-productoagotado-simple");
    const d3 = document.getElementById("display-stock-simple");
    if (d1) d1.textContent = esDestacado ?? "—";
    if (d2) d2.textContent = productoAgotado ?? "—";
    if (d3) d3.textContent = (stock !== undefined && stock !== "") ? stock : "—";
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
    const panelSimple = document.getElementById("form-panel-simple");
    const panelCompuesto = document.getElementById("form-panel-compuesto");
    const actionsWrap = document.getElementById("form-actions-wrap");

    if (panelSimple) panelSimple.style.display = "none";
    if (panelCompuesto) panelCompuesto.style.display = "none";
    if (actionsWrap) actionsWrap.style.display = "none";

    if (tipo === "MENU-SIMPLE") {
        if (panelSimple) panelSimple.style.display = "grid";
        if (actionsWrap) actionsWrap.style.display = "flex";
        setAutoIdSimple();
        setAutoOrderSimple();
        loadAndShowProductosBase();
    } else if (tipo === "MENU-COMPUESTO") {
        if (panelCompuesto) panelCompuesto.style.display = "grid";
        if (actionsWrap) actionsWrap.style.display = "flex";
        setAutoId();
        setAutoOrder();
    }
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
    const rows = await fetchSheetList();
    const row = rows.find((r) => cleanText(getValue(r, ["idmenu-unico", "idmenuunico", "idproducto"])) === id);
    if (!row) return;

    const parsePrice = (v) => {
        const raw = cleanText(v);
        if (!raw) return "";
        const n = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
        return Number.parseFloat(n);
    };
    fillForm({
        order: cleanText(getValue(row, ["orden"])),
        id: cleanText(getValue(row, ["idmenu-unico", "idmenuunico"])),
        tipoMenu: cleanText(getValue(row, ["Tipo Menu", "tipomenu"])) || "MENU-SIMPLE",
        idmenuVariable: cleanText(getValue(row, ["idmenu-variable", "idmenuvariable"])),
        category: cleanText(getValue(row, ["Categoria", "categoria"])),
        name: cleanText(getValue(row, ["Producto", "producto"])),
        desc: cleanText(getValue(row, ["Descripcion Producto", "descripcionproducto", "Descripcion"])),
        precioActual: parsePrice(getValue(row, ["Precio Actual", "precioactual"])),
        precioRegular: parsePrice(getValue(row, ["Precio Regular", "precioregular"])),
        mostrarDescuento: cleanText(getValue(row, ["Mostar Descuento", "Mostrar Descuento", "mostrardescuento"])) || "NO",
        image: cleanText(getValue(row, ["Imagen", "imagen"])),
        esDestacado: cleanText(getValue(row, ["Es Destacado", "esdestacado"])) || "NO",
        productoAgotado: cleanText(getValue(row, ["Producto Agotado", "productoagotado"])) || "NO",
        stock: cleanText(getValue(row, ["Stock", "stock"]))
    });
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
            const imageUrl = currentImageUrlSimple;

            const payload = {
                action: "create",
                sheetName: MENU_SIMPLE_SHEET_NAME,
                idmenu: cleanText(data.get("idmenu_simple")),
                orden: cleanText(data.get("orden_simple")),
                idproducto: cleanText(data.get("idproducto")),
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
            if (!payload.idproducto) {
                alert("Elegí un producto de la lista de productos base.");
                return;
            }
            try {
                await fetch(MENU_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });
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
                    "Tipo Menu": "MENU-SIMPLE"
                };
                await fetch(MENU_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payloadCompuesto)
                });
                setDebug("Enviado a menú simple y a menú compuesto (idmenu-unico: " + idmenuUnico + ").");
                alert("Ítem creado en menú simple y en menú compuesto (idmenu-unico: " + idmenuUnico + ").");
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

        const payload = {
            action: isCreate ? "create" : "update",
            sheetName: MENU_SHEET_NAME,
            orden: cleanText(data.get("orden")),
            "idmenu-unico": cleanText(data.get("idmenu-unico")),
            "Tipo Menu": cleanText(data.get("tipomenu")) || "MENU-SIMPLE",
            "idmenu-variable": cleanText(data.get("idmenu-variable")),
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
            setDebug("Enviado. Revisá el Sheet para confirmar.");
            alert(isCreate ? "Ítem enviado para crear." : "Ítem enviado para actualizar.");
            form.reset();
            if (fileInput) fileInput.value = "";
            setImagePreview("");
            currentImageUrl = "";
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
        const [rowsCompuesto, rowsSimple] = await Promise.all([fetchSheetList(), fetchSheetListSimple()]);
        fillCategoriaDatalist("categoria-datalist-compuesto", rowsCompuesto);
        fillCategoriaDatalist("categoria-datalist-simple", rowsSimple);
        switchPanelsByTipo();
    }
    document.getElementById("tipomenu-select")?.addEventListener("change", switchPanelsByTipo);

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
