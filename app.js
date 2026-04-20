/**
 * tikk.js - the definitive boutique engine
 * UX/UI Solid Patch
 */

const app = {
    state: {
        currentView: 'landing',
        sheetId: null,
        products: [],
        categories: [],
        filteredProducts: [],
        cart: JSON.parse(localStorage.getItem('tikk-cart-lux') || '[]'),
        activeCategory: 'all',
        sellerWhatsApp: '',
        storeName: 'Boutique Pro',
        isCartOpen: false,
        searchQuery: '',
        activeProductId: null
    },

    init() {
        console.log("tikk engine sync - stable ui");
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
        if (view === 'store') {
            header?.classList.add('hidden');
            footer?.classList.add('hidden');
        } else {
            header?.classList.remove('hidden');
            footer?.classList.remove('hidden');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderView(view) {
        const container = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${view}`);
        if (!template) return;
        
        container.innerHTML = template.innerHTML;
        
        if (view === 'store') {
            document.title = `${this.state.storeName} | tikk`;
            const titleEl = document.getElementById('store-title');
            if (titleEl) titleEl.textContent = this.state.storeName;
            
            const heroImg = document.getElementById('store-hero-img');
            if (heroImg) {
                // Resolution-optimized and more stable Unsplash URL
                const keyword = encodeURIComponent(this.state.storeName.split(' ')[0]);
                heroImg.src = `https://source.unsplash.com/1600x900/?${keyword},store,luxury`;
                heroImg.onload = () => heroImg.classList.add('reveal');
                heroImg.onerror = () => { heroImg.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600'; };
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
        const name = document.getElementById('store-name-input').value.trim();
        const phone = document.getElementById('whatsapp-input').value.trim();
        const url = document.getElementById('sheet-url-input').value.trim();
        const code = document.getElementById('country-code').value;

        if (!name || !phone || !url) return this.notify("Faltan datos", "error");

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return this.notify("Link de Excel inválido", "error");

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = `${code}${phone}`.replace(/[^\d]/g, '');
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
                Categoria: p.Categoria || 'General',
                Producto: p.Producto,
                Descripcion: p.Descripcion || '',
                Stock: parseInt(p.Stock) || 0,
                Precio: parseInt(p.Precio) || 0,
                LinkFoto: p.LinkFoto
            }));

            this.state.filteredProducts = [...this.state.products];
            this.state.categories = [...new Set(this.state.products.map(p => p.Categoria))];
            this.renderProductGrid();
            this.renderCategoryFilters();
        } catch (e) {
            this.notify("Error de sincronización", "error");
        }
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = this.state.filteredProducts.map(p => `
            <div onclick="app.openProductModal('${p.id}')" class="lux-card overflow-hidden flex flex-col group h-full cursor-pointer shadow-lg hover:shadow-2xl">
                <div class="h-80 bg-white/5 relative overflow-hidden flex items-center justify-center">
                    ${p.LinkFoto ? `<img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000">` : `<i data-lucide="package" class="opacity-10 w-12 h-12"></i>`}
                    ${p.Stock <= 0 ? `<div class="absolute inset-0 bg-black/80 flex items-center justify-center font-black uppercase text-[10px] tracking-widest italic tracking-[0.3em]">Agotado</div>` : ''}
                </div>
                <div class="p-8 flex flex-col flex-grow">
                    <span class="text-[9px] font-black uppercase text-lux-blue mb-2 tracking-widest">${p.Categoria}</span>
                    <h3 class="text-xl font-bold italic mb-4 leading-tight">${p.Producto}</h3>
                    <div class="mt-auto flex justify-between items-end border-t border-white/5 pt-6">
                        <span class="text-3xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                        <div class="bg-white/5 px-2 py-1 rounded text-[8px] font-bold text-white/30 uppercase tracking-widest">Ver detalle</div>
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
            <div class="space-y-10">
                <div class="h-96 bg-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                    <img src="${p.LinkFoto || 'https://placehold.co/600/000/fff?text=No+Photo'}" class="w-full h-full object-cover">
                </div>
                <div>
                    <span class="text-[10px] font-black uppercase text-lux-blue mb-4 block tracking-[0.3em] font-bold">${p.Categoria}</span>
                    <h2 class="text-4xl font-black italic mb-6 leading-tight">${p.Producto}</h2>
                    <p class="text-white/50 font-medium text-lg leading-relaxed">${p.Descripcion || 'Sin descripción.'}</p>
                </div>
                <div class="flex justify-between items-center py-8 border-y border-white/5">
                    <div>
                        <span class="block text-[10px] font-bold uppercase text-white/20 tracking-widest mb-1">Precio</span>
                        <span class="text-4xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                    </div>
                </div>
            </div>
        `;

        actions.innerHTML = `
            <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-16 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-white/5">Bolsa</button>
            <button onclick="app.buyNow('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-16 rounded-2xl bg-lux-blue text-white font-black text-[10px] uppercase tracking-widest">Pagar ya</button>
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
            <button onclick="app.filterCategory('${c}')" class="px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${this.state.activeCategory === c ? 'bg-lux-blue text-white' : 'bg-white/5 text-white/30 hover:text-white border border-white/5'}">${c === 'all' ? 'Colección' : c}</button>
        `).join('');
    },

    addToCart(id) {
        const p = this.state.products.find(x => x.id === id);
        const cur = this.state.cart.find(i => i.id === id);
        if (cur) cur.quantity++;
        else this.state.cart.push({ ...p, quantity: 1 });
        this.saveCart();
        this.updateCartCount();
        this.notify(`+1 ${p.Producto}`, "success");
    },
    
    buyNow(id) {
        const p = this.state.products.find(x => x.id === id);
        let m = ` *BOUTIQUE: ${this.state.storeName.toUpperCase()}*\n✨ *Producto:* ${p.Producto}\n💰 *Precio:* $${p.Precio.toLocaleString('es-CL')}\n\n Quiero comprar este producto.`;
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    updateCartCount() {
        const c = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        const btn = document.getElementById('cart-count-btn');
        if (btn) btn.textContent = c;
    },

    saveCart() { localStorage.setItem('tikk-cart-lux', JSON.stringify(this.state.cart)); },

    toggleCart() {
        if (this.state.cart.length === 0) return this.notify("La bolsa está vacía", "info");
        let m = ` *PEDIDO: ${this.state.storeName.toUpperCase()}*\n\n`;
        this.state.cart.forEach(i => m += `▫️ *${i.Producto}* (x${i.quantity}) - $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n`);
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        m += `\n💰 *TOTAL: $${total.toLocaleString('es-CL')}*`;
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
        n.className = `bg-lux-500 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 font-bold text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-4`;
        n.innerHTML = `<i data-lucide="zap" class="w-4 h-4 text-lux-blue"></i><span>${m}</span>`;
        c.appendChild(n);
        lucide.createIcons();
        setTimeout(() => { n.classList.add('opacity-0'); setTimeout(() => n.remove(), 500); }, 3000);
    },

    copyStoreLink() {
        const url = document.getElementById('shareable-url').value;
        navigator.clipboard.writeText(url);
        this.notify("Link copiado", "success");
    },
    
    editStoreData() { this.navigate('diy'); },

    shareWithFriend() {
        const m = "Crea tu boutique online gratis con un Excel en tikk.cl";
        window.open(`https://wa.me/?text=${encodeURIComponent(m)}`);
    },

    async downloadProZip() { this.notify("Zip no disponible en esta vista", "info"); }
};

document.addEventListener('DOMContentLoaded', () => app.init());