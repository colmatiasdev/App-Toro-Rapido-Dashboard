const TELEFONO_NEGOCIO = window.APP_CONFIG?.telefonoNegocio || "5493814130520";
const URL_APPS_SCRIPT = window.APP_CONFIG?.appsScriptPedidosUrl || "https://script.google.com/macros/s/AKfycbzllzUCk1UqUV08XINHmy6Omvcl6JZ8_jRYY8k1WS2N_Kgnyec_mEp9CdVUdhrafC_B/exec";
const COSTO_ENVIO_BASE = Number(window.APP_CONFIG?.costoEnvioBase) || 1500;
const MONTO_MINIMO_ENVIO_GRATIS = Number(window.APP_CONFIG?.montoMinimoEnvioGratis) || 25000;

const formatearMoneda = typeof window.formatMoneda === "function" ? window.formatMoneda : (v) => `$ ${Number(v).toLocaleString("es-AR")}`;

function leerPedidoMenu() {
    let payload = null;
    try {
        const stored = sessionStorage.getItem("toro_pedido");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
                payload = parsed;
            }
        }
    } catch (e) {
        console.error(e);
    }
    if (!payload) {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get("pedido");
        if (raw) {
            try {
                payload = JSON.parse(decodeURIComponent(raw));
            } catch (e) {
                console.error(e);
            }
        }
    }
    if (payload && Array.isArray(payload.items)) {
        payload.items = payload.items.map((it) => ({
            ...it,
            requiresOptions: it.requiresOptions === true || String(it.requiresOptions).toLowerCase() === "true",
            options: Array.isArray(it.options) ? it.options : (it.options ? [it.options] : [])
        }));
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
    if (tieneItemsSinOpcionesObligatorias(payload)) {
        alert("⚠️ Algunos productos requieren elegir opciones antes de enviar. Usá «Elegir opciones» en cada ítem del resumen.");
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
        return `* ${item.qty}x ${isPromo ? "[PROMO] " : ""}${item.name} ${formatearMoneda(item.subtotal)}`;
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

    const params = new URLSearchParams(window.location.search);
    const esReserva = params.get("reserva") === "1";
    let msg = esReserva
        ? `*TORO RÁPIDO - RESERVA*\n_El pedido será preparado para cuando abramos el local._\n_ID: ${idPedido}_\n\n*Cliente* ${nombre}\n*Domicilio:* ${direccion}\n*WSP:* ${whatsapp}\n\n*Detalle del Pedido*\n${itemsWhatsApp}`
        : `*TORO RÁPIDO - DELIVERY*\n_ID: ${idPedido}_\n\n*Cliente* ${nombre}\n*Domicilio:* ${direccion}\n*WSP:* ${whatsapp}\n\n*Detalle del Pedido*\n${itemsWhatsApp}`;
    msg += `\n\n*SUBTOTAL:* ${formatearMoneda(subtotal)}`;
    msg += `\n*ENVÍO:* ${costoEnvio === 0 ? "¡GRATIS!" : formatearMoneda(costoEnvio)}`;
    msg += `\n*TOTAL:* ${formatearMoneda(subtotal + costoEnvio)}\n\n_Sujeto a confirmación de zona._`;

    document.getElementById("overlay-carga").style.display = "none";
    window.open(`https://wa.me/${TELEFONO_NEGOCIO}?text=${encodeURIComponent(msg)}`, "_blank");
    window.location.href = esReserva ? "../confirmacion/confirmacion.html?reserva=1" : "../confirmacion/confirmacion.html";
}

function tieneItemsSinOpcionesObligatorias(payload) {
    if (!payload || !Array.isArray(payload.items)) return false;
    return payload.items.some((item) => item.requiresOptions === true && (!item.options || item.options.length === 0));
}

function puedeEnviarPedido() {
    const payload = leerPedidoMenu();
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) return false;
    if (tieneItemsSinOpcionesObligatorias(payload)) return false;
    const nombre = document.getElementById("cust-name")?.value?.trim() || "";
    const whatsapp = document.getElementById("cust-phone")?.value?.trim() || "";
    const direccion = document.getElementById("cust-address")?.value?.trim() || "";
    return nombre.length > 0 && whatsapp.length > 0 && direccion.length > 0;
}

function updateBotonEnviar() {
    const btn = document.getElementById("boton-enviar-whatsapp");
    if (btn) btn.disabled = !puedeEnviarPedido();
}

function renderResumenMenu() {
    const container = document.getElementById("resumen-menu");
    const list = document.getElementById("resumen-menu-items");
    const subtotalEl = document.getElementById("resumen-menu-subtotal");
    const envioEl = document.getElementById("resumen-menu-envio");
    const totalEl = document.getElementById("resumen-menu-total");
    if (!container || !list || !subtotalEl || !envioEl || !totalEl) {
        updateBotonEnviar();
        return;
    }

    const payload = leerPedidoMenu();
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
        updateBotonEnviar();
        return;
    }

    const menuActivo = window.APP_CONFIG?.menuActivo || "menu-simple";
    const menuBase = menuActivo === "menu-compuesto" ? "../menu/menu-compuesto/menu-compuesto.html" : "../menu/menu-simple/menu-simple.html";

    list.innerHTML = payload.items.map((item) => {
        const isPromo = (item.category || "").toLowerCase().includes("promo");
        const label = `${item.qty}x ${isPromo ? "[PROMO] " : ""}${item.name}`;
        const requiereOpciones = item.requiresOptions === true && (!item.options || item.options.length === 0);
        const linkOpciones = requiereOpciones
            ? menuBase + "?addOptions=" + encodeURIComponent(item.id) + "&return=pedidos"
            : "";
        const opcionesBlock = requiereOpciones
            ? `<div class="resumen-menu-item-opciones">
                <span class="resumen-menu-item-opciones-aviso"><i class="fa-solid fa-circle-exclamation"></i> Este producto requiere elegir opciones.</span>
                <a href="${linkOpciones}" class="resumen-menu-item-opciones-link"><i class="fa-solid fa-pen-to-square"></i> Elegir opciones</a>
               </div>`
            : "";
        return `
            <div class="resumen-menu-item${isPromo ? " item-promo" : ""}${requiereOpciones ? " item-requiere-opciones" : ""}">
                <div class="resumen-menu-item-row">
                    <span>${label}</span>
                    <strong>${formatearMoneda(item.subtotal)}</strong>
                </div>
                ${opcionesBlock}
            </div>
        `;
    }).join("");

    const alertaOpciones = document.getElementById("resumen-alerta-opciones");
    if (alertaOpciones) {
        alertaOpciones.style.display = tieneItemsSinOpcionesObligatorias(payload) ? "block" : "none";
    }

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
    updateBotonEnviar();
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
    if (typeof window.checkAndExpirarSesionPedido === "function" && window.checkAndExpirarSesionPedido("../../index.html")) return;
    if (typeof window.touchSesionPedido === "function") window.touchSesionPedido();
    const menuActivo = window.APP_CONFIG?.menuActivo || "menu-simple";
    const linkModificar = document.getElementById("link-modificar-pedido");
    if (linkModificar) {
        const path = window.location.pathname || "";
        const dir = path.replace(/\/[^/]*$/, "");
        const parentDir = dir ? dir.replace(/\/[^/]*$/, "") : "";
        if (parentDir) {
            linkModificar.href = parentDir + "/menu/" + menuActivo + "/" + menuActivo + ".html";
        } else {
            linkModificar.href = "../menu/" + menuActivo + "/" + menuActivo + ".html";
        }
    }
    const params = new URLSearchParams(window.location.search);
    const esReserva = params.get("reserva") === "1";
    const bannerReserva = document.getElementById("pedidos-banner-reserva");
    if (bannerReserva) bannerReserva.style.display = esReserva ? "block" : "none";
    if (linkModificar) linkModificar.classList.toggle("boton-volver-menu-reserva", esReserva);
    const linkModificarTexto = document.getElementById("link-modificar-texto");
    if (linkModificarTexto) linkModificarTexto.textContent = esReserva ? "Modificar reserva" : "Modificar pedido";
    const resumenNote = document.getElementById("resumen-menu-note");
    if (resumenNote) resumenNote.textContent = esReserva ? "Revisá tu reserva antes de enviarla por WhatsApp." : "Revisá tu pedido antes de enviarlo por WhatsApp.";
    if (esReserva && typeof window.HorarioAtencion !== "undefined") {
        try {
            const result = await window.HorarioAtencion.getHorarioEfectivo();
            const byDay = result.byDay != null ? result.byDay : result;
            const estado = window.HorarioAtencion.getEstadoHorario(byDay);
            const elTiempo = document.getElementById("pedidos-banner-reserva-tiempo");
            if (elTiempo && estado.textoHastaApertura) {
                elTiempo.textContent = estado.textoHastaApertura;
                elTiempo.style.display = "";
            }
        } catch (e) { /* ignorar */ }
    }
    renderResumenMenu();
    await cargarPie();
    ["cust-name", "cust-phone", "cust-address"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", updateBotonEnviar);
        if (el) el.addEventListener("change", updateBotonEnviar);
    });
    updateBotonEnviar();
}

window.enviarPedido = enviarPedido;
window.onload = initPedidos;
