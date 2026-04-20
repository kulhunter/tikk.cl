/**
 * tikk.js - Technological E-commerce Engine
 * Optimized for mobile-first & SaaS architecture.
 */

const app = {
    // --- Config & State ---
    state: {
        currentView: 'landing',
        sheetId: null,
        products: [],
        categories: [],
        cart: JSON.parse(localStorage.getItem('tikk-cart') || '[]'),
        activeCategory: 'all',
        sellerWhatsApp: '56936305140',
        storeName: 'Mi Tienda Online',
        isCartOpen: false,
        isLoading: false
    },

    // --- Initialization ---
    init() {
        console.log("tikk core online");
        window.addEventListener('popstate', () => this.handleRouting());
        window.addEventListener('hashchange', () => this.handleRouting());
        
        // Handle initial routing
        this.handleRouting();
        this.updateCartCount();
        this.updateMobileDock();
    },

    // --- Routing & URL Management ---
    handleRouting() {
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        
        // Priority 1: Pretty Hash (/slug/id/wa)
        if (hash.startsWith('#/')) {
            const parts = hash.split('/').filter(p => p !== '#' && p !== '');
            if (parts.length >= 3) {
                // Format: #/slug/id/whatsapp
                this.state.storeName = decodeURIComponent(parts[0].replace(/-/g, ' '));
                this.state.sheetId = parts[1];
                this.state.sellerWhatsApp = parts[2];
                this.navigate('store', false);
                this.loadStoreData(this.state.sheetId);
                return;
            }
        }

        // Priority 2: Old Query Params (backward compatibility)
        const s = params.get('s');
        const w = params.get('w');
        if (s) {
            this.state.sheetId = s;
            if (w) this.state.sellerWhatsApp = w;
            this.navigate('store', false);
            this.loadStoreData(s);
            return;
        }

        // Priority 3: Internal Views via Hash
        const view = hash.replace('#', '') || 'landing';
        if (['landing', 'diy', 'share'].includes(view)) {
            this.navigate(view, false);
        } else {
            this.navigate('landing', false);
        }
    },

    navigate(view, pushState = true) {
        this.state.currentView = view;
        this.toggleCart(false);
        this.renderView(view);

        if (pushState) {
            if (view === 'landing') {
                window.history.pushState({}, '', window.location.pathname);
            } else if (view !== 'store' && view !== 'share') {
                window.location.hash = view;
            }
        }

        // UI Adjustments
        this.updateMobileDock();
        
        const cartBtn = document.getElementById('cart-button');
        if (view === 'store') {
            cartBtn?.classList.remove('hidden');
        } else {
            cartBtn?.classList.add('hidden');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateMobileDock() {
        const dock = document.getElementById('mobile-dock');
        // Hide dock if we are inside a store view (to don't crowd the mobile UI)
        if (this.state.currentView === 'store') {
            dock?.classList.add('translate-y-32');
            dock?.classList.add('opacity-0');
        } else {
            dock?.classList.remove('translate-y-32');
            dock?.classList.remove('opacity-0');
        }
    },

    renderView(view) {
        const container = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${view}`);
        
        if (template) {
            container.innerHTML = template.innerHTML;
            
            if (view === 'store') {
                document.getElementById('store-title').textContent = this.state.storeName;
                if (this.state.products.length > 0) this.renderProductGrid();
            }

            if (view === 'share') {
                const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                const shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
                
                const input = document.getElementById('shareable-url');
                const btn = document.getElementById('view-store-btn');
                if (input) input.value = shareUrl;
                if (btn) btn.href = shareUrl;
            }

            lucide.createIcons();
        }
    },

    // --- DIY Logic ---
    async generateFromDiy() {
        const sheetInput = document.getElementById('sheet-url-input');
        const waInput = document.getElementById('whatsapp-input');
        const nameInput = document.getElementById('store-name-input');
        
        const url = sheetInput?.value.trim();
        const whatsapp = waInput?.value.trim();
        const name = nameInput?.value.trim() || 'Mi Tienda Pro';
        
        if (!whatsapp || !url) {
            this.notify("Completa el número y el link de Excel", "error");
            return;
        }

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            this.notify("Enlace de Sheets no válido", "error");
            return;
        }

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = whatsapp.replace('+', '').trim();
        this.state.storeName = name;
        
        this.navigate('share');
    },

    copyStoreLink() {
        const input = document.getElementById('shareable-url');
        if (input) {
            navigator.clipboard.writeText(input.value);
            this.notify("Link copiado con éxito", "success");
        }
    },

    // --- Store Data ---
    async loadStoreData(id) {
        if (this.state.products.length > 0 && this.state.sheetId === id) return; // Already loaded

        try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error("Error al leer base de datos. Verifica compartir.");
            
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            
            if (data.length === 0) throw new Error("Archivo vacío o sin formato correcto.");

            this.state.products = data.map(p => ({
                id: p.Codigo,
                Codigo: p.Codigo,
                Categoria: p.Categoria || 'General',
                Producto: p.Producto,
                Stock: parseInt(p.Stock) || 0,
                Precio: parseInt(p.Precio) || 0,
                LinkFoto: p.LinkFoto
            }));

            this.state.categories = [...new Set(this.state.products.map(p => p.Categoria))];
            this.renderProductGrid();
            this.renderCategoryFilters();

        } catch (err) {
            this.notify(err.message, "error");
            const grid = document.getElementById('product-grid');
            if (grid) grid.innerHTML = `<div class="col-span-full py-20 text-center text-red-500 font-bold">${err.message}</div>`;
        }
    },

    parseCSV(text) {
        const rows = text.split(/\n/);
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        return rows.slice(1).map(row => {
            const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            let obj = {};
            headers.forEach((h, i) => {
                obj[h] = values[i] ? values[i].replace(/"/g, '').trim() : '';
            });
            return obj;
        }).filter(o => o.Producto);
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        const filtered = this.state.activeCategory === 'all' 
            ? this.state.products 
            : this.state.products.filter(p => p.Categoria === this.state.activeCategory);

        grid.innerHTML = filtered.map(p => `
            <div class="tech-card rounded-4xl h-full flex flex-col group overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
                <div class="relative h-72 sm:h-80 overflow-hidden bg-slate-50">
                    <img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onerror="this.src='https://placehold.co/600x800/f8fafc/cbd5e1?text=${p.Producto}'">
                    <div class="absolute top-4 right-4 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span class="bg-white/90 backdrop-blur-md text-[10px] font-black px-3 py-1.5 rounded-full text-slate-500 shadow-xl ring-1 ring-slate-100">#${p.Codigo}</span>
                    </div>
                </div>
                <div class="p-8 flex flex-col flex-grow">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-tech-500 mb-2">${p.Categoria}</span>
                    <h3 class="text-xl font-bold text-dark mb-4 leading-snug group-hover:text-tech-600 transition-colors">${p.Producto}</h3>
                    <div class="mt-auto pt-6 flex flex-col gap-5 border-t border-slate-50">
                        <div class="flex items-center justify-between">
                            <span class="text-3xl font-black text-dark">$${p.Precio.toLocaleString('es-CL')}</span>
                            ${p.Stock > 0 ? 
                                `<span class="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black">Stock: ${p.Stock}</span>` : 
                                `<span class="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black italic">Agotado</span>`
                            }
                        </div>
                        <button 
                            onclick="app.addToCart('${p.id}')"
                            ${p.Stock <= 0 ? 'disabled' : ''}
                            class="w-full ${p.Stock > 0 ? 'bg-dark text-white hover:bg-tech-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 group-active:scale-95 shadow-lg shadow-slate-200"
                        >
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                            Agregar
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
        
        container.innerHTML = ['all', ...this.state.categories].map(cat => `
            <button onclick="app.filterCategory('${cat}')" class="px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${this.state.activeCategory === cat ? 'bg-tech-600 text-white border-tech-600 shadow-lg shadow-tech-100' : 'bg-white text-slate-500 border-slate-100 hover:border-tech-200'}">
                ${cat === 'all' ? 'Ver Todos' : cat}
            </button>
        `).join('');
    },

    filterCategory(cat) {
        this.state.activeCategory = cat;
        this.renderCategoryFilters();
        this.renderProductGrid();
    },

    // --- Cart & Orders ---
    addToCart(id) {
        const prod = this.state.products.find(p => p.id === id);
        if (!prod || prod.Stock <= 0) return;

        const cur = this.state.cart.find(i => i.id === id);
        if (cur) {
            if (cur.quantity < prod.Stock) cur.quantity++;
            else this.notify("Tope de stock", "warning");
        } else {
            this.state.cart.push({ ...prod, quantity: 1 });
        }

        this.updateCartCount();
        this.saveCart();
        this.notify(`Añadido: ${prod.Producto}`, "success");
    },

    updateQuantity(id, mod) {
        const item = this.state.cart.find(i => i.id === id);
        if (!item) return;
        const prod = this.state.products.find(p => p.id === id);

        item.quantity += mod;
        if (item.quantity <= 0) this.state.cart = this.state.cart.filter(i => i.id !== id);
        else if (item.quantity > prod.Stock) {
            item.quantity = prod.Stock;
            this.notify("Stock máximo alcanzado", "warning");
        }

        this.updateCartCount();
        this.saveCart();
        this.renderCart();
    },

    updateCartCount() {
        const count = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        const els = [document.getElementById('cart-count'), document.getElementById('dock-cart-btn')?.querySelector('span')];
        els.forEach(el => {
            if (el) el.textContent = count;
        });
    },

    saveCart() { localStorage.setItem('tikk-cart', JSON.stringify(this.state.cart)); },

    toggleCart(val) {
        this.state.isCartOpen = val !== undefined ? val : !this.state.isCartOpen;
        const s = document.getElementById('cart-sidebar');
        const o = document.getElementById('cart-overlay');
        
        if (this.state.isCartOpen) {
            s.classList.remove('translate-x-full');
            o.classList.remove('pointer-events-none');
            o.classList.add('opacity-100');
            this.renderCart();
        } else {
            s.classList.add('translate-x-full');
            o.classList.add('pointer-events-none');
            o.classList.remove('opacity-100');
        }
    },

    renderCart() {
        const list = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        if (!list) return;

        if (this.state.cart.length === 0) {
            list.innerHTML = `<div class="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nada por aquí aún...</div>`;
            totalEl.textContent = '$0';
            return;
        }

        list.innerHTML = this.state.cart.map(i => `
            <div class="flex gap-4 items-center bg-white p-4 rounded-3xl ring-1 ring-slate-100">
                <img src="${i.LinkFoto}" class="h-16 w-16 rounded-2xl object-cover bg-slate-50" onerror="this.src='https://placehold.co/100/f8fafc/cbd5e1?text=X'">
                <div class="flex-grow">
                    <h4 class="font-bold text-dark text-sm leading-tight mb-1">${i.Producto}</h4>
                    <p class="text-tech-500 font-black text-sm">$${(i.Precio * i.quantity).toLocaleString('es-CL')}</p>
                </div>
                <div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl">
                    <button onclick="app.updateQuantity('${i.id}', -1)" class="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-all"><i data-lucide="minus" class="w-3 h-3"></i></button>
                    <span class="w-6 text-center font-black text-xs">${i.quantity}</span>
                    <button onclick="app.updateQuantity('${i.id}', 1)" class="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-all"><i data-lucide="plus" class="w-3 h-3"></i></button>
                </div>
            </div>
        `).join('');

        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        totalEl.textContent = `$${total.toLocaleString('es-CL')}`;
        lucide.createIcons();
    },

    sendOrder() {
        if (this.state.cart.length === 0) return;
        const name = document.getElementById('buyer-name').value.trim();
        const comments = document.getElementById('order-comments').value.trim();

        if (!name) { 
            this.notify("Tu nombre es obligatorio", "error"); 
            document.getElementById('buyer-name').focus();
            return; 
        }

        let msg = `🛍️ *NUEVO PEDIDO - ${this.state.storeName.toUpperCase()}*\n\n`;
        msg += `👤 *Cliente:* ${name}\n`;
        if (comments) msg += `💭 *Nota:* ${comments}\n`;
        msg += `\n----------------------------\n`;

        this.state.cart.forEach(i => {
            msg += `▫️ *${i.Producto}* (Cod: ${i.Codigo})\n`;
            msg += `    ${i.quantity} x $${i.Precio.toLocaleString('es-CL')} | Sub: $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n\n`;
        });

        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        msg += `----------------------------\n`;
        msg += `💰 *TOTAL A PAGAR: $${total.toLocaleString('es-CL')}*`;

        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
    },

    // --- Utils ---
    notify(msg, type = 'info') {
        const c = document.getElementById('notification-container');
        if (!c) return;

        const n = document.createElement('div');
        const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-dark' : 'bg-tech-600';
        n.className = `${bg} text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 transition-all duration-500 translate-x-12 opacity-0 font-bold text-sm`;
        n.innerHTML = `<i data-lucide="${type === 'success' ? 'check' : 'info'}" class="w-4 h-4"></i><span>${msg}</span>`;
        c.appendChild(n);
        lucide.createIcons();

        setTimeout(() => n.classList.remove('translate-x-12', 'opacity-0'), 10);
        setTimeout(() => {
            n.classList.add('opacity-0', '-translate-y-4');
            setTimeout(() => n.remove(), 500);
        }, 3500);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());