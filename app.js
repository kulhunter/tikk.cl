/**
 * tikk.js - boutique luxury engine v4.1
 * UX Final Patch & ZIP Pro
 * Developed by Dan Tagle
 */

const app = {
    state: {
        currentView: 'landing',
        sheetId: null,
        products: [],
        categories: [],
        filteredProducts: [],
        cart: JSON.parse(localStorage.getItem('tikk-cart-lux-v2') || '[]'),
        activeCategory: 'all',
        sellerWhatsApp: '',
        storeName: 'Boutique Pro',
        isCartOpen: false,
        searchQuery: '',
        activeProductId: null
    },

    init() {
        console.log("tikk boutique ready — luxury pyme solution");
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
        
        const header = document.getElementById('main-header');
        const footer = document.getElementById('global-footer');
        const cartBtn = document.getElementById('cart-button');
        
        if (view === 'store') {
            header?.classList.add('hidden');
            footer?.classList.add('hidden');
            cartBtn?.classList.remove('hidden');
        } else {
            header?.classList.remove('hidden');
            footer?.classList.remove('hidden');
            cartBtn?.classList.add('hidden');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderView(view) {
        const container = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${view}`);
        if (!template) return;
        
        container.innerHTML = template.innerHTML;
        
        if (view === 'store') {
            document.title = `${this.state.storeName} | tikk Boutique`;
            const titleEl = document.getElementById('store-title');
            if (titleEl) titleEl.textContent = this.state.storeName;
            
            const heroImg = document.getElementById('store-hero-img');
            if (heroImg) {
                const keyword = encodeURIComponent(this.state.storeName.split(' ')[0]);
                heroImg.src = `https://source.unsplash.com/1600x900/?${keyword},luxury,store`;
                heroImg.onload = () => heroImg.style.opacity = '0.6';
                heroImg.onerror = () => { heroImg.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600'; };
            }
            if (this.state.products.length > 0) {
                this.renderProductGrid();
                this.renderCategoryFilters();
            }
        }

        if (view === 'share') {
            const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
            document.getElementById('shareable-url').value = shareUrl;
            document.getElementById('view-store-btn').href = shareUrl;
            document.getElementById('share-store-name').textContent = this.state.storeName;
        }

        lucide.createIcons();
    },

    async generateFromDiy() {
        const nameInput = document.getElementById('store-name-input');
        const whatsappInput = document.getElementById('whatsapp-input');
        const sheetInput = document.getElementById('sheet-url-input');
        const countrySelect = document.getElementById('country-code');

        if (!nameInput || !whatsappInput || !sheetInput) return;

        const name = nameInput.value.trim();
        const wa = whatsappInput.value.trim();
        const url = sheetInput.value.trim();
        const code = countrySelect.value;

        if (!name || !wa || !url) return this.notify("Completa todos los campos", "error");

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return this.notify("Vínculo de Excel no válido", "error");

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = `${code}${wa}`.replace(/[^\d]/g, '');
        this.state.storeName = name;
        this.navigate('share');
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
                headers.forEach((h, i) => { obj[h] = values[i] ? values[i].replace(/"/g, '').trim() : ''; });
                return obj;
            }).filter(o => !!o.Producto).map(p => ({
                id: p.Codigo,
                Codigo: p.Codigo,
                Categoria: p.Categoria || 'Boutique',
                Producto: p.Producto,
                Descripcion: p.Descripcion || '',
                Stock: parseInt(p.Stock) || 0,
                Precio: parseInt(p.Precio) || 0,
                LinkFoto: p.LinkFoto
            }));

            this.state.categories = [...new Set(this.state.products.map(p => p.Categoria))];
            this.state.filteredProducts = [...this.state.products];
            this.renderProductGrid();
            this.renderCategoryFilters();
        } catch (e) {
            this.notify("No pudimos conectar con el Excel", "error");
        }
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = this.state.filteredProducts.map(p => `
            <div onclick="app.openProductModal('${p.id}')" class="lux-card overflow-hidden flex flex-col group h-full cursor-pointer">
                <div class="h-80 bg-white/5 relative overflow-hidden flex items-center justify-center">
                    ${p.LinkFoto ? `<img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000">` : `<i data-lucide="package" class="opacity-10 w-12 h-12"></i>`}
                    ${p.Stock <= 0 ? `<div class="absolute inset-0 bg-black/80 flex items-center justify-center font-black uppercase text-[10px] tracking-[0.4em] italic">Agotado</div>` : ''}
                </div>
                <div class="p-10 flex flex-col flex-grow">
                    <span class="text-[9px] font-black uppercase text-lux-blue mb-3 tracking-[0.3em] font-bold">${p.Categoria}</span>
                    <h3 class="text-2xl font-black italic mb-6 leading-none">${p.Producto}</h3>
                    <div class="mt-auto flex justify-between items-end border-t border-white/5 pt-8">
                        <span class="text-3xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                        <div class="text-[9px] font-black uppercase text-white/20 tracking-widest">Detalle</div>
                    </div>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    openProductModal(id) {
        const p = this.state.products.find(x => x.id === id);
        if (!p) return;
        this.state.activeProductId = id;

        const content = document.getElementById('modal-content');
        const actions = document.getElementById('modal-actions');
        
        content.innerHTML = `
            <div class="space-y-12">
                <div class="h-[400px] bg-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                    <img src="${p.LinkFoto || 'https://placehold.co/800/000/fff?text=No+Photo'}" class="w-full h-full object-cover">
                </div>
                <div class="space-y-6">
                    <span class="text-xs font-black uppercase text-lux-blue tracking-[0.4em] font-bold">${p.Categoria}</span>
                    <h2 class="text-5xl font-black italic leading-tight">${p.Producto}</h2>
                    <p class="text-lux-400 font-medium text-lg leading-relaxed">${p.Descripcion || 'Curated item from our collection.'}</p>
                </div>
                <div class="flex justify-between items-center py-10 border-y border-white/5">
                    <div>
                        <span class="block text-[10px] font-black uppercase text-white/20 tracking-widest mb-2 font-bold italic">Boutique Price</span>
                        <span class="text-6xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                    </div>
                    ${p.Stock > 0 ? `<div class="text-right"><span class="block text-[10px] font-black text-lux-blue uppercase tracking-widest mb-1 italic">Disponible</span><span class="text-lg font-black">${p.Stock} unis</span></div>` : ''}
                </div>
            </div>
        `;

        actions.innerHTML = `
            <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-20 rounded-[1.5rem] border border-white/10 font-black text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all">Añadir a Bolsa</button>
            <button onclick="app.buyNow('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-20 rounded-[1.5rem] bg-lux-blue text-white font-black text-[11px] uppercase tracking-widest">Lo quiero ahora</button>
        `;

        document.getElementById('modal-overlay').classList.add('opacity-100', 'pointer-events-auto');
        document.getElementById('product-modal').classList.remove('drawer-closed');
        document.getElementById('product-modal').classList.add('drawer-open');
        lucide.createIcons();
    },

    closeProductModal() {
        document.getElementById('modal-overlay').classList.remove('opacity-100', 'pointer-events-auto');
        document.getElementById('product-modal').classList.add('drawer-closed');
        document.getElementById('product-modal').classList.remove('drawer-open');
    },

    handleSearch(q) { this.state.searchQuery = q.toLowerCase(); this.applyFilters(); },
    filterCategory(c) { this.state.activeCategory = c; this.applyFilters(); },
    applyFilters() {
        this.state.filteredProducts = this.state.products.filter(p => {
            const mC = this.state.activeCategory === 'all' || p.Categoria === this.state.activeCategory;
            const mQ = p.Producto.toLowerCase().includes(this.state.searchQuery);
            return mC && mQ;
        });
        this.renderProductGrid();
    },

    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;
        const cats = ['all', ...this.state.categories];
        container.innerHTML = cats.map(c => `
            <button onclick="app.filterCategory('${c}')" class="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${this.state.activeCategory === c ? 'bg-lux-blue text-white shadow-xl shadow-lux-blue/20' : 'bg-white/5 text-white/30 hover:text-white border border-white/5'}">${c === 'all' ? 'Ver Todo' : c}</button>
        `).join('');
    },

    addToCart(id) {
        const p = this.state.products.find(x => x.id === id);
        const cur = this.state.cart.find(i => i.id === id);
        if (cur) cur.quantity++;
        else this.state.cart.push({ ...p, quantity: 1 });
        this.saveCart();
        this.updateCartCount();
        this.notify(`Añadido: ${p.Producto}`, "success");
    },
    
    buyNow(id) {
        const p = this.state.products.find(x => x.id === id);
        let m = ` *BOUTIQUE: ${this.state.storeName.toUpperCase()}*\n✨ *Producto:* ${p.Producto}\n💰 *Precio:* $${p.Precio.toLocaleString('es-CL')}\n\n Quiero este producto lo antes posible.`;
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    updateCartCount() {
        const c = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        const btn = document.getElementById('cart-count-btn');
        if (btn) btn.textContent = c;
    },

    saveCart() { localStorage.setItem('tikk-cart-lux-v2', JSON.stringify(this.state.cart)); },

    toggleCart() {
        if (this.state.cart.length === 0) return this.notify("La bolsa está vacía", "info");
        let m = ` *PEDIDO: ${this.state.storeName.toUpperCase()}*\n\n`;
        this.state.cart.forEach(i => m += `▫️ *${i.Producto}* (x${i.quantity}) - $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n`);
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        m += `\n💰 *TOTAL SOLICITADO: $${total.toLocaleString('es-CL')}*\n\n_Gestionado vía tikk.cl_`;
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    toggleDomainModal(show) {
        const m = document.getElementById('modal-domain');
        if (show) m.classList.remove('hidden');
        else m.classList.add('hidden');
    },

    notify(m, t) {
        const c = document.getElementById('notification-container');
        const n = document.createElement('div');
        const bg = t === 'error' ? 'bg-red-600' : 'bg-lux-500';
        n.className = `${bg} text-white px-8 py-5 rounded-3xl shadow-2xl border border-white/10 font-bold text-xs flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 transition-all`;
        n.innerHTML = `<i data-lucide="zap" class="w-4 h-4 text-white"></i><span>${m}</span>`;
        c.appendChild(n);
        lucide.createIcons();
        setTimeout(() => { n.classList.add('opacity-0'); setTimeout(() => n.remove(), 500); }, 3500);
    },

    copyStoreLink() {
        const url = document.getElementById('shareable-url').value;
        navigator.clipboard.writeText(url);
        this.notify("Link copiado para Instagram", "success");
    },
    
    editStoreData() { this.navigate('diy'); },

    shareWithFriend() {
        const m = "¡Mira tikk.cl! Permite crear una tienda boutique pro usando solo un Excel. Creado por Dan Tagle: https://tikk.cl";
        window.open(`https://wa.me/?text=${encodeURIComponent(m)}`);
    },

    async downloadProZip() {
        this.notify("Compilando Boutique ZIP...", "info");
        const zip = new JSZip();
        const slug = this.state.storeName.toLowerCase().replace(/\s+/g, '-');
        const k = encodeURIComponent(this.state.storeName.split(' ')[0]);

        // Standalone Boutique Code (Full drawer & hero support)
        const html = `<!DOCTYPE html><html lang="es" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${this.state.storeName} | Boutique</title><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config={darkMode:'class',theme:{extend:{colors:{lux:{blue:'#0071e3'}}}}}</script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet"><script src="https://unpkg.com/lucide@latest"></script><style>body{background:#000;color:#f5f5f7;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}.hero-grad{background:linear-gradient(to top,#000,transparent)}.card{background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:2.5rem;transition:all .4s ease}.card:hover{transform:translateY(-8px);border-color:rgba(255,255,255,0.2)}::-webkit-scrollbar{display:none}</style></head>
        <body class="pb-32">
        <div class="h-[50vh] relative overflow-hidden bg-zinc-900"><img src="https://source.unsplash.com/1600x900/?${k},store" class="absolute inset-0 w-full h-full object-cover opacity-60"><div class="absolute inset-0 hero-grad"></div><div class="absolute inset-0 flex flex-col items-center justify-center p-6"><h1 class="text-6xl md:text-[110px] font-black italic tracking-tighter drop-shadow-2xl text-center uppercase leading-none">${this.state.storeName}</h1></div></div>
        <main class="max-w-7xl mx-auto px-6 py-20"><div class="flex flex-col md:flex-row justify-between items-center gap-10 mb-20 border-b border-white/5 pb-10"><input type="text" id="sr" placeholder="Filtrar colección..." oninput="re(this.value)" class="w-full max-w-sm h-16 px-8 rounded-full bg-white/5 border border-white/10 outline-none text-sm transition-all focus:bg-white/10"><div id="cf" class="flex gap-2"></div><button onclick="tgC()" class="bg-white/5 px-10 h-16 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-4">MI BOLSA (<span id="cc">0</span>)</button></div><div id="gd" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-24 gap-x-12"></div></main>
        <footer class="py-24 text-center opacity-40 border-t border-white/5 text-[10px] uppercase font-black tracking-[0.6em]">Powered by tikk.cl | Created by Dan Tagle</footer>
        <aside id="sb" class="fixed inset-y-0 right-0 w-full max-w-sm bg-[#0a0a0a] z-[70] translate-x-full transition-transform p-10 flex flex-col border-l border-white/10"><h2 class="text-3xl font-black mb-10 italic">Mi Bolsa</h2><div id="ci" class="flex-grow overflow-auto mb-10"></div><div class="pt-10 border-t border-white/10 mb-10 space-y-6"><div class="flex justify-between items-end"><span id="tt" class="text-4xl font-black italic tracking-tighter">$0</span></div></div><button onclick="se()" class="w-full h-20 bg-lux-blue text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl">Pedir por WhatsApp</button></aside>
        <div id="ov" onclick="tgC()" class="fixed inset-0 bg-black/80 hidden z-[65] backdrop-blur-md"></div>
        <script>const ID="${this.state.sheetId}",WA="${this.state.sellerWhatsApp}",SN="${this.state.storeName}";let ps=[],ct=[],ac='all',q='';async function fd(){const r=await fetch(\`https://docs.google.com/spreadsheets/d/\${ID}/export?format=csv\`);const t=await r.text();const rs=t.split('\\n');const hs=rs[0].split(',').map(h=>h.trim().replace(/"/g,''));ps=rs.slice(1).map(r=>{const v=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);let o={};hs.forEach((h,i)=>o[h]=v[i]?v[i].replace(/"/g,''):'');return o;}).filter(d=>d.Producto).map(p=>({id:p.Codigo,c:p.Categoria||'Boutique',n:p.Producto,p:parseInt(p.Precio)||0,f:p.LinkFoto}));rps();rfc();}function rps(){const g=document.getElementById('gd');const f=ps.filter(p=>(ac==='all'||p.c===ac)&&(p.n.toLowerCase().includes(q)));g.innerHTML=f.map(p=>\`<div class="card overflow-hidden flex flex-col"><div class="h-80 bg-white/5 relative">\${p.f?'<img src="'+p.f+'" class="w-full h-full object-cover">':'<div class="h-full flex items-center justify-center opacity-10"><i data-lucide="package"></i></div>'}</div><div class="p-10 flex flex-col flex-grow"><span class="text-[9px] font-black text-lux-blue uppercase tracking-widest mb-3">\${p.c}</span><h3 class="font-black h-12 italic text-2xl leading-none">\${p.n}</h3><div class="mt-auto pt-8 border-t border-white/5 flex justify-between items-end"><span class="font-black text-3xl italic tracking-tighter">$\${p.p.toLocaleString('es-CL')}</span><button onclick="ad('\${p.id}')" class="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase">Añadir</button></div></div></div>\`).join('');lucide.createIcons();}function rfc(){const cs=['all',...new Set(ps.map(p=>p.c))];document.getElementById('cf').innerHTML=cs.map(c=>\`<button onclick="ac='\${c}';rps();rfc();" class="px-5 py-2 rounded-full text-[10px] font-black \${ac===c?'bg-lux-blue text-white':'bg-white/5'} uppercase tracking-widest">\${c}</button>\`).join('');}function ad(id){const p=ps.find(x=>x.id===id);const e=ct.find(x=>x.id===id);if(e)e.q++;else ct.push({...p,q:1});render();}function render(){document.getElementById('cc').innerText=ct.reduce((s,i)=>s+i.q,0);document.getElementById('ci').innerHTML=ct.map(i=>\`<div class="flex justify-between mb-6 text-xs font-bold italic"><span>\${i.n} x\${i.q}</span><span>$\${(i.p*i.q).toLocaleString('es-CL')}</span></div>\`).join('');document.getElementById('tt').innerText='$'+ct.reduce((s,i)=>s+(i.p*i.q),0).toLocaleString('es-CL');}function tgC(){document.getElementById('sb').classList.toggle('translate-x-full');document.getElementById('ov').classList.toggle('hidden');}function re(v){q=v.toLowerCase();rps();}function se(){let m=\`🛍️ PEDIDO: \${SN.toUpperCase()}\\n\\n\`;ct.forEach(i=>m+=\`- \${i.n} (x\${i.q})\\n\`);const t=ct.reduce((s,i)=>s+(i.p*i.q),0);m+=\`\\n💰 TOTAL: $\${t.toLocaleString('es-CL')}\`;window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(m));}fd();lucide.createIcons();</script></body></html>`;

        zip.file("index.html", html);
        zip.file("README_TIKK.txt", "Tikk Pro ZIP. Sube index.html a GitHub Pages. Creado por Dan Tagle.");
        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = `${slug}-boutique.zip`; link.click();
        this.notify("Boutique empaquetada con éxito", "success");
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());