const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const SHEET_NAME = window.APP_CONFIG?.menuProductosSheetName || "productos-base";

const cleanText = (value) => (value ?? "").toString().trim();

const normalizeKey = (value) => (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const getValue = (row, keys) => {
    if (!row || typeof row !== "object") return "";
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const k of Object.keys(row)) {
        const n = normalizeKey(k);
        if (keyList.some((c) => normalizeKey(c) === n)) return row[k];
    }
    return "";
};

const rowsFromSheetData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.headers && Array.isArray(data.rows)) {
        const headers = data.headers.map((h) => (h != null ? String(h).trim() : ""));
        return data.rows.map((row) => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = row[i]; });
            return obj;
        });
    }
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const fetchProductosList = async () => {
    if (!MENU_SCRIPT_URL) return [];
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(SHEET_NAME)}&_ts=${Date.now()}`;
    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        if (data?.error || data?.result === "error") return [];
        return rowsFromSheetData(data);
    } catch (e) {
        console.error(e);
        return [];
    }
};

const setDebug = (message) => {
    const box = document.getElementById("script-debug");
    if (!box) return;
    if (!message) {
        box.style.display = "none";
        box.textContent = "";
        return;
    }
    box.style.display = "block";
    box.textContent = message;
};

const VALIDATION = {
    idProductoMaxLen: 50,
    productoMaxLen: 200,
    categoriaMaxLen: 100,
    descripcionMaxLen: 500,
    imagenMaxLen: 500,
    stockMaxLen: 50,
    stockMax: 999
};

const showValidationErrors = (errors, form) => {
    const box = document.getElementById("form-validation-errors");
    if (!box) return;
    if (form) form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    if (!errors || errors.length === 0) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
    }
    box.innerHTML = "<strong>Revisá los siguientes datos:</strong><ul>" +
        errors.map((e) => "<li>" + e.message + "</li>").join("") + "</ul>";
    box.style.display = "block";
    if (form && errors[0].field) {
        const input = form.querySelector("[name=\"" + errors[0].field + "\"]");
        if (input) {
            input.classList.add("invalid");
            input.focus();
        }
    }
};

const clearValidationErrors = (form) => {
    const box = document.getElementById("form-validation-errors");
    if (box) { box.style.display = "none"; box.innerHTML = ""; }
    form?.querySelectorAll(".invalid")?.forEach((el) => el.classList.remove("invalid"));
};

const validateForm = (form) => {
    const data = new FormData(form);
    const idproducto = cleanText(data.get("idproducto"));
    const producto = cleanText(data.get("producto"));
    const errors = [];

    if (!idproducto) errors.push({ field: "idproducto", message: "ID Producto es obligatorio." });
    else if (idproducto.length > VALIDATION.idProductoMaxLen) {
        errors.push({ field: "idproducto", message: "ID Producto no puede superar " + VALIDATION.idProductoMaxLen + " caracteres." });
    }
    if (!producto) errors.push({ field: "producto", message: "Producto es obligatorio." });
    else if (producto.length > VALIDATION.productoMaxLen) {
        errors.push({ field: "producto", message: "Producto no puede superar " + VALIDATION.productoMaxLen + " caracteres." });
    }
    const categoria = cleanText(data.get("categoria"));
    if (!categoria) errors.push({ field: "categoria", message: "Categoría es obligatoria." });
    else if (categoria.length > VALIDATION.categoriaMaxLen) errors.push({ field: "categoria", message: "Categoría no puede superar " + VALIDATION.categoriaMaxLen + " caracteres." });
    const precioActualRaw = cleanText(data.get("precio_actual"));
    if (precioActualRaw === "") errors.push({ field: "precio_actual", message: "Precio Actual es obligatorio." });
    else {
        const n = Number(precioActualRaw.replace(",", "."));
        if (Number.isNaN(n) || n < 0) errors.push({ field: "precio_actual", message: "Precio Actual debe ser un número mayor o igual a 0." });
    }
    const descripcion = cleanText(data.get("descripcion"));
    if (descripcion.length > VALIDATION.descripcionMaxLen) errors.push({ field: "descripcion", message: "Descripción no puede superar " + VALIDATION.descripcionMaxLen + " caracteres." });
    const imagen = cleanText(data.get("imagen"));
    if (imagen.length > VALIDATION.imagenMaxLen) errors.push({ field: "imagen", message: "Imagen (URL) no puede superar " + VALIDATION.imagenMaxLen + " caracteres." });
    const stock = cleanText(data.get("stock"));
    if (stock.length > VALIDATION.stockMaxLen) errors.push({ field: "stock", message: "STOCK no puede superar " + VALIDATION.stockMaxLen + " caracteres." });
    if (stock !== "") {
        const stockNum = Number(stock.replace(",", "."));
        if (Number.isNaN(stockNum) || stockNum < 0) {
            errors.push({ field: "stock", message: "STOCK debe ser un número mayor o igual a 0 (máximo " + VALIDATION.stockMax + ", se ajusta automáticamente)." });
        }
    }
    return { valid: errors.length === 0, errors };
};

const ALPHANUM = "0123456789abcdefghijklmnopqrstuvwxyz";
const randomAlphanumeric = (len) => {
    let s = "";
    for (let i = 0; i < len; i++) s += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
    return s;
};

const generateNextIdProducto = (rows) => {
    const idKeys = ["ID Producto", "idproducto"];
    const existing = new Set(rows.map((r) => cleanText(getValue(r, idKeys)).toLowerCase()));
    let id;
    for (let i = 0; i < 20; i++) {
        id = "PROD-BASE-" + randomAlphanumeric(10);
        if (!existing.has(id.toLowerCase())) return id;
    }
    return "PROD-BASE-" + Date.now().toString(36) + randomAlphanumeric(4);
};

const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
};

const fillCategoriaDatalist = (rows) => {
    const datalist = document.getElementById("categoria-datalist");
    if (!datalist) return;
    const seen = new Set();
    const categorias = [];
    for (const r of rows) {
        const c = cleanText(getValue(r, ["Categoria", "categoria", "Categoría"]));
        if (c && !seen.has(c)) {
            seen.add(c);
            categorias.push(c);
        }
    }
    categorias.sort((a, b) => a.localeCompare(b, "es"));
    datalist.innerHTML = categorias.map((c) => `<option value="${escapeHtml(c)}">`).join("");
};

const setCreateModeId = async () => {
    const input = document.getElementById("id-producto-input");
    if (!input) return;
    input.readOnly = true;
    const rows = await fetchProductosList();
    fillCategoriaDatalist(rows);
    input.value = generateNextIdProducto(rows);
};

const initImagenPreview = () => {
    const hiddenInput = document.getElementById("imagen-input");
    const urlWrap = document.getElementById("imagen-url-wrap");
    const urlInput = document.getElementById("imagen-url-input");
    const cargarBtn = document.getElementById("imagen-cargar-btn");
    const previewEmpty = document.getElementById("imagen-preview-empty");
    const previewImg = document.getElementById("imagen-preview-img");
    if (!hiddenInput || !previewEmpty || !previewImg) return;

    const updatePreview = (url) => {
        const u = (url ?? (urlInput ? urlInput.value : hiddenInput.value) ?? "").trim();
        previewEmpty.textContent = "No hay imagen cargada";
        if (!u) {
            previewImg.style.display = "none";
            previewImg.src = "";
            previewImg.alt = "";
            previewEmpty.style.display = "block";
            return;
        }
        previewEmpty.style.display = "none";
        previewImg.alt = "Vista previa de la imagen del producto";
        previewImg.style.display = "block";
        previewImg.src = u;
        previewImg.onerror = () => {
            previewImg.style.display = "none";
            previewEmpty.textContent = "No se pudo cargar la imagen";
            previewEmpty.style.display = "block";
        };
        previewImg.onload = () => {
            previewEmpty.style.display = "none";
        };
    };

    const syncFromUrlInput = () => {
        const v = (urlInput && urlInput.value) ? urlInput.value.trim() : "";
        if (hiddenInput) hiddenInput.value = v;
        updatePreview(v);
    };

    if (cargarBtn && urlWrap && urlInput) {
        cargarBtn.addEventListener("click", () => {
            const isHidden = urlWrap.style.display === "none" || !urlWrap.style.display;
            urlWrap.style.display = isHidden ? "block" : "none";
            if (isHidden) setTimeout(() => urlInput.focus(), 50);
        });
        urlInput.addEventListener("input", syncFromUrlInput);
        urlInput.addEventListener("paste", () => setTimeout(syncFromUrlInput, 10));
    }

    updatePreview();
};

document.addEventListener("DOMContentLoaded", async () => {
    await setCreateModeId();
    initImagenPreview();

    const checkDestacado = document.getElementById("es_destacado_check");
    const inputDestacado = document.getElementById("es_destacado_input");
    if (checkDestacado && inputDestacado) {
        checkDestacado.addEventListener("change", () => {
            inputDestacado.value = checkDestacado.checked ? "SI" : "NO";
        });
    }

    const stockInput = document.querySelector('[name="stock"]');
    if (stockInput) {
        const capStock = () => {
            const v = stockInput.value;
            if (v === "") return;
            const n = Number(v.replace(",", "."));
            if (!Number.isNaN(n) && n > VALIDATION.stockMax) {
                stockInput.value = VALIDATION.stockMax;
            } else if (!Number.isNaN(n) && n < 0) {
                stockInput.value = "0";
            }
        };
        stockInput.addEventListener("blur", capStock);
    }

    const updateDebugPayloadProductos = () => {
        if (typeof window.renderDebugPayloadSection !== "function") return;
        const form = document.getElementById("producto-form");
        if (!form) return;
        const data = new FormData(form);
        const idproducto = cleanText(data.get("idproducto"));
        const categoria = cleanText(data.get("categoria"));
        const producto = cleanText(data.get("producto"));
        const descripcion = cleanText(data.get("descripcion"));
        const precioActual = cleanText(data.get("precio_actual"));
        const imagen = cleanText(data.get("imagen"));
        const esDestacado = (cleanText(data.get("es_destacado")) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const stockRaw = cleanText(data.get("stock"));
        const stockNumRaw = stockRaw === "" ? 0 : (Number(stockRaw.replace(",", ".")) || 0);
        const stock = String(Math.min(VALIDATION.stockMax, Math.max(0, stockNumRaw)));
        const precioNum = precioActual === "" ? "" : Number(precioActual) || 0;
        const mostarMontoDescuento = (cleanText(data.get("mostar_monto_descuento")) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const mostarDescuento = (cleanText(data.get("mostar_descuento")) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const payload = {
            action: "create",
            sheetName: SHEET_NAME,
            idproducto,
            "ID Producto": idproducto,
            Categoria: categoria,
            Producto: producto,
            Descripcion: descripcion,
            "Precio Actual": precioNum,
            "Precio Regular": precioNum,
            Imagen: imagen && imagen.length > 60 ? "(imagen)" : imagen,
            "Es Destacado": esDestacado,
            "Producto Agotado": "NO",
            STOCK: stock,
            Habilitado: "NO",
            "Mostar Monto Descuento": mostarMontoDescuento,
            "Mostar Descuento": mostarDescuento
        };
        window.renderDebugPayloadSection("debug-payload-wrap", [{
            sheetName: SHEET_NAME,
            actionType: "create",
            actionDescription: "Escritura en la hoja de Google Sheet. Se crea un nuevo producto base (ID, categoría, producto, descripción, precio, imagen, etc.).",
            payload
        }]);
    };

    const form = document.getElementById("producto-form");
    form?.addEventListener("input", updateDebugPayloadProductos);
    form?.addEventListener("change", updateDebugPayloadProductos);
    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearValidationErrors(form);
        if (!MENU_SCRIPT_URL) {
            alert("Falta configurar appsScriptMenuUrl en config.js.");
            return;
        }
        const validation = validateForm(form);
        if (!validation.valid) {
            showValidationErrors(validation.errors, form);
            return;
        }
        const submitBtn = document.getElementById("submit-btn");
        const originalSubmitText = submitBtn?.textContent || "Guardar";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Guardando...";
        }
        try {
        setDebug("Enviando...");

        const data = new FormData(form);
        const idproducto = cleanText(data.get("idproducto"));
        const categoria = cleanText(data.get("categoria"));
        const producto = cleanText(data.get("producto"));
        const descripcion = cleanText(data.get("descripcion"));
        const precioActual = cleanText(data.get("precio_actual"));
        const imagen = cleanText(data.get("imagen"));
        const esDestacado = (cleanText(data.get("es_destacado")) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const stockRaw = cleanText(data.get("stock"));
        const stockNumRaw = stockRaw === "" ? 0 : (Number(stockRaw.replace(",", ".")) || 0);
        const stock = String(Math.min(VALIDATION.stockMax, Math.max(0, stockNumRaw)));
        const precioNum = precioActual === "" ? "" : Number(precioActual) || 0;

        const mostarMontoDescuento = (cleanText(data.get("mostar_monto_descuento")) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const mostarDescuento = (cleanText(data.get("mostar_descuento")) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const payload = {
            action: "create",
            sheetName: SHEET_NAME,
            idproducto: idproducto,
            "ID Producto": idproducto,
            Categoria: categoria,
            Producto: producto,
            Descripcion: descripcion,
            "Precio Actual": precioNum,
            "Precio Regular": precioNum,
            Imagen: imagen,
            "Es Destacado": esDestacado,
            "Producto Agotado": "NO",
            STOCK: stock,
            Habilitado: "NO",
            "Mostar Monto Descuento": mostarMontoDescuento,
            "Mostar Descuento": mostarDescuento
        };

        try {
            await fetch(MENU_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            setDebug("Enviado. Revisá el Sheet.");
            alert("Producto enviado para crear.");
            window.location.href = "admin-productos.html";
        } catch (error) {
            console.error(error);
            setDebug("Error: " + (error?.message || error));
            alert("No se pudo enviar. Revisá el Apps Script.");
        }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalSubmitText;
            }
        }
    });
    updateDebugPayloadProductos();
});
