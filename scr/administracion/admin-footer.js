document.addEventListener("DOMContentLoaded", () => {
    const year = new Date().getFullYear();
    document.querySelectorAll("[data-admin-year]").forEach((el) => {
        el.textContent = year;
    });
});
