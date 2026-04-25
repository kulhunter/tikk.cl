const fs = require('fs');
const path = require('path');

// 50 Long-tail keywords for the Chilean/Latam SME market
const keywords = [
    "crear tienda online gratis chile",
    "vender por whatsapp chile",
    "ecommerce facil para pymes",
    "como hacer un catalogo en whatsapp",
    "tienda online con google sheets",
    "creador de tiendas virtuales gratis",
    "plataforma ecommerce pymes chile",
    "alternativa gratis a shopify",
    "catalogo digital para instagram",
    "vender productos por internet gratis",
    "crear vitrina virtual gratis",
    "automatizar ventas whatsapp",
    "como crear un ecommerce gratis",
    "tienda online sin comisiones",
    "vender por internet sin invertir",
    "catalogo de productos para whatsapp",
    "como vender mas por whatsapp",
    "crear tienda virtual chile",
    "tienda online para emprendedores",
    "sistema de ventas para whatsapp",
    "vender ropa por whatsapp",
    "ecommerce sin mensualidades",
    "conectar google sheets con whatsapp",
    "como hacer una pagina web para vender",
    "tienda online gratis para siempre",
    "mejor plataforma para pymes chile",
    "crear catalogo online gratis",
    "ventas por redes sociales chile",
    "como automatizar mi negocio gratis",
    "tienda online con excel",
    "inventario en google sheets para tienda",
    "crear pagina web de ventas gratis",
    "catalogo interactivo whatsapp",
    "alternativa a jumpseller gratis",
    "alternativa a bsale gratis para pymes",
    "como recibir pedidos por whatsapp",
    "ecommerce rapido y facil",
    "tienda virtual para instagram gratis",
    "vender comida por whatsapp",
    "crear ecommerce desde el celular",
    "tienda online sin saber programar",
    "catalogo web para pymes",
    "como empezar a vender por internet chile",
    "tienda online para minimarket",
    "ecommerce sin pasarela de pagos",
    "vender manualidades por internet",
    "tienda online para joyas",
    "crear catalogo digital pdf a web",
    "como vender servicios por whatsapp",
    "plataforma gratuita para emprendimientos"
];

function generateSlug(keyword) {
    return keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function generateHTML(keyword, slug) {
    // Generate some contextual pseudo-AI content based on keyword
    const title = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Tikk - Ecommerce Gratis</title>
    <meta name="description" content="Aprende todo sobre ${keyword} con Tikk. Descubre la forma más fácil y gratuita de digitalizar tu negocio en Chile usando solo Google Sheets y WhatsApp.">
    <meta name="keywords" content="${keyword}, ecommerce gratis, vender por whatsapp">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { font-family: 'Inter', sans-serif; }</style>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
            <a href="index.html" class="flex items-center gap-3">
                <div class="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">t</div>
                <span class="text-2xl font-black tracking-tight">tikk</span>
            </a>
            <a href="index.html#/diy" class="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-blue-700 transition-all">Crear Tienda Gratis</a>
        </div>
    </header>

    <main class="flex-grow">
        <div class="max-w-3xl mx-auto px-6 py-20 text-center">
            <span class="text-blue-600 font-bold uppercase tracking-wider text-sm mb-4 block">Guía para Emprendedores</span>
            <h1 class="text-5xl md:text-6xl font-black mb-8 leading-tight capitalize">${title}</h1>
            <p class="text-xl text-gray-600 mb-12 leading-relaxed">
                Si estás buscando información sobre <strong>${keyword}</strong>, llegaste al lugar indicado. En Tikk hemos diseñado una plataforma 100% gratuita que resuelve exactamente esto. Olvídate de mensualidades costosas o de aprender a programar.
            </p>
            
            <div class="bg-white p-10 rounded-3xl shadow-sm border border-gray-200 text-left mb-12">
                <h2 class="text-2xl font-bold mb-4">La solución definitiva</h2>
                <p class="text-gray-600 mb-6">Usar Tikk es la mejor manera de abordar la necesidad de <em>${keyword}</em>. Funciona conectando un Google Sheet (como inventario) directo a tu WhatsApp. Tus clientes ven un catálogo profesional y tú recibes los pedidos listos en tu celular.</p>
                <ul class="list-disc pl-5 space-y-2 text-gray-600 font-medium">
                    <li>Cero comisiones por venta.</li>
                    <li>Sin límite de productos.</li>
                    <li>Diseño profesional y responsivo.</li>
                </ul>
            </div>

            <a href="index.html#/diy" class="inline-block px-10 py-5 bg-blue-600 text-white rounded-full font-bold text-xl hover:shadow-xl hover:-translate-y-1 transition-all">Empieza ahora, es gratis</a>
        </div>
    </main>

    <footer class="py-12 border-t border-gray-200 bg-white text-center mt-auto">
        <p class="text-sm font-semibold text-gray-500">Tikk - Democratizando el comercio digital.</p>
    </footer>
</body>
</html>`;
}

async function run() {
    const rootDir = path.resolve(__dirname);
    let count = 0;
    
    console.log("Iniciando AI SEO Autopilot...");
    
    for (const keyword of keywords) {
        const slug = generateSlug(keyword);
        const fileName = `${slug}.html`;
        const filePath = path.join(rootDir, fileName);
        
        const htmlContent = generateHTML(keyword, slug);
        fs.writeFileSync(filePath, htmlContent);
        count++;
        console.log(`[SEO] Generada página de caída: ${fileName}`);
    }
    
    console.log(`\n¡Éxito! Se han generado ${count} páginas físicas SEO-optimizadas en la raíz.`);
}

run();
