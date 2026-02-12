/**
 * Página de confirmación tras guardar el producto compuesto.
 * Recibe los datos desde sessionStorage (confirmacionMenuCompuesto) y muestra el resumen.
 * El botón "Finalizar creación del menú" guarda en la hoja menu-toro-rapido-web-compuesto y luego redirige al menú compuesto.
 */
(function () {
    const STORAGE_KEY = "confirmacionMenuCompuesto";
    const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
    const MENU_SHEET_NAME = window.APP_CONFIG?.menuCompuestoSheetName || "menu-toro-rapido-web-compuesto";

    const ALPHANUM = "0123456789abcdefghijklmnopqrstuvwxyz";
    function randomAlphanumeric(len) {
        let s = "";
        for (let i = 0; i < len; i++) s += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
        return s;
    }

    function getItemVal(it, keys) {
        if (!it || typeof it !== "object") return "";
        const klist = Array.isArray(keys) ? keys : [keys];
        for (const k of Object.keys(it)) {
            const n = (k || "").toString().toLowerCase().replace(/\s+/g, "").replace(/-/g, "").replace(/_/g, "");
            if (klist.some((c) => (c || "").toString().toLowerCase().replace(/\s+/g, "").replace(/-/g, "").replace(/_/g, "") === n)) return it[k];
        }
        return "";
    }

    function escapeHtml(s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    }

    function renderResumen(datos) {
        const wrap = document.getElementById("confirmacion-resumen-wrap");
        const body = document.getElementById("confirmacion-resumen-body");
        const sinDatos = document.getElementById("confirmacion-sin-datos");
        if (!body || !sinDatos) return;

        if (!datos || !datos.productoCompuesto) {
            if (wrap) wrap.style.display = "none";
            sinDatos.style.display = "block";
            return;
        }

        const pc = datos.productoCompuesto;
        const items = Array.isArray(datos.items) ? datos.items : [];
        const idproducto = datos.idproducto || pc.idproducto || "—";

        let html = "";
        const rows = [
            { label: "idproducto", value: idproducto },
            { label: "Categoria", value: pc.Categoria },
            { label: "Producto", value: pc.Producto },
            { label: "Descripcion", value: pc.Descripcion },
            { label: "Precio Actual", value: pc["Precio Actual"] },
            { label: "Precio Regular", value: pc["Precio Regular"] },
            { label: "Cantidad de ítems", value: String(items.length) }
        ];
        rows.forEach(function (r) {
            const v = r.value != null && r.value !== "" ? String(r.value) : "—";
            html += '<div class="confirmacion-resumen-row"><span class="confirmacion-resumen-label">' + escapeHtml(r.label) + "</span><span class=\"confirmacion-resumen-value\">" + escapeHtml(v) + "</span></div>";
        });

        if (items.length > 0) {
            html += '<div class="confirmacion-tabla-wrap"><table class="menu-table" aria-label="Ítems del producto compuesto"><thead><tr><th>idproducto-base</th><th>Cantidad</th><th>Producto</th><th>Precio Total Actual</th></tr></thead><tbody>';
            items.forEach(function (it) {
                const idBase = getItemVal(it, ["idproducto-base", "idproductobase"]);
                const cant = getItemVal(it, ["Cantidad", "cantidad"]);
                const prod = getItemVal(it, ["Producto", "producto"]);
                const total = getItemVal(it, ["Precio Total Actual", "Precio Total"]);
                html += "<tr><td>" + escapeHtml(idBase) + "</td><td>" + escapeHtml(String(cant)) + "</td><td>" + escapeHtml(prod) + "</td><td>" + escapeHtml(String(total)) + "</td></tr>";
            });
            html += "</tbody></table></div>";
        }

        body.innerHTML = html;
        if (wrap) wrap.style.display = "block";
        sinDatos.style.display = "none";
    }

    document.addEventListener("DOMContentLoaded", function () {
        const main = document.querySelector("main.admin-confirmacion-menu-compuesto");
        if (main) main.classList.add("admin-confirmacion-menu-compuesto");

        let datos = null;
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) datos = JSON.parse(raw);
        } catch (e) {}

        renderResumen(datos);

        if (datos && window.renderDebugPayloadSection && window.APP_CONFIG && window.APP_CONFIG.debug) {
            const blocks = [];
            if (datos.productoCompuesto) {
                blocks.push({
                    title: "Datos enviados a productos-compuesto (confirmación)",
                    sheetName: "productos-compuesto",
                    actionType: "create",
                    actionDescription: "Registro guardado antes de llegar a esta página. idproducto: " + (datos.idproducto || datos.productoCompuesto.idproducto || "—"),
                    payload: datos.productoCompuesto
                });
            }
            if (datos.items && datos.items.length > 0) {
                blocks.push({
                    title: "Ítems del detalle (productos-compuesto-detalle)",
                    sheetName: "productos-compuesto-detalle",
                    actionDescription: "Cantidad de ítems: " + datos.items.length + ". Mismo idproducto: " + (datos.idproducto || "—"),
                    payload: {
                        idproducto: datos.idproducto,
                        numItems: datos.items.length,
                        "(ejemplo ítem 1)": datos.items[0] ? JSON.stringify(datos.items[0]) : "—"
                    }
                });
            }
            if (blocks.length > 0) {
                window.renderDebugPayloadSection("debug-payload-wrap", blocks);
            }
        }

        const btnFinalizar = document.getElementById("btn-finalizar-menu");
        if (btnFinalizar) {
            btnFinalizar.addEventListener("click", async function () {
                if (!datos || !datos.productoCompuesto) {
                    alert("No hay datos de producto compuesto para guardar en el menú.");
                    return;
                }
                if (!MENU_SCRIPT_URL) {
                    alert("No está configurada la URL de Apps Script (APP_CONFIG.appsScriptMenuUrl).");
                    return;
                }
                const pc = datos.productoCompuesto;
                const idproducto = datos.idproducto || pc.idproducto || "";
                const idmenuUnico = "MENU-" + Date.now().toString(36) + randomAlphanumeric(8);
                const orden = parseInt(pc.orden, 10);
                const payload = {
                    action: "create",
                    sheetName: MENU_SHEET_NAME,
                    orden: Number.isNaN(orden) ? 1 : orden,
                    "idmenu-unico": idmenuUnico,
                    "Tipo Menu": "MENU-COMPUESTO",
                    idproducto: idproducto,
                    Categoria: pc.Categoria || "",
                    Producto: pc.Producto || "",
                    "Descripcion Producto": pc.Descripcion || "",
                    Descripcion: pc.Descripcion || "",
                    "Precio Actual": pc["Precio Actual"] || "",
                    "Precio Regular": pc["Precio Regular"] || "",
                    "Mostar Monto Descuento": pc["Mostar Monto Descuento"] || "NO",
                    "Mostar Descuento": pc["Mostar Descuento"] || "SI",
                    Imagen: pc.Imagen || "",
                    "Es Destacado": pc["Es Destacado"] || "NO",
                    "Producto Agotado": pc["Producto Agotado"] || "NO",
                    STOCK: pc.STOCK != null && pc.STOCK !== "" ? String(pc.STOCK) : "99",
                    Habilitado: pc.Habilitado != null && pc.Habilitado !== "" ? pc.Habilitado : "SI"
                };
                btnFinalizar.disabled = true;
                btnFinalizar.textContent = "Guardando en menú…";
                try {
                    await fetch(MENU_SCRIPT_URL, {
                        method: "POST",
                        mode: "no-cors",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify(payload)
                    });
                    window.location.href = "../admin-menu-compuesto/admin-menu-compuesto.html";
                } catch (err) {
                    console.error(err);
                    alert("No se pudo guardar en " + MENU_SHEET_NAME + ": " + (err?.message || err));
                    btnFinalizar.disabled = false;
                    btnFinalizar.innerHTML = '<i class="fa-solid fa-check-double" aria-hidden="true"></i> Finalizar creación del menú';
                }
            });
        }
    });
})();
