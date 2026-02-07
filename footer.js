window.applyFooterConfig = function applyFooterConfig() {
    const yearEl = document.getElementById("footer-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const config = window.APP_CONFIG || {};
    const ig = config.instagram || {};
    const igLink = document.getElementById("footer-ig");
    if (igLink) {
        igLink.href = ig.url || "#";
        igLink.textContent = ig.name ? `@${ig.name}` : "@Instagram";
    }

    const pedidosYa = document.getElementById("footer-pedidosya");
    if (pedidosYa) pedidosYa.href = config.plataformas?.pedidosYa || "#";
    const rappi = document.getElementById("footer-rappi");
    if (rappi) rappi.href = config.plataformas?.rappi || "#";
};
