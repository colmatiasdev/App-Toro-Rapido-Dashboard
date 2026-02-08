document.addEventListener("DOMContentLoaded", () => {
    try { sessionStorage.removeItem("toro_pedido"); } catch (e) {}

    const config = window.APP_CONFIG || {};
    const menuActivo = config.menuActivo || "menu-simple";
    const container = document.getElementById("hero-btns-menu");

    if (config.debug && Array.isArray(config.menuVersiones) && config.menuVersiones.length > 0 && container) {
        const label = (id) => id.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
        container.innerHTML = config.menuVersiones.map((id) =>
            `<a href="scr/${id}/${id}.html" class="btn-primary btn-menu-version">Realiza tu pedido (${label(id)})</a>`
        ).join("");
    } else if (container) {
        const linkMenu = document.getElementById("link-menu-activo");
        if (linkMenu) linkMenu.href = `scr/${menuActivo}/${menuActivo}.html`;
    }

    const slides = Array.from(document.querySelectorAll(".slide"));
    const randomInt = (max) => {
        if (max <= 0) return 0;
        if (window.crypto?.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] % max;
        }
        return Math.floor(Math.random() * max);
    };
    const shuffleIndices = (count) => {
        const indices = Array.from({ length: count }, (_, idx) => idx);
        for (let i = indices.length - 1; i > 0; i -= 1) {
            const j = randomInt(i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices;
    };
    const setActiveSlide = (nextIndex) => {
        slides.forEach((slide) => slide.classList.remove("active"));
        slides[nextIndex].classList.add("active");
    };
    let order = slides.length ? shuffleIndices(slides.length) : [];
    if (order.length > 1) {
        const lastFirst = sessionStorage.getItem("toro_carousel_first");
        if (lastFirst !== null && Number(lastFirst) === order[0]) {
            order.push(order.shift());
        }
        sessionStorage.setItem("toro_carousel_first", String(order[0]));
    }
    let orderIndex = 0;
    if (order.length) {
        setActiveSlide(order[orderIndex]);
    }
    const advanceSlide = () => {
        if (slides.length < 2) return;
        orderIndex += 1;
        if (orderIndex >= order.length) {
            order = shuffleIndices(slides.length);
            orderIndex = 0;
        }
        setActiveSlide(order[orderIndex]);
    };
    if (slides.length > 1) {
        setInterval(advanceSlide, 5000);
    }

    const igConfig = window.APP_CONFIG?.instagram || {};
    const igLink = document.getElementById("ig-link");
    const igName = document.getElementById("ig-name");
    if (igLink) igLink.href = igConfig.url || "#";
    if (igName) igName.textContent = igConfig.name ? `@${igConfig.name}` : "@Instagram";

    const wspLink = document.getElementById("wsp-link");
    const wspNumber = window.APP_CONFIG?.telefonoNegocio || "";
    if (wspLink) wspLink.href = wspNumber ? `https://wa.me/${wspNumber}` : "#";
    if (wspLink) wspLink.setAttribute("aria-label", "Escribinos por WhatsApp");

    const pedidosYaLink = document.getElementById("pedidosya-link");
    if (pedidosYaLink) pedidosYaLink.href = window.APP_CONFIG?.plataformas?.pedidosYa || "#";
    const rappiLink = document.getElementById("rappi-link");
    if (rappiLink) rappiLink.href = window.APP_CONFIG?.plataformas?.rappi || "#";
});
