/**
 * Renderiza la sección de vista previa debug (solo si APP_CONFIG.debug === true).
 * Cada paso es colapsable: se abre el detalle al hacer clic en el título.
 * Si un bloque tiene allFieldsForDebug (array de { key, value, used }), se muestran todos los campos de la hoja y se marcan visualmente los que no se envían en esta acción.
 * @param {string} wrapId - ID del contenedor (ej. "debug-payload-wrap")
 * @param {Array<{ sheetName: string, title?: string, payload: Object, actionType?: string, actionDescription?: string, allFieldsForDebug?: Array<{ key: string, value: any, used: boolean }> }>} blocks - Lista de envíos
 */
window.renderDebugPayloadSection = function (wrapId, blocks) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const config = window.APP_CONFIG;
    if (!config || !config.debug) {
        wrap.classList.remove("visible");
        wrap.style.display = "none";
        return;
    }
    const escapeHtml = (s) => {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };
    const formatVal = (v) => {
        if (v == null || v === "") return "—";
        const s = String(v);
        return (s.length > 60 && s.indexOf("data:") === 0) ? "(imagen base64)" : s;
    };
    const actionLabels = { read: "Lectura", create: "Crear", update: "Actualizar", delete: "Eliminar" };
    wrap.classList.add("visible");
    wrap.style.display = "block";
    const debugFull = !!config.debugFull;
    let html = '<p class="debug-payload-title">Vista previa de envío (modo debug)</p>';
    (blocks || []).forEach((b, idx) => {
        const titleText = b.title || b.sheetName || "Envío";
        const bodyId = wrapId + "-body-" + idx;
        const collapsedClass = debugFull ? "" : " collapsed";
        const ariaExpanded = debugFull ? "true" : "false";
        const actionLabel = (b.actionType && actionLabels[b.actionType]) ? actionLabels[b.actionType] : "";
        const sheetName = b.sheetName || "";
        const hasActionInfo = actionLabel || b.actionDescription;
        const allFields = b.allFieldsForDebug;
        html += '<div class="debug-payload-block' + collapsedClass + '">';
        html += '<button type="button" class="debug-payload-block-header" aria-expanded="' + ariaExpanded + '" aria-controls="' + bodyId + '">';
        html += '<span class="debug-payload-chevron" aria-hidden="true"></span>';
        html += '<span class="debug-payload-block-title">' + escapeHtml(titleText) + "</span>";
        html += "</button>";
        html += '<div class="debug-payload-block-body" id="' + bodyId + '">';
        if (hasActionInfo) {
            html += '<div class="debug-payload-action-wrap">';
            if (actionLabel) html += '<p class="debug-payload-action"><strong>Acción:</strong> ' + escapeHtml(actionLabel) + ' en hoja de Google Sheet <strong>«' + escapeHtml(sheetName) + '»</strong>.</p>';
            if (b.actionDescription) html += '<p class="debug-payload-action-desc"><strong>Descripción:</strong> ' + escapeHtml(b.actionDescription) + '</p>';
            html += '</div>';
        }
        html += '<p class="debug-payload-sheet">' + escapeHtml(sheetName) + "</p>";
        if (allFields && allFields.length > 0) {
            const usedFields = allFields.filter(function (f) { return f.used; });
            const ignoredFields = allFields.filter(function (f) { return !f.used; });
            html += '<p class="debug-payload-fields-subtitle debug-payload-fields-used-title">Campos que se envían en esta acción</p>';
            html += '<ul class="debug-payload-list debug-payload-list-used">';
            usedFields.forEach(function (f) {
                html += '<li class="debug-payload-field-used"><strong>' + escapeHtml(f.key) + ":</strong> " + escapeHtml(formatVal(f.value)) + "</li>";
            });
            html += "</ul>";
            if (ignoredFields.length > 0) {
                html += '<p class="debug-payload-fields-subtitle debug-payload-fields-ignored-title">Campos de la hoja que no se usan en esta acción (se ignoran al guardar)</p>';
                html += '<ul class="debug-payload-list debug-payload-list-ignored">';
                ignoredFields.forEach(function (f) {
                    html += '<li class="debug-payload-field-ignored"><strong>' + escapeHtml(f.key) + ":</strong> " + escapeHtml(formatVal(f.value)) + ' <span class="debug-payload-badge-ignored">no se envía</span></li>';
                });
                html += "</ul>";
            }
        } else {
            html += '<ul class="debug-payload-list">';
            const keys = Object.keys(b.payload || {});
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                html += "<li><strong>" + escapeHtml(k) + ":</strong> " + escapeHtml(formatVal(b.payload[k])) + "</li>";
            }
            html += "</ul>";
        }
        html += "</div></div>";
    });
    html += '<p class="debug-payload-hint">Hacé clic en cada paso para ver el detalle. Estos datos se enviarán al hacer clic en Guardar.</p>';
    wrap.innerHTML = html;
    wrap.onclick = (ev) => {
        const btn = ev.target.closest(".debug-payload-block-header");
        if (!btn) return;
        const block = btn.closest(".debug-payload-block");
        if (!block) return;
        block.classList.toggle("collapsed");
        btn.setAttribute("aria-expanded", block.classList.contains("collapsed") ? "false" : "true");
    };
};

document.addEventListener("DOMContentLoaded", () => {
    const year = String(new Date().getFullYear());
    const yearNodes = document.querySelectorAll("[data-admin-year]");
    for (let i = 0; i < yearNodes.length; i++) yearNodes[i].textContent = year;

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

    headerSlot.innerHTML = '<header class="admin-topbar" role="banner">' +
        '<div class="admin-topbar-inner">' +
        '<div class="admin-topbar-brand-wrap">' +
        '<a href="#" id="admin-logo-link" class="admin-topbar-brand" aria-label="Toro Rápido - Ir al panel">' +
        '<img id="admin-logo" src="" alt="Toro Rápido" class="admin-topbar-logo" loading="lazy">' +
        '</a>' +
        '<h1 class="admin-topbar-title" id="admin-topbar-title">Panel de Administración</h1>' +
        '</div>' +
        '<a href="#" id="admin-back-link" class="admin-topbar-back">' +
        '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i> ' +
        '<span id="admin-back-text">Volver al dashboard</span>' +
        '</a>' +
        '</div>' +
        '</header>';
    document.body.classList.add("admin-has-topbar");

    if (!document.getElementById("admin-topbar-inline-style")) {
        const style = document.createElement("style");
        style.id = "admin-topbar-inline-style";
        style.textContent = "html{width:100%;overflow-x:hidden}body.admin-has-topbar{width:100%;min-width:100%;box-sizing:border-box}#admin-header-slot{width:100%;min-width:100%;box-sizing:border-box}@supports (width:100vw){#admin-header-slot{width:100vw;max-width:100vw;position:relative;left:50%;margin-left:-50vw}}.admin-topbar{position:sticky;top:0;z-index:100;width:100%;min-width:100%;display:flex;align-items:center;justify-content:center;padding:6px 16px;min-height:64px;box-sizing:border-box;background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(15,23,42,.06)}.admin-topbar-inner{width:100%;max-width:1100px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 4px;box-sizing:border-box}.admin-topbar-brand-wrap{display:flex;align-items:center;gap:14px}.admin-topbar-brand{display:flex;align-items:center;text-decoration:none;color:inherit}.admin-topbar-title{margin:0;font-family:'Bungee',cursive;font-size:1.25rem;font-weight:400;color:#0f172a}.admin-topbar-logo{height:52px;width:auto;max-width:200px;object-fit:contain;display:block}.admin-topbar-back{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#f1f5f9;color:#475569;text-decoration:none;font-weight:700;font-size:.85rem}.admin-topbar-back:hover{background:#e2e8f0;color:#0f172a}@media (max-width:480px){.admin-topbar{padding:8px 14px;min-height:56px}.admin-topbar-brand-wrap{gap:10px}.admin-topbar-title{font-size:1rem}.admin-topbar-logo{height:40px;max-width:160px}}";
        document.head.appendChild(style);
    }

    const logo = document.getElementById("admin-logo");
    const logoLink = document.getElementById("admin-logo-link");
    const backLink = document.getElementById("admin-back-link");
    const backText = document.getElementById("admin-back-text");
    if (logo) logo.src = logoBase + "imagenes/logos/Logo.png";
    if (logoLink) logoLink.href = depth === 0 ? "dashboard.html" : "../dashboard.html";

    const titleEl = document.getElementById("admin-topbar-title");
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
