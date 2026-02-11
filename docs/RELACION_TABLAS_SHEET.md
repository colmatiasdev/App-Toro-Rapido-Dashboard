# Relación de tablas en el Google Sheet (Toro Rápido)

Este documento describe cómo se relacionan las hojas del Sheet y los formatos de ID usados en el desarrollo.

---

## 1. productos-base

- **Qué es:** Tabla de productos. Todo producto se crea primero aquí.
- **ID único:** `idproducto` (columna "ID Producto" o "idproducto").
- **Formato:** `PROD-BASE-` + valor alfanumérico único (ej. `PROD-BASE-a1b2c3d4e5`).
- **Uso:** Al crear un producto en el panel de administración, se genera este ID. Ese mismo `idproducto` se usa después para enlazar con **menu-simple** y opciones.

---

## 2. menu-simple (hoja: menu-toro-rapido-web-simple)

- **Qué es:** Menú simple. Cada fila enlaza un ítem de menú con un producto.
- **Clave única:** `idmenu`.
- **Formato:** `MENU-SIMPLE-` + valor único (ej. `MENU-SIMPLE-k7j2abc123`).
- **Relación:** 
  - `idmenu`: clave única de esta tabla.
  - `idproducto`: referencia al producto en **productos-base** (mismo valor que `idproducto` en productos-base).
- **Flujo:** Primero se crea el producto en productos-base. Luego, si el ítem va al menú simple, se agrega una fila aquí con un nuevo `idmenu` y el `idproducto` del producto creado.

---

## 3. menu-toro-rapido-web-compuesto

- **Qué es:** Menú compuesto (listado principal de ítems del menú).
- **Clave única:** `idmenu-unico`.
- **Formato:** `MENU-` + valores alfanuméricos únicos (ej. `MENU-m5n8xyz123`).
- **Campos mínimos para ítem tipo MENU-SIMPLE:**
  - `orden`: orden de visualización.
  - `idmenu-unico`: clave única de esta tabla (formato anterior).
  - `Tipo Menu`: valor `MENU-SIMPLE` (o `MENU-COMPUESTO` para ítems compuestos).
- **Relación:** Si `Tipo Menu` = `MENU-SIMPLE`, típicamente se usa `idmenu-variable` u otro campo para enlazar con la fila correspondiente en **menu-simple** (por ejemplo con el `idmenu` de esa hoja), y así llegar al `idproducto` y al producto en productos-base.

---

## Orden sugerido al crear un ítem

1. **Crear el producto** en **productos-base**  
   - Se genera `idproducto` = `PROD-BASE-` + único.

2. **Si el ítem va al menú simple:**  
   - En **menu-toro-rapido-web-simple** se agrega una fila con:
     - `idmenu` = `MENU-SIMPLE-` + único.
     - `idproducto` = el de productos-base (del paso 1).

3. **Registro en el menú compuesto:**  
   - En **menu-toro-rapido-web-compuesto** se agrega una fila con:
     - `orden`.
     - `idmenu-unico` = `MENU-` + alfanumérico único.
     - `Tipo Menu` = `MENU-SIMPLE` (o `MENU-COMPUESTO` según corresponda).

---

## Nombres de hojas en config.js

- **productos-base:** `menuProductosSheetName`
- **menú simple:** `menuSimpleSheetName` (ej. `"menu-toro-rapido-web-simple"`)
- **menú compuesto:** `menuCompuestoSheetName` (`"menu-toro-rapido-web-compuesto"`)

Los IDs se generan en el front (crear producto, crear ítem menú simple, crear ítem menú compuesto) con los formatos indicados y se envían al Apps Script para crear las filas en cada hoja.
