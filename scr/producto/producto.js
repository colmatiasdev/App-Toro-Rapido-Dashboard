(function () {
    const PLACEHOLDER_IMAGE = window.APP_CONFIG?.googleSheetUrl || "https://via.placeholder.com/400x300?text=Toro";
    const IMG_FALLBACK = "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#e2e8f0" width="400" height="300"/><rect x="140" y="90" width="120" height="90" rx="6" fill="none" stroke="#94a3b8" stroke-width="2"/><circle cx="200" cy="130" r="14" fill="#94a3b8"/><path d="M140 210l30-40 24 28 36-44 44 54" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="200" y="255" text-anchor="middle" fill="#64748b" font-size="14" font-family="system-ui,sans-serif">Sin imagen</text></svg>'
    );

    const STORAGE_KEY = "toro_producto_detalle";
    const ADD_KEY = "toro_add_product_id";

    const formatPrice = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;

    function getUrlParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function getStoredProduct() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function getReturnUrl(data) {
        const menu = (data && data.returnMenu) || "simple";
        return menu === "compuesto"
            ? "../menu-compuesto/menu-compuesto.html"
            : "../menu-simple/menu-simple.html";
    }

    function showLoading(show) {
        const el = document.getElementById("producto-loading");
        if (el) el.style.display = show ? "block" : "none";
    }

    function showError(show) {
        const el = document.getElementById("producto-error");
        if (el) el.style.display = show ? "flex" : "none";
    }

    function showContent(show) {
        const el = document.getElementById("producto-content");
        if (el) el.style.display = show ? "block" : "none";
    }

    function renderProduct(data) {
        const item = data.item;
        const returnUrl = getReturnUrl(data);

        document.getElementById("producto-name").textContent = item.name || "Producto";
        document.getElementById("producto-desc").textContent = item.desc || "";
        document.getElementById("producto-price").textContent = formatPrice(item.price || 0);

        const img = document.getElementById("producto-image");
        img.src = item.img || PLACEHOLDER_IMAGE;
        img.alt = item.name || "Producto";
        img.onerror = function () {
            this.onerror = null;
            this.classList.add("img-error");
            this.src = IMG_FALLBACK;
        };

        const badge = document.getElementById("producto-badge");
        if (item.available === false) {
            badge.style.display = "block";
        } else {
            badge.style.display = "none";
        }

        const incluyeWrap = document.getElementById("producto-incluye");
        const incluyeList = document.getElementById("producto-incluye-list");
        if (item.subItems && item.subItems.length > 0) {
            incluyeWrap.style.display = "block";
            incluyeList.innerHTML = item.subItems
                .map(
                    (sub) => `
                <li class="${sub.available === false ? "sub-item-out" : ""}">
                    ${sub.quantity > 0 ? `<span class="sub-qty">${sub.quantity}x</span>` : ""}
                    <span>${sub.name}</span>
                    ${sub.available === false ? '<span style="font-size:0.7rem;font-weight:800;color:#b91c1c;margin-left:6px;">AGOTADO</span>' : ""}
                </li>`
                )
                .join("");
        } else {
            incluyeWrap.style.display = "none";
        }

        const volverBtn = document.getElementById("producto-volver");
        const volverMenuBtn = document.getElementById("producto-volver-menu");
        volverBtn.href = returnUrl;
        volverMenuBtn.href = returnUrl;

        const agregarBtn = document.getElementById("producto-agregar");
        if (item.available === false) {
            agregarBtn.classList.add("disabled");
            agregarBtn.style.pointerEvents = "none";
            agregarBtn.href = "#";
            agregarBtn.innerHTML = '<i class="fa-solid fa-ban"></i> No disponible';
        } else {
            agregarBtn.classList.remove("disabled");
            agregarBtn.style.pointerEvents = "";
            agregarBtn.href = returnUrl;
            agregarBtn.innerHTML = '<i class="fa-solid fa-basket-shopping"></i> Agregar al pedido';
            agregarBtn.addEventListener("click", function () {
                sessionStorage.setItem(ADD_KEY, item.id);
            });
        }

        document.title = (item.name || "Producto") + " - Toro Rápido";
    }

    function init() {
        const id = getUrlParam("id");
        const data = getStoredProduct();

        showLoading(true);
        showError(false);
        showContent(false);

        if (!id || !data || data.item.id !== id) {
            showLoading(false);
            showError(true);
            document.getElementById("producto-volver").href = getReturnUrl(null);
            return;
        }

        showLoading(false);
        showContent(true);
        renderProduct(data);
    }

    init();

    try {
        const footer = document.getElementById("site-footer");
        if (footer) {
            fetch("../footer/footer.html")
                .then((r) => (r.ok ? r.text() : ""))
                .then((html) => {
                    if (html) footer.innerHTML = html;
                    if (typeof window.applyFooterConfig === "function") window.applyFooterConfig();
                })
                .catch(() => {});
        }
    } catch (e) {}
})();
