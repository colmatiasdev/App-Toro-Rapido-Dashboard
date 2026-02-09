/**
 * Menú compuesto: depende de menu-common.js. Rutas para páginas en scr/menu/.
 */
window.MENU_RETURN = "compuesto";

const URL_CSV = window.APP_CONFIG?.googleSheetUrlMenuCompuesto || window.APP_CONFIG?.googleSheetUrl || "";
const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const MENU_SHEET_NAME = window.APP_CONFIG?.menuCompuestoSheetName || "menu-toro-rapido-web-compuesto";
const MENU_DETALLE_SHEET_NAME = window.APP_CONFIG?.menuCompuestoDetalleSheetName || "menu-compuesto-detalle";
const MENU_OPCIONES_SHEET_NAME = window.APP_CONFIG?.menuOpcionesSheetName || "menu-opciones";
const URL_CSV_DETALLE = window.APP_CONFIG?.googleSheetUrlMenuCompuestoDetalle || "";

const TIPO_MENU_COMPUESTO = ["MENU-COMPUESTO", "MENU-COMPUE"];
const isTipoMenuCompuesto = (value) => {
    const v = (value ?? "").toString().trim().toUpperCase().replace(/\s/g, "");
    return TIPO_MENU_COMPUESTO.some((t) => v === t.replace(/\s/g, ""));
};

const parseDetalleRows = (rows) => {
    const getVal = (row, keys) => {
        const k = keys.find((key) => row[key] !== undefined && row[key] !== "");
        return k ? row[k] : "";
    };
    const byId = new Map();
    rows.forEach((row) => {
        const idVar = cleanText(getVal(row, ["idmenu-variable", "idmenuvariable", "idmenu variable"]));
        if (!idVar) return;
        const enabled = parseEnabled(getVal(row, ["Habilitado", "habilitado", "activo", "visible"]));
        if (!enabled) return;
        const agotado = getVal(row, ["Producto Agotado", "productoagotado", "Agotado"]);
        const stock = getVal(row, ["Stock", "stock"]);
        const available = parseAvailability(agotado, stock);
        const sub = {
            id: cleanText(getVal(row, ["idmenu-compuesto-detalle", "idproducto", "id", "codigo"])),
            name: cleanText(getVal(row, ["Producto", "producto", "Nombre"])),
            quantity: Number.parseFloat(cleanText(getVal(row, ["Cantidad", "cantidad"]))) || 1,
            priceUnit: parsePrice(getVal(row, ["Precio Unitario Actual", "Precio unitario actual", "preciounitario"])),
            priceTotal: parsePrice(getVal(row, ["Precio Total Actual", "Precio total actual", "preciototal"])),
            img: cleanText(getVal(row, ["Imagen", "imagen", "img"])) || PLACEHOLDER_IMAGE,
            available
        };
        if (!sub.name) return;
        if (!byId.has(idVar)) byId.set(idVar, []);
        byId.get(idVar).push(sub);
    });
    return byId;
};

const parseDetalleCsv = (csvText) => {
    const rows = parseCsv(csvText);
    if (rows.length < 2) return new Map();
    const headers = rows.shift().map((h) => normalizeKey(h));
    const findIdx = (candidates) => headers.findIndex((h) => candidates.includes(h));
    const idxIdVar = findIdx(["idmenuvariable", "idmenu-variable", "idmenuvariable"]);
    const idxName = findIdx(["producto", "nombre", "product"]);
    const idxCant = findIdx(["cantidad"]);
    const idxPriceUnit = findIdx(["preciounitarioactual", "preciounitario", "precio unitario"]);
    const idxPriceTotal = findIdx(["preciototalactual", "preciototal", "precio total"]);
    const idxImg = findIdx(["imagen", "img"]);
    const idxAgotado = findIdx(["productoagotado", "agotado"]);
    const idxStock = findIdx(["stock"]);
    const idxEnabled = findIdx(["habilitado", "activo"]);
    const idxId = findIdx(["idmenucompuestodetalle", "idproducto", "id", "codigo"]);
    if (idxIdVar === -1 || idxName === -1) return new Map();
    const byId = new Map();
    rows.forEach((row) => {
        const idVar = cleanText(row[idxIdVar]);
        if (!idVar) return;
        if (idxEnabled !== -1 && !parseEnabled(row[idxEnabled])) return;
        const agotado = idxAgotado === -1 ? "" : row[idxAgotado];
        const stock = idxStock === -1 ? "" : row[idxStock];
        const available = parseAvailability(agotado, stock);
        const sub = {
            id: idxId === -1 ? "" : cleanText(row[idxId]),
            name: cleanText(row[idxName]),
            quantity: idxCant === -1 ? 1 : Number.parseFloat(cleanText(row[idxCant])) || 1,
            priceUnit: idxPriceUnit === -1 ? 0 : parsePrice(row[idxPriceUnit]),
            priceTotal: idxPriceTotal === -1 ? 0 : parsePrice(row[idxPriceTotal]),
            img: idxImg === -1 ? "" : cleanText(row[idxImg]) || PLACEHOLDER_IMAGE,
            available
        };
        if (!sub.name) return;
        if (!byId.has(idVar)) byId.set(idVar, []);
        byId.get(idVar).push(sub);
    });
    return byId;
};

const mapRowsToMenu = (rows) => {
    const getValue = (row, candidates) => {
        const found = candidates.find((key) => row[key] !== undefined);
        return found ? row[found] : "";
    };
    const grouped = new Map();
    rows.forEach((row, index) => {
        const category = cleanText(getValue(row, ["Categoria", "categoria", "Category", "category", "cat", "rubro", "tipo"])) || "Otros";
        const name = cleanText(getValue(row, ["Producto", "producto", "Nombre", "nombre", "item", "titulo"]));
        if (!name) return;
        const desc = cleanText(getValue(row, ["Descripcion Producto", "Descripcion", "descripcion", "desc", "detalle", "detalleproducto"]));
        const price = parsePrice(getValue(row, ["Precio Actual", "Precio actual", "precioactual", "Precio", "precio", "price", "valor", "importe", "costo"]));
        const img = cleanText(getValue(row, ["Imagen", "imagen", "img", "image", "foto", "url", "urlimagen", "imagenurl"]));
        const agotadoValue = getValue(row, ["Producto Agotado", "productoagotado", "Agotado", "agotado"]);
        const stockValue = getValue(row, ["Stock", "stock"]);
        const available = parseAvailability(agotadoValue, stockValue);
        const rawId = cleanText(getValue(row, ["idproducto", "IdProducto", "idmenu-unico", "idmenu-variable", "idmenuunico", "idmenuvariable", "ID", "id", "codigo", "sku"]));
        const orderValue = cleanText(getValue(row, ["orden", "Orden", "order", "posicion", "position"]));
        const order = orderValue === "" ? Number.POSITIVE_INFINITY : Number.parseFloat(orderValue);
        const enabledValue = getValue(row, ["Habilitado", "habilitado", "activo", "visible", "mostrar"]);
        const enabled = parseEnabled(enabledValue);
        const tipoMenu = cleanText(getValue(row, ["Tipo Menu", "tipomenu", "tipo menu", "tipo"]));
        const idmenuVariable = cleanText(getValue(row, ["idmenu-variable", "idmenu variable", "idmenuvariable"]));
        const id = rawId || `${slugify(category)}-${index}`;
        const priceRegular = parsePrice(getValue(row, ["Precio Regular", "precio regular", "precioregular"])) || 0;
        // Columna "Mostar Descuento" en hoja menu-toro-rapido-web-compuesto: SI = mostrar oferta, NO = no mostrar
        const mostrarDescuentoRaw = String(getValue(row, ["Mostar Descuento", "Mostrar Descuento", "mostrar descuento", "mostar descuento", "mostrardescuento", "mostardescuento"])).trim().toUpperCase();
        const mostrarDescuento = mostrarDescuentoRaw === "SI" || mostrarDescuentoRaw === "SÍ";
        const porcentajeDescuentoRaw = getValue(row, ["Porcentaje Descuento", "porcentaje descuento", "porcentajedescuento"]);
        const porcentajeDescuento = porcentajeDescuentoRaw !== "" && porcentajeDescuentoRaw !== undefined ? Number(porcentajeDescuentoRaw) : null;
        const esDestacadoRaw = String(getValue(row, ["Es Destacado", "es destacado", "esdestacado"])).trim().toUpperCase();
        const esDestacado = esDestacadoRaw === "SI" || esDestacadoRaw === "SÍ";
        if (!enabled) return;
        if (!grouped.has(category)) grouped.set(category, []);
        grouped.get(category).push({
            id, name, desc, price,
            img: img || PLACEHOLDER_IMAGE,
            available,
            order,
            tipoMenu,
            idmenuVariable,
            subItems: [],
            category,
            priceRegular,
            mostrarDescuento,
            porcentajeDescuento,
            esDestacado
        });
    });
    return Array.from(grouped.entries()).map(([category, items]) => ({
        category,
        items: items.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.name.localeCompare(b.name, "es");
        })
    }));
};

const mapCsvToMenu = (csvText) => {
    const rows = parseCsv(csvText);
    if (rows.length < 2) return null;
    const headers = rows.shift().map((header) => normalizeKey(header));
    const findIndex = (candidates) => headers.findIndex((header) => candidates.includes(header));
    const idxCategory = findIndex(["categoria", "categorias", "category", "cat", "rubro", "tipo"]);
    const idxName = findIndex(["producto", "nombre", "product", "name", "titulo", "item"]);
    const idxDesc = findIndex(["descripcionproducto", "descripcion", "desc", "detalle", "detalleproducto"]);
    const idxPrice = findIndex(["precioactual", "precio", "price", "valor", "importe", "costo"]);
    const idxImg = findIndex(["imagen", "img", "image", "foto", "url", "urlimagen", "imagenurl"]);
    const idxAgotado = findIndex(["productoagotado", "agotado"]);
    const idxStock = findIndex(["stock"]);
    const idxId = findIndex(["idproducto", "idprod", "idmenuunico", "idmenuvariable", "idmenunormal", "id", "codigo", "sku"]);
    const idxOrder = findIndex(["orden", "order", "posicion", "position"]);
    const idxEnabled = findIndex(["habilitado", "activo", "visible", "mostrar"]);
    const idxTipoMenu = findIndex(["tipomenu", "tipo"]);
    const idxIdmenuVariable = findIndex(["idmenuvariable", "idmenu-variable", "idmenu variable"]);
    const idxPrecioRegular = findIndex(["precioregular", "precio regular"]);
    // CSV: cabecera normalizada (ej. "Mostar Descuento" → "mostardescuento")
    const idxMostrarDescuento = findIndex(["mostardescuento", "mostrardescuento", "mostar descuento", "mostrar descuento"]);
    const idxPorcentajeDescuento = findIndex(["porcentajedescuento", "porcentaje descuento"]);
    const idxEsDestacado = findIndex(["esdestacado", "es destacado"]);
    if (idxCategory === -1 || idxName === -1 || idxPrice === -1) return null;
    const grouped = new Map();
    rows.forEach((row, index) => {
        const category = cleanText(row[idxCategory]) || "Otros";
        const name = cleanText(row[idxName]);
        if (!name) return;
        const desc = idxDesc === -1 ? "" : cleanText(row[idxDesc]);
        const price = parsePrice(row[idxPrice]);
        const img = idxImg === -1 ? "" : cleanText(row[idxImg]);
        const agotadoValue = idxAgotado === -1 ? "" : row[idxAgotado];
        const stockValue = idxStock === -1 ? "" : row[idxStock];
        const available = parseAvailability(agotadoValue, stockValue);
        const rawId = idxId === -1 ? "" : cleanText(row[idxId]);
        const orderValue = idxOrder === -1 ? "" : cleanText(row[idxOrder]);
        const order = orderValue === "" ? Number.POSITIVE_INFINITY : Number.parseFloat(orderValue);
        const id = rawId || `${slugify(category)}-${index}`;
        const enabledValue = idxEnabled === -1 ? "" : row[idxEnabled];
        const enabled = parseEnabled(enabledValue);
        const tipoMenu = idxTipoMenu === -1 ? "" : cleanText(row[idxTipoMenu]);
        const idmenuVariable = idxIdmenuVariable === -1 ? "" : cleanText(row[idxIdmenuVariable]);
        const priceRegular = idxPrecioRegular === -1 ? 0 : parsePrice(row[idxPrecioRegular]);
        const mostrarDescuentoRaw = idxMostrarDescuento === -1 ? "" : String(row[idxMostrarDescuento] ?? "").trim().toUpperCase();
        const mostrarDescuento = mostrarDescuentoRaw === "SI" || mostrarDescuentoRaw === "SÍ";
        const porcentajeDescuentoVal = idxPorcentajeDescuento === -1 ? null : (row[idxPorcentajeDescuento] !== "" && row[idxPorcentajeDescuento] !== undefined ? Number(row[idxPorcentajeDescuento]) : null);
        const esDestacadoRaw = idxEsDestacado === -1 ? "" : String(row[idxEsDestacado] ?? "").trim().toUpperCase();
        const esDestacado = esDestacadoRaw === "SI" || esDestacadoRaw === "SÍ";
        if (!enabled) return;
        if (!grouped.has(category)) grouped.set(category, []);
        grouped.get(category).push({
            id, name, desc, price,
            img: img || PLACEHOLDER_IMAGE,
            available,
            order,
            tipoMenu,
            idmenuVariable,
            subItems: [],
            category,
            priceRegular,
            mostrarDescuento,
            porcentajeDescuento: porcentajeDescuentoVal,
            esDestacado
        });
    });
    return Array.from(grouped.entries()).map(([category, items]) => ({
        category,
        items: items.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.name.localeCompare(b.name, "es");
        })
    }));
};

const fetchCsvMenuData = async () => {
    const sep = URL_CSV.includes("?") ? "&" : "?";
    const response = await fetch(`${URL_CSV}${sep}_ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar el CSV.");
    const csvText = await response.text();
    return mapCsvToMenu(csvText);
};

const fetchMenuData = async () => {
    if (MENU_SCRIPT_URL) {
        try {
            const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
            const response = await fetch(`${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(MENU_SHEET_NAME)}&_ts=${Date.now()}`, { cache: "no-store" });
            if (!response.ok) throw new Error("No se pudo cargar desde Apps Script.");
            const text = await response.text();
            let payload = null;
            try { payload = JSON.parse(text); } catch (e) {}
            if (Array.isArray(payload)) {
                const mapped = mapRowsToMenu(payload);
                if (mapped && mapped.length) return mapped;
            }
            if (payload && Array.isArray(payload.rows) && Array.isArray(payload.headers)) {
                const mapped = mapRowsToMenu(rowsToObjects(payload.headers, payload.rows));
                if (mapped && mapped.length) return mapped;
            }
            if (payload && Array.isArray(payload.data)) {
                const mapped = mapRowsToMenu(payload.data);
                if (mapped && mapped.length) return mapped;
            }
            throw new Error("Respuesta Apps Script inválida.");
        } catch (error) {
            console.warn("Apps Script sin datos. Se intenta CSV.", error);
        }
    }
    if (!URL_CSV) throw new Error("No hay URL de Google Sheet configurada.");
    return fetchCsvMenuData();
};

const fetchDetalleData = async () => {
    if (MENU_SCRIPT_URL) {
        try {
            const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
            const response = await fetch(`${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(MENU_DETALLE_SHEET_NAME)}&_ts=${Date.now()}`, { cache: "no-store" });
            if (!response.ok) return null;
            const text = await response.text();
            let payload = null;
            try { payload = JSON.parse(text); } catch (e) {}
            if (Array.isArray(payload)) return parseDetalleRows(payload);
            if (payload && Array.isArray(payload.rows) && Array.isArray(payload.headers)) return parseDetalleRows(rowsToObjects(payload.headers, payload.rows));
            if (payload && Array.isArray(payload.data)) return parseDetalleRows(payload.data);
        } catch (error) {
            console.warn("Detalle desde Apps Script:", error);
        }
    }
    if (URL_CSV_DETALLE) {
        try {
            const sep = URL_CSV_DETALLE.includes("?") ? "&" : "?";
            const response = await fetch(`${URL_CSV_DETALLE}${sep}_ts=${Date.now()}`, { cache: "no-store" });
            if (!response.ok) return null;
            return parseDetalleCsv(await response.text());
        } catch (error) {
            console.warn("Detalle desde CSV:", error);
        }
    }
    return null;
};

const mergeDetalleIntoMenu = (menuSections, detalleMap) => {
    if (!detalleMap || !menuSections) return;
    menuSections.forEach((section) => {
        (section.items || []).forEach((item) => {
            if (isTipoMenuCompuesto(item.tipoMenu) && item.idmenuVariable) {
                item.subItems = detalleMap.get(item.idmenuVariable) || [];
                const algunoAgotado = item.subItems.some((sub) => sub.available === false);
                if (algunoAgotado) item.available = false;
            }
        });
    });
};

const fetchOpcionesData = async () => {
    const scriptUrl = MENU_SCRIPT_URL;
    if (!scriptUrl || !MENU_OPCIONES_SHEET_NAME) return new Map();
    try {
        const sep = scriptUrl.includes("?") ? "&" : "?";
        const response = await fetch(`${scriptUrl}${sep}action=list&sheetName=${encodeURIComponent(MENU_OPCIONES_SHEET_NAME)}&_ts=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return new Map();
        const text = await response.text();
        let payload = null;
        try { payload = JSON.parse(text); } catch (e) {}
        let rows = [];
        if (Array.isArray(payload)) rows = payload;
        else if (payload && Array.isArray(payload.rows) && Array.isArray(payload.headers)) rows = rowsToObjects(payload.headers, payload.rows);
        else if (payload && Array.isArray(payload.data)) rows = payload.data;
        return typeof buildOpcionesMapFromRows === "function" ? buildOpcionesMapFromRows(rows) : new Map();
    } catch (e) {
        console.warn("Opciones desde Apps Script:", e);
        return new Map();
    }
};

const applyOpcionesToMenu = (menuSections, opcionesMap) => {
    if (!opcionesMap || !menuSections) return;
    menuSections.forEach((section) => {
        (section.items || []).forEach((item) => {
            item.opciones = opcionesMap.get(item.id) || [];
        });
    });
};

const loadMenuData = async () => {
    let usedFallback = false;
    try {
        const [mapped, detalleMap, opcionesMap] = await Promise.all([fetchMenuData(), fetchDetalleData(), fetchOpcionesData()]);
        if (mapped && mapped.length) {
            mergeDetalleIntoMenu(mapped, detalleMap || null);
            applyOpcionesToMenu(mapped, opcionesMap);
            window.menuData = mapped;
            return false;
        }
        console.warn("No se pudo mapear el CSV. Se usa el menú de ejemplo.");
        usedFallback = true;
    } catch (error) {
        console.error(error);
        usedFallback = true;
    }
    window.menuData = sampleMenuData;
    return usedFallback;
};

const PRODUCTO_BASE = "../../producto/producto.html";

const renderOneItem = (item) => {
    const isCompuesto = item.subItems && item.subItems.length > 0;
    const qtyBlock =
        item.available === false
            ? `<div class="qty-controls disabled">Producto no disponible</div>`
            : `<div class="qty-controls is-empty" data-qty-wrapper="${item.id}">
                <button class="qty-btn" data-action="remove" data-id="${item.id}">QUITAR</button>
                <div id="qty-${item.id}" class="qty-value">0</div>
                <button class="qty-btn" data-action="add" data-id="${item.id}">AGREGAR</button>
              </div>`;
    const maxInfo = `<div class="item-max-info" id="qty-info-${item.id}">
        <b>¿Necesitás más de 10 unidades?</b> Seleccioná el máximo y avisamos por WhatsApp al confirmar. ¡Nosotros lo modificamos!
    </div>`;

    if (isCompuesto) {
        const subList = item.subItems
            .map(
                (sub) => `
            <li class="sub-item ${sub.available === false ? "sub-item-out" : ""}">
                ${sub.quantity > 0 ? `<span class="sub-qty">${sub.quantity}x</span>` : ""}
                <span class="sub-name">${sub.name}</span>
                ${sub.available === false ? `<span class="sub-item-agotado">AGOTADO</span>` : ""}
            </li>`
            )
            .join("");
        return `
            <article class="item item-compuesto ${item.available === false ? "is-out" : ""}">
                <div class="item-compuesto-header">
                    <a href="${PRODUCTO_BASE}?id=${encodeURIComponent(item.id)}" class="item-img-link producto-ver-detalle" data-id="${encodeURIComponent(item.id)}" aria-label="Ver detalle de ${(item.name || "").replace(/"/g, "&quot;")}">
                        <img src="${item.img || PLACEHOLDER_IMAGE}" alt="${item.name}" class="item-img" loading="lazy" decoding="async" onerror="this.onerror=null;this.classList.add('img-error');this.src=window.__MENU_IMG_FALLBACK">
                    </a>
                    ${item.available === false ? `<span class="out-badge">AGOTADO</span>` : ""}
                    <div class="item-compuesto-info">
                        <a href="${PRODUCTO_BASE}?id=${encodeURIComponent(item.id)}" class="item-info-link producto-ver-detalle" data-id="${encodeURIComponent(item.id)}" aria-label="Ver detalle de ${(item.name || "").replace(/"/g, "&quot;")}">
                            <h3 class="item-name">${item.name}</h3>
                            ${item.desc ? `<p class="item-desc">${item.desc}</p>` : ""}
                            ${(typeof getItemOfferBlock === "function" ? getItemOfferBlock(item) : "") || `<div class="item-price">${formatV2(item.price)}</div>`}
                        </a>
                    </div>
                    <div class="item-action">
                        ${qtyBlock}
                        <div class="qty-max-note" id="qty-note-${item.id}">Máximo 10 unidades</div>
                    </div>
                </div>
                <div class="item-compuesto-detalle">
                    <div class="sub-items-title">Incluye:</div>
                    <ul class="sub-items-list">${subList}</ul>
                </div>
            </article>
            ${maxInfo}
        `;
    }

    return `
            <article class="item ${item.available === false ? "is-out" : ""}">
                <a href="${PRODUCTO_BASE}?id=${encodeURIComponent(item.id)}" class="item-img-link producto-ver-detalle" data-id="${encodeURIComponent(item.id)}" aria-label="Ver detalle de ${(item.name || "").replace(/"/g, "&quot;")}">
                    <img src="${item.img || PLACEHOLDER_IMAGE}" alt="${item.name}" class="item-img" loading="lazy" decoding="async" onerror="this.onerror=null;this.classList.add('img-error');this.src=window.__MENU_IMG_FALLBACK">
                </a>
                ${item.available === false ? `<span class="out-badge">AGOTADO</span>` : ""}
                <div class="item-info">
                    <a href="${PRODUCTO_BASE}?id=${encodeURIComponent(item.id)}" class="item-info-link producto-ver-detalle" data-id="${encodeURIComponent(item.id)}" aria-label="Ver detalle de ${(item.name || "").replace(/"/g, "&quot;")}">
                        <h3 class="item-name">${item.name}</h3>
                        <p class="item-desc">${item.desc}</p>
                        ${(typeof getItemOfferBlock === "function" ? getItemOfferBlock(item) : "") || `<div class="item-price">${formatV2(item.price)}</div>`}
                    </a>
                </div>
                <div class="item-action">
                    ${qtyBlock}
                    <div class="qty-max-note" id="qty-note-${item.id}">Máximo 10 unidades</div>
                </div>
            </article>
            ${maxInfo}
        `;
};

const renderMenu = (menuData) => {
    const tabsContainer = document.getElementById("category-tabs");
    const sectionsContainer = document.getElementById("menu-sections");
    if (!tabsContainer || !sectionsContainer) return;
    const filteredMenu = (menuData || []).filter((section) => Array.isArray(section.items) && section.items.length);
    const tabsFragment = document.createDocumentFragment();
    const sectionsFragment = document.createDocumentFragment();
    filteredMenu.forEach((section, index) => {
        const isPromo = section.category.toLowerCase().includes("promo");
        const sectionId = `cat-${slugify(section.category)}`;
        const tab = document.createElement("button");
        tab.className = `tab${isPromo ? " tab-promo" : ""}${index === 0 ? " active" : ""}`;
        tab.dataset.target = sectionId;
        tab.dataset.promo = isPromo ? "true" : "false";
        tab.innerHTML = `${isPromo ? '<i class="fa-solid fa-crown"></i>' : ''}<span>${isPromo ? "PROMOCIONES" : section.category}</span>`;
        tabsFragment.appendChild(tab);
        const sectionEl = document.createElement("section");
        sectionEl.className = `menu-section${isPromo ? " section-promo" : ""}`;
        sectionEl.id = sectionId;
        sectionEl.innerHTML = `
            <div class="section-title ${isPromo ? 'title-promo' : ''}">
                ${isPromo ? '<i class="fa-solid fa-crown"></i>' : ''}
                ${section.category}
            </div>
            <div class="items-list" data-category="${sectionId}"></div>
        `;
        const list = sectionEl.querySelector(".items-list");
        list.innerHTML = section.items.map((item) => renderOneItem(item)).join("");
        sectionsFragment.appendChild(sectionEl);
    });
    tabsContainer.innerHTML = "";
    sectionsContainer.innerHTML = "";
    tabsContainer.appendChild(tabsFragment);
    sectionsContainer.appendChild(sectionsFragment);
};

const initMenu = async () => {
    const loadingEl = document.getElementById("menu-loading");
    if (loadingEl) loadingEl.style.display = "block";
    const [, , , usedFallback] = await Promise.all([
        loadHeaderV2(),
        loadPromoV2(),
        loadResumenV2(),
        loadMenuData()
    ]);
    bindHeaderActions();
    renderMenu(window.menuData);
    restoreCartFromStorage();
    try { applyPendingAddFromProduct(); } catch (e) {}
    updateCartV2();
    initCategoriesV2();
    initActionsV2();
    if (loadingEl) loadingEl.style.display = "none";
    const errorEl = document.getElementById("menu-error");
    if (errorEl) errorEl.style.display = usedFallback ? "flex" : "none";
    loadFooter();
    setTimeout(async () => {
        try {
            const refreshed = await fetchMenuData();
            if (refreshed && refreshed.length) {
                const detalleMap = await fetchDetalleData();
                mergeDetalleIntoMenu(refreshed, detalleMap);
                const current = JSON.stringify(window.menuData || []);
                const next = JSON.stringify(refreshed);
                if (current !== next) {
                    window.menuData = refreshed;
                    renderMenu(window.menuData);
                    restoreCartFromStorage();
                    initCategoriesV2();
                    updateCartV2();
                }
            }
        } catch (error) { console.warn(error); }
    }, 1800);
    try {
        if (sessionStorage.getItem("toro_scroll_resumen") === "1") {
            sessionStorage.removeItem("toro_scroll_resumen");
            document.getElementById("resumen-pedido")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    } catch (error) { console.warn(error); }
};

initMenu();
