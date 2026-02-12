/**
 * Página Productos compuestos.
 * Enlaces a agregar ítem (subproductos) y al menú compuesto.
 * Si se llega con parámetros de inserción (idproducto, numItems) o hay datos en sessionStorage, se muestra el resumen de la última inserción.
 */
function cell(content) {
    const td = document.createElement("td");
    td.textContent = content !== undefined && content !== null && String(content).trim() !== "" ? String(content).trim() : "—";
    return td;
}

document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("main.admin-menu");
    if (main) main.classList.add("admin-productos-compuestos");

    const params = new URLSearchParams(window.location.search);
    const idproductoParam = params.get("idproducto");
    const numItemsParam = params.get("numItems");

    let datos = null;
    try {
        const stored = sessionStorage.getItem("ultimaInsercionCompuesto");
        if (stored) datos = JSON.parse(stored);
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
    const tablaWrap = document.getElementById("ultima-insercion-tabla-wrap");
    const tbody = document.getElementById("ultima-insercion-tbody");

    if (wrap && resumenEl && datos && datos.idproducto) {
        wrap.style.display = "block";
        resumenEl.textContent = "Producto compuesto " + datos.idproducto + " con " + (datos.numItems || 0) + " ítem(s) guardado(s) en productos-compuesto-detalle.";

        if (tablaWrap && tbody && datos.items && datos.items.length > 0) {
            tablaWrap.style.display = "block";
            tbody.innerHTML = "";
            datos.items.forEach((it) => {
                const tr = document.createElement("tr");
                tr.appendChild(cell(it["idproducto-base"]));
                tr.appendChild(cell(String(it.Cantidad)));
                tr.appendChild(cell(it.Producto || "—"));
                tr.appendChild(cell(String(it["Precio Unitario Actual"] ?? "—")));
                tr.appendChild(cell(String(it["Precio Total Actual"] ?? "—")));
                tbody.appendChild(tr);
            });
        }

        try {
            sessionStorage.removeItem("ultimaInsercionCompuesto");
        } catch (e) {}
    }
});
