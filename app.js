/**
 * Tikk - PWA Logic
 * Arquitectura SPA Vanilla JS usando LocalStorage
 */

window.app = {
    data: {
        dates: [],
        currentView: null,
        selectedDateId: null,
        intervalId: null
    },

    init() {
        this.loadData();
        this.cacheDOM();
        this.bindEvents();
        this.renderDashboard();
        
        // Handle URL hash routing or just default to dashboard
        this.navigate('dashboard');
    },

    cacheDOM() {
        this.views = {
            dashboard: document.getElementById('view-dashboard'),
            add: document.getElementById('view-add'),
            detail: document.getElementById('view-detail'),
            settings: document.getElementById('view-settings')
        };
        this.els = {
            datesList: document.getElementById('dates-list'),
            emptyState: document.getElementById('empty-state'),
            formAdd: document.getElementById('form-add'),
            inputTitle: document.getElementById('input-title'),
            inputDate: document.getElementById('input-date'),
            headerTitle: document.getElementById('header-title'),
            btnBack: document.getElementById('btn-back'),
            navBtns: document.querySelectorAll('.nav-btn'),
            
            // Detail elements
            detailCounter: document.getElementById('detail-counter'),
            detailTitle: document.getElementById('detail-title'),
            detailDate: document.getElementById('detail-date'),
            btnWhatsapp: document.getElementById('btn-whatsapp')
        };
    },

    bindEvents() {
        this.els.formAdd.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDate();
        });
    },

    loadData() {
        const stored = localStorage.getItem('tikk_dates_v2');
        if (stored) {
            try {
                this.data.dates = JSON.parse(stored);
            } catch (e) {
                this.data.dates = [];
            }
        } else {
            // Try to migrate from v1 if exists
            const oldStored = localStorage.getItem('tikk_dates');
            if (oldStored) {
                try {
                    this.data.dates = JSON.parse(oldStored);
                    this.saveToStorage(); // Save as v2
                } catch (e) {
                    this.data.dates = [];
                }
            }
        }
    },

    saveToStorage() {
        localStorage.setItem('tikk_dates_v2', JSON.stringify(this.data.dates));
    },

    parseYearsPassed(dateString) {
        const date = dayjs(dateString);
        const now = dayjs();
        return now.diff(date, 'year');
    },

    saveDate() {
        const title = this.els.inputTitle.value.trim();
        const dateStr = this.els.inputDate.value;

        if (!title || !dateStr) {
            alert("Por favor, ponle un nombre y elige una fecha.");
            return;
        }

        const newDate = {
            id: Date.now().toString(),
            title,
            date: dateStr,
            createdAt: new Date().toISOString()
        };

        this.data.dates.push(newDate);
        this.data.dates.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        this.saveToStorage();
        
        // Reset form
        this.els.formAdd.reset();
        
        this.renderDashboard();
        this.navigate('dashboard');
    },

    deleteCurrentDate() {
        if (!this.data.selectedDateId) return;
        
        if (confirm('¿Estás seguro de eliminar este recuerdo? No hay marcha atrás.')) {
            this.data.dates = this.data.dates.filter(d => d.id !== this.data.selectedDateId);
            this.saveToStorage();
            this.renderDashboard();
            this.navigate('dashboard');
        }
    },

    navigate(viewName) {
        // Validation
        if (!this.views[viewName]) return;

        // Clean up intervals
        if (this.data.intervalId) {
            clearInterval(this.data.intervalId);
            this.data.intervalId = null;
        }

        // Setup Header Title & Back Button
        if (viewName === 'dashboard' || viewName === 'settings') {
            this.els.btnBack.classList.add('hidden');
            this.els.btnBack.classList.remove('flex');
            this.els.headerTitle.textContent = viewName === 'dashboard' ? 'Tikk' : 'Acerca de Tikk';
        } else {
            this.els.btnBack.classList.remove('hidden');
            this.els.btnBack.classList.add('flex');
            this.els.headerTitle.textContent = viewName === 'add' ? 'Crear' : 'Detalle';
        }

        const targetView = this.views[viewName];
        
        // Hide all other views
        Object.values(this.views).forEach(v => {
            if (v !== targetView && !v.classList.contains('hidden')) {
                // Animate out
                v.classList.remove('opacity-100', 'translate-y-0');
                v.classList.add('opacity-0', 'translate-y-4');
                // Wait for animation to finish before applying hidden
                setTimeout(() => {
                    // Make sure it wasn't re-opened while animating
                    if (this.data.currentView !== Object.keys(this.views).find(key => this.views[key] === v)) {
                        v.classList.add('hidden');
                    }
                }, 300);
            }
        });

        // Show target view with animation
        if (targetView.classList.contains('hidden')) {
            targetView.classList.remove('hidden');
            // Trigger reflow
            void targetView.offsetWidth;
            targetView.classList.remove('opacity-0', 'translate-y-4');
            targetView.classList.add('opacity-100', 'translate-y-0');
        } else if (targetView.classList.contains('opacity-0')) {
            // It might not be hidden but animating out, so we reverse it
            targetView.classList.remove('opacity-0', 'translate-y-4');
            targetView.classList.add('opacity-100', 'translate-y-0');
        }

        // Update Nav Bar visual states
        this.els.navBtns.forEach(btn => {
            if (btn.dataset.target === viewName) {
                btn.classList.add('text-rose-500');
                btn.classList.remove('text-slate-400', 'hover:text-slate-600');
            } else {
                btn.classList.remove('text-rose-500');
                btn.classList.add('text-slate-400', 'hover:text-slate-600');
            }
        });

        // Init specific view logic
        if (viewName === 'detail' && this.data.selectedDateId) {
            this.startDetailCounter();
        }

        this.data.currentView = viewName;
    },

    renderDashboard() {
        if (this.data.dates.length === 0) {
            this.els.emptyState.classList.remove('hidden');
            this.els.datesList.innerHTML = '';
            return;
        }

        this.els.emptyState.classList.add('hidden');
        this.els.datesList.innerHTML = '';

        this.data.dates.forEach(item => {
            const years = this.parseYearsPassed(item.date);
            const formattedDate = dayjs(item.date).format('D [de] MMMM, YYYY');
            
            const card = document.createElement('div');
            card.className = "bg-white rounded-[1.25rem] p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all duration-300 hover:shadow-md hover:border-slate-200";
            card.onclick = () => {
                window.app.data.selectedDateId = item.id;
                window.app.navigate('detail');
            };
            
            card.innerHTML = `
                <div class="pr-2">
                    <h3 class="text-lg font-bold text-slate-800 tracking-tight leading-tight mb-1">${item.title}</h3>
                    <p class="text-[13px] font-medium text-slate-400">${formattedDate}</p>
                </div>
                <div class="text-right flex-shrink-0 bg-slate-50 py-2 px-3 rounded-xl border border-slate-100">
                    <span class="text-2xl font-black text-rose-500 tracking-tighter block leading-none">${years}</span>
                    <span class="text-[10px] font-bold text-rose-300 uppercase tracking-widest mt-1 block">Años</span>
                </div>
            `;
            
            this.els.datesList.appendChild(card);
        });
    },

    startDetailCounter() {
        const dateItem = this.data.dates.find(d => d.id === this.data.selectedDateId);
        if (!dateItem) {
            this.navigate('dashboard');
            return;
        }

        this.els.headerTitle.textContent = dateItem.title;
        this.els.detailTitle.textContent = dateItem.title;
        this.els.detailDate.textContent = dayjs(dateItem.date).format('D [de] MMMM, YYYY');

        const updateCounter = () => {
            const now = dayjs();
            const past = dayjs(dateItem.date);
            const totalMinutes = now.diff(past, 'minute');
            
            // Format number with thousands separator
            this.els.detailCounter.textContent = totalMinutes.toLocaleString('es-ES');
            
            // Build WhatsApp message
            const years = now.diff(past, 'year');
            const txt = `Han pasado ${years} años y exactamente ${totalMinutes.toLocaleString('es-ES')} minutos desde ${dateItem.title}... ¡Qué locura el tiempo vuela! 🤯❤️`;
            
            this.els.btnWhatsapp.onclick = () => {
                const url = `https://wa.me/?text=${encodeURIComponent(txt)}`;
                window.open(url, '_blank');
            };
        };

        updateCounter();
        this.data.intervalId = setInterval(updateCounter, 10000);
    }
};

document.addEventListener('DOMContentLoaded', () => window.app.init());