(function () {
    const PLACEHOLDER_IMAGE = window.APP_CONFIG?.googleSheetUrl || "https://via.placeholder.com/400x300?text=Toro";
    const IMG_FALLBACK = "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#e2e8f0" width="400" height="300"/><rect x="140" y="90" width="120" height="90" rx="6" fill="none" stroke="#94a3b8" stroke-width="2"/><circle cx="200" cy="130" r="14" fill="#94a3b8"/><path d="M140 210l30-40 24 28 36-44 44 54" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="200" y="255" text-anchor="middle" fill="#64748b" font-size="14" font-family="system-ui,sans-serif">Sin imagen</text></svg>'
    );

    const STORAGE_KEY = "toro_producto_detalle";
    const ADD_KEY = "toro_add_product_id";
    const ADD_QTY_KEY = "toro_add_product_qty";
    const MAX_QTY = Number(window.APP_CONFIG?.maxProductos) || 10;

    const formatPrice = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;
    const escapeHtml = (s) => {
        if (s == null) return "";
        const div = document.createElement("div");
        div.textContent = s;
        return div.innerHTML;
    };

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
            ? "../menu/menu-compuesto/menu-compuesto.html"
            : "../menu/menu-simple/menu-simple.html";
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
        const category = item.category || data.category || "";

        const categoriaWrap = document.getElementById("producto-categoria-wrap");
        const categoriaEl = document.getElementById("producto-categoria");
        if (categoriaWrap && categoriaEl) {
            if (category) {
                categoriaWrap.style.display = "block";
                categoriaEl.textContent = category;
                categoriaEl.className = "producto-categoria" + (String(category).toLowerCase().includes("promo") ? " producto-categoria--promo" : "");
            } else {
                categoriaWrap.style.display = "none";
            }
        }

        document.getElementById("producto-name").textContent = item.name || "Producto";
        document.getElementById("producto-desc").textContent = item.desc || "";

        const destacadoEl = document.getElementById("producto-destacado");
        if (destacadoEl) destacadoEl.style.display = item.esDestacado ? "flex" : "none";

        const priceActual = Number(item.price) || 0;
        const priceRegular = Number(item.priceRegular) || 0;
        // Columna "Mostar Descuento" de Google Sheet: SI = mostrar, NO = no mostrar
        const mostrarDescuentoRaw = item.mostrarDescuento != null ? String(item.mostrarDescuento).trim().toUpperCase() : "";
        const mostrarDescuento = mostrarDescuentoRaw === "SI" || mostrarDescuentoRaw === "SÍ" || item.mostrarDescuento === true;
        const tieneDescuento = mostrarDescuento && priceRegular > priceActual && priceActual >= 0;
        // Siempre calcular el descuento a partir del precio anterior y actual
        let porcentaje = null;
        if (tieneDescuento && priceRegular > 0) {
            porcentaje = (1 - priceActual / priceRegular) * 100;
        }

        document.getElementById("producto-price").textContent = formatPrice(priceActual);

        const priceWrap = document.getElementById("producto-price-wrap");
        const ofertaHead = document.getElementById("producto-oferta-head");
        const precioLabelText = document.getElementById("producto-precio-label-text");
        const precioRegularRow = document.getElementById("producto-precio-regular-row");
        const precioRegularEl = document.getElementById("producto-price-regular");
        const ahorroLeyenda = document.getElementById("producto-ahorro-leyenda");
        const descuentoBadge = document.getElementById("producto-descuento-badge");
        const descuentoPorcentaje = document.getElementById("producto-descuento-porcentaje");

        const mostrarOferta = tieneDescuento || (mostrarDescuento && porcentaje != null && !isNaN(porcentaje) && porcentaje > 0);
        if (priceWrap) priceWrap.classList.toggle("producto-price-wrap--oferta", mostrarOferta);
        if (ofertaHead) ofertaHead.style.display = mostrarOferta ? "flex" : "none";
        if (precioLabelText) precioLabelText.textContent = mostrarOferta ? "Precio de oferta" : "Precio";

        if (precioRegularRow && precioRegularEl) {
            if (tieneDescuento) {
                precioRegularRow.style.display = "flex";
                precioRegularEl.textContent = formatPrice(priceRegular);
            } else {
                precioRegularRow.style.display = "none";
            }
        }

        if (mostrarDescuento && porcentaje != null && !isNaN(porcentaje) && porcentaje > 0 && descuentoBadge && descuentoPorcentaje) {
            descuentoPorcentaje.textContent = Math.ceil(Number(porcentaje));
            descuentoBadge.style.display = "inline-flex";
        } else if (descuentoBadge) {
            descuentoBadge.style.display = "none";
        }

        const ahorro = tieneDescuento && priceRegular > priceActual ? priceRegular - priceActual : 0;
        if (ahorroLeyenda && tieneDescuento && ahorro > 0) {
            ahorroLeyenda.textContent = "¡Ahorrás " + formatPrice(ahorro) + "! No te lo pierdas.";
            ahorroLeyenda.style.display = "block";
        } else if (ahorroLeyenda) {
            ahorroLeyenda.style.display = "none";
        }

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

        const opcionesWrap = document.getElementById("producto-opciones-wrap");
        const opcionesList = document.getElementById("producto-opciones-list");
        const opcionesData = Array.isArray(item.opciones) ? item.opciones : [];
        let selectedOpciones = [];
        const updateTotalConOpciones = () => {
            const totalRecargo = selectedOpciones.reduce((s, o) => s + (o.recargo || 0), 0);
            const total = priceActual + totalRecargo;
            const el = document.getElementById("producto-total-con-opciones");
            if (el) {
                if (totalRecargo > 0) {
                    el.style.display = "flex";
                    el.querySelector(".producto-total-con-opciones-monto").textContent = formatPrice(total);
                } else {
                    el.style.display = "none";
                }
            }
        };
        const collectSelected = () => {
            selectedOpciones = [];
            opcionesData.forEach((group, gIdx) => {
                if (group.tipo === "uno") {
                    const radio = document.querySelector(`input[name="producto-opcion-g-${gIdx}"]:checked`);
                    if (radio && radio.dataset.opcion && radio.dataset.recargo !== undefined) {
                        selectedOpciones.push({
                            grupo: group.nombre,
                            opcion: radio.dataset.opcion,
                            recargo: Number(radio.dataset.recargo) || 0
                        });
                    }
                } else {
                    document.querySelectorAll(`input[name="producto-opcion-g-${gIdx}"]:checked`).forEach((cb) => {
                        if (cb.dataset.opcion !== undefined)
                            selectedOpciones.push({
                                grupo: group.nombre,
                                opcion: cb.dataset.opcion,
                                recargo: Number(cb.dataset.recargo) || 0
                            });
                    });
                }
            });
            updateTotalConOpciones();
        };
        if (opcionesWrap && opcionesList && opcionesData.length > 0) {
            opcionesWrap.style.display = "block";
            opcionesList.innerHTML = opcionesData
                .map(
                    (group, gIdx) => `
                <div class="producto-opcion-grupo" data-grupo-idx="${gIdx}">
                    <h4 class="producto-opcion-grupo-title">${escapeHtml(group.nombre)}${group.obligatorio ? ' <span class="producto-opcion-obligatorio">(elegir al menos uno)</span>' : ""}</h4>
                    <div class="producto-opcion-opciones">
                        ${group.opciones
                            .map(
                                (opt, oIdx) => {
                                    const inputId = `producto-opcion-${gIdx}-${oIdx}`;
                                    const isRadio = group.tipo === "uno";
                                    const recargoStr = opt.recargo > 0 ? ` + ${formatPrice(opt.recargo)}` : "";
                                    return `
                            <label class="producto-opcion-label">
                                <input type="${isRadio ? "radio" : "checkbox"}" name="producto-opcion-g-${gIdx}" id="${inputId}" value="${escapeHtml(opt.nombre)}" data-opcion="${escapeHtml(opt.nombre)}" data-recargo="${opt.recargo}">
                                <span class="producto-opcion-text">${escapeHtml(opt.nombre)}${recargoStr}</span>
                            </label>`;
                                }
                            )
                            .join("")}
                    </div>
                </div>`
                )
                .join("");
            opcionesList.querySelectorAll("input").forEach((inp) => {
                inp.addEventListener("change", collectSelected);
            });
            collectSelected();
        } else if (opcionesWrap) {
            opcionesWrap.style.display = "none";
        }

        const volverBtn = document.getElementById("producto-volver");
        const volverMenuBtn = document.getElementById("producto-volver-menu");
        volverBtn.href = returnUrl;
        volverMenuBtn.href = returnUrl;

        const cantidadWrap = document.getElementById("producto-cantidad-wrap");
        const cantidadValue = document.getElementById("producto-cantidad-value");
        const btnMenos = document.getElementById("producto-cantidad-menos");
        const btnMas = document.getElementById("producto-cantidad-mas");
        let currentQty = 1;

        const maxInfoEl = document.getElementById("producto-max-info");
        const maxNoteEl = document.getElementById("producto-max-note");
        const maxLeyendaEl = document.getElementById("producto-max-leyenda");

        const updateBtnMenos = () => {
            if (btnMenos) btnMenos.disabled = currentQty <= 1;
        };
        const updateBtnMas = () => {
            if (btnMas) btnMas.disabled = currentQty >= MAX_QTY;
        };
        const updateMaxInfo = () => {
            if (!maxInfoEl) return;
            if (currentQty >= MAX_QTY) {
                maxInfoEl.style.display = "block";
            } else {
                maxInfoEl.style.display = "none";
            }
        };
        if (item.available === false) {
            if (cantidadWrap) cantidadWrap.style.display = "none";
            if (maxInfoEl) maxInfoEl.style.display = "none";
        } else {
            if (cantidadWrap) cantidadWrap.style.display = "flex";
            if (cantidadValue) cantidadValue.textContent = currentQty;
            if (maxNoteEl) maxNoteEl.textContent = "Máximo " + MAX_QTY + " unidades";
            if (maxLeyendaEl) maxLeyendaEl.textContent = "¿Necesitás más de " + MAX_QTY + " unidades? Seleccioná el máximo y avisamos por WhatsApp al confirmar. ¡Nosotros lo modificamos!";
            updateBtnMenos();
            updateBtnMas();
            updateMaxInfo();
            if (btnMenos) {
                btnMenos.onclick = function () {
                    if (currentQty <= 1) return;
                    currentQty -= 1;
                    if (cantidadValue) cantidadValue.textContent = currentQty;
                    updateBtnMenos();
                    updateBtnMas();
                    updateMaxInfo();
                };
            }
            if (btnMas) {
                btnMas.onclick = function () {
                    if (currentQty >= MAX_QTY) return;
                    currentQty += 1;
                    if (cantidadValue) cantidadValue.textContent = currentQty;
                    updateBtnMenos();
                    updateBtnMas();
                    updateMaxInfo();
                };
            }
        }

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
            agregarBtn.addEventListener("click", function (e) {
                e.preventDefault();
                if (opcionesData.length > 0) {
                    collectSelected();
                    const missing = opcionesData.filter(
                        (g) => g.obligatorio && !selectedOpciones.some((s) => s.grupo === g.nombre)
                    );
                    if (missing.length > 0) {
                        alert("Por favor elegí al menos una opción en: " + missing.map((g) => g.nombre).join(", "));
                        return;
                    }
                }
                sessionStorage.setItem(ADD_KEY, item.id);
                sessionStorage.setItem(ADD_QTY_KEY, String(currentQty));
                try {
                    if (selectedOpciones.length > 0) {
                        sessionStorage.setItem("toro_add_product_options", JSON.stringify(selectedOpciones));
                    } else {
                        sessionStorage.removeItem("toro_add_product_options");
                    }
                } catch (err) {}
                window.location.href = returnUrl;
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
