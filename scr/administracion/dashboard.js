document.addEventListener("DOMContentLoaded", () => {
    const menuActivo = window.APP_CONFIG?.menuActivo || "menu-simple";
    const link = document.getElementById("link-menu-publicado");
    if (link) link.href = `../${menuActivo}/${menuActivo}.html`;
});
