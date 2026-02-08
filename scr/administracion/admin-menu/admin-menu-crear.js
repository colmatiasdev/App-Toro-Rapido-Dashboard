const URL_CSV = window.APP_CONFIG?.googleSheetUrl || "";
const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const MENU_SHEET_NAME = window.APP_CONFIG?.menuSheetName || "menu-toro-rapido-web";

const normalizeKey = (value) => value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const cleanText = (value) => (value ?? "").toString().trim();

const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            row.push(current);
            current = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") {
                i += 1;
            }
            row.push(current);
            if (row.some((cell) => cell.trim() !== "")) {
                rows.push(row);
            }
            row = [];
            current = "";
        } else {
            current += char;
        }
    }

    if (current.length || row.length) {
        row.push(current);
        if (row.some((cell) => cell.trim() !== "")) {
            rows.push(row);
        }
    }

    return rows;
};

const getMaxOrder = (rows, idxOrder) => {
    let max = 0;
    rows.forEach((row) => {
        const value = cleanText(row[idxOrder]);
        const num = Number.parseFloat(value);
        if (!Number.isNaN(num)) max = Math.max(max, num);
    });
    return max;
};

const setAutoOrder = async () => {
    const input = document.getElementById("orden-input");
    if (!input) return;
    input.value = "";
    if (!URL_CSV) return;
    try {
        const response = await fetch(URL_CSV);
        if (!response.ok) return;
        const csvText = await response.text();
        const rows = parseCsv(csvText);
        if (rows.length < 2) return;
        const headers = rows.shift().map((header) => normalizeKey(header));
        const idxOrder = headers.findIndex((h) => ["orden", "order", "posicion", "position"].includes(h));
        if (idxOrder === -1) return;
        const maxOrder = getMaxOrder(rows, idxOrder);
        input.value = maxOrder + 1;
    } catch (error) {
        console.error(error);
    }
};

const setAutoId = () => {
    const input = document.getElementById("idproducto-input");
    if (!input) return;
    input.value = `PROD-${Date.now()}`;
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
    form.querySelector('[name="idproducto"]').value = item.id || "";
    form.querySelector('[name="categoria"]').value = item.category || "";
    form.querySelector('[name="producto"]').value = item.name || "";
    form.querySelector('[name="descripcion"]').value = item.desc || "";
    form.querySelector('[name="precio"]').value = item.price || "";
    form.querySelector('[name="esdestacado"]').value = item.destacado ? item.destacado.toUpperCase() : "NO";
    form.querySelector('[name="productoagotado"]').value = item.agotado || "NO";
    form.querySelector('[name="stock"]').value = item.stock || "";
    currentImageUrl = item.image || "";
    setImagePreview(currentImageUrl);
};

const loadForEdit = async (id) => {
    if (!URL_CSV || !id) return;
    try {
        const response = await fetch(URL_CSV);
        if (!response.ok) return;
        const csvText = await response.text();
        const rows = parseCsv(csvText);
        if (rows.length < 2) return;

        const headers = rows.shift().map((header) => normalizeKey(header));
        const findIndex = (candidates) => headers.findIndex((header) => candidates.includes(header));

        const idxCategory = findIndex(["categoria", "categorias", "category", "cat", "rubro", "tipo"]);
        const idxName = findIndex(["producto", "nombre", "product", "name", "titulo", "item"]);
        const idxPrice = findIndex(["precio", "price", "valor", "importe", "costo"]);
        const idxAgotado = findIndex(["productoagotado", "agotado"]);
        const idxStock = findIndex(["stock"]);
        const idxId = findIndex(["idproducto", "idprod", "id", "codigo", "sku"]);
        const idxOrder = findIndex(["orden", "order", "posicion", "position"]);
        const idxDesc = findIndex(["descripcion", "desc", "detalle", "detalleproducto", "descripcionproducto"]);
        const idxImg = findIndex(["imagen", "img", "image", "foto", "url", "urlimagen", "imagenurl"]);
        const idxDestacado = findIndex(["esdestacado", "destacado"]);

        const match = rows.find((row) => cleanText(row[idxId]) === id);
        if (!match) return;

        fillForm({
            order: idxOrder === -1 ? "" : cleanText(match[idxOrder]),
            id: cleanText(match[idxId]),
            category: idxCategory === -1 ? "" : cleanText(match[idxCategory]),
            name: idxName === -1 ? "" : cleanText(match[idxName]),
            price: idxPrice === -1 ? "" : cleanText(match[idxPrice]),
            stock: idxStock === -1 ? "" : cleanText(match[idxStock]),
            agotado: idxAgotado === -1 ? "NO" : cleanText(match[idxAgotado]),
            desc: idxDesc === -1 ? "" : cleanText(match[idxDesc]),
            image: idxImg === -1 ? "" : cleanText(match[idxImg]),
            destacado: idxDestacado === -1 ? "" : cleanText(match[idxDestacado])
        });
        setFormMode("edit");
    } catch (error) {
        console.error(error);
    }
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
            const file = fileInput.files[0];
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            imageUrl = base64;
            setImagePreview(base64);
        }
        if (!imageUrl && formMode === "edit") {
            imageUrl = currentImageUrl;
        }

        const isCreate = formMode !== "edit";
        const payload = {
            action: formMode === "edit" ? "update" : "create",
            sheetName: MENU_SHEET_NAME,
            orden: cleanText(data.get("orden")),
            idproducto: cleanText(data.get("idproducto")),
            Categoria: cleanText(data.get("categoria")),
            Producto: cleanText(data.get("producto")),
            Descripcion: cleanText(data.get("descripcion")),
            Precio: cleanText(data.get("precio")),
            Imagen: imageUrl,
            "Es Destacado": cleanText(data.get("esdestacado")) || "NO",
            "Producto Agotado": cleanText(data.get("productoagotado")) || "NO",
            stock: cleanText(data.get("stock")),
            habilitado: isCreate ? "SI" : undefined,
            Habilitado: isCreate ? "SI" : undefined
        };

        if (!payload.Categoria || !payload.Producto || !payload.Precio) {
            alert("Completá Categoría, Producto y Precio.");
            return;
        }

        try {
            await fetch(MENU_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(payload)
            });
            setDebug("Enviado. Revisá el Sheet para confirmar.");
            alert(formMode === "edit" ? "Ítem enviado para actualizar." : "Ítem enviado para crear.");
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
    const crearContainer = document.getElementById("admin-menu-crear");
    fetch("admin-menu-crear-fragment.html")
        .then((res) => res.ok ? res.text() : "")
        .then((html) => {
            if (crearContainer && html) crearContainer.innerHTML = html;
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
        })
        .catch(() => {
            initForm();
            setFormMode("create");
        });
});
