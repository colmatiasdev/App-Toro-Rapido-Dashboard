const TELEFONO_NEGOCIO = window.APP_CONFIG?.telefonoNegocio || "5493814130520";
const URL_APPS_SCRIPT = window.APP_CONFIG?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbzllzUCk1UqUV08XINHmy6Omvcl6JZ8_jRYY8k1WS2N_Kgnyec_mEp9CdVUdhrafC_B/exec";
const COSTO_ENVIO_BASE = Number(window.APP_CONFIG?.costoEnvioBase) || 1500;
const MONTO_MINIMO_ENVIO_GRATIS = Number(window.APP_CONFIG?.montoMinimoEnvioGratis) || 25000;

function formatearMoneda(valor) {
    return `$ ${Number(valor).toLocaleString("es-AR")}`;
}

function leerPedidoMenu() {
    const params = new URLSearchParams(window.location.search);
    let payload = null;
    const raw = params.get("pedido");
    if (raw) {
        try {
            payload = JSON.parse(decodeURIComponent(raw));
        } catch (e) {
            console.error(e);
        }
    }
    if (!payload) {
        try {
            const stored = sessionStorage.getItem("toro_pedido");
            if (stored) payload = JSON.parse(stored);
        } catch (e) {
            console.error(e);
        }
    }
    return payload;
}

async function enviarPedido() {
    const nombre = document.getElementById("cust-name").value.trim();
    const whatsapp = document.getElementById("cust-phone").value.trim();
    const direccion = document.getElementById("cust-address").value.trim();
    if (!nombre || !direccion || !whatsapp) {
        alert("⚠️ Por favor, completa tus datos de entrega.");
        return;
    }

    const payload = leerPedidoMenu();
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
        alert("❌ No encontramos productos del menú. Volvé a seleccionar tu pedido.");
        return;
    }

    const productosParaSheet = payload.items.map((item) => ({
        categoria: item.category || "",
        idproducto: item.id,
        producto: item.name,
        precio: item.price,
        cantidad: item.qty,
        subtotal: item.subtotal
    }));

    const itemsWhatsApp = payload.items.map((item) => {
        const isPromo = (item.category || "").toLowerCase().includes("promo");
        return `* (x${item.qty}) ${isPromo ? "[PROMO] " : ""}${item.name} ${formatearMoneda(item.subtotal)}`;
    }).join("\n");

    const subtotal = payload.subtotal || 0;
    if (subtotal === 0) {
        alert("❌ Selecciona productos antes de enviar.");
        return;
    }

    document.getElementById("overlay-carga").style.display = "flex";
    const costoEnvio = payload.delivery ?? (subtotal >= MONTO_MINIMO_ENVIO_GRATIS ? 0 : COSTO_ENVIO_BASE);
    const ahora = new Date();
    const idPedido = "PED-" + ahora.getTime();

    try {
        await fetch(URL_APPS_SCRIPT, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                idpedido: idPedido,
                fecha: ahora.toLocaleDateString("es-AR"),
                hora: ahora.toLocaleTimeString("es-AR"),
                cliente: nombre,
                whatsapp,
                direccion,
                total: subtotal + costoEnvio,
                productos: productosParaSheet
            })
        });
        sessionStorage.removeItem("toro_pedido");
    } catch (e) {
        console.error(e);
    }

    let msg = `*TORO RÁPIDO - DELIVERY*\n_ID: ${idPedido}_\n\n*Cliente* ${nombre}\n*Domicilio:* ${direccion}\n*WSP:* ${whatsapp}\n\n*Detalle del Pedido*\n${itemsWhatsApp}`;
    msg += `\n\n*SUBTOTAL:* ${formatearMoneda(subtotal)}`;
    msg += `\n*ENVÍO:* ${costoEnvio === 0 ? "¡GRATIS!" : formatearMoneda(costoEnvio)}`;
    msg += `\n*TOTAL:* ${formatearMoneda(subtotal + costoEnvio)}\n\n_Sujeto a confirmación de zona._`;

    document.getElementById("overlay-carga").style.display = "none";
    window.open(`https://wa.me/${TELEFONO_NEGOCIO}?text=${encodeURIComponent(msg)}`, "_blank");
    window.location.href = "../confirmacion/confirmacion.html";
}

function renderResumenMenu() {
    const container = document.getElementById("resumen-menu");
    const list = document.getElementById("resumen-menu-items");
    const subtotalEl = document.getElementById("resumen-menu-subtotal");
    const envioEl = document.getElementById("resumen-menu-envio");
    const totalEl = document.getElementById("resumen-menu-total");
    if (!container || !list || !subtotalEl || !envioEl || !totalEl) return;

    const payload = leerPedidoMenu();
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) return;

    list.innerHTML = payload.items.map((item) => {
        const isPromo = (item.category || "").toLowerCase().includes("promo");
        const label = `${item.qty}x ${item.name}${isPromo ? " [PROMO]" : ""}`;
        return `
            <div class="resumen-menu-item${isPromo ? " item-promo" : ""}">
                <span>${label}</span>
                <strong>${formatearMoneda(item.subtotal)}</strong>
            </div>
        `;
    }).join("");

    subtotalEl.innerText = formatearMoneda(payload.subtotal || 0);
    const envioRow = document.getElementById("resumen-envio-row");
    if ((payload.subtotal || 0) > 0 && (payload.delivery || 0) === 0) {
        envioEl.innerText = "¡GRATIS!";
        if (envioRow) envioRow.classList.add("envio-gratis");
    } else {
        envioEl.innerText = formatearMoneda(payload.delivery || 0);
        if (envioRow) envioRow.classList.remove("envio-gratis");
    }
    totalEl.innerText = formatearMoneda(payload.total || 0);
    container.style.display = "block";
}

async function cargarPie() {
    const container = document.getElementById("site-footer");
    if (!container) return;
    try {
        const response = await fetch("../footer/footer.html");
        if (!response.ok) return;
        container.innerHTML = await response.text();
        window.applyFooterConfig?.();
    } catch (e) {
        console.error(e);
    }
}

async function initPedidos() {
    const menuActivo = window.APP_CONFIG?.menuActivo || "menu-simple";
    const linkModificar = document.getElementById("link-modificar-pedido");
    if (linkModificar) linkModificar.href = `../${menuActivo}/${menuActivo}.html`;
    renderResumenMenu();
    await cargarPie();
}

window.enviarPedido = enviarPedido;
window.onload = initPedidos;
