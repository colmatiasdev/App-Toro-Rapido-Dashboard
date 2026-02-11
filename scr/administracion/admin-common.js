/**
 * Renderiza la sección de vista previa debug (solo si APP_CONFIG.debug === true).
 * @param {string} wrapId - ID del contenedor (ej. "debug-payload-wrap")
 * @param {Array<{ sheetName: string, title?: string, payload: Object }>} blocks - Lista de envíos (hoja + campos)
 */
window.renderDebugPayloadSection = function (wrapId, blocks) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    if (!window.APP_CONFIG || !window.APP_CONFIG.debug) {
        wrap.classList.remove("visible");
        wrap.style.display = "none";
        return;
    }
    const escapeHtml = (s) => {
        const div = document.createElement("div");
        div.textContent = s == null ? "" : String(s);
        return div.innerHTML;
    };
    const formatVal = (v) => {
        if (v == null || v === "") return "—";
        const s = String(v);
        if (s.length > 60 && s.indexOf("data:") === 0) return "(imagen base64)";
        return s;
    };
    wrap.classList.add("visible");
    wrap.style.display = "block";
    let html = '<p class="debug-payload-title">Vista previa de envío (modo debug)</p>';
    (blocks || []).forEach((b) => {
        html += '<div class="debug-payload-block">';
        if (b.title) html += '<p class="debug-payload-block-title">' + escapeHtml(b.title) + "</p>";
        html += '<p class="debug-payload-sheet">' + escapeHtml(b.sheetName || "") + "</p>";
        html += '<ul class="debug-payload-list">';
        const keys = Object.keys(b.payload || {}).filter((k) => k !== "action" && k !== "sheetName");
        keys.forEach((k) => {
            html += "<li><strong>" + escapeHtml(k) + ":</strong> " + escapeHtml(formatVal(b.payload[k])) + "</li>";
        });
        html += "</ul></div>";
    });
    html += '<p class="debug-payload-hint">Estos son los datos que se enviarán al hacer clic en Guardar.</p>';
    wrap.innerHTML = html;
};

document.addEventListener("DOMContentLoaded", () => {
    const year = new Date().getFullYear();
    document.querySelectorAll("[data-admin-year]").forEach((el) => {
        el.textContent = year;
    });

    const headerSlot = document.getElementById("admin-header-slot");
    if (!headerSlot) return;

    const path = window.location.pathname || "";
    const isDashboard = (path.includes("dashboard") || path.endsWith("administracion/")) && !path.includes("admin-menu") && !path.includes("admin-opciones") && !path.includes("admin-productos");
    const isCrear = path.includes("crear");
    const isMenuSimple = path.includes("admin-menu-simple");
    const isOpciones = path.includes("admin-opciones");
    const isProductos = path.includes("admin-productos");
    const depth = isDashboard ? 0 : 1;

    const logoBase = depth === 0 ? "../../" : "../../../";

    var headerHtml = '<header class="admin-topbar" role="banner">' +
        '<div class="admin-topbar-inner">' +
        '<div class="admin-topbar-brand-wrap">' +
        '<a href="#" id="admin-logo-link" class="admin-topbar-brand" aria-label="Toro Rápido - Ir al panel">' +
        '<img id="admin-logo" src="" alt="Toro Rápido" class="admin-topbar-logo">' +
        '</a>' +
        '<h1 class="admin-topbar-title" id="admin-topbar-title">Panel de Administración</h1>' +
        '</div>' +
        '<a href="#" id="admin-back-link" class="admin-topbar-back">' +
        '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i> ' +
        '<span id="admin-back-text">Volver al dashboard</span>' +
        '</a>' +
        '</div>' +
        '</header>';

    headerSlot.innerHTML = headerHtml;
    document.body.classList.add("admin-has-topbar");

    if (!document.getElementById("admin-topbar-inline-style")) {
        var style = document.createElement("style");
        style.id = "admin-topbar-inline-style";
        style.textContent = "html{width:100%;overflow-x:hidden}body.admin-has-topbar{width:100%;min-width:100%;box-sizing:border-box}#admin-header-slot{width:100%;min-width:100%;box-sizing:border-box}@supports (width:100vw){#admin-header-slot{width:100vw;max-width:100vw;position:relative;left:50%;margin-left:-50vw}}.admin-topbar{position:sticky;top:0;z-index:100;width:100%;min-width:100%;display:flex;align-items:center;justify-content:center;padding:6px 16px;min-height:64px;box-sizing:border-box;background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(15,23,42,.06)}.admin-topbar-inner{width:100%;max-width:1100px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 4px;box-sizing:border-box}.admin-topbar-brand-wrap{display:flex;align-items:center;gap:14px}.admin-topbar-brand{display:flex;align-items:center;text-decoration:none;color:inherit}.admin-topbar-title{margin:0;font-family:'Bungee',cursive;font-size:1.25rem;font-weight:400;color:#0f172a}.admin-topbar-logo{height:52px;width:auto;max-width:200px;object-fit:contain;display:block}.admin-topbar-back{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#f1f5f9;color:#475569;text-decoration:none;font-weight:700;font-size:.85rem}.admin-topbar-back:hover{background:#e2e8f0;color:#0f172a}@media (max-width:480px){.admin-topbar{padding:8px 14px;min-height:56px}.admin-topbar-brand-wrap{gap:10px}.admin-topbar-title{font-size:1rem}.admin-topbar-logo{height:40px;max-width:160px}}";
        document.head.appendChild(style);
    }

    var logo = document.getElementById("admin-logo");
    var logoLink = document.getElementById("admin-logo-link");
    var backLink = document.getElementById("admin-back-link");
    var backText = document.getElementById("admin-back-text");

    if (logo) logo.src = logoBase + "imagenes/logos/Logo.png";
    if (logoLink) logoLink.href = depth === 0 ? "dashboard.html" : "../dashboard.html";

    var titleEl = document.getElementById("admin-topbar-title");
    if (titleEl) {
        if (isDashboard) titleEl.textContent = "Panel de Administración";
        else if (isOpciones) titleEl.textContent = isCrear ? "Agregar opción" : "Administrador de opciones";
        else if (isProductos) titleEl.textContent = path.includes("edit") ? "Editar producto" : (isCrear ? "Agregar producto" : "Administrador de productos");
        else if (isCrear) titleEl.textContent = isMenuSimple ? "Agregar ítem - Menú simple" : "Agregar ítem - Menú compuesto";
        else titleEl.textContent = isMenuSimple ? "Administrador de Menú Simple" : "Administrador de Menú Compuesto";
    }

    if (backLink && backText) {
        if (depth === 0) {
            backLink.href = (window.APP_CONFIG && window.APP_CONFIG.urlWebPublica) ? window.APP_CONFIG.urlWebPublica : "../../inicio-publico.html";
            backText.textContent = "Ver web pública";
        } else if (isOpciones && isCrear) {
            backLink.href = "admin-opciones.html";
            backText.textContent = "Volver al listado";
        } else if (isProductos && (isCrear || path.includes("edit"))) {
            backLink.href = "admin-productos.html";
            backText.textContent = "Volver al listado";
        } else if (isOpciones && path.includes("edit")) {
            backLink.href = "admin-opciones.html";
            backText.textContent = "Volver al listado";
        } else if (isCrear) {
            backLink.href = isMenuSimple ? "admin-menu-simple.html" : "admin-menu-compuesto.html";
            backText.textContent = "Volver al listado";
        } else {
            backLink.href = "../dashboard.html";
            backText.textContent = "Volver al dashboard";
        }
    }
});
