/**
 * tikk.js - Core Application Logic
 * Built with vanilla JS for high performance and low maintenance.
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
        sellerWhatsApp: '56936305140', // Base default
        isCartOpen: false,
        isLoading: false
    },

    // --- Initialization ---
    init() {
        console.log("tikk.cl initialized");
        this.bindEvents();
        this.handleRouting();
        this.updateCartCount();
        lucide.createIcons();
    },

    bindEvents() {
        window.addEventListener('popstate', () => this.handleRouting());
        
        // Form submission inside DIY template (delegated)
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'form-diy') {
                e.preventDefault();
                this.generateFromDiy();
            }
        });

        // Close cart on overlay click
        const overlay = document.getElementById('cart-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.toggleCart(false));
        }
    },

    // --- Routing ---
    handleRouting() {
        const params = new URLSearchParams(window.location.search);
        const storeId = params.get('s'); // Spreadsheet ID
        const whatsapp = params.get('w'); // Seller WhatsApp
        const viewOverride = params.get('v');

        if (whatsapp) {
            this.state.sellerWhatsApp = whatsapp.replace('+', '');
        }

        if (storeId) {
            this.state.sheetId = storeId;
            this.navigate('store', false);
            this.loadStoreData(storeId);
        } else if (viewOverride) {
            this.navigate(viewOverride, false);
        } else {
            const hash = window.location.hash.replace('#', '') || 'landing';
            this.navigate(hash, false);
        }
    },

    navigate(view, pushState = true) {
        this.state.currentView = view;
        
        // Hide cart on navigation
        this.toggleCart(false);

        // Update UI
        this.renderView(view);

        if (pushState) {
            const url = new URL(window.location);
            // If we are in DIY share mode or Store mode, we keep the search params
            if (view === 'landing') {
                url.search = '';
                url.hash = '';
            } else if (view === 'share' || view === 'store') {
                // Keep params
            } else {
                url.hash = view;
            }
            window.history.pushState({}, '', url);
        }

        // Show/Hide header elements
        const cartBtn = document.getElementById('cart-button');
        if (view === 'store') {
            cartBtn?.classList.remove('hidden');
        } else {
            cartBtn?.classList.add('hidden');
        }

        window.scrollTo(0, 0);
        lucide.createIcons();
    },

    renderView(view) {
        const container = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${view}`);
        
        if (template) {
            container.innerHTML = template.innerHTML;
            
            // View-specific initializations
            if (view === 'store' && this.state.products.length > 0) {
                this.renderProductGrid();
            }

            if (view === 'share') {
                const url = new URL(window.location);
                url.searchParams.set('v', 'store'); // Customers will hit the store view
                const shareUrl = url.toString().replace('v=store', 's=' + this.state.sheetId + '&w=' + this.state.sellerWhatsApp);
                
                const input = document.getElementById('shareable-url');
                const btn = document.getElementById('view-store-btn');
                if (input) input.value = shareUrl;
                if (btn) btn.href = shareUrl;
            }

            lucide.createIcons();
        } else {
            console.error(`Template tpl-${view} not found`);
        }
    },

    // --- DIY Logic ---
    async generateFromDiy() {
        const sheetInput = document.getElementById('sheet-url-input');
        const waInput = document.getElementById('whatsapp-input');
        
        const url = sheetInput?.value.trim();
        const whatsapp = waInput?.value.trim();
        
        if (!whatsapp) {
            this.notify("Ingresa tu número de WhatsApp", "error");
            return;
        }

        if (!url) {
            this.notify("Ingresa un enlace de Google Sheets", "error");
            return;
        }

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            this.notify("Enlace de Sheets no válido", "error");
            return;
        }

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = whatsapp.replace('+', '');
        
        // Navigate to share view
        const newUrl = new URL(window.location.origin + window.location.pathname);
        newUrl.searchParams.set('s', this.state.sheetId);
        newUrl.searchParams.set('w', this.state.sellerWhatsApp);
        window.history.pushState({}, '', newUrl);
        
        this.navigate('share');
    },

    copyStoreLink() {
        const input = document.getElementById('shareable-url');
        if (input) {
            input.select();
            input.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(input.value);
            this.notify("¡Enlace copiado!", "success");
        }
    },

    async loadStoreData(id) {
        this.state.isLoading = true;
        this.notify("Cargando productos...", "info");

        // We use export format csv. It's public if the sheet is shared as "Anyone with the link can view"
        const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error("No se pudo leer el archivo. Verifica los permisos.");
            
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            
            // Validate columns
            const requiredLines = ["Codigo", "Categoria", "Producto", "Stock", "Precio", "LinkFoto"];
            const headers = Object.keys(data[0] || {});
            const missing = requiredLines.filter(h => !headers.includes(h));

            if (missing.length > 0) {
                this.notify(`Faltan columnas: ${missing.join(", ")}`, "error");
                return;
            }

            this.state.products = data.map(p => ({
                ...p,
                Stock: parseInt(p.Stock) || 0,
                Precio: parseInt(p.Precio) || 0,
                id: p.Codigo // Unique identifier
            }));

            this.state.categories = [...new Set(this.state.products.map(p => p.Categoria))];
            
            this.renderProductGrid();
            this.renderCategoryFilters();
            this.notify("Tienda cargada con éxito", "success");

        } catch (err) {
            console.error(err);
            this.notify(err.message, "error");
        } finally {
            this.state.isLoading = false;
        }
    },

    parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.replace(/\"/g, "").trim());
        
        return lines.slice(1).map(line => {
            // This is a simple regex-based csv splitter that handles quotes
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = (values[i] || "").replace(/\"/g, "").trim();
            });
            return obj;
        });
    },

    // --- Store Rendering ---
    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        const filtered = this.state.activeCategory === 'all' 
            ? this.state.products 
            : this.state.products.filter(p => p.Categoria === this.state.activeCategory);

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center text-slate-400">No hay productos en esta categoría</div>`;
            return;
        }

        grid.innerHTML = filtered.map(product => `
            <div class="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col h-full">
                <div class="relative h-64 overflow-hidden bg-slate-100">
                    <img src="${product.LinkFoto}" alt="${product.Producto}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://placehold.co/600x600/f1f5f9/94a3b8?text=Sin+Foto'">
                    ${product.Stock <= 0 ? `
                        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span class="bg-white text-slate-900 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest">Agotado</span>
                        </div>
                    ` : ''}
                    <div class="absolute top-4 left-4">
                        <span class="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm border border-white/50">${product.Categoria}</span>
                    </div>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">${product.Producto}</h3>
                        <span class="text-xs font-bold text-slate-300">#${product.Codigo}</span>
                    </div>
                    <p class="text-2xl font-black text-slate-900 mb-6">$${product.Precio.toLocaleString('es-CL')}</p>
                    
                    <div class="mt-auto">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-bold ${product.Stock > 5 ? 'text-green-500' : 'text-orange-500'}">
                                ${product.Stock > 0 ? `${product.Stock} disponibles` : 'Sin stock'}
                            </span>
                        </div>
                        <button 
                            onclick="app.addToCart('${product.id}')"
                            ${product.Stock <= 0 ? 'disabled' : ''}
                            class="w-full ${product.Stock <= 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'} py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        lucide.createIcons();
    },

    renderCategoryFilters() {
        const filterContainer = document.getElementById('category-filters');
        if (!filterContainer) return;

        const pills = ['all', ...this.state.categories].map(cat => `
            <button 
                onclick="app.filterCategory('${cat}')" 
                class="category-pill ${this.state.activeCategory === cat ? 'active bg-primary-600 text-white shadow-md shadow-primary-200' : 'bg-white text-slate-500 hover:bg-slate-100'} px-4 py-2 rounded-full text-sm font-bold border border-gray-100 transition-all"
            >
                ${cat === 'all' ? 'Todas' : cat}
            </button>
        `).join('');

        filterContainer.innerHTML = pills;
    },

    filterCategory(cat) {
        this.state.activeCategory = cat;
        this.renderCategoryFilters();
        this.renderProductGrid();
    },

    // --- Cart Logic ---
    addToCart(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product || product.Stock <= 0) return;

        const existing = this.state.cart.find(item => item.id === productId);
        if (existing) {
            if (existing.quantity < product.Stock) {
                existing.quantity++;
                this.notify(`Añadido: ${product.Producto}`, "success");
            } else {
                this.notify("No hay más stock disponible", "warning");
            }
        } else {
            this.state.cart.push({
                ...product,
                quantity: 1
            });
            this.notify(`Añadido: ${product.Producto}`, "success");
        }

        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    },

    updateQuantity(productId, delta) {
        const item = this.state.cart.find(i => i.id === productId);
        if (!item) return;

        const product = this.state.products.find(p => p.id === productId);
        const newQty = item.quantity + delta;

        if (newQty <= 0) {
            this.state.cart = this.state.cart.filter(i => i.id !== productId);
        } else if (newQty <= (product?.Stock || 999)) {
            item.quantity = newQty;
        } else {
            this.notify("Límite de stock alcanzado", "warning");
        }

        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    },

    saveCart() {
        localStorage.setItem('tikk-cart', JSON.stringify(this.state.cart));
    },

    updateCartCount() {
        const count = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
        const el = document.getElementById('cart-count');
        if (el) el.textContent = count;
    },

    toggleCart(force) {
        this.state.isCartOpen = force !== undefined ? force : !this.state.isCartOpen;
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        
        if (this.state.isCartOpen) {
            sidebar?.classList.remove('translate-x-full');
            overlay?.classList.remove('pointer-events-none');
            overlay?.classList.add('opacity-100');
            this.renderCart();
        } else {
            sidebar?.classList.add('translate-x-full');
            overlay?.classList.add('pointer-events-none');
            overlay?.classList.remove('opacity-100');
        }
    },

    renderCart() {
        const container = document.getElementById('cart-items');
        if (!container) return;

        if (this.state.cart.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20 text-slate-400">
                    <div class="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="shopping-basket" class="w-10 h-10 opacity-20"></i>
                    </div>
                    <p class="font-medium text-slate-500">Tu carrito está vacío</p>
                    <p class="text-xs mt-1">¡Agrega algunos productos para empezar!</p>
                </div>
            `;
            document.getElementById('cart-total').textContent = '$0';
            lucide.createIcons();
            return;
        }

        container.innerHTML = this.state.cart.map(item => `
            <div class="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-gray-100">
                    <img src="${item.LinkFoto}" alt="${item.Producto}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/100x100/f1f5f9/94a3b8?text=X'">
                </div>
                <div class="flex-grow">
                    <h4 class="font-bold text-sm text-slate-900 leading-snug mb-1">${item.Producto}</h4>
                    <p class="text-primary-600 font-black text-sm mb-2">$${item.Precio.toLocaleString('es-CL')}</p>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-gray-100">
                            <button onclick="app.updateQuantity('${item.id}', -1)" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-all text-slate-400 hover:text-slate-900">
                                <i data-lucide="minus" class="w-4 h-4"></i>
                            </button>
                            <span class="w-8 text-center text-sm font-black text-slate-700">${item.quantity}</span>
                            <button onclick="app.updateQuantity('${item.id}', 1)" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-all text-slate-400 hover:text-slate-900">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <button onclick="app.updateQuantity('${item.id}', -999)" class="text-xs font-bold text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join('');

        const total = this.state.cart.reduce((sum, item) => sum + (item.Precio * item.quantity), 0);
        document.getElementById('cart-total').textContent = `$${total.toLocaleString('es-CL')}`;
        
        lucide.createIcons();
    },

    // --- WhatsApp Integration ---
    sendOrder() {
        if (this.state.cart.length === 0) {
            this.notify("Tu carrito está vacío", "warning");
            return;
        }

        const buyerName = document.getElementById('buyer-name').value.trim();
        const comments = document.getElementById('order-comments').value.trim();

        if (!buyerName) {
            this.notify("Por favor, ingresa tu nombre", "warning");
            document.getElementById('buyer-name').focus();
            return;
        }

        let message = `Hola! 👋 Quiero realizar el siguiente pedido:\n\n`;
        message += `👤 *Cliente:* ${buyerName}\n`;
        if (comments) message += `💬 *Comentarios:* ${comments}\n`;
        message += `\n----------------------------\n`;

        this.state.cart.forEach(item => {
            const subtotal = item.Precio * item.quantity;
            message += `📦 *${item.Producto}*\n`;
            message += `   Cod: ${item.Codigo} | Cant: ${item.quantity}\n`;
            message += `   Subtotal: $${subtotal.toLocaleString('es-CL')}\n\n`;
        });

        const total = this.state.cart.reduce((sum, item) => sum + (item.Precio * item.quantity), 0);
        message += `----------------------------\n`;
        message += `💰 *TOTAL: $${total.toLocaleString('es-CL')}*`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.state.sellerWhatsApp}?text=${encodedMessage}`;

        // External redirect
        window.open(whatsappUrl, '_blank');
    },

    // --- Utility ---
    notify(msg, type = "info") {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        const colors = {
            info: 'bg-blue-600',
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-orange-600'
        };

        notification.className = `${colors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 translate-x-12 opacity-0 font-bold text-sm border-l-4 border-black/10`;
        notification.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-octagon' : 'info'}" class="w-5 h-5"></i>
            <span>${msg}</span>
        `;
        
        container.appendChild(notification);
        lucide.createIcons();

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-12', 'opacity-0');
        }, 10);

        // Remove after delay
        setTimeout(() => {
            notification.classList.add('opacity-0', 'scale-95');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());