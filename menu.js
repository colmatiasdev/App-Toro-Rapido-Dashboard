const URL_CSV = window.APP_CONFIG?.googleSheetUrl || "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTNEWKO90itVxMNkeLNQn3wfoScs6t4mGHh9DKJz4fMsdCf4xOj72cSSJfkTKopOuIEfqJawOjbB8X/pub?gid=1924165913&single=true&output=csv";
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/160x120?text=Toro";

const sampleMenuData = [
    {
        category: "populares",
        items: [
            { id: "v2-pop-1", name: "Triple cheese", desc: "Triple medallón, cheddar y salsa.", price: 9200, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=320&q=80", available: false },
            { id: "v2-pop-2", name: "Combo crispy", desc: "Burger crispy + papas + bebida.", price: 11800, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=320&q=80" },
            { id: "v2-pop-3", name: "Papas cheddar", desc: "Papas con cheddar y verdeo.", price: 5200, img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=320&q=80" }
        ]
    },
    {
        category: "burgers",
        items: [
            { id: "v2-bur-1", name: "Burger clásica", desc: "Carne, queso y pan brioche.", price: 6900, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=320&q=80" },
            { id: "v2-bur-2", name: "Burger BBQ", desc: "Cebolla caramelizada y BBQ.", price: 7600, img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=320&q=80", available: false },
            { id: "v2-bur-3", name: "Burger veggie", desc: "Medallón veggie y alioli.", price: 6400, img: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=320&q=80" }
        ]
    },
    {
        category: "papas",
        items: [
            { id: "v2-pap-1", name: "Papas clásicas", desc: "Porción individual.", price: 2800, img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=320&q=80" },
            { id: "v2-pap-2", name: "Papas con cheddar", desc: "Cheddar y panceta.", price: 4800, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=320&q=80" }
        ]
    },
    {
        category: "bebidas",
        items: [
            { id: "v2-beb-1", name: "Gaseosa 500ml", desc: "Coca-Cola, Sprite o Fanta.", price: 1800, img: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=320&q=80" },
            { id: "v2-beb-2", name: "Limonada", desc: "Natural y refrescante.", price: 2200, img: "https://images.unsplash.com/photo-1464306076886-da185f6a7c37?auto=format&fit=crop&w=320&q=80" }
        ]
    },
    {
        category: "postres",
        items: [
            { id: "v2-pos-1", name: "Cheesecake", desc: "Con frutos rojos.", price: 3900, img: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=320&q=80" },
            { id: "v2-pos-2", name: "Brownie", desc: "Con helado de vainilla.", price: 4200, img: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=320&q=80" }
        ]
    }
];

const cartV2 = new Map();
const deliveryV2 = 1500;
const freeFromV2 = 25000;

const formatV2 = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;
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

const mapCsvToMenu = (csvText) => {
    const rows = parseCsv(csvText);
    if (rows.length < 2) return null;

    const headers = rows.shift().map((header) => normalizeKey(header));
    const findIndex = (candidates) => headers.findIndex((header) => candidates.includes(header));

    const idxCategory = findIndex(["categoria", "categorias", "category", "cat", "rubro", "tipo"]);
    const idxName = findIndex(["producto", "nombre", "product", "name", "titulo", "item"]);
    const idxDesc = findIndex(["descripcion", "desc", "detalle", "detalleproducto", "descripcionproducto"]);
    const idxPrice = findIndex(["precio", "price", "valor", "importe", "costo"]);
    const idxImg = findIndex(["imagen", "img", "image", "foto", "url", "urlimagen", "imagenurl"]);
    const idxAgotado = findIndex(["productoagotado", "agotado"]);
    const idxStock = findIndex(["stock"]);
    const idxId = findIndex(["idproducto", "idprod", "id", "codigo", "sku"]);
    const idxOrder = findIndex(["orden", "order", "posicion", "position"]);

    if (idxCategory === -1 || idxName === -1 || idxPrice === -1) {
        console.warn("Faltan columnas requeridas en el CSV: categoria, nombre y precio.");
        return null;
    }

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

        if (!grouped.has(category)) grouped.set(category, []);
        grouped.get(category).push({
            id,
            name,
            desc,
            price,
            img: img || PLACEHOLDER_IMAGE,
            available,
            order
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

const renderMenu = (menuData) => {
    const tabsContainer = document.getElementById("category-tabs");
    const sectionsContainer = document.getElementById("menu-sections");
    if (!tabsContainer || !sectionsContainer) return;

    tabsContainer.innerHTML = "";
    sectionsContainer.innerHTML = "";

    menuData.forEach((section, index) => {
        const isPromo = section.category.toLowerCase().includes("promo");
        const sectionId = `cat-${slugify(section.category)}`;
        const tab = document.createElement("button");
        tab.className = `tab${isPromo ? " tab-promo" : ""}${index === 0 ? " active" : ""}`;
        tab.dataset.target = sectionId;
        tab.dataset.promo = isPromo ? "true" : "false";
        tab.textContent = section.category;
        tabsContainer.appendChild(tab);

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
        sectionsContainer.appendChild(sectionEl);

        const list = sectionEl.querySelector(".items-list");
        list.innerHTML = section.items.map((item) => `
            <article class="item ${item.available === false ? "is-out" : ""}">
                <img src="${item.img || PLACEHOLDER_IMAGE}" alt="${item.name}">
                ${item.available === false ? `<span class="out-badge">AGOTADO</span>` : ""}
                <div>
                    <h3>${item.name}</h3>
                    <p>${item.desc}</p>
                    <div class="item-price">${formatV2(item.price)}</div>
                </div>
                <div class="item-action">
                    ${
                        item.available === false
                            ? `<div class="qty-controls disabled">Producto no disponible</div>`
                            : `<div class="qty-controls is-empty" data-qty-wrapper="${item.id}">
                                <button class="qty-btn" data-action="remove" data-id="${item.id}">QUITAR</button>
                                <div id="qty-${item.id}" class="qty-value">0</div>
                                <button class="qty-btn" data-action="add" data-id="${item.id}">AGREGAR</button>
                            </div>`
                    }
                    <div class="qty-max-note" id="qty-note-${item.id}">Máximo 10 unidades</div>
                </div>
            </article>
            <div class="item-max-info" id="qty-info-${item.id}">
                <b>¿Necesitás más de 10 unidades?</b> Seleccioná el máximo y avisamos por WhatsApp al confirmar. ¡Nosotros lo modificamos!
            </div>
        `).join("");
    });
};

const updateQtyUI = (id, qty) => {
    const value = document.getElementById(`qty-${id}`);
    const wrapper = document.querySelector(`[data-qty-wrapper="${id}"]`);
    const note = document.getElementById(`qty-note-${id}`);
    const info = document.getElementById(`qty-info-${id}`);
    if (!value || !wrapper) return;
    value.textContent = qty;
    wrapper.classList.toggle("is-empty", qty === 0);
    const showMax = qty >= MAX_QTY;
    if (note) note.style.display = showMax ? "block" : "none";
    if (info) info.style.display = showMax ? "block" : "none";
};

const updateCartV2 = () => {
    const container = document.getElementById("v2-cart");
    if (cartV2.size === 0) {
        container.innerHTML = `<div class="checkout-empty">Agregá productos para ver el resumen.</div>`;
    } else {
        container.innerHTML = "";
        cartV2.forEach((item) => {
            const row = document.createElement("div");
            row.className = "checkout-item";
            row.innerHTML = `<span>${item.qty}x ${item.name}</span><strong>${formatV2(item.qty * item.price)}</strong>`;
            container.appendChild(row);
        });
    }

    const subtotal = Array.from(cartV2.values()).reduce((acc, item) => acc + item.qty * item.price, 0);
    const envio = subtotal > 0 && subtotal < freeFromV2 ? deliveryV2 : 0;
    const total = subtotal + envio;

    document.getElementById("v2-subtotal").textContent = formatV2(subtotal);
    document.getElementById("v2-envio").textContent = subtotal === 0 ? "$ 0" : (envio === 0 ? "¡Gratis!" : formatV2(envio));
    document.getElementById("v2-total").textContent = formatV2(total);
};

const findItemById = (id) => {
    for (const section of window.menuData || []) {
        const item = section.items.find((entry) => entry.id === id);
        if (item) return { item, category: section.category };
    }
    return null;
};

const MAX_QTY = Number(window.APP_CONFIG?.maxProductos) || 10;

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

const initCategoriesV2 = () => {
    const buttons = document.querySelectorAll("#category-tabs .tab");
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    const sections = Array.from(document.querySelectorAll("#menu-sections .menu-section"));
    const onScroll = () => {
        const top = window.scrollY + 140;
        let activeId = sections[0]?.id;
        sections.forEach((section) => {
            if (section.offsetTop <= top) activeId = section.id;
        });
        buttons.forEach((btn) => {
            const isActive = btn.dataset.target === activeId;
            btn.classList.toggle("active", isActive);
            btn.classList.toggle("active-promo", isActive && btn.dataset.promo === "true");
        });
    };
    window.addEventListener("scroll", () => requestAnimationFrame(onScroll));
    onScroll();
};

const initActionsV2 = () => {
    document.addEventListener("click", (event) => {
        const button = event.target.closest(".qty-btn");
        if (button?.dataset.action === "add") addItemV2(button.dataset.id);
        if (button?.dataset.action === "remove") removeItemV2(button.dataset.id);
    });

    const confirm = document.getElementById("v2-confirm");
    confirm?.addEventListener("click", () => {
        if (cartV2.size === 0) {
            alert("Selecciona productos antes de realizar el pedido.");
            return;
        }

        const items = Array.from(cartV2.values()).map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.qty * item.price,
            category: item.category || ""
        }));
        const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
        const delivery = subtotal > 0 && subtotal < freeFromV2 ? deliveryV2 : 0;
        const total = subtotal + delivery;
        const payload = {
            createdAt: new Date().toISOString(),
            items,
            subtotal,
            delivery,
            total
        };

        const encoded = encodeURIComponent(JSON.stringify(payload));
        try {
            sessionStorage.setItem("toro_pedido", JSON.stringify(payload));
        } catch (error) {
            console.warn(error);
        }
        window.location.href = `pedidos.html?pedido=${encoded}`;
    });
};

const loadHeaderV2 = async () => {
    const container = document.getElementById("menu-v2-header");
    if (!container) return;
    try {
        const response = await fetch("menu-header.html");
        if (!response.ok) return;
        container.innerHTML = await response.text();
    } catch (error) {
        console.error(error);
    }
};

const loadPromoV2 = async () => {
    const container = document.getElementById("menu-v2-promo");
    if (!container) return;
    try {
        const response = await fetch("menu-promo.html");
        if (!response.ok) return;
        container.innerHTML = await response.text();
    } catch (error) {
        console.error(error);
    }
};

const loadFooter = async () => {
    const container = document.getElementById("site-footer");
    if (!container) return;
    try {
        const response = await fetch("footer.html");
        if (!response.ok) return;
        container.innerHTML = await response.text();
    } catch (error) {
        console.error(error);
    }
};

const loadMenuData = async () => {
    let usedFallback = false;
    try {
        const response = await fetch(URL_CSV);
        if (!response.ok) throw new Error("No se pudo cargar el CSV.");
        const csvText = await response.text();
        const mapped = mapCsvToMenu(csvText);
        if (mapped && mapped.length) {
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

const initMenu = async () => {
    const loadingEl = document.getElementById("menu-loading");
    if (loadingEl) loadingEl.style.display = "block";
    await loadHeaderV2();
    await loadPromoV2();
    const usedFallback = await loadMenuData();
    renderMenu(window.menuData);
    updateCartV2();
    initCategoriesV2();
    initActionsV2();
    if (loadingEl) loadingEl.style.display = "none";
    const errorEl = document.getElementById("menu-error");
    if (errorEl) errorEl.style.display = usedFallback ? "flex" : "none";
    await loadFooter();
};

initMenu();
