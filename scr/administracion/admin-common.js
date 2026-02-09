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
    const headerUrl = depth === 0 ? "admin-header.html" : "../admin-header.html";

    fetch(headerUrl, { cache: "no-store" })
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error("No header"))))
        .then((html) => {
            headerSlot.innerHTML = html;

            const logo = document.getElementById("admin-logo");
            const logoLink = document.getElementById("admin-logo-link");
            const backLink = document.getElementById("admin-back-link");
            const backText = document.getElementById("admin-back-text");

            if (logo) logo.src = logoBase + "imagenes/logos/Logo.png";
            if (logoLink) logoLink.href = depth === 0 ? "dashboard.html" : "../dashboard.html";

            const titleEl = document.getElementById("admin-topbar-title");
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
        })
        .catch(() => {
            headerSlot.innerHTML = "";
        });
});
