/**
 * Sesión de pedido (circuito público sin login).
 * Si pasa el tiempo configurado sin actividad, se limpia el carrito y se redirige al inicio.
 * Requiere config.js cargado antes (APP_CONFIG.sesionPedidoTimeoutMinutos).
 */
(function () {
    "use strict";

    const SESION_KEY = "toro_sesion_ultima_actividad";
    const PEDIDO_KEY = "toro_pedido";
    const KEYS_TO_CLEAR = [
        PEDIDO_KEY,
        SESION_KEY,
        "toro_producto_detalle",
        "toro_add_product_id",
        "toro_add_product_qty",
        "toro_add_product_options",
        "toro_scroll_resumen"
    ];

    function getTimeoutMinutos() {
        const n = Number(window.APP_CONFIG?.sesionPedidoTimeoutMinutos);
        return typeof n === "number" && n > 0 ? n : 0;
    }

    function getLastActivity() {
        try {
            const raw = sessionStorage.getItem(SESION_KEY);
            if (!raw) return null;
            const t = new Date(raw).getTime();
            return isNaN(t) ? null : t;
        } catch (e) {
            return null;
        }
    }

    /** Limpia datos de pedido/carrito y sesión. */
    function clearSesionPedido() {
        try {
            KEYS_TO_CLEAR.forEach(function (key) {
                sessionStorage.removeItem(key);
            });
        } catch (e) {
            console.warn("sesion-pedido: error al limpiar", e);
        }
    }

    /**
     * Comprueba si la sesión expiró. Si expiró, limpia y redirige a la URL indicada.
     * @param {string} redirectUrl - URL relativa al index (ej. "../../index.html" o "../../../index.html")
     * @returns {boolean} true si expiró y ya redirigió (el caller debe salir); false si todo ok
     */
    function checkAndExpirarSesionPedido(redirectUrl) {
        const timeoutMin = getTimeoutMinutos();
        if (timeoutMin === 0) return false;

        const last = getLastActivity();
        if (last === null) return false;

        const ahora = Date.now();
        const diffMin = (ahora - last) / (60 * 1000);
        if (diffMin < timeoutMin) return false;

        clearSesionPedido();
        try {
            window.location.replace(redirectUrl || "../../index.html");
        } catch (e) {
            window.location.href = redirectUrl || "../../index.html";
        }
        return true;
    }

    /** Marca actividad reciente (renueva la sesión). Llamar al cargar menú/pedidos o al agregar/quitar del carrito. */
    function touchSesionPedido() {
        if (getTimeoutMinutos() === 0) return;
        try {
            sessionStorage.setItem(SESION_KEY, new Date().toISOString());
        } catch (e) {}
    }

    window.checkAndExpirarSesionPedido = checkAndExpirarSesionPedido;
    window.touchSesionPedido = touchSesionPedido;
    window.clearSesionPedido = clearSesionPedido;
})();
