/**
 * Página Productos compuestos.
 * Enlaces a agregar ítem (subproductos) y al menú compuesto.
 * Si se llega con parámetros de inserción (idproducto, numItems) o hay datos en sessionStorage, se muestra el resumen de la última inserción, el total de Precio Total Actual, el modo debug y el formulario para guardar en productos-compuesto.
 */
const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const PRODUCTOS_COMPUESTO_SHEET_NAME = window.APP_CONFIG?.productosCompuestoSheetName || "productos-compuesto";
const PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME = window.APP_CONFIG?.productosCompuestoDetalleSheetName || "productos-compuesto-detalle";

function cell(content) {
    const td = document.createElement("td");
    td.textContent = content !== undefined && content !== null && String(content).trim() !== "" ? String(content).trim() : "—";
    return td;
}

/** Formato moneda Argentina (ej. $ 1.461.879,79). */
function formatMoneda(val) {
    if (val === undefined || val === null || val === "") return "—";
    const n = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
    if (Number.isNaN(n)) return "—";
    return (window.formatMoneda && typeof window.formatMoneda === "function") ? window.formatMoneda(n) : ("$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}

const normalizeKey = (s) => (s ?? "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s_-]/g, "");

/** Extrae el idproducto (formato PROD-COMPUESTO-xxx) del párrafo #ultima-insercion-resumen de la página. */
function getIdproductoFromPage() {
    const el = document.getElementById("ultima-insercion-resumen");
    if (!el || !el.textContent) return "";
    const m = el.textContent.match(/PROD-COMPUESTO-[a-z0-9]+/i);
    return m ? m[0] : "";
}

/** Convierte filas de la hoja (arrays) a objetos por nombre de columna (insensible a mayúsculas/espacios). */
function rowsToItems(headers, rows) {
    if (!Array.isArray(headers) || !Array.isArray(rows)) return [];
    const getVal = (row, keys) => {
        for (let i = 0; i < headers.length; i++) {
            const h = (headers[i] ?? "").toString().trim();
            for (const k of keys) {
                if (normalizeKey(h) === normalizeKey(k)) return row[i];
            }
        }
        return "";
    };
    return rows.map((row) => ({
        "idproducto-base": getVal(row, ["idproducto-base", "idproducto-base"]),
        Cantidad: (() => {
            const v = getVal(row, ["Cantidad", "cantidad"]);
            const n = parseInt(v, 10);
            return Number.isNaN(n) ? 1 : n;
        })(),
        Producto: getVal(row, ["Producto", "producto"]),
        "Precio Unitario Actual": getVal(row, ["Precio Unitario Actual", "Precio Actual"]),
        "Precio Total Actual": (() => {
            const v = getVal(row, ["Precio Total Actual"]);
            const n = typeof v === "number" ? v : parseFloat(String(v || "").replace(",", "."));
            return Number.isNaN(n) ? 0 : n;
        })()
    }));
}

/**
 * Obtiene de la hoja productos-compuesto-detalle únicamente los registros cuyo idproducto
 * coincide con el que está en la página (#ultima-insercion-resumen, formato PROD-COMPUESTO-xxx).
 * @returns {{ items: Array, error?: string }}
 */
async function fetchItemsFromSheet(idproducto) {
    const idToUse = (idproducto && String(idproducto).trim()) || getIdproductoFromPage();
    if (!MENU_SCRIPT_URL) {
        return { items: [], error: "No está configurada la URL de Apps Script (APP_CONFIG.appsScriptMenuUrl)." };
    }
    if (!idToUse) {
        return { items: [], error: "No hay idproducto en la página (formato PROD-COMPUESTO-xxx)." };
    }
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const idBuscado = String(idToUse).trim();
    const url = `${MENU_SCRIPT_URL}${sep}sheetName=${encodeURIComponent(PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME)}&idproducto=${encodeURIComponent(idBuscado)}&_ts=${Date.now()}`;
    try {
        const res = await fetch(url, { cache: "no-store", mode: "cors" });
        let data;
        const contentType = res.headers.get("content-type") || "";
        const text = await res.text();
        if (!res.ok) {
            console.warn("[productos-compuestos] GET hoja falló:", res.status, res.statusText, text.slice(0, 200));
            return { items: [], error: "Error " + res.status + " al conectar con la hoja. Revisá la consola (F12)." };
        }
        if (contentType.indexOf("application/json") !== -1) {
            try {
                data = JSON.parse(text);
            } catch (parseErr) {
                return { items: [], error: "La respuesta no es JSON válido." };
            }
        } else {
            console.warn("[productos-compuestos] La respuesta no es JSON. Content-Type:", contentType, "Inicio:", text.slice(0, 150));
            return { items: [], error: "El servidor no devolvió JSON (¿abriste la app desde file://? Probá servir la app por http o usar la URL de Apps Script en el navegador)." };
        }
        if (data && (data.result === "error" || data.error)) {
            const msg = data.error || "Error desconocido";
            console.warn("[productos-compuestos] API error:", msg);
            return { items: [], error: msg };
        }
        const headers = data?.headers || [];
        const rows = Array.isArray(data?.rows) ? data.rows : [];
        const items = rowsToItems(headers, rows);
        if (items.length === 0 && idBuscado) {
            console.warn("[productos-compuestos] No se encontraron filas con idproducto =", idBuscado, ". Headers de la hoja:", headers);
            return { items: [], error: "No hay filas con idproducto = " + idBuscado + " en la hoja. Revisá que la columna se llame «idproducto» y que existan datos con ese valor." };
        }
        return { items };
    } catch (e) {
        console.error("[productos-compuestos] Error cargando detalle desde hoja:", e);
        const msg = e && e.message ? e.message : String(e);
        return { items: [], error: "Error de red o CORS: " + msg + ". Si abrís desde file://, probá servir la app por HTTP." };
    }
}

/** Pinta la tabla de última inserción y el total con los ítems de datos.items. */
function renderUltimaInsercionTabla(datos) {
    const tablaWrap = document.getElementById("ultima-insercion-tabla-wrap");
    const tbody = document.getElementById("ultima-insercion-tbody");
    const tfoot = document.getElementById("ultima-insercion-tfoot");
    const totalPrecioEl = document.getElementById("ultima-insercion-total-precio");
    if (!tablaWrap || !tbody || !datos?.items?.length) return;
    let totalPrecio = 0;
    tablaWrap.style.display = "block";
    tbody.innerHTML = "";
    datos.items.forEach((it) => {
        const precioUnit = it["Precio Unitario Actual"];
        const precioTotal = it["Precio Total Actual"];
        const numTotal = typeof precioTotal === "number" ? precioTotal : parseFloat(String(precioTotal ?? "").replace(",", "."));
        if (!Number.isNaN(numTotal)) totalPrecio += numTotal;
        const tr = document.createElement("tr");
        tr.appendChild(cell(it["idproducto-base"]));
        tr.appendChild(cell(String(it.Cantidad)));
        tr.appendChild(cell(it.Producto || "—"));
        tr.appendChild(cell(formatMoneda(precioUnit)));
        tr.appendChild(cell(formatMoneda(precioTotal)));
        tbody.appendChild(tr);
    });
    if (tfoot && totalPrecioEl) {
        tfoot.style.display = "table-footer-group";
        totalPrecioEl.textContent = formatMoneda(totalPrecio);
    }
}

/** Renderiza la sección debug: pasos de lo guardado en productos-compuesto-detalle y lo que se enviaría a productos-compuesto. */
function renderDebugSection(datos) {
    const wrap = document.getElementById("debug-payload-wrap");
    if (!wrap || !datos || !datos.idproducto) return;
    if (!window.APP_CONFIG?.debug) {
        wrap.style.display = "none";
        wrap.classList.remove("visible");
        return;
    }
    const blocks = [];

    if (datos.items && datos.items.length > 0) {
        blocks.push({
            title: "1. Datos guardados en «" + PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME + "» (ítems del detalle)",
            sheetName: PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME,
            actionType: "create",
            actionDescription: "Cada ítem se guardó con el mismo idproducto: " + datos.idproducto + ". idproducto-base es el ID del producto en productos-base.",
            payload: {
                idproducto: datos.idproducto,
                numItems: datos.items.length,
                "(ejemplo ítem 1)": datos.items[0] ? JSON.stringify(datos.items[0]) : "—"
            }
        });
        datos.items.forEach((it, idx) => {
            blocks.push({
                title: "Ítem " + (idx + 1) + " → " + PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME,
                sheetName: PRODUCTOS_COMPUESTO_DETALLE_SHEET_NAME,
                actionType: "create",
                payload: Object.assign({ idproducto: datos.idproducto }, it)
            });
        });
    }

    const idproducto = document.getElementById("pc-idproducto");
    const producto = document.getElementById("pc-producto");
    const categoria = document.getElementById("pc-categoria");
    const descripcion = document.getElementById("pc-descripcion");
    const precioActual = document.getElementById("pc-precio-actual");
    const imagen = document.getElementById("pc-imagen");
    const esDestacado = document.getElementById("pc-es-destacado");
    const habilitado = document.getElementById("pc-habilitado");
    const payloadCompuesto = {
        action: "create",
        sheetName: PRODUCTOS_COMPUESTO_SHEET_NAME,
        idproducto: datos.idproducto,
        Categoria: categoria ? categoria.value : "",
        Producto: producto ? producto.value : "",
        Descripcion: descripcion ? descripcion.value : "",
        "Precio Actual": precioActual ? precioActual.value : "",
        Imagen: imagen ? imagen.value : "",
        "Es Destacado": esDestacado && esDestacado.checked ? "SI" : "NO",
        Habilitado: habilitado && habilitado.checked ? "SI" : "NO"
    };
    blocks.push({
        title: "2. Datos a guardar en «" + PRODUCTOS_COMPUESTO_SHEET_NAME + "» (registro principal)",
        sheetName: PRODUCTOS_COMPUESTO_SHEET_NAME,
        actionType: "create",
        actionDescription: "Un solo registro por producto compuesto. idproducto = " + datos.idproducto + " (mismo que en productos-compuesto-detalle).",
        payload: payloadCompuesto
    });

    if (typeof window.renderDebugPayloadSection === "function") {
        window.renderDebugPayloadSection("debug-payload-wrap", blocks);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const main = document.querySelector("main.admin-menu");
    if (main) main.classList.add("admin-productos-compuestos");

    const params = new URLSearchParams(window.location.search);
    const idproductoParam = params.get("idproducto");
    const numItemsParam = params.get("numItems");

    let datos = null;
    let hadStored = false;
    try {
        const stored = sessionStorage.getItem("ultimaInsercionCompuesto");
        if (stored) {
            hadStored = true;
            datos = JSON.parse(stored);
        }
    } catch (e) {}

    if (!datos && idproductoParam) {
        datos = {
            idproducto: idproductoParam,
            numItems: parseInt(numItemsParam, 10) || 0,
            items: []
        };
    }

    const wrap = document.getElementById("ultima-insercion-wrap");
    const resumenEl = document.getElementById("ultima-insercion-resumen");
    const formProductosCompuestoWrap = document.getElementById("form-productos-compuesto-wrap");
    const pcIdproducto = document.getElementById("pc-idproducto");
    const btnGuardarCompuesto = document.getElementById("btn-guardar-productos-compuesto");

    if (wrap && resumenEl && datos && datos.idproducto) {
        wrap.style.display = "block";
        const numItems = datos.items?.length ?? datos.numItems ?? 0;
        resumenEl.textContent = "Producto compuesto " + datos.idproducto + " con " + numItems + " ítem(s) guardado(s) en productos-compuesto-detalle.";

        if (!datos.items || datos.items.length === 0) {
            const tablaWrapEl = document.getElementById("ultima-insercion-tabla-wrap");
            const loadingEl = document.createElement("p");
            loadingEl.className = "ultima-insercion-loading";
            loadingEl.setAttribute("aria-live", "polite");
            loadingEl.textContent = "Cargando ítems desde la hoja…";
            if (tablaWrapEl) {
                tablaWrapEl.style.display = "block";
                tablaWrapEl.appendChild(loadingEl);
            }
            const result = await fetchItemsFromSheet(datos.idproducto);
            if (loadingEl.parentNode) loadingEl.remove();
            if (result.error) {
                const errEl = document.createElement("p");
                errEl.className = "ultima-insercion-error";
                errEl.setAttribute("role", "alert");
                errEl.textContent = result.error;
                if (tablaWrapEl) {
                    tablaWrapEl.appendChild(errEl);
                }
                console.warn("[productos-compuestos] Carga de detalle:", result.error);
            }
            if (result.items && result.items.length > 0) {
                datos.items = result.items;
                if (typeof datos.numItems !== "number") datos.numItems = result.items.length;
                resumenEl.textContent = "Producto compuesto " + datos.idproducto + " con " + datos.items.length + " ítem(s) guardado(s) en productos-compuesto-detalle.";
            }
        }
        renderUltimaInsercionTabla(datos);

        if (formProductosCompuestoWrap && pcIdproducto) {
            formProductosCompuestoWrap.style.display = "block";
            pcIdproducto.value = datos.idproducto;
        }
        renderDebugSection(datos);

        if (hadStored) {
            try {
                sessionStorage.removeItem("ultimaInsercionCompuesto");
            } catch (e) {}
        }
    }

    if (btnGuardarCompuesto) {
        btnGuardarCompuesto.addEventListener("click", async () => {
            const idproducto = document.getElementById("pc-idproducto")?.value?.trim();
            if (!idproducto) {
                alert("No hay idproducto. Agregá primero ítems al producto compuesto desde «Agregar ítem al producto compuesto».");
                return;
            }
            const categoria = document.getElementById("pc-categoria")?.value?.trim() || "";
            const producto = document.getElementById("pc-producto")?.value?.trim() || "";
            const descripcion = document.getElementById("pc-descripcion")?.value?.trim() || "";
            const precioActual = document.getElementById("pc-precio-actual")?.value?.trim() || "";
            const imagen = document.getElementById("pc-imagen")?.value?.trim() || "";
            const esDestacado = document.getElementById("pc-es-destacado")?.checked ? "SI" : "NO";
            const habilitado = document.getElementById("pc-habilitado")?.checked ? "SI" : "NO";

            const payload = {
                action: "create",
                sheetName: PRODUCTOS_COMPUESTO_SHEET_NAME,
                idproducto,
                Categoria: categoria,
                Producto: producto,
                Descripcion: descripcion,
                "Precio Actual": precioActual,
                Imagen: imagen,
                "Es Destacado": esDestacado,
                Habilitado: habilitado
            };

            btnGuardarCompuesto.disabled = true;
            btnGuardarCompuesto.textContent = "Guardando...";
            const scriptDebug = document.getElementById("script-debug-compuesto");
            if (scriptDebug) {
                scriptDebug.textContent = "";
                scriptDebug.classList.remove("script-debug-success", "script-debug-error");
            }
            try {
                await fetch(MENU_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });
                if (scriptDebug) {
                    scriptDebug.textContent = "Guardado en «" + PRODUCTOS_COMPUESTO_SHEET_NAME + "» con idproducto " + idproducto + ".";
                    scriptDebug.classList.add("script-debug-success");
                }
                datos = Object.assign({}, datos || {}, { idproducto, items: datos?.items || [] });
                renderDebugSection(datos);
            } catch (err) {
                console.error(err);
                if (scriptDebug) {
                    scriptDebug.textContent = "Error: " + (err?.message || err);
                    scriptDebug.classList.add("script-debug-error");
                }
                alert("No se pudo guardar: " + (err?.message || err));
            } finally {
                btnGuardarCompuesto.disabled = false;
                btnGuardarCompuesto.innerHTML = '<i class="fa-solid fa-save" aria-hidden="true"></i> Guardar en productos-compuesto';
            }
        });
    }

    document.getElementById("pc-categoria")?.addEventListener("input", () => renderDebugSection({ idproducto: pcIdproducto?.value, items: datos?.items || [] }));
    document.getElementById("pc-producto")?.addEventListener("input", () => renderDebugSection({ idproducto: pcIdproducto?.value, items: datos?.items || [] }));
    document.getElementById("pc-descripcion")?.addEventListener("input", () => renderDebugSection({ idproducto: pcIdproducto?.value, items: datos?.items || [] }));
    document.getElementById("pc-precio-actual")?.addEventListener("input", () => renderDebugSection({ idproducto: pcIdproducto?.value, items: datos?.items || [] }));
    document.getElementById("pc-imagen")?.addEventListener("input", () => renderDebugSection({ idproducto: pcIdproducto?.value, items: datos?.items || [] }));
    document.getElementById("pc-es-destacado")?.addEventListener("change", () => renderDebugSection({ idproducto: pcIdproducto?.value, items: datos?.items || [] }));
    document.getElementById("pc-habilitado")?.addEventListener("change", () => renderDebugSection({ idproducto: pcIdproducto?.value, items: datos?.items || [] }));
});
