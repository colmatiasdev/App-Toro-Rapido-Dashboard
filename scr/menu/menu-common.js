/**
 * Código compartido para menu-simple y menu-compuesto.
 * Rutas pensadas para páginas en scr/menu/menu-simple/ o scr/menu/menu-compuesto/.
 */
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/160x120?text=Toro";
const IMG_FALLBACK = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120"><rect fill="#e2e8f0" width="160" height="120"/><rect x="52" y="36" width="56" height="44" rx="4" fill="none" stroke="#94a3b8" stroke-width="2"/><circle cx="80" cy="52" r="6" fill="#94a3b8"/><path d="M52 80l12-16 10 12 14-18 18 22" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="80" y="102" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui,sans-serif">Sin imagen</text></svg>'
);
if (typeof window !== "undefined") window.__MENU_IMG_FALLBACK = IMG_FALLBACK;

const sampleMenuData = [
    { category: "populares", items: [
        { id: "v2-pop-1", name: "Triple cheese", desc: "Triple medallón, cheddar y salsa.", price: 9200, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=320&q=80", available: false },
        { id: "v2-pop-2", name: "Combo crispy", desc: "Burger crispy + papas + bebida.", price: 11800, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=320&q=80" },
        { id: "v2-pop-3", name: "Papas cheddar", desc: "Papas con cheddar y verdeo.", price: 5200, img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=320&q=80" }
    ]},
    { category: "burgers", items: [
        { id: "v2-bur-1", name: "Burger clásica", desc: "Carne, queso y pan brioche.", price: 6900, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=320&q=80" },
        { id: "v2-bur-2", name: "Burger BBQ", desc: "Cebolla caramelizada y BBQ.", price: 7600, img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=320&q=80", available: false },
        { id: "v2-bur-3", name: "Burger veggie", desc: "Medallón veggie y alioli.", price: 6400, img: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=320&q=80" }
    ]},
    { category: "papas", items: [
        { id: "v2-pap-1", name: "Papas clásicas", desc: "Porción individual.", price: 2800, img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=320&q=80" },
        { id: "v2-pap-2", name: "Papas con cheddar", desc: "Cheddar y panceta.", price: 4800, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=320&q=80" }
    ]},
    { category: "bebidas", items: [
        { id: "v2-beb-1", name: "Gaseosa 500ml", desc: "Coca-Cola, Sprite o Fanta.", price: 1800, img: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=320&q=80" },
        { id: "v2-beb-2", name: "Limonada", desc: "Natural y refrescante.", price: 2200, img: "https://images.unsplash.com/photo-1464306076886-da185f6a7c37?auto=format&fit=crop&w=320&q=80" }
    ]},
    { category: "postres", items: [
        { id: "v2-pos-1", name: "Cheesecake", desc: "Con frutos rojos.", price: 3900, img: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=320&q=80" },
        { id: "v2-pos-2", name: "Brownie", desc: "Con helado de vainilla.", price: 4200, img: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=320&q=80" }
    ]}
];

const cartV2 = new Map();
const TELEFONO_NEGOCIO = window.APP_CONFIG?.telefonoNegocio || "5493814130520";
const deliveryV2 = Number(window.APP_CONFIG?.costoEnvioBase) || 1500;
const freeFromV2 = Number(window.APP_CONFIG?.montoMinimoEnvioGratis) || 25000;
let categoriesObserver = null;
let scrollHandler = null;

const formatV2 = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;

/** Bloque HTML resumido de oferta para ítem del menú (móvil). Retorna "" si no hay oferta. */
const getItemOfferBlock = (item) => {
    const price = Number(item.price) || 0;
    const priceRegular = Number(item.priceRegular) || 0;
    const raw = item.mostrarDescuento != null ? String(item.mostrarDescuento).trim().toUpperCase() : "";
    const mostrarDescuento = raw === "SI" || raw === "SÍ" || item.mostrarDescuento === true;
    if (!mostrarDescuento || priceRegular <= price || price <= 0) return "";
    const porcentaje = Math.ceil((1 - price / priceRegular) * 100);
    return `<div class="item-offer">
        <span class="item-offer-badge"><i class="fa-solid fa-tag"></i> Oferta · ${porcentaje}%</span>
        <span class="item-offer-price">${formatV2(price)}</span>
        <span class="item-offer-antes">Antes ${formatV2(priceRegular)}</span>
    </div>`;
};
if (typeof window !== "undefined") window.getItemOfferBlock = getItemOfferBlock;

const normalizeKey = (value) => value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
const slugify = (value) => normalizeKey(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "categoria";
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
            if (inQuotes && next === '"') { current += '"'; i += 1; }
            else inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            row.push(current);
            current = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") i += 1;
            row.push(current);
            if (row.some((cell) => cell.trim() !== "")) rows.push(row);
            row = [];
            current = "";
        } else {
            current += char;
        }
    }
    if (current.length || row.length) {
        row.push(current);
        if (row.some((cell) => cell.trim() !== "")) rows.push(row);
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

const rowsToObjects = (headers, rows) => rows.map((row) => {
    const obj = {};
    headers.forEach((header, idx) => { obj[header] = row[idx]; });
    return obj;
});

/** Obtiene valor de un objeto por varias posibles claves (ej. Grupo, grupo). */
const getRowVal = (row, keys) => {
    const k = keys.find((key) => row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "");
    return k ? row[k] : "";
};

/**
 * Convierte filas de la hoja "menu-opciones" en un Map: idproducto -> array de grupos.
 * Cada grupo: { nombre, tipo: "uno"|"varios", obligatorio: boolean, opciones: [{ nombre, recargo }] }
 */
const buildOpcionesMapFromRows = (rows) => {
    const map = new Map();
    if (!Array.isArray(rows) || rows.length === 0) return map;
    rows.forEach((row) => {
        const idProducto = cleanText(getRowVal(row, ["idproducto", "IdProducto", "idproducto", "id menu"]));
        const grupo = cleanText(getRowVal(row, ["Grupo", "grupo", "grupo nombre"]));
        const tipoRaw = String(getRowVal(row, ["Tipo", "tipo"])).toLowerCase();
        const tipo = tipoRaw === "varios" ? "varios" : "uno";
        const obligatorioRaw = String(getRowVal(row, ["Obligatorio", "obligatorio"])).trim().toUpperCase();
        const obligatorio = obligatorioRaw === "SI" || obligatorioRaw === "SÍ";
        const opcion = cleanText(getRowVal(row, ["Opcion", "opcion", "Opción", "opción"]));
        const recargoRaw = getRowVal(row, ["Recargo", "recargo"]);
        const recargo = Math.max(0, Number(String(recargoRaw).replace(/[^\d.-]/g, "")) || 0);
        if (!idProducto || !grupo || !opcion) return;
        if (!map.has(idProducto)) map.set(idProducto, []);
        const groups = map.get(idProducto);
        let group = groups.find((g) => g.nombre === grupo);
        if (!group) {
            group = { nombre: grupo, tipo, obligatorio, opciones: [] };
            groups.push(group);
        }
        if (group.opciones.some((o) => o.nombre === opcion)) return;
        group.opciones.push({ nombre: opcion, recargo });
    });
    return map;
};

if (typeof window !== "undefined") window.buildOpcionesMapFromRows = buildOpcionesMapFromRows;

const updateQtyUI = (id, qty) => {
    const value = document.getElementById(`qty-${id}`);
    const wrapper = document.querySelector(`[data-qty-wrapper="${id}"]`);
    const note = document.getElementById(`qty-note-${id}`);
    const info = document.getElementById(`qty-info-${id}`);
    const addBtn = document.querySelector(`.qty-btn[data-action="add"][data-id="${id}"]`);
    if (!value || !wrapper) return;
    value.textContent = qty;
    wrapper.classList.toggle("is-empty", qty === 0);
    const showMax = qty >= MAX_QTY;
    if (note) note.style.display = showMax ? "block" : "none";
    if (info) info.style.display = showMax ? "block" : "none";
    if (addBtn) addBtn.disabled = showMax;
};

const updateCartV2 = () => {
    const container = document.getElementById("v2-cart");
    if (cartV2.size === 0) {
        container.innerHTML = `<div class="checkout-empty">Agregá productos para ver el resumen.</div>`;
    } else {
        container.innerHTML = "";
        cartV2.forEach((item) => {
            const isPromo = (item.category || "").toLowerCase().includes("promo");
            const row = document.createElement("div");
            row.className = `checkout-item${isPromo ? " item-promo" : ""}`;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "checkout-item-remove";
            btn.dataset.id = item.id;
            if (item.qty > 1) {
                btn.setAttribute("aria-label", "Quitar una unidad");
                btn.title = "Quitar una unidad";
                btn.innerHTML = "<i class=\"fa-solid fa-circle-minus\"></i>";
            } else {
                btn.setAttribute("aria-label", "Quitar del pedido");
                btn.title = "Quitar del pedido";
                btn.innerHTML = "<i class=\"fa-solid fa-circle-xmark\"></i>";
            }
            const labelSpan = document.createElement("span");
            labelSpan.className = "checkout-item-label";
            labelSpan.textContent = `${item.qty}x ${isPromo ? "[PROMO] " : ""}${item.name}`;
            const strong = document.createElement("strong");
            strong.className = "checkout-item-price";
            strong.textContent = formatV2(item.qty * item.price);
            row.appendChild(btn);
            row.appendChild(labelSpan);
            row.appendChild(strong);
            container.appendChild(row);
        });
    }

    const subtotal = Array.from(cartV2.values()).reduce((acc, item) => acc + item.qty * item.price, 0);
    const envio = subtotal > 0 && subtotal < freeFromV2 ? deliveryV2 : 0;
    const total = subtotal + envio;

    document.getElementById("v2-subtotal").textContent = formatV2(subtotal);
    const envioEl = document.getElementById("v2-envio");
    const envioRow = document.getElementById("menu-envio-row");
    const isGratis = subtotal > 0 && envio === 0;
    if (envioEl) {
        envioEl.textContent = subtotal === 0 ? "$ 0" : (isGratis ? "¡GRATIS!" : formatV2(envio));
    }
    if (envioRow) {
        envioRow.classList.toggle("envio-gratis", isGratis);
    }
    const leyendaEl = document.getElementById("menu-envio-leyenda");
    if (leyendaEl) {
        if (subtotal > 0 && subtotal < freeFromV2) {
            const faltante = freeFromV2 - subtotal;
            leyendaEl.innerHTML = `Si sumás productos por ${formatV2(faltante)} o más de ese valor. El envío es <strong>GRATIS</strong>.`;
            leyendaEl.style.display = "block";
        } else {
            leyendaEl.style.display = "none";
        }
    }
    document.getElementById("v2-total").textContent = formatV2(total);

    try {
        const items = Array.from(cartV2.values()).map((item) => ({
            id: item.baseId || item.id,
            cartKey: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.qty * item.price,
            category: item.category || "",
            options: item.options || []
        }));
        const subtotalVal = items.reduce((acc, item) => acc + item.subtotal, 0);
        const deliveryVal = subtotalVal > 0 && subtotalVal < freeFromV2 ? deliveryV2 : 0;
        sessionStorage.setItem("toro_pedido", JSON.stringify({
            createdAt: new Date().toISOString(),
            items,
            subtotal: subtotalVal,
            delivery: deliveryVal,
            total: subtotalVal + deliveryVal
        }));
    } catch (e) {}
};

const findItemById = (id) => {
    for (const section of window.menuData || []) {
        const item = section.items.find((entry) => entry.id === id);
        if (item) return { item, category: section.category };
    }
    return null;
};

const MAX_QTY = Number(window.APP_CONFIG?.maxProductos) || 10;

const getOptionsSignature = (options) => {
    if (!options || options.length === 0) return "";
    const copy = options.slice().sort((a, b) => (a.grupo + a.opcion).localeCompare(b.grupo + b.opcion));
    return JSON.stringify(copy);
};

const addItemV2 = (id) => {
    const result = findItemById(id);
    if (!result || result.item.available === false) return;
    const { item, category } = result;
    const current = cartV2.get(id) || { ...item, category, qty: 0 };
    if (current.qty >= MAX_QTY) return;
    current.qty += 1;
    cartV2.set(id, current);
    updateQtyUI(id, current.qty);
    updateCartV2();
};

/** Agrega al carrito un producto con opciones (desde la página producto). */
const addItemWithOptionsV2 = (baseId, qty, options) => {
    const result = findItemById(baseId);
    if (!result || result.item.available === false) return;
    const { item, category } = result;
    const sig = getOptionsSignature(options);
    const cartKey = sig ? baseId + "|" + sig : baseId;
    const recargoTotal = (options || []).reduce((s, o) => s + (Number(o.recargo) || 0), 0);
    const unitPrice = (Number(item.price) || 0) + recargoTotal;
    const optionsLabel = (options || []).map((o) => o.opcion).join(", ");
    const nameToShow = optionsLabel ? item.name + " (" + optionsLabel + ")" : item.name;
    let current = cartV2.get(cartKey);
    if (!current) {
        current = {
            ...item,
            id: cartKey,
            baseId: baseId,
            name: nameToShow,
            price: unitPrice,
            qty: 0,
            category,
            options: options || []
        };
    }
    const addQty = Math.min(MAX_QTY - current.qty, Math.max(1, qty || 1));
    if (addQty <= 0) return;
    current.qty += addQty;
    cartV2.set(cartKey, current);
    updateQtyUI(baseId, (cartV2.get(baseId) || {}).qty || 0);
    updateCartV2();
};

const removeItemV2 = (id) => {
    const current = cartV2.get(id);
    if (!current) return;
    current.qty -= 1;
    if (current.qty <= 0) {
        cartV2.delete(id);
        updateQtyUI(id, 0);
    } else {
        cartV2.set(id, current);
        updateQtyUI(id, current.qty);
    }
    updateCartV2();
};

const removeItemLineV2 = (id) => {
    if (!cartV2.has(id)) return;
    cartV2.delete(id);
    updateQtyUI(id, 0);
    updateCartV2();
};

const initCategoriesV2 = () => {
    if (categoriesObserver) {
        categoriesObserver.disconnect();
        categoriesObserver = null;
    }
    if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
        scrollHandler = null;
    }

    const buttons = document.querySelectorAll("#category-tabs .tab");
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    const sections = Array.from(document.querySelectorAll("#menu-sections .menu-section"));
    const setActiveTab = (activeId) => {
        if (!activeId) return;
        buttons.forEach((btn) => {
            const isActive = btn.dataset.target === activeId;
            btn.classList.toggle("active", isActive);
            btn.classList.toggle("active-promo", isActive && btn.dataset.promo === "true");
        });
    };

    if ("IntersectionObserver" in window) {
        categoriesObserver = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (visible.length) setActiveTab(visible[0].target.id);
        }, { rootMargin: "-140px 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
        sections.forEach((section) => categoriesObserver.observe(section));
    } else {
        let ticking = false;
        scrollHandler = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const top = window.scrollY + 140;
                let activeId = sections[0]?.id;
                sections.forEach((section) => {
                    if (section.offsetTop <= top) activeId = section.id;
                });
                setActiveTab(activeId);
                ticking = false;
            });
        };
        window.addEventListener("scroll", scrollHandler, { passive: true });
        scrollHandler();
    }
};

const APPLY_ADD_KEY = "toro_add_product_id";
const APPLY_ADD_QTY_KEY = "toro_add_product_qty";
const PRODUCTO_DETALLE_KEY = "toro_producto_detalle";

const APPLY_OPTIONS_KEY = "toro_add_product_options";

/** Aplica el agregado desde la página producto (id + cantidad + opciones). Llamar al cargar el menú. */
const applyPendingAddFromProduct = () => {
    try {
        const addId = sessionStorage.getItem(APPLY_ADD_KEY);
        if (!addId) return;
        sessionStorage.removeItem(APPLY_ADD_KEY);
        const qtyRaw = sessionStorage.getItem(APPLY_ADD_QTY_KEY);
        sessionStorage.removeItem(APPLY_ADD_QTY_KEY);
        let options = [];
        try {
            const optRaw = sessionStorage.getItem(APPLY_OPTIONS_KEY);
            if (optRaw) {
                options = JSON.parse(optRaw);
                sessionStorage.removeItem(APPLY_OPTIONS_KEY);
            }
        } catch (e) {}
        const qty = Math.min(MAX_QTY, Math.max(1, parseInt(qtyRaw || "1", 10) || 1));
        const res = findItemById(addId);
        if (res && res.item.available !== false) {
            if (options && options.length > 0) {
                addItemWithOptionsV2(addId, qty, options);
            } else {
                for (let i = 0; i < qty; i++) addItemV2(addId);
            }
        }
    } catch (e) {}
};

const initActionsV2 = () => {
    document.addEventListener("click", (event) => {
        const linkDetalle = event.target.closest(".producto-ver-detalle");
        if (linkDetalle) {
            event.preventDefault();
            const id = linkDetalle.dataset.id ? decodeURIComponent(linkDetalle.dataset.id) : "";
            const result = id ? findItemById(id) : null;
            if (result) {
                const item = result.item;
                const payload = {
                    item: {
                        id: item.id,
                        name: item.name,
                        desc: item.desc || "",
                        price: item.price,
                        img: item.img || "",
                        available: item.available,
                        subItems: item.subItems || [],
                        category: result.category,
                        priceRegular: item.priceRegular,
                        mostrarDescuento: item.mostrarDescuento,
                        porcentajeDescuento: item.porcentajeDescuento,
                        esDestacado: item.esDestacado,
                        opciones: item.opciones || []
                    },
                    category: result.category,
                    returnMenu: window.MENU_RETURN || "simple"
                };
                try { sessionStorage.setItem(PRODUCTO_DETALLE_KEY, JSON.stringify(payload)); } catch (e) {}
            }
            window.location.href = linkDetalle.href || "../../producto/producto.html?id=" + encodeURIComponent(id);
            return;
        }
        const button = event.target.closest(".qty-btn");
        if (button?.dataset.action === "add") addItemV2(button.dataset.id);
        if (button?.dataset.action === "remove") removeItemV2(button.dataset.id);
        const btnRemove = event.target.closest(".checkout-item-remove");
        if (btnRemove?.dataset.id) {
            const id = btnRemove.dataset.id;
            const current = cartV2.get(id);
            if (current && current.qty > 1) removeItemV2(id);
            else removeItemLineV2(id);
        }
    });

    const confirm = document.getElementById("v2-confirm");
    confirm?.addEventListener("click", () => {
        if (cartV2.size === 0) {
            alert("Selecciona productos antes de realizar el pedido.");
            return;
        }
        const items = Array.from(cartV2.values()).map((item) => ({
            id: item.baseId || item.id,
            cartKey: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.qty * item.price,
            category: item.category || "",
            options: item.options || []
        }));
        const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
        const delivery = subtotal > 0 && subtotal < freeFromV2 ? deliveryV2 : 0;
        const total = subtotal + delivery;
        const payload = { createdAt: new Date().toISOString(), items, subtotal, delivery, total };
        const encoded = encodeURIComponent(JSON.stringify(payload));
        try { sessionStorage.setItem("toro_pedido", JSON.stringify(payload)); } catch (error) { console.warn(error); }
        const reservaParam = window.__menuPuedeReservar ? "&reserva=1" : "";
        window.location.href = `../../pedidos/pedidos.html?pedido=${encoded}${reservaParam}`;
    });
};

/** Muestra u oculta el modo reserva en el botón y la alerta del resumen. estado: { puedeReservar, textoHastaApertura } */
const applyReservaUI = (estado) => {
    const reserva = estado && estado.puedeReservar === true;
    const btn = document.getElementById("v2-confirm");
    const note = document.querySelector(".checkout-note");
    let alertaReserva = document.getElementById("menu-resumen-alerta-reserva");
    if (reserva && btn) {
        btn.innerHTML = "<i class=\"fa-solid fa-calendar-check\"></i> Realizar reserva";
        btn.classList.add("checkout-btn-reserva");
        const tiempoLine = estado.textoHastaApertura
            ? "<p class=\"menu-resumen-alerta-reserva-tiempo\">" + estado.textoHastaApertura + "</p>"
            : "";
        const content = "<div class=\"menu-resumen-alerta-reserva-content\"><div class=\"menu-resumen-alerta-reserva-titulo\"><i class=\"fa-solid fa-calendar-check\"></i> Podés realizar una <strong>RESERVA</strong></div><p class=\"menu-resumen-alerta-reserva-leyenda\">La reserva del pedido será tomada al momento de la apertura del local.</p>" + tiempoLine + "</div>";
        if (!alertaReserva) {
            alertaReserva = document.createElement("div");
            alertaReserva.id = "menu-resumen-alerta-reserva";
            alertaReserva.className = "menu-resumen-alerta-reserva";
            alertaReserva.innerHTML = content;
            if (note && note.parentNode) note.parentNode.insertBefore(alertaReserva, note);
            else btn.parentNode.appendChild(alertaReserva);
        } else {
            alertaReserva.innerHTML = content;
        }
        alertaReserva.style.display = "";
    } else if (btn) {
        btn.innerHTML = "<i class=\"fa-solid fa-circle-check\"></i> Realizar pedido";
        btn.classList.remove("checkout-btn-reserva");
        if (alertaReserva) alertaReserva.style.display = "none";
    }
};

const loadHeaderV2 = async () => {
    const container = document.getElementById("menu-v2-header");
    if (!container) return;
    try {
        const response = await fetch("../menu-header/menu-header.html");
        if (!response.ok) return;
        container.innerHTML = await response.text();
    } catch (error) { console.error(error); }
};

const loadPromoV2 = async () => {
    const container = document.getElementById("menu-v2-promo");
    if (!container) return;
    try {
        const response = await fetch("../menu-promo-destacada/menu-promo-destacada.html");
        if (!response.ok) return;
        container.innerHTML = await response.text();
    } catch (error) { console.error(error); }
};

const loadResumenV2 = async () => {
    const container = document.getElementById("menu-checkout-wrap");
    if (!container) return;
    try {
        const response = await fetch("../menu-resumen/menu-resumen.html");
        if (!response.ok) return;
        container.innerHTML = await response.text();
        initHorarioAlertaMenu();
    } catch (error) { console.error(error); }
};

/** Minutos desde config para activar la cuenta regresiva (por defecto 10). */
const getMinutosCuentaRegresiva = () => Math.max(0, Number(window.APP_CONFIG?.minutosCuentaRegresiva) || 10);

/** Rellena las alertas de horario (portada y resumen) con la misma lógica que index: minutos antes de apertura/cierre. */
const initHorarioAlertaMenu = async () => {
    if (typeof window.HorarioAtencion === "undefined") return;
    const result = await window.HorarioAtencion.getHorarioEfectivo();
    const byDay = result.byDay != null ? result.byDay : result;
    const feriadoHoySinAtender = result.feriadoHoySinAtender === true;
    const estado = feriadoHoySinAtender
        ? { abierto: false, tipo: "cerrado", mensaje: "Feriado sin atención", puedeReservar: false }
        : window.HorarioAtencion.getEstadoHorario(byDay);
    const seg = estado.segundosHastaCierre != null ? estado.segundosHastaCierre : 0;
    const umbralSeg = getMinutosCuentaRegresiva() * 60;
    const mostrarCountdown = estado.tipo === "abierto-pronto-cierre" && seg > 0 && seg <= umbralSeg;
    const endMs = mostrarCountdown ? Date.now() + seg * 1000 : 0;

    const cardResumen = document.getElementById("resumen-pedido");
    const esCerrado = feriadoHoySinAtender || estado.tipo === "cerrado" || estado.tipo === "cerrado-abre-en";
    const esReserva = !feriadoHoySinAtender && estado.puedeReservar === true;
    if (cardResumen) {
        let leyendaCerrado = document.getElementById("menu-resumen-cerrado-leyenda");
        if (esCerrado && !esReserva) {
            const partes = feriadoHoySinAtender
                ? ["El local está cerrado. Hoy no se atiende por feriado."]
                : ["El local está cerrado."];
            if (!feriadoHoySinAtender && estado.diaAperturaLabel && estado.horaApertura) {
                partes.push(" Abre " + estado.diaAperturaLabel + " a las " + estado.horaApertura + ".");
            }
            if (!feriadoHoySinAtender && estado.textoHastaApertura) {
                partes.push(" " + estado.textoHastaApertura + ".");
            }
            const textoLeyenda = partes.join("");
            if (!leyendaCerrado) {
                leyendaCerrado = document.createElement("div");
                leyendaCerrado.id = "menu-resumen-cerrado-leyenda";
                leyendaCerrado.className = "menu-resumen-cerrado-leyenda";
                const icon = document.createElement("i");
                icon.className = "fa-solid fa-store-slash";
                icon.setAttribute("aria-hidden", "true");
                leyendaCerrado.appendChild(icon);
                leyendaCerrado.appendChild(document.createTextNode(textoLeyenda));
                cardResumen.insertBefore(leyendaCerrado, cardResumen.firstChild);
            } else {
                const textNode = Array.from(leyendaCerrado.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
                if (textNode) textNode.textContent = textoLeyenda;
            }
            leyendaCerrado.style.display = "";
            cardResumen.classList.add("checkout-card--cerrado");
        } else {
            if (leyendaCerrado) leyendaCerrado.style.display = "none";
            cardResumen.classList.remove("checkout-card--cerrado");
        }
    }

    const renderAlerta = (containerId) => {
        const wrap = document.getElementById(containerId);
        if (!wrap) return;
        const tipo = estado.tipo;
        if (tipo === "cerrado" || tipo === "cerrado-abre-en") {
            wrap.innerHTML = "";
            wrap.style.display = "none";
            return;
        }
        if (tipo === "abierto" && containerId === "menu-horario-alerta-resumen") {
            wrap.innerHTML = "";
            wrap.style.display = "none";
            return;
        }
        let html = "";
        if (tipo === "abierto") {
            html = `<div class="menu-horario-alerta menu-horario-abierto"><i class="fa-solid fa-store"></i><span class="menu-horario-badge">Local ABIERTO</span></div>`;
        } else if (tipo === "abierto-pronto-cierre") {
            if (mostrarCountdown) {
                const initial = window.HorarioAtencion.formatCountdown(seg);
                html = `<div class="menu-horario-alerta menu-horario-pronto-cierre"><i class="fa-solid fa-exclamation-triangle"></i><span class="menu-horario-countdown-label">Pedí antes del cierre</span><span class="menu-horario-countdown" data-end-ms="${endMs}">${initial}</span><span class="menu-horario-badge menu-horario-badge-amber">Local ABIERTO</span></div>`;
            } else {
                html = `<div class="menu-horario-alerta menu-horario-pronto-cierre"><i class="fa-solid fa-exclamation-triangle"></i><span>${estado.mensaje}</span><span class="menu-horario-badge menu-horario-badge-amber">Local ABIERTO</span></div>`;
            }
        }
        wrap.innerHTML = html;
        wrap.style.display = "";
    };
    renderAlerta("menu-horario-alerta-portada");
    renderAlerta("menu-horario-alerta-resumen");

    window.__menuPuedeReservar = estado.puedeReservar === true;
    applyReservaUI(estado);

    let floatingCerradoEl = document.getElementById("menu-floating-cerrado");
    if (floatingCerradoEl) floatingCerradoEl.remove();
    const mostrarBadgeCerrado = window.APP_CONFIG?.mostrarBadgeFlotanteCerrado !== false;
    const mostrarBadgeReserva = window.APP_CONFIG?.mostrarBadgeFlotanteReserva !== false;
    const mostrarBadge = esCerrado && (esReserva ? mostrarBadgeReserva : mostrarBadgeCerrado);
    if (mostrarBadge) {
        const textoCerrado = esReserva
            ? "Se encuentra habilitado para hacer un pedido"
            : "Cerrado por el momento";
        floatingCerradoEl = document.createElement("div");
        floatingCerradoEl.id = "menu-floating-cerrado";
        const claseAbajo = !esReserva ? " floating-cerrado-abajo" : "";
        floatingCerradoEl.className = "floating-cerrado" + (esReserva ? " floating-cerrado-reserva" : "") + claseAbajo;
        const icono = esReserva ? "fa-calendar-check" : "fa-store";
        floatingCerradoEl.innerHTML = `<div class="floating-cerrado-line1"><i class="fa-solid ${icono}"></i><span class="floating-cerrado-badge">Local CERRADO</span></div><span class="floating-cerrado-texto">${textoCerrado}</span>`;
        document.body.appendChild(floatingCerradoEl);
    }

    const floatingCheckoutEl = document.querySelector(".floating-checkout");
    if (floatingCheckoutEl) {
        floatingCheckoutEl.style.display = (esCerrado && !esReserva) ? "none" : "";
    }

    let floatingCountdownEl = document.getElementById("menu-floating-countdown");
    if (floatingCountdownEl) floatingCountdownEl.remove();
    if (mostrarCountdown) {
        const initial = window.HorarioAtencion.formatCountdown(seg);
        floatingCountdownEl = document.createElement("div");
        floatingCountdownEl.id = "menu-floating-countdown";
        floatingCountdownEl.className = "floating-countdown";
        floatingCountdownEl.innerHTML = `<i class="fa-solid fa-clock"></i><span class="floating-countdown-time menu-horario-countdown" data-end-ms="${endMs}">${initial}</span>`;
        document.body.appendChild(floatingCountdownEl);

        if (window._menuHorarioCountdownInterval) clearInterval(window._menuHorarioCountdownInterval);
        window._menuHorarioCountdownInterval = setInterval(() => {
            const els = document.querySelectorAll(".menu-horario-countdown[data-end-ms]");
            if (!els.length) return;
            let anyActive = false;
            els.forEach((el) => {
                const endMsVal = Number(el.getAttribute("data-end-ms"));
                const rest = (endMsVal - Date.now()) / 1000;
                if (rest <= 0) {
                    el.textContent = "00:00";
                    el.removeAttribute("data-end-ms");
                    const fl = document.getElementById("menu-floating-countdown");
                    if (fl) fl.remove();
                } else {
                    anyActive = true;
                    el.textContent = window.HorarioAtencion.formatCountdown(rest);
                }
            });
            if (!anyActive && window._menuHorarioCountdownInterval) {
                clearInterval(window._menuHorarioCountdownInterval);
                window._menuHorarioCountdownInterval = null;
            }
        }, 1000);
    }
};

const bindHeaderActions = () => {
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) {
        backBtn.addEventListener("click", (event) => {
            event.preventDefault();
            window.location.href = "../../../index.html";
        });
    }
};

const loadFooter = async () => {
    const container = document.getElementById("site-footer");
    if (!container) return;
    try {
        const response = await fetch("../../footer/footer.html");
        if (!response.ok) return;
        container.innerHTML = await response.text();
        window.applyFooterConfig?.();
    } catch (error) { console.error(error); }
};

const restoreCartFromStorage = () => {
    try {
        const stored = sessionStorage.getItem("toro_pedido");
        if (!stored) return;
        const payload = JSON.parse(stored);
        if (!payload || !Array.isArray(payload.items)) return;
        payload.items.forEach((entry) => {
            const baseId = entry.baseId || entry.id;
            const result = findItemById(baseId);
            if (!result || result.item.available === false) return;
            const qty = Math.min(Number(entry.qty) || 0, MAX_QTY);
            if (qty <= 0) return;
            const cartKey = entry.cartKey || entry.id;
            const cartEntry = entry.options && entry.options.length > 0
                ? { ...result.item, id: cartKey, baseId: baseId, name: entry.name, price: entry.price, qty, category: entry.category || result.category, options: entry.options }
                : { ...result.item, id: cartKey, category: result.category, qty };
            cartV2.set(cartKey, cartEntry);
            if (cartKey === baseId) updateQtyUI(baseId, qty);
        });
    } catch (error) { console.warn(error); }
};
