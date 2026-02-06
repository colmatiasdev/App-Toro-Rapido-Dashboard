const dataV2 = [
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

const renderV2 = () => {
    dataV2.forEach((section) => {
        const container = document.querySelector(`[data-category="${section.category}"]`);
        if (!container) return;
        container.innerHTML = section.items.map((item) => `
            <article class="item ${item.available === false ? "is-out" : ""}">
                <img src="${item.img}" alt="${item.name}">
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
                </div>
            </article>
        `).join("");
    });
};

const updateQtyUI = (id, qty) => {
    const value = document.getElementById(`qty-${id}`);
    const wrapper = document.querySelector(`[data-qty-wrapper="${id}"]`);
    if (!value || !wrapper) return;
    value.textContent = qty;
    wrapper.classList.toggle("is-empty", qty === 0);
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

const addItemV2 = (id) => {
    const item = dataV2.flatMap(section => section.items).find((i) => i.id === id);
    if (!item || item.available === false) return;
    const current = cartV2.get(id) || { ...item, qty: 0 };
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
    const buttons = document.querySelectorAll(".tab");
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    const sections = Array.from(document.querySelectorAll(".menu-section"));
    const onScroll = () => {
        const top = window.scrollY + 140;
        let activeId = sections[0]?.id;
        sections.forEach((section) => {
            if (section.offsetTop <= top) activeId = section.id;
        });
        buttons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.target === activeId);
        });
    };
    window.addEventListener("scroll", () => requestAnimationFrame(onScroll));
    onScroll();
};

const initSearchV2 = () => {
    const search = document.getElementById("search-v2");
    if (!search) return;
    search.addEventListener("input", (event) => {
        const query = event.target.value.toLowerCase();
        document.querySelectorAll(".item").forEach((card) => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? "grid" : "none";
        });
    });
};

const initActionsV2 = () => {
    document.addEventListener("click", (event) => {
        const button = event.target.closest(".qty-btn");
        if (button?.dataset.action === "add") addItemV2(button.dataset.id);
        if (button?.dataset.action === "remove") removeItemV2(button.dataset.id);
    });

    const confirm = document.getElementById("v2-confirm");
    confirm?.addEventListener("click", () => {
        window.location.href = "confirmacion.html";
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

loadHeaderV2();
loadPromoV2();
renderV2();
updateCartV2();
initCategoriesV2();
initSearchV2();
initActionsV2();
