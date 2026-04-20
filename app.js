/**
 * tikk.js - Full Leap for Entrepreneurs
 * Branding: Apple Noir / Obsidian
 * Architecture: SaaS-ready, No-code Interface
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
        storeName: 'Mi Tienda Pro',
        isCartOpen: false,
        searchQuery: ''
    },

    init() {
        console.log("tikk leap engine v3 - world class pyme tool");
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
        
        // --- UX Rules ---
        const mainHeader = document.getElementById('main-header');
        const mainFooter = document.getElementById('main-footer');
        
        if (view === 'store') {
            mainHeader?.classList.add('hidden');
            mainFooter?.classList.add('hidden');
            document.body.classList.add('bg-apple-500');
        } else {
            mainHeader?.classList.remove('hidden');
            mainFooter?.classList.remove('hidden');
            document.body.classList.remove('bg-apple-500');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderView(view) {
        const container = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${view}`);
        if (!template) return;
        
        container.innerHTML = template.innerHTML;
        
        if (view === 'store') {
            document.title = `${this.state.storeName} | Boutique Pro`;
            const titleEl = document.getElementById('store-title');
            const heroImg = document.getElementById('store-hero-img');
            
            if (titleEl) titleEl.textContent = this.state.storeName;
            if (heroImg) {
                const keyword = this.state.storeName.replace(/\s+/g, ',');
                heroImg.src = `https://source.unsplash.com/featured/?${keyword},store,business`;
            }
            if (this.state.products.length > 0) this.renderProductGrid();
        }

        if (view === 'share') {
            const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
            document.getElementById('shareable-url').value = shareUrl;
            document.getElementById('view-store-btn').href = shareUrl;
            document.title = `Tienda Creada: ${this.state.storeName}`;
            document.getElementById('share-store-name').textContent = this.state.storeName;
        }

        if (view === 'diy' && this.state.sheetId) {
            document.getElementById('store-name-input').value = this.state.storeName;
            document.getElementById('whatsapp-input').value = this.state.sellerWhatsApp;
            document.getElementById('sheet-url-input').value = `https://docs.google.com/spreadsheets/d/${this.state.sheetId}/edit`;
        }

        lucide.createIcons();
    },

    async generateFromDiy() {
        const name = document.getElementById('store-name-input').value.trim();
        const code = document.getElementById('country-code').value;
        const phone = document.getElementById('whatsapp-input').value.trim();
        const url = document.getElementById('sheet-url-input').value.trim();

        if (!name || !phone || !url) return this.notify("Faltan datos críticos", "error");

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return this.notify("Ese link de Excel no sirve", "error");

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = `${code}${phone}`.replace(/[^\d]/g, '');
        this.state.storeName = name;
        this.navigate('share');
    },

    editStoreData() {
        this.navigate('diy');
    },

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

            this.state.categories = [...new Set(this.state.products.map(p => p.Categoria))];
            this.state.filteredProducts = [...this.state.products];
            this.renderProductGrid();
            this.renderCategoryFilters();
        } catch (e) {
            this.notify("Error sincronizando. Verifica el link del Excel.", "error");
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
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = this.state.filteredProducts.map(p => `
            <div class="apple-card rounded-[2.5rem] overflow-hidden flex flex-col group h-full">
                <div class="h-64 bg-white/5 flex items-center justify-center overflow-hidden relative">
                    ${p.LinkFoto ? `<img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">` : `<i data-lucide="package" class="opacity-10 h-10 w-10"></i>`}
                    ${p.Stock <= 0 ? '<div class="absolute inset-0 bg-black/60 flex items-center justify-center font-black uppercase text-[10px] tracking-widest">Agotado</div>' : ''}
                </div>
                <div class="p-8 flex flex-col flex-grow">
                    <span class="text-[9px] font-black uppercase text-apple-blue mb-2 tracking-widest">${p.Categoria}</span>
                    <h3 class="text-lg font-bold mb-6 italic leading-tight">${p.Producto}</h3>
                    <div class="mt-auto pt-6 border-t border-white/5 flex flex-col gap-5">
                        <div class="flex justify-between items-end">
                            <span class="text-3xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                            <span class="text-[9px] font-bold text-white/20 uppercase tracking-widest">#${p.Codigo}</span>
                        </div>
                        <div class="grid grid-cols-5 gap-2">
                             <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="col-span-4 h-12 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-apple-100 transition-all">
                                <i data-lucide="shopping-basket" class="w-3.5 h-3.5"></i> Añadir
                             </button>
                             <button onclick="app.buyNow('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-12 bg-apple-blue text-white rounded-xl flex items-center justify-center hover:brightness-110">
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
        container.innerHTML = cats.map(c => `
            <button onclick="app.filterCategory('${c}')" class="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${this.state.activeCategory === c ? 'bg-apple-blue text-white shadow-xl shadow-apple-blue/20' : 'bg-white/5 text-apple-400 border border-white/5 hover:text-white'}">${c === 'all' ? 'Ver Todo' : c}</button>
        `).join('');
    },

    // --- Cart Engine ---
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
        this.saveCart();
        this.updateCartCount();
        this.notify(`+1 ${p.Producto}`, "success");
    },

    buyNow(id) { this.addToCart(id); this.toggleCart(true); },

    updateQuantity(id, mod) {
        const item = this.state.cart.find(i => i.id === id);
        if (!item) return;
        item.quantity += mod;
        if (item.quantity <= 0) this.state.cart = this.state.cart.filter(i => i.id !== id);
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    },

    updateCartCount() {
        const count = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        document.getElementById('cart-count-btn').textContent = count;
        const mainCount = document.getElementById('cart-count');
        if (mainCount) mainCount.textContent = count;
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
        if (!list) return;

        if (this.state.cart.length === 0) {
            list.innerHTML = `<div class="py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-[0.4em]">Bolsa vacía</div>`;
            totalEl.textContent = '$0';
            return;
        }

        list.innerHTML = this.state.cart.map(i => `
            <div class="flex gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/5">
                <img src="${i.LinkFoto}" class="h-16 w-16 rounded-2xl object-cover" onerror="this.src='https://placehold.co/100/121/868?text=X'">
                <div class="flex-grow">
                    <h4 class="font-bold text-xs truncate w-32 italic">${i.Producto}</h4>
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
        const area = document.getElementById('buyer-address').value.trim();
        if (!buyer || !area) return this.notify("Nombre y dirección necesarios", "error");

        let m = ` *NUEVO PEDIDO: ${this.state.storeName.toUpperCase()}*\n\n`;
        m += `👤 *Cliente:* ${buyer}\n`;
        m += `📍 *Dirección:* ${area}\n\n`;
        m += `----------------------------\n`;
        this.state.cart.forEach(i => m += `▫️ *${i.Producto}* (x${i.quantity})\n    Sub: $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n\n`);
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        m += `----------------------------\n💰 *TOTAL PRODUCTOS: $${total.toLocaleString('es-CL')}*\n\n`;
        m += `🚚 _Gestionado vía tikk.cl_`;
        
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    // --- Pro ZIP Export ---
    async downloadProZip() {
        this.notify("Generando paquete boutique...", "info");
        const zip = new JSZip();
        const slug = this.state.storeName.toLowerCase().replace(/\s+/g, '-');
        const keyword = this.state.storeName.replace(/\s+/g, ',');
        
        const html = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.state.storeName} | Powered by tikk</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={darkMode:'class',theme:{extend:{colors:{apple:{blue:'#0071e3'}}}}}</script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>body{background:#000;color:#f5f5f7;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}.card{background:#121212;border:1px solid rgba(255,255,255,0.05);transition:all .3s ease}.h-grad{background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.8) 100%)}</style>
</head>
<body class="pb-24">
    <div class="h-[40vh] relative overflow-hidden bg-apple-500">
        <img src="https://source.unsplash.com/featured/?${keyword},store" class="absolute inset-0 w-full h-full object-cover opacity-60">
        <div class="absolute inset-0 h-grad"></div>
        <div class="absolute inset-0 flex items-center justify-center p-6"><h1 class="text-4xl md:text-7xl font-black italic tracking-tighter drop-shadow-2xl text-center">${this.state.storeName}</h1></div>
    </div>
    <main class="max-w-7xl mx-auto px-6 py-10">
        <div class="flex justify-between items-center gap-6 mb-12 flex-wrap">
            <input type="text" id="sr" placeholder="Busca productos..." oninput="re(this.value)" class="w-full max-w-sm h-12 px-6 rounded-2xl bg-white/5 border border-white/10 outline-none text-sm">
            <div id="cf" class="flex gap-2"></div>
            <button onclick="tgC()" class="bg-white/5 px-6 h-12 rounded-full font-bold text-xs">BOLSA (<span id="cc">0</span>)</button>
        </div>
        <div id="gd" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"></div>
    </main>
    <footer class="py-20 text-center opacity-40 border-t border-white/5 text-[10px] uppercase font-black tracking-widest font-bold">
        Powered by tikk.cl | Created by Dan Tagle
    </footer>
    <aside id="sb" class="fixed inset-y-0 right-0 w-full max-w-sm bg-[#121212] z-[70] translate-x-full transition-transform p-8 flex flex-col border-l border-white/10">
        <h2 class="text-2xl font-black mb-8 italic">Bolsa</h2>
        <div id="ci" class="flex-grow overflow-auto mb-6"></div>
        <div class="pt-6 border-t border-white/5 mb-6 space-y-4">
            <input type="text" id="bn" placeholder="Nombre" class="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/5 text-sm">
            <input type="text" id="ba" placeholder="Dirección" class="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/5 text-sm">
            <div class="flex justify-between items-end"><span id="tt" class="text-2xl font-black">$0</span></div>
        </div>
        <button onclick="se()" class="w-full h-14 bg-apple-blue text-white rounded-2xl font-black">WhatsApp Pedido</button>
    </aside>
    <div id="ov" onclick="tgC()" class="fixed inset-0 bg-black/60 hidden z-60 backdrop-blur-sm"></div>

    <script>
        const ID="${this.state.sheetId}",WA="${this.state.sellerWhatsApp}",SN="${this.state.storeName}";let ps=[],ct=[],ac='all',q='';
        async function fd(){
            const r=await fetch(\`https://docs.google.com/spreadsheets/d/\${ID}/export?format=csv\`); const t=await r.text();
            const rs=t.split('\\n'); const hs=rs[0].split(',').map(h=>h.trim().replace(/"/g,''));
            ps=rs.slice(1).map(r=>{const v=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); let o={}; hs.forEach((h,i)=>o[h]=v[i]?v[i].replace(/"/g,''):''); return o;})
            .filter(d=>d.Producto).map(p=>({id:p.Codigo,c:p.Categoria||'General',n:p.Producto,p:parseInt(p.Precio)||0,f:p.LinkFoto}));rps();rfc();
        }
        function rps(){
            const g=document.getElementById('gd'); const f=ps.filter(p=>(ac==='all'||p.c===ac)&&(p.n.toLowerCase().includes(q)));
            g.innerHTML=f.map(p=>\`<div class="card rounded-3xl overflow-hidden flex flex-col">
                <div class="h-64 bg-white/5">\${p.f?'<img src="'+p.f+'" class="w-full h-full object-cover">':'<div class="h-full flex items-center justify-center opacity-10"><i data-lucide="package"></i></div>'}</div>
                <div class="p-8 flex flex-col flex-grow"><span class="text-[9px] font-black text-apple-blue uppercase mb-2">\${p.c}</span><h3 class="font-bold h-12 italic text-lg opacity-90">\${p.n}</h3><div class="mt-auto flex justify-between items-end"><span class="font-black text-xl">$\${p.p.toLocaleString('es-CL')}</span><button onclick="ad('\${p.id}')" class="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">Añadir</button></div></div></div>\`).join('');
            lucide.createIcons();
        }
        function rfc(){
            const cs=['all',...new Set(ps.map(p=>p.c))]; document.getElementById('cf').innerHTML=cs.map(c=>\`<button onclick="ac='\${c}';rps();rfc();" class="px-5 py-2 rounded-full text-[10px] font-black uppercase \${ac===c?'bg-apple-blue':'bg-white/5'}">\${c}</button>\`).join('');
        }
        function ad(id){const p=ps.find(x=>x.id===id);const e=ct.find(x=>x.id===id);if(e)e.q++;else ct.push({...p,q:1});render();}
        function render(){
            document.getElementById('cc').innerText=ct.reduce((s,i)=>s+i.q,0);
            document.getElementById('ci').innerHTML=ct.map(i=>\`<div class="flex justify-between mb-4 text-xs font-bold italic"><span>\${i.n} x\${i.q}</span><span>$\${(i.p*i.q).toLocaleString('es-CL')}</span></div>\`).join('');
            document.getElementById('tt').innerText='$'+ct.reduce((s,i)=>s+(i.p*i.q),0).toLocaleString('es-CL');
        }
        function tgC(){document.getElementById('sb').classList.toggle('translate-x-full');document.getElementById('ov').classList.toggle('hidden');}
        function re(v){q=v.toLowerCase();rps();}
        function se(){
            const n=document.getElementById('bn').value,a=document.getElementById('ba').value; if(!n||!a)return alert('Datos incompletos');
            let m=\`🛍️ PEDIDO: \${SN.toUpperCase()}\\n👤: \${n}\\n📍: \${a}\\n\\n\`; ct.forEach(i=>m+=\`- \${i.n} (x\${i.q})\\n\`);
            window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(m));
        }
        fd();lucide.createIcons();
    </script>
</body>
</html>`;

        zip.file("index.html", html);
        zip.file("LEEME.txt", "Tikk Pro ZIP\n\n1. Sube el index.html a GitHub.\n2. Listo.\nBy Dan Tagle.");
        
        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${slug}-boutique.zip`;
        link.click();
        this.notify("Tu boutique pro está lista para descargar", "success");
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