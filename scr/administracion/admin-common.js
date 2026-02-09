document.addEventListener("DOMContentLoaded", () => {
    const year = new Date().getFullYear();
    document.querySelectorAll("[data-admin-year]").forEach((el) => {
        el.textContent = year;
    });

    const headerSlot = document.getElementById("admin-header-slot");
    if (!headerSlot) return;

    const path = window.location.pathname || "";
    const isDashboard = (path.includes("dashboard") || path.endsWith("administracion/")) && !path.includes("admin-menu") && !path.includes("admin-opciones");
    const isCrear = path.includes("crear");
    const isMenuSimple = path.includes("admin-menu-simple");
    const isOpciones = path.includes("admin-opciones");
    const depth = isDashboard ? 0 : 1;

    const logoBase = depth === 0 ? "../../" : "../../../";

    var headerHtml = '<header class="admin-topbar" role="banner">' +
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
        '</header>';

    headerSlot.innerHTML = headerHtml;

    if (!document.getElementById("admin-topbar-inline-style")) {
        var style = document.createElement("style");
        style.id = "admin-topbar-inline-style";
        style.textContent = ".admin-topbar{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 20px;min-height:64px;box-sizing:border-box;background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(15,23,42,.06)}.admin-topbar-brand-wrap{display:flex;align-items:center;gap:14px}.admin-topbar-brand{display:flex;align-items:center;text-decoration:none;color:inherit}.admin-topbar-title{margin:0;font-family:'Bungee',cursive;font-size:1.25rem;font-weight:400;color:#0f172a}.admin-topbar-logo{height:52px;width:auto;max-width:200px;object-fit:contain;display:block}.admin-topbar-back{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#f1f5f9;color:#475569;text-decoration:none;font-weight:700;font-size:.85rem}.admin-topbar-back:hover{background:#e2e8f0;color:#0f172a}@media (max-width:480px){.admin-topbar{padding:8px 14px;min-height:56px}.admin-topbar-brand-wrap{gap:10px}.admin-topbar-title{font-size:1rem}.admin-topbar-logo{height:40px;max-width:160px}}";
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
        } else if (isCrear) {
            backLink.href = isMenuSimple ? "admin-menu-simple.html" : "admin-menu-compuesto.html";
            backText.textContent = "Volver al listado";
        } else {
            backLink.href = "../dashboard.html";
            backText.textContent = "Volver al dashboard";
        }
    }
});
