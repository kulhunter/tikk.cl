/**
 * Tikk v2.1 PWA
 * Arquitectura Reactiva SPA Vanilla JS
 */

window.app = {
    data: {
        dates: [],
        currentView: null,
        selectedDateId: null,
        intervalId: null,
        onboardingSlide: 0,
        detailUnit: 'minutos'
    },

    onboardingData: [
        {
            title: "Bienvenido a Tikk",
            text: "El contador emocional. Celebra y calcula con exactitud cuántos segundos faltan o han pasado desde esa fecha.",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`
        },
        {
            title: "Desliza para limpiar",
            text: "Diseño sin fricción. Puedes editar o eliminar tus fechas deslizando las tarjetas fácilmente desde la página inicial.",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>`
        },
        {
            title: "Notificaciones Nativas",
            text: "Genera alarmas automáticas en tu calendario sin necesidad de servidores extraños. Siempre avisa, aunque no tengas internet.",
            icon: `<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />`
        }
    ],

    init() {
        this.loadData();
        this.cacheDOM();
        this.bindEvents();
        this.initSwipeLogic();
        this.renderDashboard();
        
        const onboarded = localStorage.getItem('tikk_onboarded_v2.1');
        if (!onboarded) {
            this.navigate('onboarding');
            this.renderOnboarding();
        } else {
            this.navigate('dashboard');
        }
    },

    cacheDOM() {
        this.views = {
            onboarding: document.getElementById('view-onboarding'),
            dashboard: document.getElementById('view-dashboard'),
            add: document.getElementById('view-add'),
            detail: document.getElementById('view-detail'),
            settings: document.getElementById('view-settings')
        };
        this.els = {
            // General
            mainHeader: document.getElementById('main-header'),
            mainNav: document.getElementById('main-nav'),
            datesList: document.getElementById('dates-list'),
            emptyState: document.getElementById('empty-state'),
            headerTitle: document.getElementById('header-title'),
            btnBack: document.getElementById('btn-back'),
            navBtns: document.querySelectorAll('.nav-btn'),

            // Add/Edit Form
            formAdd: document.getElementById('form-add'),
            formTitle: document.getElementById('form-add-title'),
            inputTitle: document.getElementById('input-title'),
            inputDate: document.getElementById('input-date'),
            inputAnnual: document.getElementById('input-annual'),
            
            // Detail
            detailSubtitle: document.getElementById('detail-subtitle'),
            detailHeaderDate: document.getElementById('detail-header-date'),
            detailCounter: document.getElementById('detail-counter'),
            detailUnitSelector: document.getElementById('detail-unit-selector'),
            detailExactBox: document.getElementById('detail-exact-box'),
            detailExactPrefix: document.getElementById('detail-exact-prefix'),
            detailExactTime: document.getElementById('detail-exact-time'),
            detailExactSuffix: document.getElementById('detail-exact-suffix'),
            detailNextBox: document.getElementById('detail-next-box'),
            detailNextDays: document.getElementById('detail-next-days'),
            whatsappMessage: document.getElementById('whatsapp-message'),
            detailCardBlob: document.getElementById('detail-card-blob'),

            // Onboarding 
            onboardingTitle: document.getElementById('onboarding-title'),
            onboardingText: document.getElementById('onboarding-text'),
            onboardingIcon: document.getElementById('onboarding-icon'),
            onboardingBtn: document.getElementById('onboarding-btn')
        };
    },

    bindEvents() {
        if(this.els.formAdd) {
            this.els.formAdd.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDate();
            });
        }
    },

    loadData() {
        const stored = localStorage.getItem('tikk_dates_v2');
        if (stored) {
            try {
                this.data.dates = JSON.parse(stored);
            } catch (e) {
                this.data.dates = [];
            }
        }
    },

    saveToStorage() {
        localStorage.setItem('tikk_dates_v2', JSON.stringify(this.data.dates));
    },

    nextOnboarding() {
        if (this.data.onboardingSlide < 2) {
            this.data.onboardingSlide++;
            this.renderOnboarding();
        } else {
            localStorage.setItem('tikk_onboarded_v2.1', 'true');
            this.navigate('dashboard');
        }
    },

    renderOnboarding() {
        if (!this.els.onboardingIcon) return;
        const slide = this.onboardingData[this.data.onboardingSlide];
        this.els.onboardingIcon.style.opacity = '0';
        this.els.onboardingTitle.style.opacity = '0';
        this.els.onboardingText.style.opacity = '0';
        
        setTimeout(() => {
            if (this.data.onboardingSlide === 2) {
                this.els.onboardingIcon.innerHTML = `<svg class="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">${slide.icon}</svg>`;
            } else {
                this.els.onboardingIcon.innerHTML = `<svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">${slide.icon}</svg>`;
            }
            this.els.onboardingTitle.textContent = slide.title;
            this.els.onboardingText.textContent = slide.text;
            
            this.els.onboardingIcon.style.opacity = '1';
            this.els.onboardingTitle.style.opacity = '1';
            this.els.onboardingText.style.opacity = '1';
            
            if (this.data.onboardingSlide === 2) {
                this.els.onboardingBtn.textContent = 'Empezar ahora';
            }
            
            for(let i=0; i<3; i++) {
                const dot = document.getElementById(`dot-${i}`);
                if (dot) {
                    if (i === this.data.onboardingSlide) {
                        dot.className = "h-2 w-6 rounded-full bg-rose-500 transition-all duration-300";
                    } else {
                        dot.className = "h-2 w-2 rounded-full bg-slate-200 transition-all duration-300";
                    }
                }
            }
        }, 150);
    },

    // UI Routing
    navigate(viewName) {
        if (!this.views[viewName]) return;

        if (this.data.intervalId) {
            clearInterval(this.data.intervalId);
            this.data.intervalId = null;
        }

        // Header / Nav visibility
        if (viewName === 'onboarding') {
            if(this.els.mainHeader) this.els.mainHeader.style.display = 'none';
            if(this.els.mainNav) this.els.mainNav.style.display = 'none';
        } else {
            if(this.els.mainHeader) this.els.mainHeader.style.display = 'flex';
            if(this.els.mainNav) this.els.mainNav.style.display = 'block';
            
            if (viewName === 'dashboard' || viewName === 'settings') {
                if(this.els.btnBack) {
                    this.els.btnBack.classList.add('hidden');
                    this.els.btnBack.classList.remove('flex');
                }
                if(this.els.headerTitle) this.els.headerTitle.textContent = viewName === 'dashboard' ? 'Tikk' : 'Acerca de Tikk';
            } else {
                if(this.els.btnBack) {
                    this.els.btnBack.classList.remove('hidden');
                    this.els.btnBack.classList.add('flex');
                }
                const isAdd = viewName === 'add';
                if(this.els.headerTitle) this.els.headerTitle.textContent = isAdd ? (this.data.selectedDateId ? 'Editar' : 'Crear') : 'Detalle';
                
                // If opening Add view, clear selected ID if entering via standard route
                if (isAdd && !this.data._editingNow) {
                    this.data.selectedDateId = null;
                    this.els.formAdd.reset();
                    this.els.formTitle.textContent = 'Nueva Fecha';
                }
            }
        }

        // Views transition logic
        const targetView = this.views[viewName];
        
        Object.values(this.views).forEach(v => {
            if (v !== targetView && !v.classList.contains('hidden')) {
                v.classList.remove('opacity-100', 'translate-y-0');
                v.classList.add('opacity-0', 'translate-y-4');
                setTimeout(() => {
                    if (this.data.currentView !== Object.keys(this.views).find(key => this.views[key] === v)) {
                        v.classList.add('hidden');
                    }
                }, 200);
            }
        });

        if (targetView.classList.contains('hidden')) {
            targetView.classList.remove('hidden');
            void targetView.offsetWidth;
            targetView.classList.remove('opacity-0', 'translate-y-4');
            targetView.classList.add('opacity-100', 'translate-y-0');
        } else if (targetView.classList.contains('opacity-0')) {
            targetView.classList.remove('opacity-0', 'translate-y-4');
            targetView.classList.add('opacity-100', 'translate-y-0');
        }

        this.els.navBtns.forEach(btn => {
            if (btn.dataset.target === viewName) {
                btn.classList.add('text-rose-500');
                btn.classList.remove('text-slate-400');
            } else {
                btn.classList.remove('text-rose-500');
                btn.classList.add('text-slate-400');
            }
        });

        if (viewName === 'detail' && this.data.selectedDateId) {
            this.startDetailCounter();
        }

        this.data.currentView = viewName;
    },

    // Date calculations
    parseDateInfo(dateStr, isAnnual) {
        let date = dayjs(dateStr);
        let now = dayjs();

        if (isAnnual) {
            let next = dayjs(dateStr).year(now.year());
            if (next.isBefore(now, 'day')) {
                next = next.add(1, 'year');
            }
            return {
                isFuture: next.isAfter(now),
                years: next.diff(date, 'year'), // User exact age / anniversary years next time it comes
                nextDate: next,
                origDate: date
            };
        } else {
            const isFuture = date.isAfter(now);
            const years = Math.abs(isFuture ? date.diff(now, 'year') : now.diff(date, 'year'));
            return {
                isFuture,
                years,
                nextDate: date,
                origDate: date
            };
        }
    },

    // Saving and rendering
    saveDate() {
        const title = this.els.inputTitle.value.trim();
        const dateStr = this.els.inputDate.value;
        const isAnnual = this.els.inputAnnual.checked;

        if (!title || !dateStr) {
            alert("Por favor, ponle un nombre y elige una fecha.");
            return;
        }

        if (this.data.selectedDateId) {
            // Edit existing
            const item = this.data.dates.find(d => d.id === this.data.selectedDateId);
            if (item) {
                item.title = title;
                item.date = dateStr;
                item.isAnnual = isAnnual;
            }
            this.data._editingNow = false;
            this.data.selectedDateId = null;
        } else {
            // Add new
            const newDate = {
                id: Date.now().toString(),
                title,
                date: dateStr,
                isAnnual,
                createdAt: new Date().toISOString()
            };
            this.data.dates.push(newDate);
        }

        this.saveToStorage();
        this.els.formAdd.reset();
        
        this.renderDashboard();
        this.navigate('dashboard');
    },

    editDate(id) {
        const item = this.data.dates.find(d => d.id === id);
        if (!item) return;
        
        this.data.selectedDateId = item.id;
        this.data._editingNow = true;
        
        this.els.formTitle.textContent = 'Editar Evento';
        this.els.inputTitle.value = item.title;
        this.els.inputDate.value = item.date;
        this.els.inputAnnual.checked = item.isAnnual || false;
        
        this.navigate('add');
    },

    deleteDate(id) {
        if (confirm('¿Estás seguro de eliminar este recuerdo? No hay marcha atrás.')) {
            this.data.dates = this.data.dates.filter(d => d.id !== id);
            this.saveToStorage();
            if (this.data.selectedDateId === id) this.data.selectedDateId = null;
            if (this.data.currentView === 'detail') this.navigate('dashboard');
            this.renderDashboard();
        } else {
            // User cancelled delete, reset the card's swipe styling if it exists
            const card = document.querySelector(`.swipe-surface[data-id="${id}"]`);
            if (card) {
                card.style.transform = `translateX(0px)`;
            }
        }
    },

    deleteCurrentDate() {
        if (this.data.selectedDateId) this.deleteDate(this.data.selectedDateId);
    },

    renderDashboard() {
        if (!this.els.datesList) return;

        this.data.dates.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (this.data.dates.length === 0) {
            this.els.emptyState.classList.remove('hidden');
            this.els.datesList.innerHTML = '';
            return;
        }

        this.els.emptyState.classList.add('hidden');
        this.els.datesList.innerHTML = '';

        this.data.dates.forEach(item => {
            const timeData = this.parseDateInfo(item.date, item.isAnnual);
            const formattedDate = dayjs(item.date).format('D [de] MMMM YYYY');
            
            const cardOuter = document.createElement('div');
            cardOuter.className = 'swipe-card-wrapper';
            
            const bgActions = document.createElement('div');
            bgActions.className = 'swipe-actions-bg';
            bgActions.innerHTML = `
                <div class="swipe-action-left" onclick="window.app.editDate('${item.id}')">EDITAR</div>
                <div class="swipe-action-right" onclick="window.app.deleteDate('${item.id}')">BORRAR</div>
            `;
            
            const cardInner = document.createElement('div');
            cardInner.className = 'swipe-surface p-5 flex items-center justify-between cursor-pointer';
            cardInner.dataset.id = item.id;
            
            const bgBadge = (timeData.isFuture && !item.isAnnual) ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-rose-50 border-rose-100 text-rose-500';
            const textBadge = (timeData.isFuture && !item.isAnnual) ? 'text-blue-300' : 'text-rose-300';

            cardInner.innerHTML = `
                <div class="pr-2 pointer-events-none">
                    <h3 class="text-lg font-bold text-slate-800 tracking-tight leading-tight mb-1">${item.title}</h3>
                    <p class="text-[13px] font-medium text-slate-400 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${formattedDate} 
                        ${item.isAnnual ? '<span class="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider ml-1">Anual</span>' : ''}
                    </p>
                </div>
                <div class="text-right flex-shrink-0 border py-2 px-3 rounded-xl pointer-events-none ${bgBadge}">
                    <span class="text-2xl font-black tracking-tighter block leading-none">${timeData.years}</span>
                    <span class="text-[10px] font-bold uppercase tracking-widest mt-1 block ${textBadge}">Años</span>
                </div>
            `;
            
            cardOuter.appendChild(bgActions);
            cardOuter.appendChild(cardInner);
            this.els.datesList.appendChild(cardOuter);
        });
    },

    // Swipe UI Handlers
    initSwipeLogic() {
        this.swipeState = {
            startX: 0,
            currentX: 0,
            targetCard: null,
            threshold: 90
        };

        const list = document.getElementById('dates-list');
        if (!list) return;

        list.addEventListener('touchstart', e => {
            const surface = e.target.closest('.swipe-surface');
            if (!surface) return;
            this.swipeState.targetCard = surface;
            this.swipeState.startX = e.touches[0].clientX;
            surface.classList.add('dragging');
        }, {passive: true});

        list.addEventListener('touchmove', e => {
            if (!this.swipeState.targetCard) return;
            // Allow some vertical scrolling but capture horizontal
            this.swipeState.currentX = e.touches[0].clientX - this.swipeState.startX;
            
            if (Math.abs(this.swipeState.currentX) > 15) {
                // visually constrain movement
                let x = this.swipeState.currentX;
                if (x > 120) x = 120 + (x - 120) * 0.2; 
                if (x < -120) x = -120 + (x + 120) * 0.2;
                
                this.swipeState.targetCard.style.transform = `translateX(${x}px)`;
            }
        }, {passive: true});

        list.addEventListener('touchend', e => {
            if (!this.swipeState.targetCard) return;
            const surface = this.swipeState.targetCard;
            surface.classList.remove('dragging');
            const x = this.swipeState.currentX;
            const id = surface.dataset.id;
            
            if (x > this.swipeState.threshold) {
                // Swipe Right -> Edit
                surface.style.transform = `translateX(100%)`;
                setTimeout(() => this.editDate(id), 200);
            } else if (x < -this.swipeState.threshold) {
                // Swipe Left -> Delete
                surface.style.transform = `translateX(-100%)`;
                setTimeout(() => this.deleteDate(id), 200);
            } else {
                // Snap back / Simple Click logic
                surface.style.transform = `translateX(0px)`;
                if (Math.abs(x) < 5) {
                    // Treat as click
                    window.app.data.selectedDateId = id;
                    window.app.navigate('detail');
                }
            }
            
            this.swipeState.targetCard = null;
            this.swipeState.currentX = 0;
        });
    },

    updateDetailUnit() {
        if (!this.els.detailUnitSelector) return;
        this.data.detailUnit = this.els.detailUnitSelector.value;
        if(this.forceDetailCounterUpdate) this.forceDetailCounterUpdate();
    },

    forceDetailCounterUpdate: null,

    startDetailCounter() {
        const item = this.data.dates.find(d => d.id === this.data.selectedDateId);
        if (!item) {
            this.navigate('dashboard');
            return;
        }

        // Check DOM integrity to prevent exception
        if (!this.els.detailSubtitle || !this.els.detailCounter) return;

        this.els.headerTitle.textContent = item.title;
        this.els.detailHeaderDate.textContent = item.title;
        
        const info = this.parseDateInfo(item.date, item.isAnnual);
        const isFutureOverall = info.isFuture;

        if (isFutureOverall) {
            this.els.detailSubtitle.textContent = "Faltan exactamente";
            this.els.detailCardBlob.classList.remove('bg-slate-100');
            this.els.detailCardBlob.classList.add('bg-blue-100');
            this.els.detailSubtitle.classList.remove('text-rose-500');
            this.els.detailSubtitle.classList.add('text-blue-500');
            this.els.detailExactPrefix.textContent = "Faltan un asombroso total de";
            this.els.detailExactSuffix.textContent = "para ese día.";
        } else {
            this.els.detailSubtitle.textContent = "Ya han pasado";
            this.els.detailCardBlob.classList.remove('bg-blue-100');
            this.els.detailCardBlob.classList.add('bg-slate-100');
            this.els.detailSubtitle.classList.remove('text-blue-500');
            this.els.detailSubtitle.classList.add('text-rose-500');
            this.els.detailExactPrefix.textContent = "Han pasado un asombroso total de";
            this.els.detailExactSuffix.textContent = "desde ese día.";
        }

        const updateCounter = () => {
            const now = dayjs();
            const eventTime = dayjs(info.origDate);
            const isFut = eventTime.isAfter(now);
            
            // Total Big Number calculation
            const a = isFut ? eventTime : now;
            const b = isFut ? now : eventTime;
            
            let total = 0;
            switch(this.data.detailUnit) {
                case 'segundos': total = a.diff(b, 'second'); break;
                case 'minutos': total = a.diff(b, 'minute'); break;
                case 'horas': total = a.diff(b, 'hour'); break;
                case 'días': total = a.diff(b, 'day'); break;
                case 'semanas': total = a.diff(b, 'week'); break;
                case 'meses': total = a.diff(b, 'month'); break;
                case 'años': total = a.diff(b, 'year'); break;
            }
            this.els.detailCounter.textContent = total.toLocaleString('es-ES');

            // Exact String Math Logic accurately calculating down to seconds without errors
            let start = b;
            let end = a;
            
            let exactYears = end.diff(start, 'year');
            start = start.add(exactYears, 'year');
            let exactMonths = end.diff(start, 'month');
            start = start.add(exactMonths, 'month');
            let exactDays = end.diff(start, 'day');
            start = start.add(exactDays, 'day');
            let exactHours = end.diff(start, 'hour');
            start = start.add(exactHours, 'hour');
            let exactMinutes = end.diff(start, 'minute');
            start = start.add(exactMinutes, 'minute');
            let exactSeconds = end.diff(start, 'second');

            let parts = [];
            if (exactYears > 0) parts.push(`${exactYears} ${exactYears === 1 ? 'año' : 'años'}`);
            if (exactMonths > 0) parts.push(`${exactMonths} ${exactMonths === 1 ? 'mes' : 'meses'}`);
            if (exactDays > 0) parts.push(`${exactDays} ${exactDays === 1 ? 'días' : 'días'}`);
            if (exactHours > 0) parts.push(`${exactHours} ${exactHours === 1 ? 'hora' : 'horas'}`);
            if (exactMinutes > 0) parts.push(`${exactMinutes} ${exactMinutes === 1 ? 'minuto' : 'minutos'}`);
            if (parts.length > 0 || exactSeconds > 0) parts.push(`${exactSeconds} ${exactSeconds === 1 ? 'segundo' : 'segundos'}`);
            
            if (parts.length === 0) parts.push("0 segundos");

            let exactStr = "";
            if (parts.length > 1) {
                const lastToken = parts.pop();
                exactStr = parts.join(', ') + ' y ' + lastToken;
            } else {
                exactStr = parts[0];
            }
            this.els.detailExactTime.textContent = exactStr;

            // Handle Annual Next Occurrence Box
            if (item.isAnnual && !isFutureOverall) {
                this.els.detailNextBox.classList.remove('hidden');
                let nextAn = dayjs(item.date).year(now.year());
                if (nextAn.isBefore(now, 'day')) {
                    nextAn = nextAn.add(1, 'year');
                }
                const missingDays = nextAn.diff(now.startOf('day'), 'day');
                this.els.detailNextDays.textContent = `${missingDays} ${missingDays === 1 ? 'día' : 'días'}`;
            } else {
                this.els.detailNextBox.classList.add('hidden');
            }

            // Whatsapp Msg Prep
            const verbPrefix = isFutureOverall ? "Falta" : "Han pasado";
            const verbSec = isFutureOverall ? "para" : "desde";
            const preMessage = `${verbPrefix} exactamente la friolera suma de ${total.toLocaleString('es-ES')} ${this.data.detailUnit} (${exactStr}) ${verbSec} ${item.title}... ¡Qué locura cómo pasa el tiempo! 🤯❤️`;
            
            if (!this.els.whatsappMessage.dataset.userEdited) {
                this.els.whatsappMessage.value = preMessage;
            }
            this.els.whatsappMessage.oninput = () => {
                this.els.whatsappMessage.dataset.userEdited = 'true';
            };
        };

        this.forceDetailCounterUpdate = updateCounter;
        updateCounter();
        this.data.intervalId = setInterval(updateCounter, 1000); 
    },

    sendWhatsapp() {
        const txt = this.els.whatsappMessage.value;
        const msg = encodeURIComponent(txt);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    },

    async setupNotifications() {
        const item = this.data.dates.find(d => d.id === this.data.selectedDateId);
        if (!item) return;

        const now = dayjs();
        let evTime = dayjs(item.date);
        
        if (item.isAnnual) {
            evTime = evTime.year(now.year());
            if (evTime.isBefore(now, 'day')) {
                evTime = evTime.add(1, 'year');
            }
        }

        const fmt = (d) => d.format('YYYYMMDDTHHmmss');
        const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tikk PWA//ES
BEGIN:VEVENT
UID:${item.id}-${Date.now()}@tikk.cl
DTSTAMP:${fmt(now)}Z
DTSTART:${fmt(evTime)}Z
DTEND:${fmt(evTime.add(1,'hour'))}Z
SUMMARY:${item.title}
DESCRIPTION:¡Registrado en Tikk PWA!
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:1 Mes para ${item.title}
TRIGGER:-P4W
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:1 Semana para ${item.title}
TRIGGER:-P1W
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Mañana es ${item.title}
TRIGGER:-P1D
END:VALARM
END:VEVENT
END:VCALENDAR`;

        const file = new File([icsData], `${item.title.replace(/\\s+/g, '_')}.ics`, {type: "text/calendar"});
        
        try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Tikk: ${item.title}`,
                    text: 'Agrega estas notificaciones inteligentes a tu calendario.'
                });
            } else {
                // Fallback Download for Desktop
                const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `${item.title.replace(/\\s+/g, '_')}.ics`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch(e) {
            console.log('User cancelled share or download failed', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => window.app.init());