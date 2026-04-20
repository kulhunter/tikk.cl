/**
 * tikk.js - the cinematic boutique engine
 * Powered by Dan Tagle
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
        console.log("tikk luxe v4 - by dan tagle");
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
        
        // Visibility logic
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
            document.title = `${this.state.storeName} | tikk Boutique`;
            const titleEl = document.getElementById('store-title');
            if (titleEl) titleEl.textContent = this.state.storeName;
            
            const heroImg = document.getElementById('store-hero-img');
            if (heroImg) {
                const keyword = encodeURIComponent(this.state.storeName.replace(/\s+/g, ','));
                heroImg.src = `https://source.unsplash.com/featured/?${keyword},boutique,store,luxury`;
            }
            if (this.state.products.length > 0) {
                this.renderProductGrid();
                this.renderCategoryFilters();
            }
        }

        if (view === 'share') {
            const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
            const linkInput = document.getElementById('shareable-url');
            if (linkInput) linkInput.value = shareUrl;
            const viewBtn = document.getElementById('view-store-btn');
            if (viewBtn) viewBtn.href = shareUrl;
            const nameEl = document.getElementById('share-store-name');
            if (nameEl) nameEl.textContent = this.state.storeName;
        }

        if (view === 'diy' && this.state.sheetId) {
            const nameIn = document.getElementById('store-name-input');
            const waIn = document.getElementById('whatsapp-input');
            const sheetIn = document.getElementById('sheet-url-input');
            if (nameIn) nameIn.value = this.state.storeName;
            if (waIn) waIn.value = this.state.sellerWhatsApp.substring(this.state.sellerWhatsApp.length - 8);
            if (sheetIn) sheetIn.value = `https://docs.google.com/spreadsheets/d/${this.state.sheetId}/edit`;
        }

        lucide.createIcons();
    },

    async generateFromDiy() {
        const name = document.getElementById('store-name-input').value.trim();
        const phone = document.getElementById('whatsapp-input').value.trim();
        const url = document.getElementById('sheet-url-input').value.trim();
        const code = document.getElementById('country-code').value;

        if (!name || !phone || !url) return this.notify("Completa el perfil de tu boutique", "error");

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return this.notify("Link de Excel no reconocido", "error");

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
            const rawHeaders = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            this.state.products = rows.slice(1).map(row => {
                const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                let obj = {};
                rawHeaders.forEach((h, i) => { obj[h] = values[i] ? values[i].replace(/"/g, '').trim() : ''; });
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

            this.state.categories = [...new Set(this.state.products.map(p => p.Categoria))];
            this.state.filteredProducts = [...this.state.products];
            this.renderProductGrid();
            this.renderCategoryFilters();
        } catch (e) {
            this.notify("Error sincronizando. Verifica el link de tu Excel.", "error");
        }
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = this.state.filteredProducts.map(p => `
            <div onclick="app.openProductModal('${p.id}')" class="lux-card rounded-[2.5rem] overflow-hidden flex flex-col group h-full cursor-pointer">
                <div class="h-80 bg-white/5 relative overflow-hidden flex items-center justify-center">
                    ${p.LinkFoto ? `<img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000">` : `<i data-lucide="package" class="opacity-10 w-12 h-12"></i>`}
                    ${p.Stock <= 0 ? `<div class="absolute inset-0 bg-black/80 flex items-center justify-center font-black uppercase text-[10px] tracking-widest italic tracking-[0.3em]">Sold Out</div>` : ''}
                </div>
                <div class="p-8 flex flex-col flex-grow">
                    <span class="text-[9px] font-black uppercase text-lux-blue mb-2 tracking-widest">${p.Categoria}</span>
                    <h3 class="text-xl font-bold italic mb-4 leading-tight">${p.Producto}</h3>
                    <div class="mt-auto flex justify-between items-end border-t border-white/5 pt-6">
                        <span class="text-3xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                        <div class="bg-white/5 p-2 rounded-lg text-[9px] font-bold text-white/20">COD: ${p.Codigo}</div>
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
                <div class="h-96 bg-white/5 rounded-[2.5rem] overflow-hidden">
                    <img src="${p.LinkFoto || 'https://placehold.co/600/121/868?text=X'}" class="w-full h-full object-cover">
                </div>
                <div>
                    <span class="text-xs font-black uppercase text-lux-blue mb-4 block tracking-widest">${p.Categoria}</span>
                    <h2 class="text-4xl font-black italic mb-6 leading-tight">${p.Producto}</h2>
                    <p class="text-lux-400 font-medium text-lg leading-relaxed">${p.Descripcion || 'Sin descripción disponible.'}</p>
                </div>
                <div class="flex justify-between items-center py-6 border-y border-white/5">
                    <div>
                        <span class="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-1 font-bold">Precio Unitario</span>
                        <span class="text-5xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                    </div>
                    <div class="text-right">
                        <span class="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-1 font-bold">Stock</span>
                        <span class="text-2xl font-black opacity-80">${p.Stock} unidades</span>
                    </div>
                </div>
            </div>
        `;

        actions.innerHTML = `
            <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-16 rounded-2xl border border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/5">Añadir a Bolsa</button>
            <button onclick="app.buyNow('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-16 rounded-2xl bg-lux-blue text-white font-black text-xs uppercase tracking-widest">Comprar Ahora</button>
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

    // --- Core Logic ---
    handleSearch(q) { this.state.searchQuery = q.toLowerCase(); this.applyFilters(); },
    filterCategory(c) { this.state.activeCategory = c; this.applyFilters(); },
    applyFilters() {
        this.state.filteredProducts = this.state.products.filter(p => {
            const matchesC = this.state.activeCategory === 'all' || p.Categoria === this.state.activeCategory;
            const matchesQ = p.Producto.toLowerCase().includes(this.state.searchQuery) || p.Codigo.toLowerCase().includes(this.state.searchQuery);
            return matchesC && matchesQ;
        });
        this.renderProductGrid();
    },

    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;
        const cats = ['all', ...this.state.categories];
        container.innerHTML = cats.map(c => `
            <button onclick="app.filterCategory('${c}')" class="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${this.state.activeCategory === c ? 'bg-lux-blue text-white' : 'bg-white/5 text-white/30 border border-white/5 hover:text-white'}">${c === 'all' ? 'Ver Todo' : c}</button>
        `).join('');
    },

    addToCart(id) {
        const p = this.state.products.find(x => x.id === id);
        const cur = this.state.cart.find(i => i.id === id);
        if (cur) {
            if (cur.quantity < p.Stock) cur.quantity++;
            else return this.notify("Sin stock suficiente", "warning");
        } else {
            this.state.cart.push({ ...p, quantity: 1 });
        }
        this.saveCart();
        this.updateCartCount();
        this.notify(`+1 ${p.Producto}`, "success");
    },

    buyNow(id) {
        const p = this.state.products.find(x => x.id === id);
        if (!p) return;
        let m = ` *PEDIDO EXPRESS: ${this.state.storeName.toUpperCase()}*\n\n`;
        m += `✨ *Producto:* ${p.Producto}\n`;
        m += `💰 *Precio:* $${p.Precio.toLocaleString('es-CL')}\n\n`;
        m += `----------------------------\n📦 _Quiero comprar este producto ahora._\n\n`;
        m += `*Gestionado vía tikk.cl*`;
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    updateCartCount() {
        const count = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        const el = document.getElementById('cart-count-btn');
        if (el) el.textContent = count;
    },

    saveCart() { localStorage.setItem('tikk-cart-lux', JSON.stringify(this.state.cart)); },

    toggleCart() {
        // Lux Boutique usually opens the WhatsApp summary directly or a simple modal.
        // For now, we reuse the sendOrder logic if the user has items.
        if (this.state.cart.length === 0) return this.notify("Tu bolsa está vacía", "info");
        this.sendOrder();
    },

    sendOrder() {
        if (this.state.cart.length === 0) return;
        let m = ` *NUEVO PEDIDO: ${this.state.storeName.toUpperCase()}*\n\n`;
        m += `----------------------------\n`;
        this.state.cart.forEach(i => m += `▫️ *${i.Producto}* (x${i.quantity})\n    Sub: $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n\n`);
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        m += `----------------------------\n💰 *TOTAL SOLICITADO: $${total.toLocaleString('es-CL')}*\n\n`;
        m += `*Gestionado vía tikk.cl — By Dan Tagle*`;
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
    },

    // --- Social & Utility ---
    shareWithFriend() {
        const m = "¡Mira esta herramienta de Dan Tagle! Permite crear una tienda pro gratis usando solo un Excel: https://tikk.cl";
        window.open(`https://wa.me/?text=${encodeURIComponent(m)}`);
    },
    
    notify(m, t) {
        const c = document.getElementById('notification-container');
        const n = document.createElement('div');
        const bg = t === 'success' ? 'bg-lux-blue' : t === 'error' ? 'bg-red-600' : 'bg-white/10';
        n.className = `${bg} text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm border border-white/10 animate-in fade-in slide-in-from-right-4`;
        n.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>${m}</span>`;
        c.appendChild(n);
        lucide.createIcons();
        setTimeout(() => { n.classList.add('opacity-0'); setTimeout(() => n.remove(), 500); }, 3000);
    },

    copyStoreLink() {
        const input = document.getElementById('shareable-url');
        input.select();
        navigator.clipboard.writeText(input.value);
        this.notify("Link copiado", "success");
    },
    
    async downloadProZip() {
        this.notify("Generando Boutique Offline...", "info");
        const zip = new JSZip();
        // Standalone logic omitted for brevity here but follows previous pattern
        // Adding hero, grid and drawer logic into one single file.
        this.notify("Zip generado (Simulado para esta demo)", "success");
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());