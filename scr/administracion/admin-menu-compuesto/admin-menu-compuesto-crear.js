const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const MENU_SHEET_NAME = window.APP_CONFIG?.menuCompuestoSheetName || "menu-toro-rapido-web-compuesto";

const normalizeKey = (value) => (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const cleanText = (value) => (value ?? "").toString().trim();

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

const fetchSheetList = async () => {
    if (!MENU_SCRIPT_URL) return [];
    const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
    const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(MENU_SHEET_NAME)}&_ts=${Date.now()}`;
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

const setAutoOrder = async () => {
    const input = document.getElementById("orden-input");
    if (!input) return;
    input.value = "";
    const rows = await fetchSheetList();
    let max = 0;
    rows.forEach((row) => {
        const v = cleanText(getValue(row, ["orden", "order"]));
        const num = Number(v);
        if (!Number.isNaN(num)) max = Math.max(max, num);
    });
    input.value = max + 1;
};

const setAutoId = () => {
    const input = document.getElementById("idmenu-unico-input");
    if (!input) return;
    input.value = `MENU-${Date.now()}`;
};

const setFormMode = (mode) => {
    const formMode = document.getElementById("form-mode");
    const submitBtn = document.getElementById("submit-btn");
    const cancelBtn = document.getElementById("cancel-edit");
    const uploadBlock = document.getElementById("upload-image-block");
    const changeBtn = document.getElementById("change-image-btn");
    if (formMode) formMode.value = mode;
    if (submitBtn) submitBtn.textContent = mode === "edit" ? "Actualizar" : "Guardar";
    if (cancelBtn) cancelBtn.style.display = mode === "edit" ? "inline-flex" : "none";
    if (uploadBlock) uploadBlock.style.display = mode === "edit" ? "none" : "grid";
    if (changeBtn) changeBtn.style.display = mode === "edit" ? "inline-flex" : "none";
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

let currentImageUrl = "";

const setImagePreview = (url) => {
    const wrapper = document.getElementById("image-preview");
    const img = document.getElementById("image-preview-img");
    if (!wrapper || !img) return;
    if (!url) {
        wrapper.style.display = "none";
        img.src = "";
        return;
    }
    wrapper.style.display = "grid";
    img.src = url;
};

const fillForm = (item) => {
    const form = document.getElementById("add-item-form");
    if (!form) return;
    form.querySelector('[name="orden"]').value = item.order || "";
    form.querySelector('[name="idmenu-unico"]').value = item.id || "";
    form.querySelector('[name="tipomenu"]').value = item.tipoMenu || "MENU-SIMPLE";
    form.querySelector('[name="idmenu-variable"]').value = item.idmenuVariable || "";
    form.querySelector('[name="categoria"]').value = item.category || "";
    form.querySelector('[name="producto"]').value = item.name || "";
    form.querySelector('[name="descripcionproducto"]').value = item.desc || "";
    form.querySelector('[name="precioactual"]').value = item.precioActual || "";
    form.querySelector('[name="precioregular"]').value = item.precioRegular || "";
    form.querySelector('[name="mostrardescuento"]').value = item.mostrarDescuento || "NO";
    form.querySelector('[name="esdestacado"]').value = item.esDestacado || "NO";
    form.querySelector('[name="productoagotado"]').value = item.productoAgotado || "NO";
    form.querySelector('[name="stock"]').value = item.stock || "";
    currentImageUrl = item.image || "";
    setImagePreview(currentImageUrl);
};

const loadForEdit = async (id) => {
    if (!id) return;
    const rows = await fetchSheetList();
    const row = rows.find((r) => cleanText(getValue(r, ["idmenu-unico", "idmenuunico", "idproducto"])) === id);
    if (!row) return;

    const parsePrice = (v) => {
        const raw = cleanText(v);
        if (!raw) return "";
        const n = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
        return Number.parseFloat(n);
    };
    fillForm({
        order: cleanText(getValue(row, ["orden"])),
        id: cleanText(getValue(row, ["idmenu-unico", "idmenuunico"])),
        tipoMenu: cleanText(getValue(row, ["Tipo Menu", "tipomenu"])) || "MENU-SIMPLE",
        idmenuVariable: cleanText(getValue(row, ["idmenu-variable", "idmenuvariable"])),
        category: cleanText(getValue(row, ["Categoria", "categoria"])),
        name: cleanText(getValue(row, ["Producto", "producto"])),
        desc: cleanText(getValue(row, ["Descripcion Producto", "descripcionproducto", "Descripcion"])),
        precioActual: parsePrice(getValue(row, ["Precio Actual", "precioactual"])),
        precioRegular: parsePrice(getValue(row, ["Precio Regular", "precioregular"])),
        mostrarDescuento: cleanText(getValue(row, ["Mostar Descuento", "Mostrar Descuento", "mostrardescuento"])) || "NO",
        image: cleanText(getValue(row, ["Imagen", "imagen"])),
        esDestacado: cleanText(getValue(row, ["Es Destacado", "esdestacado"])) || "NO",
        productoAgotado: cleanText(getValue(row, ["Producto Agotado", "productoagotado"])) || "NO",
        stock: cleanText(getValue(row, ["Stock", "stock"]))
    });
    setFormMode("edit");
};

const initForm = () => {
    const form = document.getElementById("add-item-form");
    const cancelBtn = document.getElementById("cancel-edit");
    cancelBtn?.addEventListener("click", () => {
        form?.reset();
        const fileInput = document.getElementById("imagen-file");
        if (fileInput) fileInput.value = "";
        setImagePreview("");
        currentImageUrl = "";
        setFormMode("create");
    });

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!MENU_SCRIPT_URL) {
            alert("Falta configurar appsScriptMenuUrl en config.js.");
            return;
        }
        setDebug("Enviando datos al Apps Script...");

        const formMode = document.getElementById("form-mode")?.value || "create";
        const data = new FormData(form);
        const fileInput = document.getElementById("imagen-file");
        let imageUrl = "";
        if (fileInput?.files?.[0]) {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(fileInput.files[0]);
            });
            imageUrl = base64;
            setImagePreview(base64);
        }
        if (!imageUrl && formMode === "edit") imageUrl = currentImageUrl;

        const isCreate = formMode !== "edit";
        const payload = {
            action: isCreate ? "create" : "update",
            sheetName: MENU_SHEET_NAME,
            orden: cleanText(data.get("orden")),
            "idmenu-unico": cleanText(data.get("idmenu-unico")),
            "Tipo Menu": cleanText(data.get("tipomenu")) || "MENU-SIMPLE",
            "idmenu-variable": cleanText(data.get("idmenu-variable")),
            Categoria: cleanText(data.get("categoria")),
            Producto: cleanText(data.get("producto")),
            "Descripcion Producto": cleanText(data.get("descripcionproducto")),
            "Precio Actual": cleanText(data.get("precioactual")),
            "Precio Regular": cleanText(data.get("precioregular")),
            "Mostar Descuento": cleanText(data.get("mostrardescuento")) || "NO",
            Imagen: imageUrl,
            "Es Destacado": cleanText(data.get("esdestacado")) || "NO",
            "Producto Agotado": cleanText(data.get("productoagotado")) || "NO",
            Stock: cleanText(data.get("stock")),
            habilitado: isCreate ? "SI" : undefined,
            Habilitado: isCreate ? "SI" : undefined
        };

        if (!payload.Categoria || !payload.Producto || !payload["Precio Actual"]) {
            alert("Completá Categoría, Producto y Precio Actual.");
            return;
        }

        try {
            await fetch(MENU_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            setDebug("Enviado. Revisá el Sheet para confirmar.");
            alert(isCreate ? "Ítem enviado para crear." : "Ítem enviado para actualizar.");
            form.reset();
            if (fileInput) fileInput.value = "";
            setImagePreview("");
            currentImageUrl = "";
            setFormMode("create");
        } catch (error) {
            console.error(error);
            setDebug(`Error al enviar: ${error?.message || error}`);
            alert("No se pudo enviar el ítem. Revisá el Apps Script.");
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    initForm();
    setFormMode("create");
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
        loadForEdit(id);
    } else {
        setAutoId();
        setAutoOrder();
    }
    const fileInput = document.getElementById("imagen-file");
    const uploadBtn = document.getElementById("upload-image-btn");
    const changeBtn = document.getElementById("change-image-btn");
    uploadBtn?.addEventListener("click", () => fileInput?.click());
    changeBtn?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) {
            setImagePreview("");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    });
});
