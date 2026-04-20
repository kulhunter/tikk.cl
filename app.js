/**
 * tikk.js - Neighborhood Commerce Revolution
 * Architecture: SaaS-ready, Decentralized Metadata
 * Developer: Dan Tagle (dantagle.cl)
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
        console.log("tikk engine v2.0 - hello barrio!");
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
        if (pushState && !['store', 'share', 'landing'].includes(view)) window.location.hash = view;
        if (view === 'landing') window.history.pushState({}, '', window.location.pathname);
        
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
            document.title = `${this.state.storeName} | Catálogo Online`;
            document.getElementById('store-title').textContent = this.state.storeName;
            document.getElementById('cart-store-name').textContent = this.state.storeName;
            if (this.state.products.length > 0) this.renderProductGrid();
        }

        if (view === 'share') {
            const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
            document.getElementById('shareable-url').value = shareUrl;
            document.getElementById('view-store-btn').href = shareUrl;
        }

        if (view === 'diy' && this.state.sheetId) {
            // Restore previous data for editing
            document.getElementById('store-name-input').value = this.state.storeName;
            document.getElementById('whatsapp-input').value = this.state.sellerWhatsApp;
            document.getElementById('sheet-url-input').value = `https://docs.google.com/spreadsheets/d/${this.state.sheetId}/edit`;
        }

        lucide.createIcons();
    },

    async generateFromDiy() {
        const name = document.getElementById('store-name-input').value.trim();
        const wa = document.getElementById('whatsapp-input').value.trim();
        const url = document.getElementById('sheet-url-input').value.trim();

        if (!name || !wa || !url) return this.notify("Faltan datos por llenar", "error");

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return this.notify("Link de Excel inválido", "error");

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = wa.replace('+', '').trim();
        this.state.storeName = name;
        this.navigate('share');
    },

    editStoreData() {
        this.navigate('diy');
    },

    // --- Product Management ---
    async loadStoreData(id) {
        try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error("No se pudo leer el Excel. Verifica que esté compartido.");
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
            this.notify(e.message, "error");
        }
    },

    handleSearch(q) {
        this.state.searchQuery = q.toLowerCase();
        this.applyFilters();
    },

    filterCategory(cat) {
        this.state.activeCategory = cat;
        this.applyFilters();
    },

    applyFilters() {
        this.state.filteredProducts = this.state.products.filter(p => {
            const matchesCat = this.state.activeCategory === 'all' || p.Categoria === this.state.activeCategory;
            const matchesQuery = p.Producto.toLowerCase().includes(this.state.searchQuery) || p.Codigo.toLowerCase().includes(this.state.searchQuery);
            return matchesCat && matchesQuery;
        });
        this.renderProductGrid();
        this.renderCategoryFilters();
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        if (this.state.filteredProducts.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center text-apple-400">No hay productos que coincidan.</div>`;
            return;
        }

        grid.innerHTML = this.state.filteredProducts.map(p => `
            <div class="apple-card rounded-4xl overflow-hidden flex flex-col h-full group">
                <div class="relative h-64 overflow-hidden bg-white/5 flex items-center justify-center">
                    ${p.LinkFoto && p.LinkFoto.startsWith('http') ? 
                        `<img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">` : 
                        `<div class="flex flex-col items-center gap-4 text-apple-400">
                            <i data-lucide="package" class="w-12 h-12 opacity-20"></i>
                            <span class="text-[10px] uppercase font-black tracking-widest opacity-40">Sin foto disponible</span>
                         </div>`
                    }
                    ${p.Stock <= 0 ? `<div class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center font-black text-xs uppercase tracking-widest">Agotado</div>` : ''}
                </div>
                <div class="p-8 flex flex-col flex-grow">
                    <span class="text-[9px] font-black uppercase tracking-widest text-apple-blue mb-1">${p.Categoria}</span>
                    <h3 class="text-xl font-bold mb-6">${p.Producto}</h3>
                    <div class="mt-auto flex flex-col gap-4">
                        <div class="flex justify-between items-end">
                            <span class="text-3xl font-black tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                            <span class="text-[9px] text-white/20 font-bold uppercase tracking-widest">#${p.Codigo}</span>
                        </div>
                        <div class="flex flex-col gap-2">
                            <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="w-full h-12 ${p.Stock > 0 ? 'bg-white text-black hover:bg-apple-100' : 'bg-white/5 text-white/10 cursor-not-allowed'} rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2">
                                <i data-lucide="shopping-cart" class="w-4 h-4"></i> Añadir al carrito
                            </button>
                            <button onclick="app.buyNow('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="w-full h-12 ${p.Stock > 0 ? 'bg-apple-blue text-white' : 'bg-white/5 text-white/10'} rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-apple-blue/20">
                                <i data-lucide="zap" class="w-4 h-4"></i> Comprar ahora
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
        container.innerHTML = cats.map(c => `
            <button onclick="app.filterCategory('${c}')" class="px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${this.state.activeCategory === c ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/20' : 'bg-white/5 text-apple-400 border border-white/5 hover:text-white'}">${c === 'all' ? 'Ver Todo' : c}</button>
        `).join('');
    },

    // --- Cart logic ---
    addToCart(id) {
        const p = this.state.products.find(x => x.id === id);
        if (!p || p.Stock <= 0) return;
        const cur = this.state.cart.find(i => i.id === id);
        if (cur) {
            if (cur.quantity < p.Stock) cur.quantity++;
            else return this.notify("Máximo stock alcanzado", "warning");
        } else {
            this.state.cart.push({ ...p, quantity: 1 });
        }
        this.updateCartCount();
        this.saveCart();
        this.notify(`+1 ${p.Producto}`, "success");
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
        document.getElementById('cart-count').textContent = count;
    },

    saveCart() { localStorage.setItem('tikk-cart', JSON.stringify(this.state.cart)); },

    toggleCart(force) {
        this.state.isCartOpen = force !== undefined ? force : !this.state.isCartOpen;
        const s = document.getElementById('cart-sidebar');
        if (this.state.isCartOpen) {
            s.classList.remove('translate-x-[110%]');
            this.renderCart();
        } else {
            s.classList.add('translate-x-[110%]');
        }
    },

    renderCart() {
        const list = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        if (this.state.cart.length === 0) {
            list.innerHTML = `<div class="py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-[0.4em]">Bolsa vacía</div>`;
            totalEl.textContent = '$0';
            return;
        }
        list.innerHTML = this.state.cart.map(i => `
            <div class="flex gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/5 shadow-sm">
                <img src="${i.LinkFoto}" class="h-16 w-16 rounded-xl object-cover" onerror="this.src='https://placehold.co/100/121/868?text=X'">
                <div class="flex-grow">
                    <h4 class="font-bold text-xs truncate w-32">${i.Producto}</h4>
                    <p class="text-apple-blue font-black text-sm">$${(i.Precio * i.quantity).toLocaleString('es-CL')}</p>
                </div>
                <div class="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <button onclick="app.updateQuantity('${i.id}', -1)" class="text-white/40"><i data-lucide="minus" class="w-3 h-3"></i></button>
                    <span class="text-xs font-bold w-4 text-center">${i.quantity}</span>
                    <button onclick="app.updateQuantity('${i.id}', 1)" class="text-white/40"><i data-lucide="plus" class="w-3 h-3"></i></button>
                </div>
            </div>
        `).join('');
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        totalEl.textContent = `$${total.toLocaleString('es-CL')}`;
        lucide.createIcons();
    },

    sendOrder() {
        const buyer = document.getElementById('buyer-name').value.trim();
        const address = document.getElementById('buyer-address').value.trim();
        const comments = document.getElementById('order-comments').value.trim();
        
        if (!buyer) return this.notify("Tu nombre es obligatorio", "error");
        if (!address) return this.notify("La dirección es necesaria para calcular el despacho", "error");

        let m = `🏡 *PEDIDO: ${this.state.storeName.toUpperCase()}*\n\n`;
        m += `👤 *Cliente:* ${buyer}\n`;
        m += `📍 *Dirección:* ${address}\n`;
        if (comments) m += `💭 *Nota:* ${comments}\n`;
        m += `\n----------------------------\n`;
        this.state.cart.forEach(i => m += `📦 *${i.Producto}* (x${i.quantity})\n    Sub: $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n\n`);
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        m += `----------------------------\n💰 *TOTAL PRODUCTOS: $${total.toLocaleString('es-CL')}*\n\n`;
        m += `🚚 _*Nota:* El costo de despacho se calcula por separado (usando Blue Express)._`;
        
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    // --- Guides & Modals ---
    toggleGuideModal(show, type) {
        const m = document.getElementById('modal-guide');
        const c = document.getElementById('guide-content');
        const t = document.getElementById('guide-title');
        
        if (show) {
            m.classList.remove('pointer-events-none', 'opacity-0');
            if (type === 'github') {
                t.textContent = "Cómo subir mi Web a GitHub";
                c.innerHTML = `
                <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="flex gap-6">
                        <div class="h-10 w-10 rounded-full bg-apple-blue flex items-center justify-center font-black flex-shrink-0">1</div>
                        <div><h4 class="font-bold mb-2">Crea un Repositorio</h4><p class="text-apple-400 text-sm">Entra a GitHub, crea un nuevo repositorio público (ej: mi-tienda). No añadas README ni nada.</p></div>
                    </div>
                    <div class="flex gap-6">
                        <div class="h-10 w-10 rounded-full bg-apple-blue flex items-center justify-center font-black flex-shrink-0">2</div>
                        <div><h4 class="font-bold mb-2">Sube el ZIP</h4><p class="text-apple-400 text-sm">Descomprime el archivo que descargaste aquí. Arrastra los archivos (index.html, readme, etc) directamente a tu repositorio en la web de GitHub.</p></div>
                    </div>
                    <div class="flex gap-6">
                        <div class="h-10 w-10 rounded-full bg-apple-blue flex items-center justify-center font-black flex-shrink-0">3</div>
                        <div><h4 class="font-bold mb-2">Activa las "Pages"</h4><p class="text-apple-400 text-sm">Anda a "Settings" -> "Pages". En Build and Deployment, elige "Deploy from a branch" y selecciona "main" y "/(root)". Dale a Save.</p></div>
                    </div>
                    <div class="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl">
                        <p class="text-green-500 text-xs font-bold">¡Listo! En un par de minutos tu tienda estará en: tunombre.github.io/mi-tienda</p>
                    </div>
                </div>`;
            } else {
                t.textContent = "Conecta tu Dominio .cl";
                c.innerHTML = `
                <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                    <p class="text-sm text-apple-400 italic mb-6">Nota: Dan Tagle ofrece asesoría para esto (1 UF) pero aquí te explico cómo hacerlo tú mismo.</p>
                    <div class="flex gap-6">
                        <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-black flex-shrink-0">1</div>
                        <div><h4 class="font-bold mb-2">Cloudflare es el secreto</h4><p class="text-apple-400 text-sm">Crea una cuenta en Cloudflare y añade tu dominio .cl. Te darán dos "NameServers".</p></div>
                    </div>
                    <div class="flex gap-6">
                        <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-black flex-shrink-0">2</div>
                        <div><h4 class="font-bold mb-2">Cambia en NIC.cl</h4><p class="text-apple-400 text-sm">Entra a NIC.cl, busca tu dominio y cambia los servidores de nombre por los que te dio Cloudflare.</p></div>
                    </div>
                    <div class="flex gap-6">
                        <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-black flex-shrink-0">3</div>
                        <div><h4 class="font-bold mb-2">Apunta a GitHub</h4><p class="text-apple-400 text-sm">En Cloudflare, añade un registro CNAME "www" que apunte a tu URL de GitHub (tunombre.github.io). Luego en GitHub Settings, añade tu dominio personalizado.</p></div>
                    </div>
                </div>`;
            }
        } else {
            m.classList.add('pointer-events-none', 'opacity-0');
        }
        lucide.createIcons();
    },

    async downloadProZip() {
        this.notify("Empacando tu página...", "info");
        const zip = new JSZip();
        const slug = this.state.storeName.toLowerCase().replace(/\s+/g, '-');
        
        // Build Standalone HTML (more robust version)
        const html = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.state.storeName} | Catálogo Online</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={darkMode:'class',theme:{extend:{colors:{apple:{blue:'#0071e3'}}}}}</script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>body{background:#000;color:#f5f5f7;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}.card{background:#121212;border:1px solid rgba(255,255,255,0.05);transition:all .3s ease}.card:hover{border-color:rgba(255,255,255,0.2)}.pb-safe{padding-bottom:env(safe-area-inset-bottom)}</style>
</head>
<body class="pb-safe">
    <header class="h-14 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <h1 class="text-sm font-black uppercase tracking-widest">${this.state.storeName}</h1>
        <button onclick="tgC()" class="relative"><i data-lucide="shopping-basket"></i><span id="cc" class="absolute -top-1 -right-1 bg-apple-blue text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span></button>
    </header>
    <main class="max-w-7xl mx-auto px-6 py-10">
        <div class="flex flex-col md:flex-row justify-between gap-6 mb-12">
            <input type="text" id="sr" placeholder="Busca un producto..." oninput="re(this.value)" class="w-full max-w-sm h-12 px-6 rounded-2xl bg-white/5 border border-white/10 outline-none text-sm">
            <div id="cf" class="flex gap-2"></div>
        </div>
        <div id="gd" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"></div>
    </main>
    <footer class="py-10 text-center opacity-40 border-t border-white/5">
        <p class="text-[10px] font-bold tracking-widest uppercase">Powered by tikk.cl | By Dan Tagle</p>
    </footer>
    <aside id="sb" class="fixed inset-y-0 right-0 w-full max-w-sm bg-[#121212] z-[70] translate-x-full transition-transform p-8 flex flex-col border-l border-white/10">
        <h2 class="text-2xl font-black mb-8 italic">Tu Pedido</h2>
        <div id="ci" class="flex-grow overflow-auto mb-6"></div>
        <div class="pt-6 border-t border-white/5 mb-6 space-y-4">
            <input type="text" id="bn" placeholder="Tu Nombre" class="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/5 text-sm">
            <input type="text" id="ba" placeholder="Dirección para despacho" class="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/5 text-sm">
            <div class="flex justify-between items-end"><span class="text-xs opacity-40">Total</span><span id="tt" class="text-2xl font-black">$0</span></div>
        </div>
        <button onclick="se()" class="w-full h-14 bg-apple-blue text-white rounded-2xl font-black">Enviar por WhatsApp</button>
    </aside>
    <div id="ov" onclick="tgC()" class="fixed inset-0 bg-black/60 hidden z-60 backdrop-blur-sm"></div>

    <script>
        const ID="${this.state.sheetId}",WA="${this.state.sellerWhatsApp}",SN="${this.state.storeName}";let ps=[],ct=[],ac='all',q='';
        async function fd(){
            const r=await fetch(\`https://docs.google.com/spreadsheets/d/\${ID}/export?format=csv\`); const t=await r.text();
            const rs=t.split('\\n'); const hs=rs[0].split(',').map(h=>h.trim().replace(/"/g,''));
            ps=rs.slice(1).map(r=>{const v=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); let o={}; hs.forEach((h,i)=>o[h]=v[i]?v[i].replace(/"/g,''):''); return o;})
            .filter(d=>d.Producto).map(p=>({id:p.Codigo,c:p.Categoria||'General',n:p.Producto,p:parseInt(p.Precio)||0,f:p.LinkFoto,s:parseInt(p.Stock)||0}));rps();rfc();
        }
        function rps(){
            const g=document.getElementById('gd'); const f=ps.filter(p=>(ac==='all'||p.c===ac)&&(p.n.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)));
            g.innerHTML=f.map(p=>\`<div class="card rounded-[2.5rem] overflow-hidden flex flex-col">
                <div class="h-64 bg-white/5 flex items-center justify-center overflow-hidden">\${p.f?'<img src="'+p.f+'" class="w-full h-full object-cover">':'<i data-lucide="package" class="opacity-10"></i>'}</div>
                <div class="p-6 flex flex-col flex-grow"><span class="text-[9px] font-black uppercase text-apple-blue mb-1">\${p.c}</span><h3 class="font-bold h-12 mb-4">\${p.n}</h3><div class="mt-auto flex justify-between items-end"><span class="font-black text-xl">$\${p.p.toLocaleString('es-CL')}</span><button onclick="ad('\${p.id}')" class="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black">Añadir</button></div></div></div>\`).join('');
            lucide.createIcons();
        }
        function rfc(){
            const cs=['all',...new Set(ps.map(p=>p.c))]; document.getElementById('cf').innerHTML=cs.map(c=>\`<button onclick="ac='\${c}';rps();rfc();" class="px-4 py-2 rounded-full text-[10px] font-black uppercase \${ac===c?'bg-apple-blue':'bg-white/5'}">\${c}</button>\`).join('');
        }
        function ad(id){const p=ps.find(x=>x.id===id);const e=ct.find(x=>x.id===id);if(e)e.q++;else ct.push({...p,q:1});render();}
        function render(){
            document.getElementById('cc').innerText=ct.reduce((s,i)=>s+i.q,0);
            document.getElementById('ci').innerHTML=ct.map(i=>\`<div class="flex justify-between mb-4 text-xs font-bold"><span>\${i.n} x\${i.q}</span><span>$\${(i.p*i.q).toLocaleString('es-CL')}</span></div>\`).join('');
            document.getElementById('tt').innerText='$'+ct.reduce((s,i)=>s+(i.p*i.q),0).toLocaleString('es-CL');
        }
        function tgC(){document.getElementById('sb').classList.toggle('translate-x-full');document.getElementById('ov').classList.toggle('hidden');}
        function re(v){q=v.toLowerCase();rps();}
        function se(){
            const n=document.getElementById('bn').value,a=document.getElementById('ba').value; if(!n||!a)return alert('Nombre y Dirección obligatorios');
            let m=\`🛍️ PEDIDO PARA \${SN.toUpperCase()}\\n\\n👤: \${n}\\n📍: \${a}\\n\\n\`; ct.forEach(i=>m+=\`- \${i.n} (x\${i.q})\\n\`);
            window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(m));
        }
        fd();lucide.createIcons();
    </script>
</body>
</html>`;

        zip.file("index.html", html);
        zip.file("GUÍA_DE_GITHUB.txt", "PASO A PASO PARA SUBIR TU TIENDA:\n1. Crea repo en GitHub.\n2. Sube el index.html.\n3. Activa GitHub Pages en Settings.");
        
        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `tienda-${slug}.zip`;
        link.click();
        this.notify("Proyecto listo!", "success");
    },

    notify(m, t) {
        const c = document.getElementById('notification-container');
        const n = document.createElement('div');
        const bg = t === 'success' ? 'bg-apple-blue' : t === 'error' ? 'bg-red-600' : 'bg-white/10';
        n.className = `${bg} text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-500 translate-x-12 opacity-0 font-bold text-sm border border-white/10`;
        n.innerHTML = `<i data-lucide="${t === 'success' ? 'check' : 'info'}" class="w-4 h-4"></i><span>${m}</span>`;
        c.appendChild(n);
        lucide.createIcons();
        setTimeout(() => n.classList.remove('translate-x-12', 'opacity-0'), 10);
        setTimeout(() => { n.classList.add('opacity-0', '-translate-y-4'); setTimeout(() => n.remove(), 500); }, 3500);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());