const MENU_SCRIPT_URL = window.APP_CONFIG?.appsScriptMenuUrl || "";
const SHEET_NAME = window.APP_CONFIG?.menuOpcionesSheetName || "opciones-base";

const state = { rows: [] };

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

const parseRecargo = (value) => {
    const raw = cleanText(value);
    if (!raw) return 0;
    const n = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const num = Number.parseFloat(n);
    return Number.isNaN(num) ? 0 : num;
};

const loadOpciones = async () => {
    const tbody = document.getElementById("opciones-body");
    if (!tbody) return;

    if (!MENU_SCRIPT_URL) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-loading">No hay Apps Script configurado (appsScriptMenuUrl en config.js).</td></tr>`;
        return;
    }

    try {
        const sep = MENU_SCRIPT_URL.includes("?") ? "&" : "?";
        const url = `${MENU_SCRIPT_URL}${sep}action=list&sheetName=${encodeURIComponent(SHEET_NAME)}&_ts=${Date.now()}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar");
        const text = await response.text();
        let data = null;
        try { data = JSON.parse(text); } catch (e) { throw new Error("Respuesta inválida"); }
        if (data?.error || data?.result === "error") throw new Error(data?.message || "Error");

        const rawRows = rowsFromSheetData(data);
        if (!rawRows.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-loading">No hay opciones. Agregá una desde el botón superior.</td></tr>`;
            return;
        }

        const habilitadaVal = (v) => (cleanText(v) || "NO").toUpperCase() === "SI" ? "SI" : "NO";
        const mapped = rawRows.map((row) => {
            const idopciones = cleanText(getValue(row, ["ID Opciones", "idopciones", "idproducto"]));
            const grupo = cleanText(getValue(row, ["Grupo", "grupo"]));
            const tipo = cleanText(getValue(row, ["Tipo", "tipo"])) || "uno";
            const obligatorio = cleanText(getValue(row, ["Obligatorio", "obligatorio"])) || "NO";
            const opcion = cleanText(getValue(row, ["Opcion", "opcion", "Opción"]));
            const recargo = parseRecargo(getValue(row, ["Recargo", "recargo"]));
            const habilitada = habilitadaVal(getValue(row, ["Habilitada", "habilitada"]));
            return { idopciones, grupo, tipo, obligatorio, opcion, recargo, habilitada };
        }).filter((r) => r.idopciones || r.grupo || r.opcion);

        const sorted = [...mapped].sort((a, b) => {
            const ga = (a.grupo || "").toLowerCase();
            const gb = (b.grupo || "").toLowerCase();
            if (ga !== gb) return ga.localeCompare(gb);
            return (a.opcion || "").toLowerCase().localeCompare((b.opcion || "").toLowerCase());
        });
        state.rows = sorted;

        const groups = {};
        sorted.forEach((row, idx) => {
            const g = row.grupo || "Sin grupo";
            if (!groups[g]) groups[g] = [];
            groups[g].push(idx);
        });
        const groupNames = Object.keys(groups).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        const btnHabilitada = (h, idx) => {
            const isSi = h === "SI";
            const cls = isSi ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no";
            const title = isSi ? "Habilitada. Clic para deshabilitar" : "Deshabilitada. Clic para habilitar";
            const icon = isSi ? "fa-circle-check" : "fa-circle-xmark";
            return `<button type="button" class="${cls}" data-index="${idx}" title="${title}" aria-label="${title}"><i class="fa-solid ${icon}"></i></button>`;
        };

        const parts = [];
        groupNames.forEach((grupoName) => {
            parts.push(`<tr class="opciones-group-header"><td colspan="6">${grupoName}</td></tr>`);
            groups[grupoName].forEach((idx) => {
                const row = state.rows[idx];
                parts.push(`
            <tr>
                <td class="tipo-cell"><span class="tipo-icon tipo-${(row.tipo || "").toLowerCase() === "varios" ? "varios" : "uno"}" title="${(row.tipo || "").toLowerCase() === "varios" ? "Varias opciones (checkbox)" : "Una opción (radio)"}" aria-hidden="true"><i class="fa-solid ${(row.tipo || "").toLowerCase() === "varios" ? "fa-square-check" : "fa-circle-dot"}"></i></span></td>
                <td>${(row.obligatorio || "").toUpperCase() === "SI" ? "Obligatorio" : "Opcional"}</td>
                <td>${row.opcion || "—"}</td>
                <td class="${row.recargo === 0 ? 'recargo-sin-cargo' : ''}">${row.recargo === 0 ? 'SIN CARGO' : '$ ' + Number(row.recargo).toLocaleString("es-AR")}</td>
                <td class="habilitada-cell">${btnHabilitada(row.habilitada, idx)}</td>
                <td class="actions">
                    <a class="action-btn" href="admin-opciones-edit.html" data-action="edit" data-index="${idx}">Editar</a>
                </td>
            </tr>`);
            });
        });
        tbody.innerHTML = parts.join("");
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="6" class="table-loading">No se pudo cargar las opciones.</td></tr>`;
    }
};

const STORAGE_KEY = "opcionesEdit";

function setupOpcionesTableListeners() {
    const tbody = document.getElementById("opciones-body");
    if (!tbody) return;
    tbody.addEventListener("click", async function (e) {
        const toggleBtn = e.target.closest(".habilitada-btn");
        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            const idx = parseInt(toggleBtn.getAttribute("data-index"), 10);
            const row = state.rows[idx];
            if (!row || !MENU_SCRIPT_URL) return;
            const newHabilitada = row.habilitada === "SI" ? "NO" : "SI";
            const isSi = newHabilitada === "SI";
            const newCls = isSi ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no";
            const newTitle = isSi ? "Habilitada. Clic para deshabilitar" : "Deshabilitada. Clic para habilitar";
            const newIcon = isSi ? "fa-circle-check" : "fa-circle-xmark";
            toggleBtn.className = newCls + " habilitada-btn-loading";
            toggleBtn.setAttribute("title", newTitle);
            toggleBtn.setAttribute("aria-label", newTitle);
            const iconEl = toggleBtn.querySelector("i.fa-solid");
            if (iconEl) iconEl.className = "fa-solid " + newIcon;
            toggleBtn.disabled = true;
            let prevIcon = row.habilitada === "SI" ? "fa-circle-check" : "fa-circle-xmark";
            try {
                const payload = {
                    action: "update",
                    sheetName: SHEET_NAME,
                    idopcionesOld: row.idopciones || "",
                    grupoOld: row.grupo || "",
                    opcionOld: row.opcion || "",
                    idopciones: row.idopciones || "",
                    "ID Opciones": row.idopciones || "",
                    Grupo: row.grupo || "",
                    Tipo: row.tipo || "",
                    Obligatorio: row.obligatorio || "",
                    Opcion: row.opcion || "",
                    Recargo: String(row.recargo),
                    Habilitada: newHabilitada
                };
                await fetch(MENU_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });
                await loadOpciones();
            } catch (err) {
                console.error(err);
                alert("No se pudo actualizar Habilitada. Revisá la consola.");
                toggleBtn.className = (row.habilitada === "SI" ? "habilitada-btn habilitada-si" : "habilitada-btn habilitada-no");
                const prevTitle = row.habilitada === "SI" ? "Habilitada. Clic para deshabilitar" : "Deshabilitada. Clic para habilitar";
                toggleBtn.setAttribute("title", prevTitle);
                toggleBtn.setAttribute("aria-label", prevTitle);
                if (iconEl) iconEl.className = "fa-solid " + prevIcon;
            } finally {
                toggleBtn.disabled = false;
                toggleBtn.classList.remove("habilitada-btn-loading");
            }
            return;
        }
        const link = e.target.closest(".action-btn[data-action='edit']");
        if (!link) return;
        const idx = parseInt(link.getAttribute("data-index"), 10);
        const row = state.rows[idx];
        if (!row) return;
        e.preventDefault();
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                idopciones: row.idopciones || "",
                grupo: row.grupo || "",
                opcion: row.opcion || ""
            }));
        } catch (err) {
            console.warn("sessionStorage no disponible", err);
        }
        window.location.href = "admin-opciones-edit.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupOpcionesTableListeners();
    loadOpciones();
});
