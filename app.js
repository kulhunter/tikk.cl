/**
 * tikk.js - Store Platform & Project Generator
 */

const app = {
    state: {
        currentView: 'landing',
        sheetId: null,
        products: [],
        categories: [],
        cart: JSON.parse(localStorage.getItem('tikk-cart') || '[]'),
        activeCategory: 'all',
        sellerWhatsApp: '',
        storeName: '',
        isCartOpen: false
    },

    init() {
        console.log("tikk engine started");
        window.addEventListener('popstate', () => this.handleRouting());
        window.addEventListener('hashchange', () => this.handleRouting());
        this.handleRouting();
        this.updateCartCount();
    },

    handleRouting() {
        const hash = window.location.hash;
        
        if (hash.startsWith('#/')) {
            const parts = hash.split('/').filter(p => !!p && p !== '#');
            if (parts.length >= 3) {
                this.state.storeName = decodeURIComponent(parts[0].replace(/-/g, ' '));
                this.state.sheetId = parts[1];
                this.state.sellerWhatsApp = parts[2];
                this.navigate('store', false);
                this.loadStoreData(this.state.sheetId);
                return;
            }
        }

        const view = hash.replace('#', '') || 'landing';
        this.navigate(view, false);
    },

    navigate(view, pushState = true) {
        this.state.currentView = view;
        this.renderView(view);
        if (pushState && view !== 'store' && view !== 'share') window.location.hash = view;
        
        const cartBtn = document.getElementById('cart-button');
        if (view === 'store') cartBtn?.classList.remove('hidden');
        else cartBtn?.classList.add('hidden');
        
        window.scrollTo(0, 0);
        lucide.createIcons();
    },

    renderView(view) {
        const container = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${view}`);
        if (!template) return;
        
        container.innerHTML = template.innerHTML;
        
        if (view === 'store') {
            document.getElementById('store-title').textContent = this.state.storeName;
            if (this.state.products.length > 0) this.renderProductGrid();
        }

        if (view === 'share') {
            const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
            document.getElementById('shareable-url').value = shareUrl;
            document.getElementById('view-store-btn').href = shareUrl;
        }
        lucide.createIcons();
    },

    async generateFromDiy() {
        const wa = document.getElementById('whatsapp-input').value.trim();
        const name = document.getElementById('store-name-input').value.trim();
        const url = document.getElementById('sheet-url-input').value.trim();

        if (!wa || !name || !url) {
            this.notify("Completa todos los campos", "error");
            return;
        }

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            this.notify("Link de Excel no válido", "error");
            return;
        }

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = wa.replace('+', '');
        this.state.storeName = name;
        this.navigate('share');
    },

    copyStoreLink() {
        const input = document.getElementById('shareable-url');
        input.select();
        navigator.clipboard.writeText(input.value);
        this.notify("¡Link copiado!", "success");
    },

    // --- Data Engine ---
    async loadStoreData(id) {
        try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
            const response = await fetch(csvUrl);
            const csvText = await response.text();
            
            const rows = csvText.split(/\n/);
            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            this.state.products = rows.slice(1).map(row => {
                const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                let obj = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i] ? values[i].replace(/"/g, '').trim() : '';
                });
                return obj;
            }).filter(o => !!o.Producto).map(p => ({
                id: p.Codigo,
                Codigo: p.Codigo,
                Categoria: p.Categoria || 'General',
                Producto: p.Producto,
                Stock: parseInt(p.Stock) || 0,
                Precio: parseInt(p.Precio) || 0,
                LinkFoto: p.LinkFoto
            }));

            this.renderProductGrid();
        } catch (e) {
            this.notify("Error cargando productos", "error");
        }
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = this.state.products.map(p => `
            <div class="bg-white rounded-4xl overflow-hidden border border-slate-100 flex flex-col h-full shadow-sm hover:shadow-xl transition-all group">
                <div class="h-64 overflow-hidden bg-slate-50">
                    <img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.src='https://placehold.co/400x500/f8fafc/cbd5e1?text=${encodeURIComponent(p.Producto)}'">
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <h3 class="font-bold text-dark mb-2">${p.Producto}</h3>
                    <div class="mt-auto">
                        <div class="flex justify-between items-end mb-4">
                            <span class="text-2xl font-black">$${p.Precio.toLocaleString('es-CL')}</span>
                            <span class="text-[10px] font-bold text-slate-300">#${p.Codigo}</span>
                        </div>
                        <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="w-full ${p.Stock > 0 ? 'bg-dark text-white' : 'bg-slate-100 text-slate-400'} py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
                             ${p.Stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    // --- Download Project Hack ---
    downloadProject() {
        const slug = this.state.storeName.toLowerCase().replace(/\s+/g, '-');
        const fileName = `tienda-${slug}.html`;
        
        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.state.storeName} | Powered by tikk</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-[#f8fafc] text-slate-900 pb-32">
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div class="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <h1 class="text-xl font-black">${this.state.storeName}</h1>
            <button onclick="toggleCart()" class="relative p-2">
                <i data-lucide="shopping-cart"></i>
                <span id="cart-count" class="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
            </button>
        </div>
    </header>
    <main class="max-w-6xl mx-auto px-5 py-10">
        <div id="grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">Cargando productos...</div>
    </main>
    <footer class="py-10 text-center text-slate-400 text-xs">
        <p>Potenciado por <a href="https://tikk.cl" class="font-bold underline">tikk.cl</a></p>
        <p class="mt-2">Creado por <a href="https://dantagle.cl" class="font-bold underline">Dan Tagle</a></p>
    </footer>

    <!-- Cart Overlay -->
    <div id="overlay" onclick="toggleCart()" class="fixed inset-0 bg-black/40 hidden z-[60]"></div>
    <div id="sidebar" class="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[70] translate-x-full transition-transform p-8 flex flex-col">
        <h2 class="text-2xl font-black mb-8">Pedido</h2>
        <div id="items" class="flex-grow overflow-auto"></div>
        <div class="pt-6 border-t font-black text-2xl flex justify-between mb-4"><span>Total:</span><span id="total">$0</span></div>
        <input type="text" id="buyer" placeholder="Tu Nombre" class="w-full bg-slate-50 p-4 rounded-xl mb-4 border-none outline-none">
        <button onclick="send()" class="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black">Pedir por WhatsApp</button>
    </div>

    <script>
        const ID = "${this.state.sheetId}";
        const WA = "${this.state.sellerWhatsApp}";
        let cart = [];

        async function init() {
            const res = await fetch(\`https://docs.google.com/spreadsheets/d/\${ID}/export?format=csv\`);
            const txt = await res.text();
            const rows = txt.split('\\n');
            const heads = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = rows.slice(1).map(row => {
                const vals = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                let o = {}; heads.forEach((h, i) => o[h] = vals[i] ? vals[i].replace(/"/g, '') : ''); return o;
            }).filter(d => d.Producto);
            
            document.getElementById('grid').innerHTML = data.map(d => \`
                <div class="bg-white rounded-3xl overflow-hidden border p-4 shadow-sm">
                    <img src="\${d.LinkFoto}" class="h-48 w-full object-cover rounded-2xl mb-4">
                    <h3 class="font-bold mb-2">\${d.Producto}</h3>
                    <p class="font-black text-xl mb-4">$\${parseInt(d.Precio).toLocaleString('es-CL')}</p>
                    <button onclick="add('\${d.Codigo}', '\${d.Producto}', \${d.Precio})" class="w-full bg-slate-900 text-white py-2 rounded-xl font-bold">Añadir</button>
                </div>\`).join('');
            lucide.createIcons();
        }

        function add(id, name, price) {
            const e = cart.find(i => i.id === id);
            if (e) e.q++; else cart.push({id, name, price, q: 1});
            render();
        }

        function render() {
            const count = cart.reduce((s, i) => s + i.q, 0);
            document.getElementById('cart-count').innerText = count;
            document.getElementById('items').innerHTML = cart.map(i => \`
                <div class="flex justify-between mb-2"><span>\${i.name} x\${i.q}</span><span>$\${(i.price * i.q).toLocaleString('es-CL')}</span></div>\`).join('');
            document.getElementById('total').innerText = '$' + cart.reduce((s, i) => s + (i.price * i.q), 0).toLocaleString('es-CL');
        }

        function toggleCart() {
            const s = document.getElementById('sidebar');
            const o = document.getElementById('overlay');
            s.classList.toggle('translate-x-full');
            o.classList.toggle('hidden');
        }

        function send() {
            const name = document.getElementById('buyer').value;
            if(!name) return alert('Pon tu nombre');
            let m = '🛍️ Nuevo Pedido: ' + name + '\\n\\n';
            cart.forEach(i => m += '- ' + i.name + ' x' + i.q + '\\n');
            window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(m));
        }

        init(); lucide.createIcons();
    </script>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        this.notify("Proyecto preparado y descargado", "success");
    },

    // --- Cart logic ---
    addToCart(id) {
        const prod = this.state.products.find(p => p.id === id);
        const cur = this.state.cart.find(i => i.id === id);
        if (cur) cur.quantity++; else this.state.cart.push({ ...prod, quantity: 1 });
        this.updateCartCount();
        this.saveCart();
    },

    updateCartCount() {
        const count = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        document.getElementById('cart-count').innerText = count;
    },

    saveCart() { localStorage.setItem('tikk-cart', JSON.stringify(this.state.cart)); },

    toggleCart() {
        this.state.isCartOpen = !this.state.isCartOpen;
        const s = document.getElementById('cart-sidebar');
        const o = document.getElementById('cart-overlay');
        if (this.state.isCartOpen) {
            s.classList.remove('translate-x-full');
            o.classList.remove('opacity-100');
            o.classList.remove('pointer-events-none');
            this.renderCart();
        } else {
            s.classList.add('translate-x-full');
            o.classList.add('opacity-100');
            o.classList.add('pointer-events-none');
        }
    },

    renderCart() {
        const list = document.getElementById('cart-items');
        list.innerHTML = this.state.cart.map(i => `
            <div class="flex justify-between mb-4"><div><b>${i.Producto}</b><br><small>x${i.quantity}</small></div><b>$${(i.Precio * i.quantity).toLocaleString('es-CL')}</b></div>
        `).join('');
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        document.getElementById('cart-total').innerText = '$' + total.toLocaleString('es-CL');
    },

    sendOrder() {
        const buyer = document.getElementById('buyer-name').value;
        if (!buyer) return;
        let msg = `🛍️ Pedido de ${buyer}\n\n`;
        this.state.cart.forEach(i => msg += `- ${i.Producto} x${i.quantity}\n`);
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(msg)}`);
    },

    notify(m, t) {
        const n = document.createElement('div');
        n.className = `fixed bottom-4 left-4 ${t === 'error' ? 'bg-red-600' : 'bg-tech-600'} text-white px-6 py-3 rounded-xl z-[100] shadow-xl font-bold`;
        n.innerText = m;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());