document.addEventListener("DOMContentLoaded", () => {
    const year = new Date().getFullYear();
    document.querySelectorAll("[data-admin-year]").forEach((el) => {
        el.textContent = year;
    });

    const headerSlot = document.getElementById("admin-header-slot");
    if (!headerSlot) return;

    const path = window.location.pathname || "";
    const isDashboard = (path.includes("dashboard") || path.endsWith("administracion/")) && !path.includes("admin-menu");
    const isCrear = path.includes("crear");
    const isMenuSimple = path.includes("admin-menu-simple");
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

    var logo = document.getElementById("admin-logo");
    var logoLink = document.getElementById("admin-logo-link");
    var backLink = document.getElementById("admin-back-link");
    var backText = document.getElementById("admin-back-text");

    if (logo) logo.src = logoBase + "imagenes/logos/Logo.png";
    if (logoLink) logoLink.href = depth === 0 ? "dashboard.html" : "../dashboard.html";

    var titleEl = document.getElementById("admin-topbar-title");
    if (titleEl) {
        if (isDashboard) titleEl.textContent = "Panel de Administración";
        else if (isCrear) titleEl.textContent = isMenuSimple ? "Agregar ítem - Menú simple" : "Agregar ítem - Menú compuesto";
        else titleEl.textContent = isMenuSimple ? "Administrador de Menú Simple" : "Administrador de Menú Compuesto";
    }

    if (backLink && backText) {
        if (depth === 0) {
            backLink.href = (window.APP_CONFIG && window.APP_CONFIG.urlWebPublica) ? window.APP_CONFIG.urlWebPublica : "../../inicio-publico.html";
            backText.textContent = "Ver web pública";
        } else if (isCrear) {
            backLink.href = isMenuSimple ? "admin-menu-simple.html" : "admin-menu-compuesto.html";
            backText.textContent = "Volver al listado";
        } else {
            backLink.href = "../dashboard.html";
            backText.textContent = "Volver al dashboard";
        }
    }
});
