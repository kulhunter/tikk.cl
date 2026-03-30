/**
 * Tikk v3.0 PWA Nivel Apple
 * Arquitectura Reactiva SPA Vanilla JS
 */

window.app = {
    data: {
        dates: [],
        currentView: null,
        selectedDateId: null,
        intervalId: null,
        onboardingSlide: 0,
        detailUnit: 'minutos',
        coords: null
    },

    onboardingData: [
        {
            title: "Bienvenido a Tikk",
            text: "El contador emocional. Celebra y calcula con exactitud matemática cuántos segundos faltan o han pasado desde tu evento favorito.",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`
        },
        {
            title: "Desliza sin fricción",
            text: "Interacciones Apple Level. Edita o elimina tus fechas deslizando las tarjetas fácilmente sin menús estorbosos ni complicaciones.",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>`
        },
        {
            title: "Recomendador e Integración",
            text: "Descubre lugares perfectos cerca de ti con el módulo Inspiración y exporta alarmas a tu Calendario para no olvidar nada. ¡Empecemos!",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>`
        }
    ],

    init() {
        this.loadData();
        this.cacheDOM();
        this.bindEvents();
        this.initSwipeLogic();
        this.renderDashboard();
        
        const onboarded = localStorage.getItem('tikk_onboarded_v3');
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
            inspiration: document.getElementById('view-inspiration'),
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
            inputRecurrence: document.getElementById('input-recurrence'),
            
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
            onboardingBtn: document.getElementById('onboarding-btn'),

            // Inspiration
            geoPromptBox: document.getElementById('geo-prompt-box'),
            inspirationGrid: document.getElementById('inspiration-grid')
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
                // Migrate old boolean isAnnual to new recurrence string
                this.data.dates.forEach(d => {
                    if (d.recurrence === undefined) {
                        d.recurrence = d.isAnnual ? 'annual' : 'none';
                    }
                });
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
            localStorage.setItem('tikk_onboarded_v3', 'true');
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
                this.els.onboardingIcon.innerHTML = `<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">${slide.icon}</svg>`;
            } else {
                this.els.onboardingIcon.innerHTML = `<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">${slide.icon}</svg>`;
            }
            this.els.onboardingTitle.textContent = slide.title;
            this.els.onboardingText.textContent = slide.text;
            
            this.els.onboardingIcon.style.opacity = '1';
            this.els.onboardingTitle.style.opacity = '1';
            this.els.onboardingText.style.opacity = '1';
            
            if (this.data.onboardingSlide === 2) {
                this.els.onboardingBtn.textContent = 'Empezar magia a nivel Apple';
            }
            
            for(let i=0; i<3; i++) {
                const dot = document.getElementById(`dot-${i}`);
                if (dot) {
                    if (i === this.data.onboardingSlide) {
                        dot.className = "h-2 w-8 rounded-full bg-rose-500 transition-all duration-300";
                    } else {
                        dot.className = "h-2 w-2 rounded-full bg-slate-200 transition-all duration-300";
                    }
                }
            }
        }, 150);
    },

    navigate(viewName) {
        if (!this.views[viewName]) return;

        if (this.data.intervalId) {
            clearInterval(this.data.intervalId);
            this.data.intervalId = null;
        }

        // Header / Nav logic
        if (viewName === 'onboarding') {
            if(this.els.mainHeader) this.els.mainHeader.style.display = 'none';
            if(this.els.mainNav) this.els.mainNav.style.display = 'none';
        } else {
            if(this.els.mainHeader) this.els.mainHeader.style.display = 'flex';
            if(this.els.mainNav) this.els.mainNav.style.display = 'block';
            
            if (['dashboard', 'settings', 'inspiration'].includes(viewName)) {
                if(this.els.btnBack) {
                    this.els.btnBack.classList.add('hidden');
                    this.els.btnBack.classList.remove('flex');
                }
                if(this.els.headerTitle) {
                    if (viewName === 'dashboard') this.els.headerTitle.textContent = 'Tikk';
                    if (viewName === 'settings') this.els.headerTitle.textContent = 'Acerca';
                    if (viewName === 'inspiration') this.els.headerTitle.textContent = 'Inspiración';
                }
            } else {
                if(this.els.btnBack) {
                    this.els.btnBack.classList.remove('hidden');
                    this.els.btnBack.classList.add('flex');
                }
                const isAdd = viewName === 'add';
                if(this.els.headerTitle) this.els.headerTitle.textContent = isAdd ? (this.data.selectedDateId ? 'Editar' : 'Crear') : 'Detalle';
                
                if (isAdd && !this.data._editingNow) {
                    this.data.selectedDateId = null;
                    this.els.formAdd.reset();
                    this.els.formTitle.textContent = 'Nueva Fecha';
                }
            }
        }

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
                
                // Specific styling for inspiration icon
                if (btn.dataset.target === 'inspiration' && viewName !== 'inspiration') {
                    btn.classList.remove('text-blue-500');
                } else if (btn.dataset.target === 'inspiration' && viewName === 'inspiration') {
                    btn.classList.remove('text-rose-500');
                    btn.classList.add('text-blue-500');
                }
            }
        });

        if (viewName === 'detail' && this.data.selectedDateId) {
            this.startDetailCounter();
        }

        this.data.currentView = viewName;
    },

    // Mathematics Core Module
    parseDateInfo(dateStr, recurrence) {
        let origDate = dayjs(dateStr);
        let now = dayjs();

        if (recurrence === 'none') {
            const isFuture = origDate.isAfter(now);
            const years = Math.abs(isFuture ? origDate.diff(now, 'year') : now.diff(origDate, 'year'));
            return {
                isFuture,
                years,
                nextDate: origDate,
                origDate
            };
        } else {
            // Find next occurrence in the future
            let next = dayjs(dateStr);
            while (next.isBefore(now, 'second')) {
                switch(recurrence) {
                    case 'daily': next = next.add(1, 'day'); break;
                    case 'weekly': next = next.add(1, 'week'); break;
                    case 'monthly': next = next.add(1, 'month'); break;
                    case 'semestral': next = next.add(6, 'month'); break;
                    case 'annual': next = next.add(1, 'year'); break;
                    default: next = next.add(1, 'year');
                }
            }
            // Calculated years for badges
            return {
                isFuture: true, // Recurrent target is always considered a next goal
                years: recurrence === 'annual' ? next.diff(origDate, 'year') : next.diff(origDate, 'month'), 
                nextDate: next,
                origDate
            };
        }
    },

    saveDate() {
        const title = this.els.inputTitle.value.trim();
        const dateStr = this.els.inputDate.value;
        const recurrence = this.els.inputRecurrence.value;

        if (!title || !dateStr) {
            alert("Por favor, ponle un nombre y elige una fecha.");
            return;
        }

        if (this.data.selectedDateId) {
            const item = this.data.dates.find(d => d.id === this.data.selectedDateId);
            if (item) {
                item.title = title;
                item.date = dateStr;
                item.recurrence = recurrence;
            }
            this.data._editingNow = false;
            this.data.selectedDateId = null;
        } else {
            const newDate = {
                id: Date.now().toString(),
                title,
                date: dateStr,
                recurrence,
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
        this.els.inputRecurrence.value = item.recurrence || 'none';
        
        this.navigate('add');
    },

    deleteDate(id) {
        if (confirm('¿Estás seguro de eliminar de raíz este recuerdo? No hay recuperación posible.')) {
            this.data.dates = this.data.dates.filter(d => d.id !== id);
            this.saveToStorage();
            if (this.data.selectedDateId === id) this.data.selectedDateId = null;
            if (this.data.currentView === 'detail') this.navigate('dashboard');
            this.renderDashboard();
        } else {
            // Restore visual layout
            const card = document.querySelector(`.swipe-surface[data-id="${id}"]`);
            if (card) {
                card.style.transform = `translateX(0px)`;
            }
        }
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

        const badgeText = { 'daily': 'DÍAS', 'weekly': 'SEMANAS', 'monthly': 'MESES', 'semestral': 'CICLOS', 'annual': 'AÑOS' };
        const labelText = { 'daily': 'DIARIO', 'weekly': 'SEMANAL', 'monthly': 'MENSUAL', 'semestral': 'SEMESTRAL', 'annual': 'ANUAL' };

        this.data.dates.forEach(item => {
            const timeData = this.parseDateInfo(item.date, item.recurrence || 'none');
            const formattedDate = dayjs(item.date).format('D MMM YYYY');
            const isRecurrent = item.recurrence !== 'none';
            
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
            // Native smooth click handling
            cardInner.onclick = () => {
                this.data.selectedDateId = item.id;
                this.navigate('detail');
            };
            
            const bgBadge = (timeData.isFuture && !isRecurrent) ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-rose-50 border-rose-100 text-rose-500';
            const textBadgeColor = (timeData.isFuture && !isRecurrent) ? 'text-blue-300' : 'text-rose-300';
            
            let badgeTextRender = isRecurrent ? badgeText[item.recurrence] : 'AÑOS';
            let labelTag = isRecurrent ? `<span class="px-1.5 py-0.5 rounded-[4px] bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider ml-2">${labelText[item.recurrence]}</span>` : '';

            cardInner.innerHTML = `
                <div class="pr-2 pointer-events-none">
                    <h3 class="text-[17px] font-bold text-slate-800 tracking-tight leading-tight mb-1.5 line-clamp-2">${item.title}</h3>
                    <p class="text-[13px] font-medium text-slate-400 flex items-center">
                        <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${formattedDate} 
                        ${labelTag}
                    </p>
                </div>
                <div class="text-right flex-shrink-0 border py-2.5 px-3.5 rounded-[14px] pointer-events-none ${bgBadge}">
                    <span class="text-[1.7rem] font-black tracking-tighter block leading-none">${timeData.years}</span>
                    <span class="text-[9px] font-bold uppercase tracking-widest mt-1 block ${textBadgeColor}">${badgeTextRender}</span>
                </div>
            `;
            
            cardOuter.appendChild(bgActions);
            cardOuter.appendChild(cardInner);
            this.els.datesList.appendChild(cardOuter);
        });
    },

    initSwipeLogic() {
        this.swipeState = { startX: 0, currentX: 0, targetCard: null, threshold: 90 };
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
            let currentClientX = e.touches[0].clientX;
            let diffX = currentClientX - this.swipeState.startX;
            
            if (Math.abs(diffX) > 10) {
                this.swipeState.currentX = diffX;
                let x = diffX;
                // Elastic effect
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
                // Edit (Swiped completely Right to unveil left action)
                surface.style.transform = `translateX(100%)`;
                setTimeout(() => {
                    surface.style.transform = `translateX(0px)`;
                    this.editDate(id);
                }, 200);
            } else if (x < -this.swipeState.threshold) {
                // Delete
                surface.style.transform = `translateX(-100%)`;
                setTimeout(() => this.deleteDate(id), 200);
            } else {
                surface.style.transform = `translateX(0px)`;
            }
            
            this.swipeState.targetCard = null;
            this.swipeState.currentX = 0;
            this.swipeState.startX = 0;
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

        if (!this.els.detailSubtitle || !this.els.detailCounter) return;

        this.els.headerTitle.textContent = item.title;
        this.els.detailHeaderDate.textContent = item.title;
        
        const info = this.parseDateInfo(item.date, item.recurrence || 'none');
        // If it's recurrent, we consider it a FUTURE countdown to the next occurrence. Wait, is it?
        // Let's track exact mathematical time difference to the NEXT target.
        const isFutureOverall = info.isFuture; 
        
        // Colors & Words
        if (isFutureOverall) {
            this.els.detailSubtitle.textContent = item.recurrence !== 'none' ? "Próxima ocurrencia en" : "Faltan exactamente";
            this.els.detailCardBlob.classList.replace('bg-slate-100', 'bg-blue-100');
            this.els.detailSubtitle.classList.replace('text-rose-500', 'text-blue-500');
            this.els.detailExactPrefix.textContent = "Magia: Faltan";
            this.els.detailExactSuffix.textContent = "para esa fecha asombrosa.";
        } else {
            this.els.detailSubtitle.textContent = "Ya han volado";
            this.els.detailCardBlob.classList.replace('bg-blue-100', 'bg-slate-100');
            this.els.detailSubtitle.classList.replace('text-blue-500', 'text-rose-500');
            this.els.detailExactPrefix.textContent = "Precisión: Pasaron";
            this.els.detailExactSuffix.textContent = "desde ese instante inolvidable.";
        }

        const updateCounter = () => {
            const now = dayjs();
            const eventTime = isFutureOverall && item.recurrence !== 'none' ? info.nextDate : dayjs(info.origDate);
            const isFut = eventTime.isAfter(now);
            
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

            // Exact Absolute Time Array down to second
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
            if (exactHours > 0) parts.push(`${exactHours} ${exactHours === 1 ? 'hora' : 'h'}`);
            if (exactMinutes > 0) parts.push(`${exactMinutes} ${exactMinutes === 1 ? 'min' : 'min'}`);
            if (parts.length > 0 || exactSeconds >= 0) {
                // Always push seconds so the UI breathes
                parts.push(`${exactSeconds} ${exactSeconds === 1 ? 'segundo' : 'segundos'}`);
            }

            let exactStr = "";
            if (parts.length > 1) {
                const lastToken = parts.pop();
                exactStr = parts.join(', ') + ' y ' + lastToken;
            } else {
                exactStr = parts[0];
            }
            this.els.detailExactTime.textContent = exactStr;

            // Handle Recurring Warning Box
            if (item.recurrence !== 'none') {
                this.els.detailNextBox.classList.remove('hidden');
                const missingDays = info.nextDate.diff(now.startOf('day'), 'day');
                this.els.detailNextDays.textContent = `${missingDays} ${missingDays === 1 ? 'día libre' : 'días libres'}`;
            } else {
                this.els.detailNextBox.classList.add('hidden');
            }

            // Whatsapp Prep
            const verbPrefix = isFutureOverall ? "Falta" : "Han pasado";
            const preMessage = `${verbPrefix} exactamente la friolera suma de ${total.toLocaleString('es-ES')} ${this.data.detailUnit} (${exactStr}) para ${item.title}... ¡Qué locura cómo pasa el reloj! 🤯❤️`;
            
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

        const info = this.parseDateInfo(item.date, item.recurrence || 'none');
        const evTime = info.nextDate; // The real next notification
        const fmt = (d) => d.format('YYYYMMDDTHHmmss');
        
        const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tikk PWA//ES
BEGIN:VEVENT
UID:${item.id}-${Date.now()}@tikk.cl
DTSTAMP:${fmt(dayjs())}Z
DTSTART:${fmt(evTime)}Z
DTEND:${fmt(evTime.add(1,'hour'))}Z
SUMMARY:${item.title}
DESCRIPTION:¡Notificación inteligente de Tikk PWA!
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:¡Pronto es ${item.title}!
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
                    text: 'Guárdalo en tu calendario seguro.'
                });
            } else {
                // Fallback direct
                const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `${item.title.replace(/\\s+/g, '_')}.ics`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch(e) {
            console.log('Cancelled', e);
        }
    },

    // Inspiracion Geolocation Magic
    acquireLocation() {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización.');
            return;
        }

        const btn = document.querySelector('#geo-prompt-box button');
        const originalText = btn.textContent;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Buscando satélites...`;
        
        navigator.geolocation.getCurrentPosition((pos) => {
            this.data.coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };
            this.els.geoPromptBox.classList.add('hidden');
            this.generateInspirationCards();
        }, (err) => {
            alert('Necesitamos permiso de ubicación para sugerirte lugares exóticos cerca.');
            btn.textContent = originalText;
        });
    },

    generateInspirationCards() {
        if (!this.data.coords) return;
        this.els.inspirationGrid.classList.remove('hidden');
        this.els.inspirationGrid.innerHTML = '';
        
        const terms = [
            { t: "Restaurantes Románticos", ic: "🍽️", bg: "bg-rose-50" },
            { t: "Parques y Naturaleza", ic: "🌳", bg: "bg-green-50" },
            { t: "Tiendas Cerca", ic: "🛍️", bg: "bg-blue-50" },
            { t: "Cafeterías Locales", ic: "☕", bg: "bg-orange-50" },
            { t: "Actividades Divertidas", ic: "🎳", bg: "bg-purple-50" },
            { t: "Cines o Teatros", ic: "🎟️", bg: "bg-red-50" }
        ];

        terms.forEach(c => {
            const url = `https://www.google.com/maps/search/${encodeURIComponent(c.t)}/@${this.data.coords.lat},${this.data.coords.lng},14z/data=!3m1!4b1!4m2!2m1!6e5`;
            const card = `<a href="${url}" target="_blank" class="${c.bg} rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm hover:scale-105 active:scale-95 transition-all text-decoration-none">
                <span class="text-3xl mb-3 drop-shadow-sm">${c.ic}</span>
                <span class="text-sm font-bold text-slate-700 leading-tight">${c.t}</span>
            </a>`;
            this.els.inspirationGrid.innerHTML += card;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => window.app.init());