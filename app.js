/**
 * tikk.js - High-Tech Store Platform
 * Aesthetic: Apple Noir / Obsidian
 * Optimized for SEO, AEO, and CX.
 */

const app = {
    state: {
        currentView: 'landing',
        sheetId: null,
        products: [],
        categories: [],
        filteredProducts: [],
        cart: JSON.parse(localStorage.getItem('tikk-cart') || '[]'),
        activeCategory: 'all',
        sellerWhatsApp: '',
        storeName: 'Mi Tienda',
        isCartOpen: false,
        searchQuery: ''
    },

    init() {
        console.log("tikk obsidian core active");
        window.addEventListener('popstate', () => this.handleRouting());
        window.addEventListener('hashchange', () => this.handleRouting());
        this.handleRouting();
        this.updateCartCount();
        lucide.createIcons();
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
        if (pushState && !['store', 'share'].includes(view)) window.location.hash = view;
        
        const cartBtn = document.getElementById('cart-button');
        if (view === 'store') cartBtn?.classList.remove('hidden');
        else cartBtn?.classList.add('hidden');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderView(view) {
        const container = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${view}`);
        if (!template) return;
        
        container.innerHTML = template.innerHTML;
        
        if (view === 'store') {
            document.title = `${this.state.storeName} | tikk`;
            document.getElementById('store-title').textContent = this.state.storeName;
            document.getElementById('store-label-cart').textContent = this.state.storeName;
            if (this.state.products.length > 0) {
                this.renderProductGrid();
                this.renderCategoryFilters();
            }
        }

        if (view === 'share') {
            const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
            const input = document.getElementById('shareable-url');
            const btn = document.getElementById('view-store-btn');
            if (input) input.value = shareUrl;
            if (btn) btn.href = shareUrl;
            document.getElementById('share-title').textContent = `¡Vitrina "${this.state.storeName}" Lista!`;
        }
        lucide.createIcons();
    },

    async generateFromDiy() {
        const name = document.getElementById('store-name-input').value.trim();
        const wa = document.getElementById('whatsapp-input').value.trim();
        const url = document.getElementById('sheet-url-input').value.trim();

        if (!name || !wa || !url) {
            this.notify("Faltan campos por completar", "error");
            return;
        }

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            this.notify("URL de Sheets inválida", "error");
            return;
        }

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = wa.replace('+', '').trim();
        this.state.storeName = name;
        this.navigate('share');
    },

    // --- Core Data Logic ---
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

            this.state.filteredProducts = [...this.state.products];
            this.state.categories = [...new Set(this.state.products.map(p => p.Categoria))];
            
            this.renderProductGrid();
            this.renderCategoryFilters();
        } catch (e) {
            console.error(e);
            this.notify("Error al sincronizar con Excel", "error");
        }
    },

    handleSearch(query) {
        this.state.searchQuery = query.toLowerCase();
        this.applyFilters();
    },

    filterCategory(cat) {
        this.state.activeCategory = cat;
        this.applyFilters();
    },

    applyFilters() {
        this.state.filteredProducts = this.state.products.filter(p => {
            const matchesCat = this.state.activeCategory === 'all' || p.Categoria === this.state.activeCategory;
            const matchesSearch = p.Producto.toLowerCase().includes(this.state.searchQuery) || p.Codigo.toLowerCase().includes(this.state.searchQuery);
            return matchesCat && matchesSearch;
        });
        this.renderProductGrid();
        this.renderCategoryFilters();
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        if (this.state.filteredProducts.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center text-apple-400 font-medium">No se encontraron productos en esta selección.</div>`;
            return;
        }

        grid.innerHTML = this.state.filteredProducts.map(p => `
            <div class="apple-card rounded-[2rem] overflow-hidden flex flex-col h-full group">
                <div class="relative h-72 overflow-hidden bg-white/5">
                    <img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onerror="this.src='https://placehold.co/600x800/121212/86868b?text=${encodeURIComponent(p.Producto)}'">
                    ${p.Stock <= 0 ? `<div class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center font-black text-xs uppercase tracking-tighter">Agotado</div>` : ''}
                </div>
                <div class="p-8 flex flex-col flex-grow">
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-apple-blue mb-2">${p.Categoria}</span>
                    <h3 class="text-xl font-bold mb-6">${p.Producto}</h3>
                    <div class="mt-auto flex flex-col gap-4">
                        <div class="flex justify-between items-end">
                            <span class="text-2xl font-black tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                            <span class="text-[9px] text-white/20 font-bold tracking-widest">COD: ${p.Codigo}</span>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="flex-grow h-12 ${p.Stock > 0 ? 'bg-white text-black hover:bg-apple-100' : 'bg-white/5 text-white/20 cursor-not-allowed'} rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2">
                                <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                                Agregar
                            </button>
                            <button onclick="app.buyNow('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-12 px-4 bg-apple-blue text-white rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center">
                                <i data-lucide="zap" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;

        const cats = ['all', ...this.state.categories];
        container.innerHTML = cats.map(cat => `
            <button onclick="app.filterCategory('${cat}')" class="px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${this.state.activeCategory === cat ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/20' : 'bg-white/5 text-apple-400 hover:text-white border border-white/5'}">
                ${cat === 'all' ? 'Ver Todo' : cat}
            </button>
        `).join('');
    },

    // --- Cart & Order Engine ---
    addToCart(id) {
        const prod = this.state.products.find(p => p.id === id);
        if (!prod || prod.Stock <= 0) return;

        const cur = this.state.cart.find(i => i.id === id);
        if (cur) {
            if (cur.quantity < prod.Stock) cur.quantity++;
            else this.notify("Máximo stock alcanzado", "warning");
        } else {
            this.state.cart.push({ ...prod, quantity: 1 });
        }
        this.updateCartCount();
        this.saveCart();
        this.notify(`+1 ${prod.Producto}`, "success");
    },

    buyNow(id) {
        this.addToCart(id);
        this.toggleCart(true);
    },

    updateQuantity(id, mod) {
        const item = this.state.cart.find(i => i.id === id);
        if (!item) return;
        item.quantity += mod;
        if (item.quantity <= 0) this.state.cart = this.state.cart.filter(i => i.id !== id);
        this.updateCartCount();
        this.saveCart();
        this.renderCart();
    },

    updateCartCount() {
        const count = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        const el = document.getElementById('cart-count');
        if (el) el.textContent = count;
    },

    toggleCart(force) {
        this.state.isCartOpen = force !== undefined ? force : !this.state.isCartOpen;
        const s = document.getElementById('cart-sidebar');
        const o = document.getElementById('cart-overlay');
        if (this.state.isCartOpen) {
            s.classList.remove('translate-x-[110%]');
            o.classList.remove('pointer-events-none');
            o.classList.add('opacity-100');
            this.renderCart();
        } else {
            s.classList.add('translate-x-[110%]');
            o.classList.add('pointer-events-none');
            o.classList.remove('opacity-100');
        }
    },

    renderCart() {
        const list = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        if (!list) return;

        if (this.state.cart.length === 0) {
            list.innerHTML = `<div class="py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/10">Tu bolsa está vacía</div>`;
            totalEl.textContent = '$0';
            return;
        }

        list.innerHTML = this.state.cart.map(i => `
            <div class="flex gap-5 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <img src="${i.LinkFoto}" class="h-16 w-16 rounded-xl object-cover" onerror="this.src='https://placehold.co/100/121212/86868b?text=X'">
                <div class="flex-grow">
                    <h4 class="font-bold text-sm leading-tight mb-2">${i.Producto}</h4>
                    <p class="text-apple-blue font-black text-sm">$${(i.Precio * i.quantity).toLocaleString('es-CL')}</p>
                </div>
                <div class="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5">
                    <button onclick="app.updateQuantity('${i.id}', -1)" class="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white"><i data-lucide="minus" class="w-3 h-3"></i></button>
                    <span class="w-6 text-center text-xs font-bold">${i.quantity}</span>
                    <button onclick="app.updateQuantity('${i.id}', 1)" class="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white"><i data-lucide="plus" class="w-3 h-3"></i></button>
                </div>
            </div>
        `).join('');

        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        totalEl.textContent = `$${total.toLocaleString('es-CL')}`;
        lucide.createIcons();
    },

    sendOrder() {
        const buyer = document.getElementById('buyer-name').value.trim();
        const comments = document.getElementById('order-comments').value.trim();
        if (!buyer) return this.notify("Ingresa tu nombre", "error");

        let m = ` *PEDIDO: ${this.state.storeName.toUpperCase()}*\n\n`;
        m += `👤 *Cliente:* ${buyer}\n`;
        if (comments) m += `💭 *Nota:* ${comments}\n`;
        m += `\n----------------------------\n`;
        this.state.cart.forEach(i => m += `▫️ *${i.Producto}* (x${i.quantity})\n    $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n\n`);
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        m += `----------------------------\n💰 *TOTAL: $${total.toLocaleString('es-CL')}*`;
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    // --- Pro Export Logic ---
    async downloadProZip() {
        this.notify("Empacando proyecto...", "info");
        const zip = new JSZip();
        const slug = this.state.storeName.toLowerCase().replace(/\s+/g, '-');
        
        // Final Shop HTML (Specialized for standalone)
        const html = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.state.storeName} | Powered by tikk</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={darkMode:'class',theme:{extend:{colors:{apple:{50:'#f5f5f7',100:'#e8e8ed',400:'#86868b',500:'#1d1d1f',600:'#121212',blue:'#0071e3'},obsidian:'#000'}}}}</script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>body{background:#000;color:#f5f5f7;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}.glass{background:rgba(29,29,31,0.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1)}.card{background:#121212;border:1px solid rgba(255,255,255,0.05);transition:all .3s ease-in-out}.card:hover{border-color:rgba(255,255,255,0.2)}</style>
</head>
<body class="selection:bg-apple-blue selection:text-white">
    <header class="glass sticky top-0 z-50 h-14 border-b border-white/5 flex items-center justify-between px-6">
        <h1 class="text-lg font-bold tracking-tight">${this.state.storeName}</h1>
        <button onclick="toggleCart()" class="relative p-2 text-apple-400 hover:text-white">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            <span id="cc" class="absolute -top-1 -right-1 bg-apple-blue text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
        </button>
    </header>
    <main class="max-w-7xl mx-auto px-6 py-10 pb-40">
        <div class="flex justify-between items-center mb-10 gap-4">
            <input type="text" id="sr" placeholder="Buscar..." oninput="re(this.value)" class="flex-grow max-w-sm h-10 px-4 rounded-xl bg-white/5 border border-white/5 outline-none text-sm font-medium">
            <div id="cf" class="flex gap-2 overflow-x-auto"></div>
        </div>
        <div id="gd" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
    </main>
    <footer class="py-10 text-center text-[11px] text-apple-400 border-t border-white/5">
        <p>Potenciado por <a href="https://tikk.cl" class="font-bold underline">tikk.cl</a> | Por <a href="https://dantagle.cl" class="font-bold underline">Dan Tagle</a></p>
    </footer>
    <aside id="sb" class="fixed inset-y-0 right-0 w-full max-w-sm bg-apple-600 z-[70] translate-x-full transition-all duration-300 p-8 flex flex-col border-l border-white/10 shadow-2xl">
        <h2 class="text-xl font-bold mb-6">Bolsa</h2>
        <div id="ci" class="flex-grow overflow-auto mb-6"></div>
        <div class="pt-6 border-t border-white/10 mb-6 flex justify-between items-end"><span class="text-apple-400 text-xs">Total</span><span id="tt" class="text-2xl font-bold">$0</span></div>
        <input type="text" id="bn" placeholder="Tu Nombre" class="w-full h-12 px-4 rounded-xl bg-white/5 mb-4 border border-white/5 outline-none text-sm">
        <button onclick="send()" class="w-full h-14 bg-apple-blue text-white rounded-2xl font-bold">Enviar Pedido WhatsApp</button>
    </aside>
    <div id="ov" onclick="toggleCart()" class="fixed inset-0 bg-black/60 hidden z-60 backdrop-blur-sm"></div>

    <script>
        const ID="${this.state.sheetId}",WA="${this.state.sellerWhatsApp}";let ps=[],cts=[],ct=[],q='',ac='all';
        async function fetchD(){
            const r=await fetch(\`https://docs.google.com/spreadsheets/d/\${ID}/export?format=csv\`);
            const t=await r.text(); const rows=t.split('\\n'); const hs=rows[0].split(',').map(h=>h.trim().replace(/"/g,''));
            ps=rows.slice(1).map(r=>{
                const v=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); let o={}; hs.forEach((h,i)=>o[h]=v[i]?v[i].replace(/"/g,'').trim():''); return o;
            }).filter(d=>d.Producto).map(p=>({id:p.Codigo,c:p.Categoria||'General',n:p.Producto,p:parseInt(p.Precio)||0,f:p.LinkFoto,s:parseInt(p.Stock)||0}));
            cts=['all',...new Set(ps.map(p=>p.c))]; rps(); rc();
        }
        function rps(){
            const g=document.getElementById('gd');
            const f=ps.filter(p=>(ac==='all'||p.c===ac)&&(p.n.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)));
            g.innerHTML=f.map(p=>\`<div class="card rounded-3xl overflow-hidden flex flex-col">
                <img src="\${p.f}" class="h-64 object-cover" onerror="this.src='https://placehold.co/400/121/fff?text=\${p.n}'">
                <div class="p-6">
                    <h3 class="font-bold mb-2 text-sm">\${p.n}</h3>
                    <div class="flex justify-between items-end mt-4"><span class="font-black text-lg">$\${p.p.toLocaleString('es-CL')}</span><button onclick="add('\${p.id}')" class="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-bold">Agregar</button></div>
                </div></div>\`).join('');
            lucide.createIcons();
        }
        function rc(){
            document.getElementById('cf').innerHTML=cts.map(c=>\`<button onclick="ac='\${c}';rps();rc();" class="px-5 py-2 rounded-full text-[10px] font-black uppercase \${ac===c?'bg-apple-blue':'bg-white/5'}">\${c}</button>\`).join('');
        }
        function add(id){
            const i=ps.find(p=>p.id===id); const e=ct.find(x=>x.id===id); if(e)e.q++;else ct.push({...i,q:1}); render();
        }
        function render(){
            document.getElementById('cc').innerText=ct.reduce((s,i)=>s+i.q,0);
            document.getElementById('ci').innerHTML=ct.map(i=>\`<div class="flex justify-between mb-4 text-sm"><span>\${i.n} x\${i.q}</span><span>$\${(i.p*i.q).toLocaleString('es-CL')}</span></div>\`).join('');
            document.getElementById('tt').innerText='$'+ct.reduce((s,i)=>s+(i.p*i.q),0).toLocaleString('es-CL');
        }
        function toggleCart(){ document.getElementById('sb').classList.toggle('translate-x-full'); document.getElementById('ov').classList.toggle('hidden'); }
        function re(v){q=v.toLowerCase();rps();}
        function send(){
            const n=document.getElementById('bn').value; if(!n)return alert('Nombre?');
            let m=\`🛍️ PEDIDO: \${n}\\n\\n\`; ct.forEach(i=>m+=\`▫️ \${i.n} (x\${i.q})\\n\`);
            window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(m));
        }
        fetchD(); lucide.createIcons();
    </script>
</body>
</html>`;

        zip.file("index.html", html);
        zip.file("README.md", `# ${this.state.storeName}\n\nGenerado por tikk.cl\n\n1. Sube estos archivos a un repositorio de GitHub.\n2. Activa GitHub Pages en settings.\n3. Tu tienda estará viva.\n\nCreado por Dan Tagle (dantagle.cl)`);
        
        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${slug}-project.zip`;
        link.click();
        this.notify("Proyecto descargado. ¡Suerte!", "success");
    },

    saveCart() { localStorage.setItem('tikk-cart', JSON.stringify(this.state.cart)); },
    updateCartCount() {
        const count = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        const el = document.getElementById('cart-count');
        if (el) el.textContent = count;
    },

    notify(m, t) {
        const c = document.getElementById('notification-container');
        const n = document.createElement('div');
        const bg = t === 'success' ? 'bg-apple-blue' : t === 'error' ? 'bg-red-600' : 'bg-white/10';
        n.className = `${bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-500 translate-x-12 opacity-0 font-bold text-sm border border-white/10 backdrop-blur-xl`;
        n.innerHTML = `<i data-lucide="${t === 'success' ? 'check' : 'info'}" class="w-4 h-4"></i><span>${m}</span>`;
        c.appendChild(n);
        lucide.createIcons();
        setTimeout(() => n.classList.remove('translate-x-12', 'opacity-0'), 10);
        setTimeout(() => { n.classList.add('opacity-0', '-translate-y-4'); setTimeout(() => n.remove(), 500); }, 3500);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());