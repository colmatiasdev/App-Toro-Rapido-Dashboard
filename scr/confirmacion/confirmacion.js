document.addEventListener("DOMContentLoaded", () => {
    const igConfig = window.APP_CONFIG?.instagram || {};
    const igLink = document.getElementById("ig-link");
    const igName = document.getElementById("ig-name");
    if (igLink) igLink.href = igConfig.url || "#";
    if (igName) igName.textContent = igConfig.name ? `@${igConfig.name}` : "@ToroRapidoOk";

    const params = new URLSearchParams(window.location.search);
    const esReserva = params.get("reserva") === "1";
    const successBadge = document.querySelector(".success-badge");
    const titulo = document.querySelector(".status-container h1");
    const subtitulo = document.querySelector(".status-container p");
    if (esReserva && successBadge) {
        successBadge.innerHTML = "<i class=\"fa-solid fa-calendar-check\"></i> Reserva realizada";
    }
    if (esReserva && titulo) titulo.textContent = "¡Reserva enviada!";
    if (esReserva && subtitulo) subtitulo.textContent = "Tu reserva fue enviada por WhatsApp. El pedido se preparará para cuando abramos el local. Te avisaremos por WhatsApp.";

    const menuActivo = window.APP_CONFIG?.menuActivo || "menu-simple";
    const linkCarta = document.getElementById("link-volver-carta");
    if (linkCarta) linkCarta.href = `../menu/${menuActivo}/${menuActivo}.html`;
});
