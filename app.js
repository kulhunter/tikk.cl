/**
 * tikk.js - human-centric store platform
 * Optimized for ages 30-60.
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
        console.log("tikk human-core starting...");
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
        
        // --- Header/Footer Visibility ---
        const mainHeader = document.getElementById('main-header');
        const mainFooter = document.getElementById('main-footer');
        if (view === 'store') {
            mainHeader?.classList.add('hidden');
            mainFooter?.classList.add('hidden');
        } else {
            mainHeader?.classList.remove('hidden');
            mainFooter?.classList.remove('hidden');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderView(view) {
        const container = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${view}`);
        if (!template) return;
        
        container.innerHTML = template.innerHTML;
        
        if (view === 'store') {
            document.getElementById('store-title').textContent = this.state.storeName;
            const heroImg = document.getElementById('store-hero-img');
            if (heroImg) {
                const query = encodeURIComponent(this.state.storeName.replace(/\s+/g, ','));
                heroImg.src = `https://source.unsplash.com/featured/?${query},store,boutique,business`;
            }
            if (this.state.products.length > 0) {
                this.renderProductGrid();
                this.renderCategoryFilters();
            }
        }

        if (view === 'share') {
            const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
            const input = document.getElementById('shareable-url');
            if (input) input.value = shareUrl;
            
            const btn = document.getElementById('view-store-btn');
            if (btn) btn.href = shareUrl;
            
            const nameEl = document.getElementById('share-store-name');
            if (nameEl) nameEl.textContent = this.state.storeName;
        }

        if (view === 'diy' && this.state.sheetId) {
            const nameInput = document.getElementById('store-name-input');
            const waInput = document.getElementById('whatsapp-input');
            const sheetInput = document.getElementById('sheet-url-input');
            if (nameInput) nameInput.value = this.state.storeName;
            if (waInput) waInput.value = this.state.sellerWhatsApp.substring(this.state.sellerWhatsApp.length - 8); // simplified restoration
            if (sheetInput) sheetInput.value = `https://docs.google.com/spreadsheets/d/${this.state.sheetId}/edit`;
        }

        lucide.createIcons();
    },

    async generateFromDiy() {
        const nameInput = document.getElementById('store-name-input');
        const phoneInput = document.getElementById('whatsapp-input');
        const sheetInput = document.getElementById('sheet-url-input');
        const countrySelect = document.getElementById('country-code');

        if (!nameInput || !phoneInput || !sheetInput || !countrySelect) {
            this.notify("Error de cargador. Intenta recargar la página.", "error");
            return;
        }

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const url = sheetInput.value.trim();
        const code = countrySelect.value;

        if (!name || !phone || !url) {
            this.notify("Debes completar todos los campos.", "error");
            return;
        }

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            this.notify("Link del Excel no es válido.", "error");
            return;
        }

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = `${code}${phone}`.replace(/[^\d]/g, '');
        this.state.storeName = name;
        
        this.navigate('share');
    },

    editStoreData() { this.navigate('diy'); },

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
            this.notify("No pudimos leer tu Excel. Asegúrate que esté compartido para lectura pública.", "error");
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
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = this.state.filteredProducts.map(p => `
            <div class="card-pro overflow-hidden flex flex-col h-full group">
                <div class="h-64 bg-white/5 relative flex items-center justify-center overflow-hidden">
                    ${p.LinkFoto ? `<img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">` : `<i data-lucide="package" class="opacity-20 w-10 h-10"></i>`}
                    ${p.Stock <= 0 ? `<div class="absolute inset-0 bg-black/70 flex items-center justify-center font-black uppercase text-[10px] tracking-widest italic">Agotado</div>` : ''}
                </div>
                <div class="p-6 md:p-8 flex flex-col flex-grow">
                    <span class="text-[9px] font-black uppercase tracking-widest text-apple-blue mb-3">${p.Categoria}</span>
                    <h3 class="text-xl font-bold mb-4 italic leading-tight">${p.Producto}</h3>
                    <div class="mt-auto space-y-4">
                        <div class="flex justify-between items-end">
                            <span class="text-3xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                            <span class="text-[9px] text-white/20 font-bold tracking-widest uppercase">Cod: ${p.Codigo}</span>
                        </div>
                        <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="w-full h-12 ${p.Stock > 0 ? 'bg-white text-black' : 'bg-white/5 text-white/20'} rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i> Añadir
                        </button>
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
            <button onclick="app.filterCategory('${c}')" class="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${this.state.activeCategory === c ? 'bg-apple-blue text-white shadow-xl shadow-apple-blue/20' : 'bg-white/5 text-white/40 border border-white/5 hover:text-white'}">${c === 'all' ? 'Todo' : c}</button>
        `).join('');
    },

    // --- Cart ---
    addToCart(id) {
        const prod = this.state.products.find(p => p.id === id);
        const cur = this.state.cart.find(i => i.id === id);
        if (cur) {
            if (cur.quantity < prod.Stock) cur.quantity++;
            else return this.notify("Máximo stock limitado.", "warning");
        } else {
            this.state.cart.push({ ...prod, quantity: 1 });
        }
        this.saveCart();
        this.updateCartCount();
        this.notify(`+1 ${prod.Producto}`, "success");
    },
    
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
        const btnCount = document.getElementById('cart-count-btn');
        if (btnCount) btnCount.textContent = count;
        const mainCount = document.getElementById('cart-count');
        if (mainCount) mainCount.textContent = count;
    },

    saveCart() { localStorage.setItem('tikk-cart', JSON.stringify(this.state.cart)); },

    toggleCart(force) {
        this.state.isCartOpen = force !== undefined ? force : !this.state.isCartOpen;
        const s = document.getElementById('cart-sidebar');
        if (this.state.isCartOpen) { s.classList.remove('translate-x-[110%]'); this.renderCart(); }
        else s.classList.add('translate-x-[110%]');
    },

    renderCart() {
        const list = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        if (!list) return;

        if (this.state.cart.length === 0) {
            list.innerHTML = `<div class="py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-[0.4em]">Sin productos</div>`;
            totalEl.textContent = '$0';
            return;
        }

        list.innerHTML = this.state.cart.map(i => `
            <div class="flex gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/5">
                <img src="${i.LinkFoto}" class="h-16 w-16 rounded-xl object-cover" onerror="this.src='https://placehold.co/100/121/868?text=X'">
                <div class="flex-grow">
                    <h4 class="font-bold text-xs italic">${i.Producto}</h4>
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
        const name = document.getElementById('buyer-name').value.trim();
        const address = document.getElementById('buyer-address').value.trim();
        if (!name || !address) return this.notify("Nombre y dirección requeridos.", "error");

        let m = ` *PEDIDO: ${this.state.storeName.toUpperCase()}*\n\n`;
        m += `👤: ${name}\n📍: ${address}\n\n`;
        this.state.cart.forEach(i => m += `▫️ *${i.Producto}* (x${i.quantity})\n    $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n\n`);
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        m += `----------------------------\n💰 *TOTAL: $${total.toLocaleString('es-CL')}*\n\n_Generado vía tikk.cl_`;
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    // --- Modals ---
    toggleDomainModal(show) {
        const m = document.getElementById('modal-domain');
        if (show) m.classList.remove('opacity-0', 'pointer-events-none');
        else m.classList.add('opacity-0', 'pointer-events-none');
    },

    copyStoreLink() {
        const input = document.getElementById('shareable-url');
        input.select();
        navigator.clipboard.writeText(input.value);
        this.notify("Link copiado con éxito.", "success");
    },

    async downloadProZip() {
        this.notify("Preparando descarga...", "info");
        const zip = new JSZip();
        const slug = this.state.storeName.toLowerCase().replace(/\s+/g, '-');
        const query = encodeURIComponent(this.state.storeName.replace(/\s+/g, ','));

        const html = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.state.storeName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={darkMode:'class',theme:{extend:{colors:{apple:{blue:'#0071e3'}}}}}</script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>body{background:#000;color:#f5f5f7;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}.hero-grad{background:linear-gradient(to top,#000,transparent)}.card{background:#121212;border:1px solid rgba(255,255,255,0.1);border-radius:2rem}::-webkit-scrollbar{display:none}</style>
</head>
<body class="pb-32">
    <div class="h-[50vh] relative overflow-hidden">
        <img src="https://source.unsplash.com/featured/?${query},store" class="absolute inset-0 w-full h-full object-cover opacity-60">
        <div class="absolute inset-0 hero-grad"></div>
        <div class="absolute inset-0 flex items-center justify-center p-6"><h1 class="text-4xl md:text-7xl font-black italic tracking-tighter drop-shadow-2xl text-center uppercase">${this.state.storeName}</h1></div>
    </div>
    <main class="max-w-7xl mx-auto px-6 py-10">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <input type="text" id="sr" placeholder="Buscar..." oninput="re(this.value)" class="w-full max-w-sm h-14 px-6 rounded-2xl bg-white/5 border border-white/10 outline-none text-sm">
            <div id="cf" class="flex gap-2"></div>
            <button onclick="tgC()" class="bg-white/5 px-8 h-14 rounded-full font-bold text-xs border border-white/5">BOLSA (<span id="cc">0</span>)</button>
        </div>
        <div id="gd" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"></div>
    </main>
    <aside id="sb" class="fixed inset-y-0 right-0 w-full max-w-sm bg-[#121212] z-[70] translate-x-full transition-transform p-8 flex flex-col border-l border-white/10">
        <h2 class="text-2xl font-black mb-8 italic">Bolsa</h2>
        <div id="ci" class="flex-grow overflow-auto mb-6"></div>
        <div class="pt-6 border-t border-white/10 mb-6 space-y-4">
            <input type="text" id="bn" placeholder="Nombre" class="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 outline-none">
            <input type="text" id="ba" placeholder="Dirección" class="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 outline-none">
            <div class="flex justify-between items-end"><span id="tt" class="text-2xl font-black italic">$0</span></div>
        </div>
        <button onclick="se()" class="w-full h-14 bg-apple-blue text-white rounded-2xl font-black">Enviar por WhatsApp</button>
    </aside>
    <div id="ov" onclick="tgC()" class="fixed inset-0 bg-black/80 hidden z-60 backdrop-blur-sm"></div>

    <script>
        const ID="${this.state.sheetId}",WA="${this.state.sellerWhatsApp}",SN="${this.state.storeName}";let ps=[],ct=[],ac='all',q='';
        async function fd(){
            const r=await fetch(\`https://docs.google.com/spreadsheets/d/\${ID}/export?format=csv\`); const t=await r.text();
            const rs=t.split('\\n'); const hs=rs[0].split(',').map(h=>h.trim().replace(/"/g,''));
            ps=rs.slice(1).map(r=>{const v=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); let o={}; hs.forEach((h,i)=>o[h]=v[i]?v[i].replace(/"/g,''):''); return o;})
            .filter(d=>d.Producto).map(p=>({id:p.Codigo,c:p.Categoria,n:p.Producto,p:parseInt(p.Precio),f:p.LinkFoto})); rps(); rfc();
        }
        function rps(){
            const g=document.getElementById('gd'); const f=ps.filter(p=>(ac==='all'||p.c===ac)&&(p.n.toLowerCase().includes(q)));
            g.innerHTML=f.map(p=>\`<div class="card overflow-hidden flex flex-col">
                <div class="h-64 bg-white/5">\${p.f?'<img src="'+p.f+'" class="w-full h-full object-cover">':'<div class="h-full flex items-center justify-center opacity-10"><i data-lucide="package"></i></div>'}</div>
                <div class="p-8 flex flex-col flex-grow"><span class="text-[9px] font-black text-apple-blue uppercase tracking-widest">\${p.c}</span><h3 class="font-bold h-12 italic opacity-90">\${p.n}</h3><div class="mt-auto flex justify-between items-end"><span class="font-black text-xl">$\${p.p.toLocaleString('es-CL')}</span><button onclick="ad('\${p.id}')" class="bg-white text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase">Añadir</button></div></div></div>\`).join('');
            lucide.createIcons();
        }
        function rfc(){
            const cs=['all',...new Set(ps.map(p=>p.c))]; document.getElementById('cf').innerHTML=cs.map(c=>\`<button onclick="ac='\${c}';rps();rfc();" class="px-5 py-2 rounded-full text-[10px] font-black \${ac===c?'bg-apple-blue':'bg-white/5'} uppercase tracking-widest">\${c}</button>\`).join('');
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
            const n=document.getElementById('bn').value,a=document.getElementById('ba').value; if(!n||!a)return alert('Faltan datos');
            let m=\`🛍️ PEDIDO: \${SN.toUpperCase()}\\n👤: \${n}\\n📍: \${a}\\n\\n\`; ct.forEach(i=>m+=\`- \${i.n} (x\${i.q})\\n\`);
            window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(m));
        }
        fd();lucide.createIcons();
    </script>
</body>
</html>`;

        zip.file("index.html", html);
        zip.file("README.txt", "Tikk Pro. Sube el index.html a GitHub y listo.");
        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = `${slug}.zip`; link.click();
        this.notify("¡Descarga lista!", "success");
    },

    notify(m, t) {
        const c = document.getElementById('notification-container');
        if (!c) return;
        const n = document.createElement('div');
        const bg = t === 'success' ? 'bg-apple-blue' : t === 'error' ? 'bg-red-600' : 'bg-white/10';
        n.className = `${bg} text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 transition-all duration-500 translate-y-12 opacity-0 font-bold text-sm border border-white/10 animate-in fade-in slide-in-from-bottom-4`;
        n.innerHTML = `<i data-lucide="${t === 'success' ? 'check' : 'alert-circle'}" class="w-4 h-4"></i><span>${m}</span>`;
        c.appendChild(n);
        lucide.createIcons();
        setTimeout(() => n.classList.remove('translate-y-12', 'opacity-0'), 10);
        setTimeout(() => { n.classList.add('opacity-0', 'translate-y-4'); setTimeout(() => n.remove(), 500); }, 3500);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());