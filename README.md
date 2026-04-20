# tikk.cl - Tu tienda desde Google Sheets 🚀

**tikk** es una aplicación web moderna que permite a cualquier persona crear una tienda online funcional con carrito de compras en segundos, utilizando únicamente un archivo de Google Sheets como base de datos. Los pedidos se gestionan 100% a través de WhatsApp.

## ✨ Características

- **Sin base de datos compleja:** Usa Google Sheets (Excel en Drive) para gestionar productos, stock y precios.
- **Carrito de compras integrado:** Experiencia de usuario premium para seleccionar múltiples productos.
- **Pedidos por WhatsApp:** Genera automáticamente un mensaje detallado con el pedido para el vendedor.
- **Diseño Responsive:** Optimizado para dispositivos móviles y escritorio.
- **Sin Costo de Servidor:** Aplicación estática lista para GitHub Pages.

## 🛠️ Tecnologías Usadas

- **Frontend:** HTML5, Tailwind CSS (Styling), Vanilla JavaScript (Logic).
- **Iconos:** Lucide Icons.
- **Infraestructura:** GitHub Pages + Cloudflare.

## 📋 Requisitos del Google Sheet

Para que la tienda funcione, tu archivo de Google Sheets debe tener las siguientes columnas en la primera fila (encabezados exactos, sin tildes):

| Codigo | Categoria | Producto | Stock | Precio | LinkFoto |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A01 | Ropa | Camiseta | 10 | 15000 | https://url-de-la-foto.jpg |

> [!IMPORTANT]
> Debes compartir el archivo en Google Drive como **"Cualquiera con el enlace puede ver"** para que la app pueda leer los datos.

## 🚀 Instalación y Desarrollo Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/kulhunter/tikk.cl
   cd tikk.cl
   ```

2. **Ejecutar localmente:**
   No requiere compilación. Solo abre `index.html` en tu navegador o usa un servidor local sencillo:
   ```bash
   # Si tienes Python
   python3 -m http.server 8000
   ```

3. **Configuración de WhatsApp:**
   Abre el archivo `app.js` y modifica la variable al inicio:
   ```javascript
   sellerWhatsApp: '56936305140', // Reemplaza con tu número (código país + número)
   ```

## 🌐 Despliegue en GitHub Pages

1. Sube los cambios a tu repositorio de GitHub.
2. Ve a **Settings > Pages**.
3. Selecciona el branch `main` y la carpeta `/ (root)`.
4. El despliegue será automático en `tikk.cl` (si tu dominio ya está configurado).

## 💡 Soporte y Consultoría

Si prefieres que **DanTagle** configure tu tienda por ti:
- **Costo:** 1 UF.
- **Agenda:** [Calendly - Dan Tagle](https://calendly.com/dan-tagle/30min)
- Incluye sesión de 1 hora para dejar todo funcionando con tu propio Excel.

---
Desarrollado con ❤️ por el equipo de tikk.cl
