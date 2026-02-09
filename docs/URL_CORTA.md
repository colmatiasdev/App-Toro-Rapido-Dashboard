# Cómo configurar una URL corta para redes y mensajes

Una **URL corta** permite compartir el enlace de tu pedido online en Instagram, WhatsApp, historias o mensajes sin pegar la dirección larga del sitio. Ejemplo: `https://bit.ly/tororapido` en lugar de `https://tudominio.com/carpeta/...`.

---

## 1. Crear la URL corta

Elegí **una** de estas opciones y creá un enlace que apunte a la **URL pública** de tu sitio (donde está publicado el index, por ejemplo GitHub Pages, Netlify o tu hosting).

### Opción A: Bitly (recomendado)

1. Entrá a [bitly.com](https://bitly.com) y creá una cuenta gratis.
2. Clic en **Create** → pegá la URL completa de tu sitio (ej. `https://tudominio.com` o `https://usuario.github.io/toro-rapido`).
3. Elegí o editá el enlace corto (ej. `bit.ly/tororapido`).
4. Guardá. Esa URL corta es la que vas a configurar.

**Ventaja:** Podés ver estadísticas de clics y cambiar a qué URL apunta sin tocar el código.

### Opción B: TinyURL

1. Entrá a [tinyurl.com](https://tinyurl.com).
2. Pegá la URL completa de tu sitio.
3. Opcional: elegí un alias (ej. `tinyurl.com/tororapido`).
4. Generá el enlace y copialo.

### Opción C: Dominio propio corto

Si tenés un dominio (ej. `tororapido.com`):

- En el panel de tu proveedor de dominio (DonWeb, Nube, etc.) configurá una **redirección** o **redirect**: que `https://pedi.tororapido.com` (o `tororapido.com/pedi`) redirija a la URL completa de tu sitio.
- La “URL corta” que vas a usar es esa: `https://pedi.tororapido.com` (o la que hayas elegido).

---

## 2. Configurarla en el proyecto

En **`config.js`** (raíz del proyecto), en la sección **Contacto y redes**, completá `urlCorta` con la URL corta **completa** (con `https://`):

```js
urlCorta: "https://bit.ly/tororapido",
```

Si todavía no tenés URL corta, dejalo vacío:

```js
urlCorta: "",
```

---

## 3. Dónde se usa

- Si en el **footer** o en la **portada** hay un botón o texto del tipo “Pedí acá” o “Ver menú”, se puede enlazar usando `urlCorta` cuando esté definida (el código puede usar `window.APP_CONFIG.urlCorta` y, si existe, mostrar ese enlace para compartir).
- Para **redes sociales**: cuando publiques en Instagram, Facebook o WhatsApp, usá directamente la URL corta que pusiste en `urlCorta` (copiándola de config o de donde la muestre la app).
- Para **mensajes**: podés copiar esa misma URL y mandarla por WhatsApp o SMS.

---

## 4. Consejos

- **Siempre** usá la URL **pública y final** de tu sitio al crear el acortador (la que abre el sitio en producción).
- Si cambiás de hosting o de dominio, actualizá la redirección en Bitly/TinyURL o en tu dominio para que la URL corta siga apuntando al sitio nuevo.
- En Bitly podés editar el destino del enlace sin cambiar la URL corta; así no hace falta tocar `config.js` cada vez que cambie la URL larga.

---

## Resumen

| Paso | Acción |
|------|--------|
| 1 | Crear la URL corta en Bitly, TinyURL o con tu dominio. |
| 2 | En `config.js` poner esa URL en `urlCorta` (con `https://`). |
| 3 | Usar esa misma URL en redes, historias y mensajes. |
