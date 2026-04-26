/**
 * tikk.js - the definitive boutique platform v4.2
 * SEO & Tooltip Integrated
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
        console.log("tikk boutique seo-ready engine start");
        window.addEventListener('popstate', () => this.handleRouting());
        window.addEventListener('hashchange', () => this.handleRouting());
        this.handleRouting();
        this.updateCartCount();
        lucide.createIcons();
    },

    handleRouting() {
        const hash = window.location.hash;
        if (hash.startsWith('#/')) {
            const hashParts = hash.split('?')[0].split('/').filter(p => !!p && p !== '#');
            if (hashParts.length >= 3) {
                this.state.storeName = decodeURIComponent(hashParts[0].replace(/-/g, ' '));
                this.state.sheetId = hashParts[1];
                this.state.sellerWhatsApp = hashParts[2];
                
                const params = new URLSearchParams(hash.split('?')[1] || '');
                this.state.storeDesc = params.get('desc') || '';
                this.state.storeLogo = params.get('logo') || '';
                this.state.scriptUrl = params.get('script') || '';
                this.state.storeTheme = params.get('theme') || 'dark';
                this.state.storeColor = params.get('color') || 'blue';
                
                this.applyTheme(this.state.storeTheme, this.state.storeColor);

                this.navigate('store', false);
                this.loadStoreData(this.state.sheetId);
                return;
            }
        }
        this.applyTheme('dark', 'blue');
        const view = hash.split('?')[0].replace(/^#\/?/, '') || 'landing';
        this.navigate(view, false);
    },

    applyTheme(theme, color) {
        if (theme === 'light') {
            document.body.style.backgroundColor = '#ffffff';
            document.body.style.color = '#000000';
            document.documentElement.style.setProperty('--bg-lux', '#ffffff');
            document.documentElement.style.setProperty('--text-lux', '#000000');
        } else {
            document.body.style.backgroundColor = '#000000';
            document.body.style.color = '#ffffff';
            document.documentElement.style.setProperty('--bg-lux', '#000000');
            document.documentElement.style.setProperty('--text-lux', '#ffffff');
        }
        
        const colors = { blue: '#0071e3', green: '#25D366', purple: '#bf5af2', red: '#ff3b30' };
        if (colors[color]) {
            document.documentElement.style.setProperty('--color-lux-blue', colors[color]);
        }
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
                const keyword = encodeURIComponent(this.state.storeName.split(' ')[0] || 'boutique');
                // source.unsplash.com is deprecated, using image.pollinations.ai or a fallback
                heroImg.src = `https://image.pollinations.ai/prompt/luxury%20boutique%20store%20dark%20aesthetic%20${keyword}?width=1600&height=900&nologo=true`;
                heroImg.onerror = () => { heroImg.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600'; };
            }
            if (this.state.products.length > 0) {
                this.renderProductGrid();
                this.renderCategoryFilters();
            }
        }

        if (view === 'share') {
            const slug = this.state.storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            let shareUrl = `${window.location.origin}${window.location.pathname}#/${slug}/${this.state.sheetId}/${this.state.sellerWhatsApp}`;
            
            const params = new URLSearchParams();
            if (this.state.storeTheme !== 'dark') params.append('theme', this.state.storeTheme);
            if (this.state.storeColor !== 'blue') params.append('color', this.state.storeColor);
            if (this.state.storeDesc) params.append('desc', this.state.storeDesc);
            if (this.state.storeLogo) params.append('logo', this.state.storeLogo);
            if (this.state.scriptUrl) params.append('script', this.state.scriptUrl);
            
            const queryString = params.toString();
            if (queryString) shareUrl += `?${queryString}`;

            const input = document.getElementById('shareable-url');
            if (input) input.value = shareUrl;
            const btn = document.getElementById('view-store-btn');
            if (btn) btn.href = shareUrl;
            const nameEl = document.getElementById('share-store-name');
            if (nameEl) nameEl.textContent = this.state.storeName;
        }

        lucide.createIcons();
    },

    async generateFromDiy() {
        const name = document.getElementById('store-name-input').value.trim();
        const wa = document.getElementById('whatsapp-input').value.trim();
        const url = document.getElementById('sheet-url-input').value.trim();
        const code = document.getElementById('country-code').value;
        
        const desc = document.getElementById('store-desc-input')?.value.trim() || '';
        const logo = document.getElementById('store-logo-input')?.value.trim() || '';
        const script = document.getElementById('store-script-input')?.value.trim() || '';
        const theme = document.getElementById('store-theme-select')?.value || 'dark';
        const color = document.getElementById('store-color-select')?.value || 'blue';

        if (!name || !wa || !url) return this.notify("Completa el perfil boutique", "error");

        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return this.notify("Vínculo Sheets inválido", "error");

        this.state.sheetId = match[1];
        this.state.sellerWhatsApp = `${code}${wa}`.replace(/[^\d]/g, '');
        this.state.storeName = name;
        this.state.storeDesc = desc;
        this.state.storeLogo = logo;
        this.state.scriptUrl = script;
        this.state.storeTheme = theme;
        this.state.storeColor = color;
        
        this.applyTheme(theme, color);
        this.navigate('share');
    },

    parseCSV(text) {
        let result = []; let row = []; let inQuotes = false; let currentValue = '';
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (inQuotes) {
                if (char === '"') {
                    if (i + 1 < text.length && text[i+1] === '"') { currentValue += '"'; i++; } else { inQuotes = false; }
                } else { currentValue += char; }
            } else {
                if (char === '"') { inQuotes = true; } else if (char === ',') { row.push(currentValue); currentValue = ''; } else if (char === '\n' || char === '\r') {
                    row.push(currentValue); result.push(row); row = []; currentValue = '';
                    if (char === '\r' && text[i+1] === '\n') i++;
                } else { currentValue += char; }
            }
        }
        if (currentValue || row.length > 0) { row.push(currentValue); result.push(row); }
        return result;
    },

    async loadStoreData(id) {
        try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error("Network response error");
            const csvText = await response.text();
            
            const rows = this.parseCSV(csvText);
            if (rows.length < 2) throw new Error("No data rows");
            const headers = rows[0].map(h => h.trim());
            
            this.state.products = rows.slice(1).map(row => {
                let obj = {};
                headers.forEach((h, i) => { obj[h] = row[i] ? row[i].trim() : ''; });
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
            this.notify("Error de vinculación Sheets", "error");
        }
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = this.state.filteredProducts.map(p => `
            <div onclick="app.openProductModal('${p.id}')" class="lux-card overflow-hidden flex flex-col group h-full cursor-pointer shadow-2xl">
                <div class="h-80 bg-white/5 relative overflow-hidden flex items-center justify-center">
                    ${p.LinkFoto ? `<img src="${p.LinkFoto}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000">` : `<i data-lucide="package" class="opacity-10 w-12 h-12"></i>`}
                    ${p.Stock <= 0 ? `<div class="absolute inset-0 bg-black/80 flex items-center justify-center font-black uppercase text-[10px] tracking-[0.4em] italic">Sold Out</div>` : ''}
                </div>
                <div class="p-10 flex flex-col flex-grow">
                    <span class="text-[9px] font-black uppercase text-lux-blue mb-3 tracking-[0.3em] font-bold italic">${p.Categoria}</span>
                    <h3 class="text-2xl font-black italic mb-6 leading-none">${p.Producto}</h3>
                    <div class="mt-auto flex justify-between items-end border-t border-white/5 pt-8">
                        <span class="text-3xl font-black italic tracking-tighter text-white">$${p.Precio.toLocaleString('es-CL')}</span>
                        <div class="text-[9px] font-black uppercase text-white/20 tracking-widest italic">Curated</div>
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
                <div class="h-[400px] bg-white/5 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
                    <img src="${p.LinkFoto || 'https://placehold.co/800/000/fff?text=No+Photo'}" class="w-full h-full object-cover">
                </div>
                <div class="space-y-6">
                    <span class="text-xs font-black uppercase text-lux-blue tracking-[0.4em] font-bold italic">${p.Categoria}</span>
                    <h2 class="text-5xl font-black italic leading-tight uppercase tracking-tight">${p.Producto}</h2>
                    <p class="text-lux-400 font-medium text-lg leading-relaxed">${p.Descripcion || 'Exclusive item from our digital boutique.'}</p>
                </div>
                <div class="flex justify-between items-center py-10 border-y border-white/5">
                    <div>
                        <span class="block text-[10px] font-black uppercase text-white/20 tracking-widest mb-2 font-bold italic">Boutique Price</span>
                        <span class="text-6xl font-black italic tracking-tighter">$${p.Precio.toLocaleString('es-CL')}</span>
                    </div>
                    ${p.Stock > 0 ? `<div class="text-right"><span class="block text-[10px] font-black text-lux-blue uppercase tracking-widest mb-1 italic">Stock</span><span class="text-lg font-black">${p.Stock} unis</span></div>` : ''}
                </div>
            </div>
        `;

        actions.innerHTML = `
            <button onclick="app.addToCart('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-20 rounded-[1.5rem] border border-white/10 font-black text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all">Añadir a Bolsa</button>
            <button onclick="app.buyNow('${p.id}')" ${p.Stock <= 0 ? 'disabled' : ''} class="h-20 rounded-[1.5rem] bg-lux-blue text-white font-black text-[11px] uppercase tracking-widest shadow-xl">Lo quiero ahora</button>
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
            <button onclick="app.filterCategory('${c}')" class="px-7 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${this.state.activeCategory === c ? 'bg-lux-blue text-white shadow-xl shadow-lux-blue/20' : 'bg-white/5 text-white/40 hover:text-white border border-white/5'}">${c === 'all' ? 'Ver Todo' : c}</button>
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
    
    async buyNow(id) {
        const p = this.state.products.find(x => x.id === id);
        let m = ` *BOUTIQUE: ${this.state.storeName.toUpperCase()}*\n✨ *Producto:* ${p.Producto}\n💰 *Precio:* $${p.Precio.toLocaleString('es-CL')}\n\n Deseo comprar esta pieza ahora.`;
        
        if (this.state.scriptUrl) {
            this.notify("Procesando tu compra...", "info");
            try {
                const items = [{ id: p.id, quantity: 1 }];
                await fetch(`${this.state.scriptUrl}?action=deduct&items=${encodeURIComponent(JSON.stringify(items))}`, { method: 'GET', mode: 'no-cors' });
            } catch (e) { console.error("Error stock:", e); }
        }
        
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
        this.closeProductModal();
    },

    updateCartCount() {
        const c = this.state.cart.reduce((s, i) => s + i.quantity, 0);
        const btn = document.getElementById('cart-count-btn');
        if (btn) btn.textContent = c;
    },

    saveCart() { localStorage.setItem('tikk-cart-lux-v2', JSON.stringify(this.state.cart)); },

    async toggleCart() {
        if (this.state.cart.length === 0) return this.notify("La bolsa está vacía", "info");
        let m = ` *PEDIDO: ${this.state.storeName.toUpperCase()}*\n\n`;
        this.state.cart.forEach(i => m += `▫️ *${i.Producto}* (x${i.quantity}) - $${(i.Precio * i.quantity).toLocaleString('es-CL')}\n`);
        const total = this.state.cart.reduce((s, i) => s + (i.Precio * i.quantity), 0);
        m += `\n💰 *TOTAL SOLICITADO: $${total.toLocaleString('es-CL')}*\n\n_Gestionado vía tikk.cl_`;
        
        if (this.state.scriptUrl) {
            this.notify("Procesando carrito...", "info");
            try {
                const items = this.state.cart.map(i => ({ id: i.id, quantity: i.quantity }));
                await fetch(`${this.state.scriptUrl}?action=deduct&items=${encodeURIComponent(JSON.stringify(items))}`, { method: 'GET', mode: 'no-cors' });
            } catch (e) { console.error("Error stock:", e); }
        }
        
        window.open(`https://wa.me/${this.state.sellerWhatsApp}?text=${encodeURIComponent(m)}`);
        this.state.cart = [];
        this.saveCart();
        this.updateCartCount();
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
        n.className = `${bg} text-white px-8 py-5 rounded-3xl shadow-2xl border border-white/10 font-bold text-[10px] uppercase tracking-widest flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 transition-all`;
        n.innerHTML = `<i data-lucide="zap" class="w-4 h-4 text-white"></i><span>${m}</span>`;
        c.appendChild(n);
        lucide.createIcons();
        setTimeout(() => { n.classList.add('opacity-0'); setTimeout(() => n.remove(), 500); }, 3500);
    },

    copyStoreLink() {
        const url = document.getElementById('shareable-url').value;
        if (!url) return this.notify("Error obteniendo URL", "error");
        navigator.clipboard.writeText(url).then(() => {
            this.notify("Enlace copiado", "success");
        }).catch(err => {
            this.notify("Error al copiar enlace", "error");
        });
    },
    
    toggleAdvancedDiy() {
        const section = document.getElementById('diy-advanced-section');
        if (section) section.classList.toggle('hidden');
    },

    editStoreData() { this.navigate('diy'); },

    sendToEmail() {
        const email = document.getElementById('save-email-input').value.trim();
        if (!email) return this.notify("Ingresa un correo válido", "error");
        const url = document.getElementById('shareable-url').value;
        const subject = encodeURIComponent("El link de tu nueva Tienda Online Tikk");
        const body = encodeURIComponent(`¡Felicidades por tu nueva tienda!\n\nAquí tienes tu enlace de acceso permanente (guárdalo bien):\n${url}\n\nRecuerda que si necesitas el código fuente (ZIP) puedes generarlo entrando a tu tienda y volviendo a generar el enlace desde Tikk.`);
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
        this.notify("Redirigiendo a tu correo...", "success");
    },

    async registerMasterclass() {
        const email = document.getElementById('mc-email').value;
        const store = document.getElementById('mc-store').value;
        const niche = document.getElementById('mc-niche').value;
        
        if (!email || !store || !niche) return this.notify("Completa todos los campos", "error");

        const btn = document.querySelector('#masterclass-form button');
        const ogText = btn.innerText;
        btn.innerText = "PROCESANDO...";
        btn.disabled = true;

        try {
            // Webhook del Apps Script (El usuario debe reemplazar esto con su propia URL de despliegue)
            const scriptURL = "https://script.google.com/macros/s/TU_SCRIPT_ID_AQUI/exec";
            
            const formData = new FormData();
            formData.append('email', email);
            formData.append('store', store);
            formData.append('niche', niche);

            // Fetch en background sin bloqueo por CORS
            fetch(scriptURL, { method: 'POST', body: formData, mode: 'no-cors' }).catch(e => console.log(e));
            
            await new Promise(r => setTimeout(r, 800));

            document.getElementById('masterclass-form-container').classList.add('hidden');
            document.getElementById('masterclass-success-container').classList.remove('hidden');
            this.notify("¡Inscripción exitosa!", "success");
            
        } catch (error) {
            this.notify("Hubo un error de conexión.", "error");
            btn.innerText = ogText;
            btn.disabled = false;
        }
    },

    shareWithFriend() {
        const m = "Impulsa tu negocio con tikk.cl: Tu tienda boutique pro usando solo un Excel. Creado por Dan Tagle: https://tikk.cl";
        window.open(`https://wa.me/?text=${encodeURIComponent(m)}`);
    },

    async downloadProZip() {
        if (typeof JSZip === 'undefined') {
            return this.notify("Librería ZIP no disponible", "error");
        }
        this.notify("Empaquetando Boutique...", "info");
        
        try {
            const redirectUrl = document.getElementById('shareable-url').value;
            const zip = new JSZip();
            
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${this.state.storeName} | Tienda Online</title>
    <meta http-equiv="refresh" content="0; url=${redirectUrl}">
    <script>window.location.href = "${redirectUrl}";</script>
    <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;}</style>
</head>
<body>
    <div style="text-align:center;">
        <h2>Redirigiendo a tu boutique segura...</h2>
    </div>
</body>
</html>`;
            
            zip.file("index.html", htmlContent);
            const content = await zip.generateAsync({type:"blob"});
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `boutique-${this.state.storeName.replace(/\\s+/g, '-').toLowerCase()}.zip`;
            a.click();
            URL.revokeObjectURL(a.href);
            
            this.notify("¡Boutique descargada!", "success");
        } catch (e) {
            console.error("ZIP Error:", e);
            this.notify("Error al generar ZIP", "error");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());