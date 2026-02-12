document.addEventListener("DOMContentLoaded", () => {
    const menuActivo = window.APP_CONFIG?.menuActivo || "menu-compuesto";
    const link = document.getElementById("link-menu-publicado");
    if (link) link.href = `../menu/${menuActivo}/${menuActivo}.html`;
});
