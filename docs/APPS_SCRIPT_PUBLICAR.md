# Cómo publicar el Apps Script para el Dashboard

Este documento explica cómo publicar el script de **docs/APPS_SCRIPT_COMPLETO.gs** en Google para que el panel de administración (menú simple, menú compuesto, opciones) funcione correctamente.

---

## 1. Crear o abrir el proyecto de Apps Script

1. Entrá a [Google Apps Script](https://script.google.com).
2. Si ya tenés un proyecto vinculado a tu Google Sheet del menú, abrilo. Si no:
   - **Nuevo proyecto** y luego vinculá el libro: en el editor, **Archivo → Crear → Hoja de cálculo** (o **Abrir desde → Hoja de cálculo** y elegí el libro de Toro Rápido).

---

## 2. Pegar el código

1. En el proyecto de Apps Script, abrí el archivo **Code.gs** (o el que uses).
2. Borrá todo el contenido y pegá el contenido completo de **docs/APPS_SCRIPT_COMPLETO.gs**.
3. Guardá (Ctrl+S o el icono de disco).

---

## 3. Hojas en tu Google Sheet

Asegurate de tener estas **pestañas** en el mismo libro de Google Sheets vinculado al script:

| Nombre de la pestaña | Uso |
|----------------------|-----|
| **menu-toro-rapido-web-simple** | Menú simple (o el que tengas en `menuSimpleSheetName`) |
| **menu-toro-rapido-web-compuesto** | Menú compuesto (o el de `menuCompuestoSheetName`) |
| **opciones-base** | Opciones por producto (o el de `menuOpcionesSheetName`) |

La **primera fila** de cada hoja debe ser la de encabezados (idproducto, Categoria, Producto, etc.). Los nombres de columnas pueden variar en mayúsculas/minúsculas; el script los reconoce.

---

## 4. Desplegar como aplicación web

1. En el editor de Apps Script: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Configuración:
   - **Descripción:** por ejemplo "Toro Rápido API".
   - **Ejecutar como:** **Yo** (tu cuenta).
   - **Quién tiene acceso:** **Cualquier persona** (así el dashboard en GitHub Pages puede llamar al script).
4. Clic en **Implementar**.
5. **Copiá la URL del despliegue** (algo como `https://script.google.com/macros/s/XXXXX/exec`). Esa URL es la que va en **config.js** en:
   - `appsScriptMenuUrl`
   - (y si usás el mismo script para envío de pedidos, también en `appsScriptPedidosUrl`).

---

## 5. Configurar config.js en el dashboard

En la raíz del proyecto del dashboard, en **config.js**, poné la URL que copiaste:

```javascript
appsScriptMenuUrl: "https://script.google.com/macros/s/XXXXXXXX/exec",
```

Reemplazá `XXXXXXXX` por tu URL real.

---

## 6. Qué hace el script

- **doGet:** listar cualquier hoja. El dashboard llama con `?action=list&sheetName=nombre-de-la-hoja` y recibe `{ headers: [...], rows: [...] }`.
- **doPost:**  
  - **create:** agrega una fila nueva en la hoja indicada en `sheetName`.  
  - **update:** busca la fila (por idproducto, idmenu-unico o por idproducto+grupo+opcion en opciones) y actualiza las celdas.  
  - **delete:** busca la fila por id y pone **Habilitado** en `NO` (para menús).

Con esto, el dashboard puede listar, crear y modificar ítems del menú simple, menú compuesto y opciones de producto correctamente.
