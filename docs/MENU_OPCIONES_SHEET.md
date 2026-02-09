# Hoja de opciones / agregados del menú (Google Sheet)

Esta hoja define **grupos de opciones** por producto (aderezos, tamaño, agregados extra, guarnición, etc.) y el **recargo** de cada opción. Se usa en la página de detalle del producto y en el carrito.

## Nombre de la hoja

En `config.js` se configura el nombre, por ejemplo:

- **menu-opciones** (recomendado)

El mismo nombre debe existir como pestaña en tu Google Sheet.

---

## Columnas (primera fila = encabezados)

| Columna       | Descripción |
|---------------|-------------|
| **idproducto** | ID del producto al que aplican estas opciones. Debe ser **exactamente el mismo** que en la hoja del menú: en **menu-toro-rapido-web-compuesto** suele ser la columna **idproducto** o **idmenu-unico**; en **menu-toro-rapido-web-simple** la columna **idproducto** o **id**. Sin coincidencia no se mostrarán opciones para ese producto. |
| **Grupo**       | Nombre del grupo de opciones que verá el cliente (ej. "Aderezo", "Tamaño", "Agregados extra", "Guarnición"). |
| **Tipo**        | `uno` = el cliente elige **una sola** opción (como un radio). `varios` = puede elegir **varias** (como checkboxes). |
| **Obligatorio** | `SI` = el cliente **debe** elegir al menos una opción de este grupo antes de agregar al pedido. `NO` = es opcional. |
| **Opcion**      | Nombre de la opción que se muestra (ej. "Mayonesa", "Grande", "Huevo", "Papas fritas"). |
| **Recargo**     | Precio extra en pesos que se suma al precio del producto si el cliente elige esta opción. Usar `0` o vacío si no hay recargo. |

---

## Ejemplo de datos (como en PedidosYa)

Producto **BUR-01** (ej. Hamburguesa clásica):

| idproducto | Grupo          | Tipo   | Obligatorio | Opcion      | Recargo |
|------------|----------------|--------|-------------|-------------|---------|
| BUR-01     | Aderezo        | uno    | SI          | Mayonesa    | 0       |
| BUR-01     | Aderezo        | uno    | SI          | Mostaza     | 0       |
| BUR-01     | Aderezo        | uno    | SI          | Ketchup     | 0       |
| BUR-01     | Aderezo        | uno    | SI          | Aji         | 0       |
| BUR-01     | Tamaño         | uno    | SI          | Chico       | 0       |
| BUR-01     | Tamaño         | uno    | SI          | Grande      | 500     |
| BUR-01     | Agregados extra| varios | NO          | Huevo       | 300     |
| BUR-01     | Agregados extra| varios | NO          | Jamón       | 400     |
| BUR-01     | Agregados extra| varios | NO          | Queso       | 350     |
| BUR-01     | Guarnición     | uno    | SI          | Papas fritas| 0       |
| BUR-01     | Guarnición     | uno    | SI          | Puré        | 0       |
| BUR-01     | Guarnición     | uno    | SI          | Ensalada    | 0       |
| BUR-01     | Guarnición     | uno    | SI          | Arroz       | 0       |

Producto **PAP-01** (solo tamaño):

| idproducto | Grupo  | Tipo | Obligatorio | Opcion | Recargo |
|------------|--------|------|-------------|--------|---------|
| PAP-01     | Tamaño | uno  | SI          | Porción chica  | 0   |
| PAP-01     | Tamaño | uno  | SI          | Porción grande | 400 |

---

## Cómo diseñar la tabla en Google Sheet

1. **Crear una pestaña** con el nombre configurado (ej. `menu-opciones`).
2. **Fila 1:** encabezados exactos (podés usar mayúsculas/minúsculas o espacios; el sistema reconoce variantes).
   - idproducto, Grupo, Tipo, Obligatorio, Opcion, Recargo
3. **Desde la fila 2:** una fila por **cada opción** de cada grupo de cada producto.
   - El mismo **idproducto** y **Grupo** se repiten en varias filas (una por opción).
   - **Tipo** y **Obligatorio** suelen ser iguales para todas las opciones del mismo grupo (uno/varios, SI/NO).
4. **Recargo:** número entero en pesos. Dejar en 0 o vacío si la opción no tiene costo extra.
5. Los IDs de producto (**idproducto**) deben ser los mismos que en tu hoja de menú (compuesto o simple), para que al abrir el detalle del producto se carguen sus opciones.

---

## Resumen rápido

- **Una fila = una opción** (ej. "Mayonesa" dentro del grupo "Aderezo" del producto BUR-01).
- **Grupos:** se arman agrupando por (idproducto, Grupo). Cada grupo se muestra en la página del producto con su nombre (ej. "Aderezo", "Tamaño").
- **Tipo "uno":** el cliente elige una sola opción del grupo (ej. un aderezo, un tamaño).
- **Tipo "varios":** el cliente puede marcar varias (ej. varios agregados extra).
- **Obligatorio SI:** si no elige al menos una opción en ese grupo, no puede agregar al pedido.
- **Recargo:** se suma al precio base del producto por cada opción elegida con recargo.
