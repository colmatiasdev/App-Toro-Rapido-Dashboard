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

/** Formato moneda Argentina (ej. $ 1.461.879,79). No usa window.formatMoneda para evitar recursión (esta función puede ser la asignada en window). */
function formatMoneda(val) {
    if (val === undefined || val === null || val === "") return "—";
    const n = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
    if (Number.isNaN(n)) return "—";
    return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            const hn = normalizeKey(h);
            for (const k of keys) {
                if (hn === normalizeKey(k)) return row[i];
            }
        }
        return "";
    };
    return rows.map((row) => {
        const cant = getVal(row, ["Cantidad", "cantidad"]);
        const nCant = parseInt(cant, 10);
        const cantidad = Number.isNaN(nCant) ? 1 : nCant;
        const precioUnitStr = getVal(row, ["Precio Unitario Actual", "Precio Actual", "Precio Unitario"]);
        const precioTotalVal = getVal(row, ["Precio Total Actual", "Precio Total"]);
        const precioTotalNum = typeof precioTotalVal === "number" ? precioTotalVal : parseFloat(String(precioTotalVal || "").replace(",", "."));
        const precioTotal = Number.isNaN(precioTotalNum) ? 0 : precioTotalNum;
        return {
            "idproducto-base": getVal(row, ["idproducto-base", "idproducto base", "ID Producto Base"]),
            Cantidad: cantidad,
            Producto: getVal(row, ["Producto", "producto"]),
            "Precio Unitario Actual": precioUnitStr,
            "Precio Total Actual": precioTotal
        };
    });
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
        const text = await res.text();
        if (!res.ok) {
            console.warn("[productos-compuestos] GET hoja falló:", res.status, res.statusText, text.slice(0, 200));
            return { items: [], error: "Error " + res.status + " al conectar con la hoja. Revisá la consola (F12)." };
        }
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseErr) {
            console.warn("[productos-compuestos] Respuesta no es JSON. Inicio:", text.slice(0, 150));
            return { items: [], error: "El servidor no devolvió JSON válido. ¿Abriste desde file://? Probá servir por HTTP." };
        }
        if (data && (data.result === "error" || data.error)) {
            const msg = data.error || "Error desconocido";
            console.warn("[productos-compuestos] API error:", msg);
            return { items: [], error: msg };
        }
        const headers = data?.headers || [];
        const rows = Array.isArray(data?.rows) ? data.rows : [];
        const items = rowsToItems(headers, rows);
        return { items };
    } catch (e) {
        console.error("[productos-compuestos] Error cargando detalle desde hoja:", e);
        const msg = e && e.message ? e.message : String(e);
        return { items: [], error: "Error de red o CORS: " + msg + ". Si abrís desde file://, probá servir la app por HTTP." };
    }
}

/**
 * Obtiene de la hoja productos-compuesto los valores únicos de la columna Categoria (ordenados).
 * @returns {Promise<string[]>}
 */
async function fetchCategoriasFromSheet() {
    if (!MENU_SCRIPT_URL) return [];
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const url = `${MENU_SCRIPT_URL}${sep}sheetName=${encodeURIComponent(PRODUCTOS_COMPUESTO_SHEET_NAME)}&_ts=${Date.now()}`;
    try {
        const res = await fetch(url, { cache: "no-store", mode: "cors" });
        const text = await res.text();
        if (!res.ok) return [];
        let data;
        try {
            data = JSON.parse(text);
        } catch (_) {
            return [];
        }
        if (data?.result === "error" || data?.error) return [];
        const headers = data?.headers || [];
        const rows = Array.isArray(data?.rows) ? data.rows : [];
        const colCategoria = headers.findIndex((h) => normalizeKey(String(h ?? "")) === normalizeKey("Categoria"));
        if (colCategoria === -1) return [];
        const set = new Set();
        rows.forEach((row) => {
            const v = row[colCategoria];
            const s = (v != null ? String(v) : "").trim();
            if (s) set.add(s);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
    } catch (e) {
        console.warn("[productos-compuestos] Error cargando categorías:", e);
        return [];
    }
}

/** Devuelve el valor de Categoria (input combobox con datalist). */
function getCategoriaValue() {
    const input = document.getElementById("pc-categoria");
    return (input && (input.value || "").trim()) || "";
}

/** Escapa HTML para usar en atributos/value. */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/** Rellena el datalist de categorías con los valores de la hoja (combobox: elegir o escribir nuevo). */
function fillCategoriaDatalist(categorias) {
    const datalist = document.getElementById("pc-categoria-datalist");
    if (!datalist) return;
    const list = Array.isArray(categorias) ? categorias : [];
    datalist.innerHTML = list.map((cat) => `<option value="${escapeHtml(cat)}">`).join("");
}

/** Actualiza la previsualización de la imagen desde el valor de pc-imagen (URL o data URL). */
function updateImagenPreview() {
    const hidden = document.getElementById("pc-imagen");
    const img = document.getElementById("pc-imagen-preview");
    const placeholder = document.getElementById("pc-imagen-preview-placeholder");
    const src = (hidden && hidden.value || "").trim();
    if (!img || !placeholder) return;
    if (src && (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://"))) {
        img.src = src;
        img.style.display = "block";
        img.onerror = () => {
            img.style.display = "none";
            placeholder.style.display = "inline";
        };
        img.onload = () => {
            placeholder.style.display = "none";
        };
        placeholder.style.display = "none";
    } else {
        img.src = "";
        img.style.display = "none";
        placeholder.style.display = "inline";
    }
}

/** Obtiene valor de un ítem por clave (acepta varias variantes de nombre). */
function getItemVal(it, keys) {
    if (!it || typeof it !== "object") return "";
    const klist = Array.isArray(keys) ? keys : [keys];
    for (const k of Object.keys(it)) {
        const n = (k || "").toString().toLowerCase().replace(/\s+/g, "").replace(/-/g, "").replace(/_/g, "");
        if (klist.some((c) => (c || "").toString().toLowerCase().replace(/\s+/g, "").replace(/-/g, "").replace(/_/g, "") === n)) return it[k];
    }
    return "";
}

/** Pinta la tabla de última inserción y el total con los ítems de datos.items. */
function renderUltimaInsercionTabla(datos) {
    const tablaWrap = document.getElementById("ultima-insercion-tabla-wrap");
    const tbody = document.getElementById("ultima-insercion-tbody");
    const tfoot = document.getElementById("ultima-insercion-tfoot");
    const totalPrecioEl = document.getElementById("ultima-insercion-total-precio");
    if (!tablaWrap) return;
    const tbodyEl = tbody || tablaWrap.querySelector("tbody");
    if (!tbodyEl) return;
    const items = Array.isArray(datos?.items) ? datos.items : [];
    if (items.length === 0) {
        updatePrecioRegularEnFormulario(0);
        return;
    }
    let totalPrecio = 0;
    tablaWrap.style.display = "block";
    tbodyEl.innerHTML = "";
    items.forEach((it) => {
        const precioUnit = getItemVal(it, ["Precio Unitario Actual", "Precio Unitario", "precioUnitarioActual"]);
        const precioTotal = getItemVal(it, ["Precio Total Actual", "Precio Total", "precioTotalActual"]);
        const numTotal = typeof precioTotal === "number" ? precioTotal : parseFloat(String(precioTotal ?? "").replace(",", "."));
        if (!Number.isNaN(numTotal)) totalPrecio += numTotal;
        const tr = document.createElement("tr");
        tr.appendChild(cell(getItemVal(it, ["idproducto-base", "idproducto-base", "idproductobase"])));
        tr.appendChild(cell(String(getItemVal(it, ["Cantidad", "cantidad"]) || "—")));
        tr.appendChild(cell(getItemVal(it, ["Producto", "producto"]) || "—"));
        tr.appendChild(cell(formatMoneda(precioUnit)));
        tr.appendChild(cell(formatMoneda(precioTotal)));
        tbodyEl.appendChild(tr);
    });
    if (tfoot && totalPrecioEl) {
        tfoot.style.display = "table-footer-group";
        totalPrecioEl.textContent = formatMoneda(totalPrecio);
    }
    updatePrecioRegularEnFormulario(totalPrecio);
}

/** Actualiza el campo informativo Precio Regular del formulario con el total del resumen. */
function updatePrecioRegularEnFormulario(totalPrecio) {
    const hidden = document.getElementById("pc-precio-regular");
    const display = document.getElementById("pc-precio-regular-value");
    const num = typeof totalPrecio === "number" && !Number.isNaN(totalPrecio) ? totalPrecio : 0;
    if (hidden) hidden.value = String(num);
    if (display) display.textContent = formatMoneda(num);
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

    const orden = document.getElementById("pc-orden");
    const idproducto = document.getElementById("pc-idproducto");
    const producto = document.getElementById("pc-producto");
    const categoria = document.getElementById("pc-categoria");
    const descripcion = document.getElementById("pc-descripcion");
    const precioActual = document.getElementById("pc-precio-actual");
    const precioRegular = document.getElementById("pc-precio-regular");
    const mostarMontoDescuento = document.getElementById("pc-mostar-monto-descuento");
    const mostarDescuento = document.getElementById("pc-mostar-descuento");
    const imagen = document.getElementById("pc-imagen");
    const esDestacado = document.getElementById("pc-es-destacado");
    const productoAgotado = document.getElementById("pc-producto-agotado");
    const stock = document.getElementById("pc-stock");
    const habilitado = document.getElementById("pc-habilitado");
    const payloadCompuesto = {
        action: "create",
        sheetName: PRODUCTOS_COMPUESTO_SHEET_NAME,
        orden: orden ? orden.value : "",
        idproducto: datos.idproducto,
        Categoria: getCategoriaValue(),
        Producto: producto ? producto.value : "",
        Descripcion: descripcion ? descripcion.value : "",
        "Precio Actual": precioActual ? precioActual.value : "",
        "Precio Regular": precioRegular ? precioRegular.value : "",
        "Mostar Monto Descuento": mostarMontoDescuento ? mostarMontoDescuento.value : "",
        "Mostar Descuento": mostarDescuento ? mostarDescuento.value : "",
        Imagen: imagen ? imagen.value : "",
        "Es Destacado": esDestacado && esDestacado.checked ? "SI" : "NO",
        "Producto Agotado": "NO",
        STOCK: "99",
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
    const datosParam = params.get("d");

    let datos = null;
    let hadStored = false;
    try {
        if (datosParam) {
            const base64 = datosParam.replace(/-/g, "+").replace(/_/g, "/");
            const padLen = (4 - (base64.length % 4)) % 4;
            const padded = base64 + "====".slice(0, padLen);
            const decoded = decodeURIComponent(escape(atob(padded)));
            datos = JSON.parse(decoded);
            if (datos && !Array.isArray(datos.items)) datos.items = [];
        }
    } catch (e) {}
    if (!datos) {
        try {
            const stored = sessionStorage.getItem("ultimaInsercionCompuesto");
            if (stored) {
                hadStored = true;
                datos = JSON.parse(stored);
            }
        } catch (e2) {}
    }
    if (!datos && idproductoParam) {
        datos = {
            idproducto: idproductoParam,
            numItems: parseInt(numItemsParam, 10) || 0,
            items: []
        };
    }
    if (datos && !Array.isArray(datos.items)) datos.items = [];

    const wrap = document.getElementById("ultima-insercion-wrap");
    const resumenEl = document.getElementById("ultima-insercion-resumen");
    const formProductosCompuestoWrap = document.getElementById("form-productos-compuesto-wrap");
    const pcIdproducto = document.getElementById("pc-idproducto");
    const btnGuardarCompuesto = document.getElementById("btn-guardar-productos-compuesto");

    if (wrap && resumenEl && datos && datos.idproducto) {
        wrap.style.display = "block";
        const tablaWrapEl = document.getElementById("ultima-insercion-tabla-wrap");
        const numItemsInicial = (datos.items && datos.items.length) || 0;
        resumenEl.textContent = "Producto compuesto " + datos.idproducto + " con " + (numItemsInicial || datos.numItems || 0) + " ítem(s) guardado(s) en productos-compuesto-detalle.";
        if (tablaWrapEl) tablaWrapEl.style.display = "block";
        renderUltimaInsercionTabla(datos);
        if (numItemsInicial > 0) {
            const loadingP = document.createElement("p");
            loadingP.className = "ultima-insercion-loading";
            loadingP.setAttribute("aria-live", "polite");
            loadingP.textContent = "Actualizando desde la hoja…";
            wrap.appendChild(loadingP);
        }
        const result = await fetchItemsFromSheet(datos.idproducto);
        const loadingP = wrap.querySelector && wrap.querySelector(".ultima-insercion-loading");
        if (loadingP && loadingP.parentNode) loadingP.remove();
        if (result.error) {
            const errEl = document.createElement("p");
            errEl.className = "ultima-insercion-error";
            errEl.setAttribute("role", "alert");
            errEl.textContent = result.error;
            wrap.appendChild(errEl);
            console.warn("[productos-compuestos] Carga de detalle:", result.error);
            if (!datos.items || datos.items.length === 0) {
                resumenEl.textContent = "Producto compuesto " + datos.idproducto + " con " + (datos.numItems || 0) + " ítem(s). No se pudieron cargar los ítems desde la hoja.";
            }
        } else if (result.items && result.items.length > 0) {
            datos.items = result.items;
            datos.numItems = result.items.length;
            resumenEl.textContent = "Producto compuesto " + datos.idproducto + " con " + datos.items.length + " ítem(s) guardado(s) en productos-compuesto-detalle.";
            renderUltimaInsercionTabla(datos);
        } else if (!datos.items || datos.items.length === 0) {
            resumenEl.textContent = "Producto compuesto " + datos.idproducto + " con 0 ítem(s) en la hoja. Agregá ítems desde «Agregar ítem al producto compuesto».";
        }

        if (formProductosCompuestoWrap && pcIdproducto) {
            formProductosCompuestoWrap.style.display = "block";
            const ordenInicial = "1";
            const pcOrden = document.getElementById("pc-orden");
            if (pcOrden) pcOrden.value = ordenInicial;
            pcIdproducto.value = datos.idproducto;
            const ordenValueEl = document.getElementById("pc-orden-value");
            const idproductoValueEl = document.getElementById("pc-idproducto-value");
            if (ordenValueEl) ordenValueEl.textContent = ordenInicial;
            if (idproductoValueEl) idproductoValueEl.textContent = datos.idproducto || "—";
            const categorias = await fetchCategoriasFromSheet();
            fillCategoriaDatalist(categorias);
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
            const orden = document.getElementById("pc-orden")?.value?.trim() || "";
            const categoria = getCategoriaValue();
            const producto = document.getElementById("pc-producto")?.value?.trim() || "";
            const descripcion = document.getElementById("pc-descripcion")?.value?.trim() || "";
            const precioActual = document.getElementById("pc-precio-actual")?.value?.trim() || "";
            const precioRegular = document.getElementById("pc-precio-regular")?.value?.trim() || "";
            const mostarMontoDescuento = document.getElementById("pc-mostar-monto-descuento")?.value?.trim() || "NO";
            const mostarDescuento = document.getElementById("pc-mostar-descuento")?.value?.trim() || "SI";
            const imagen = document.getElementById("pc-imagen")?.value?.trim() || "";
            const esDestacado = document.getElementById("pc-es-destacado")?.checked ? "SI" : "NO";
            const productoAgotado = "NO";
            const stock = "99";
            const habilitado = document.getElementById("pc-habilitado")?.checked ? "SI" : "NO";

            const payload = {
                action: "create",
                sheetName: PRODUCTOS_COMPUESTO_SHEET_NAME,
                orden,
                idproducto,
                Categoria: categoria,
                Producto: producto,
                Descripcion: descripcion,
                "Precio Actual": precioActual,
                "Precio Regular": precioRegular,
                "Mostar Monto Descuento": mostarMontoDescuento,
                "Mostar Descuento": mostarDescuento,
                Imagen: imagen,
                "Es Destacado": esDestacado,
                "Producto Agotado": productoAgotado,
                STOCK: stock,
                Habilitado: habilitado
            };

            btnGuardarCompuesto.disabled = true;
            btnGuardarCompuesto.textContent = "Guardando...";
            const scriptDebug = document.getElementById("script-debug-compuesto");
            if (scriptDebug) {
                scriptDebug.textContent = "";
                scriptDebug.classList.remove("script-debug-success", "script-debug-error");
            }
            let guardadoOk = false;
            try {
                await fetch(MENU_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });
                guardadoOk = true;
                if (scriptDebug) {
                    scriptDebug.textContent = "Guardado correctamente. Redirigiendo a confirmación…";
                    scriptDebug.classList.add("script-debug-success");
                }
                datos = Object.assign({}, datos || {}, { idproducto, items: datos?.items || [] });
                const datosConfirmacion = {
                    productoCompuesto: payload,
                    items: datos?.items || [],
                    idproducto
                };
                try {
                    sessionStorage.setItem("confirmacionMenuCompuesto", JSON.stringify(datosConfirmacion));
                } catch (e) {}
                window.location.href = "../admin-confirmacion-menu-compuesto/admin-confirmacion-menu-compuesto.html";
            } catch (err) {
                console.error(err);
                if (scriptDebug) {
                    scriptDebug.textContent = "Error: " + (err?.message || err);
                    scriptDebug.classList.add("script-debug-error");
                }
                alert("No se pudo guardar: " + (err?.message || err));
            } finally {
                if (!guardadoOk) {
                    btnGuardarCompuesto.disabled = false;
                    btnGuardarCompuesto.innerHTML = '<i class="fa-solid fa-save" aria-hidden="true"></i> Guardar en productos-compuesto';
                }
            }
        });
    }

    const refreshDebug = () => renderDebugSection({ idproducto: pcIdproducto?.value, items: datos?.items || [] });
    document.getElementById("pc-categoria")?.addEventListener("input", refreshDebug);
    document.getElementById("pc-producto")?.addEventListener("input", refreshDebug);
    document.getElementById("pc-descripcion")?.addEventListener("input", refreshDebug);
    document.getElementById("pc-precio-actual")?.addEventListener("input", refreshDebug);
    document.getElementById("pc-mostar-monto-descuento")?.addEventListener("change", refreshDebug);
    document.getElementById("pc-mostar-descuento")?.addEventListener("change", refreshDebug);
    const pcImagenHidden = document.getElementById("pc-imagen");
    const pcImagenFile = document.getElementById("pc-imagen-file");
    const pcImagenUrl = document.getElementById("pc-imagen-url");
    pcImagenFile?.addEventListener("change", () => {
        const file = pcImagenFile.files && pcImagenFile.files[0];
        if (!file || !file.type.startsWith("image/")) {
            if (pcImagenHidden) pcImagenHidden.value = "";
            if (pcImagenUrl) pcImagenUrl.value = "";
            updateImagenPreview();
            refreshDebug();
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (pcImagenHidden) pcImagenHidden.value = reader.result;
            if (pcImagenUrl) pcImagenUrl.value = "";
            updateImagenPreview();
            refreshDebug();
        };
        reader.readAsDataURL(file);
    });
    pcImagenUrl?.addEventListener("input", () => {
        const url = (pcImagenUrl.value || "").trim();
        if (pcImagenHidden) pcImagenHidden.value = url;
        updateImagenPreview();
        refreshDebug();
    });
    document.getElementById("pc-es-destacado")?.addEventListener("change", refreshDebug);
    document.getElementById("pc-habilitado")?.addEventListener("change", refreshDebug);
});
