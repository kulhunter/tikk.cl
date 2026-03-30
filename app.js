/**
 * Tikk v4.5 PWA (Pro Edition - Dark Mode, AI Generators)
 */

window.app = {
    data: {
        dates: [],
        currentView: null,
        selectedDateId: null,
        intervalId: null,
        onboardingSlide: 0,
        detailUnit: 'minutos',
        coords: null,
        msgStyleIndex: 0
    },

    onboardingData: [
        {
            title: "Tus Momentos",
            text: "Un espacio íntimo para las fechas que de verdad te importan. Guarda recuerdos, anécdotas y celébralos.",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`
        },
        {
            title: "Ideas y Plantillas",
            text: "Crea notificaciones en segundos. Desde aniversarios hasta recordatorios médicos, diseñados para ti.",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>`
        }
    ],

    init() {
        this.initTheme();
        this.loadData();
        this.cacheDOM();
        this.bindEvents();
        this.initSwipeLogic();
        this.renderDashboard();
        
        const onboarded = localStorage.getItem('tikk_v4_onboarded');
        if (!onboarded) {
            this.navigate('onboarding');
            this.renderOnboarding();
        } else {
            this.navigate('dashboard');
        }
    },

    initTheme() {
        const storedTheme = localStorage.getItem('tikk_theme');
        const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (storedTheme === 'dark' || (!storedTheme && userPrefersDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    toggleTheme() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('tikk_theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('tikk_theme', 'dark');
        }
    },

    cacheDOM() {
        this.views = {
            onboarding: document.getElementById('view-onboarding'),
            dashboard: document.getElementById('view-dashboard'),
            catalog: document.getElementById('view-catalog'),
            add: document.getElementById('view-add'),
            detail: document.getElementById('view-detail'),
            inspiration: document.getElementById('view-inspiration')
        };
        this.els = {
            mainHeader: document.getElementById('main-header'),
            mainNav: document.getElementById('main-nav'),
            globalFab: document.getElementById('global-fab'),
            datesList: document.getElementById('dates-list'),
            emptyState: document.getElementById('empty-state'),
            headerTitle: document.getElementById('header-title'),
            btnBack: document.getElementById('btn-back'),
            navBtns: document.querySelectorAll('.nav-btn'),

            formAdd: document.getElementById('form-add'),
            formTitle: document.getElementById('form-add-title'),
            inputTitle: document.getElementById('input-title'),
            inputDate: document.getElementById('input-date'),
            inputRecurrence: document.getElementById('input-recurrence'),
            inputCategory: document.getElementById('input-category'),
            inputEmoji: document.getElementById('input-emoji'),
            inputAnecdote: document.getElementById('input-anecdote'),
            
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
            detailEmojiBox: document.getElementById('detail-emoji-box'),
            detailEmoji: document.getElementById('detail-emoji'),
            detailAnecdoteBox: document.getElementById('detail-anecdote-box'),
            detailAnecdoteText: document.getElementById('detail-anecdote-text'),

            onboardingTitle: document.getElementById('onboarding-title'),
            onboardingText: document.getElementById('onboarding-text'),
            onboardingIcon: document.getElementById('onboarding-icon'),
            onboardingBtn: document.getElementById('onboarding-btn'),

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
        
        if(this.els.inputCategory) {
            this.els.inputCategory.addEventListener('change', () => {
                const em = { 'amor': '❤️', 'salud': '💊', 'mascota': '🐶', 'trabajo': '💼', 'personal': '✨', 'custom': '⭐' };
                if (!this.els.inputEmoji.value || Object.values(em).includes(this.els.inputEmoji.value)) {
                    this.els.inputEmoji.value = em[this.els.inputCategory.value] || '⭐';
                }
            });
        }
    },

    loadData() {
        const stored = localStorage.getItem('tikk_dates_v4');
        if (stored) {
            try {
                this.data.dates = JSON.parse(stored);
            } catch (e) {
                this.data.dates = [];
            }
        }
    },

    saveToStorage() {
        localStorage.setItem('tikk_dates_v4', JSON.stringify(this.data.dates));
    },

    nextOnboarding() {
        if (this.data.onboardingSlide < 1) {
            this.data.onboardingSlide++;
            this.renderOnboarding();
        } else {
            localStorage.setItem('tikk_v4_onboarded', 'true');
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
            if (this.data.onboardingSlide === 1) {
                this.els.onboardingIcon.innerHTML = `<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">${slide.icon}</svg>`;
            } else {
                this.els.onboardingIcon.innerHTML = `<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">${slide.icon}</svg>`;
            }
            this.els.onboardingTitle.textContent = slide.title;
            this.els.onboardingText.textContent = slide.text;
            
            this.els.onboardingIcon.style.opacity = '1';
            this.els.onboardingTitle.style.opacity = '1';
            this.els.onboardingText.style.opacity = '1';
            
            if (this.data.onboardingSlide === 1) {
                this.els.onboardingBtn.innerHTML = `Explorar el Catálogo <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>`;
            }
            
            for(let i=0; i<2; i++) {
                const dot = document.getElementById(`dot-${i}`);
                if (dot) {
                    if (i === this.data.onboardingSlide) {
                        dot.className = "h-2 w-8 rounded-full bg-brand-500 transition-all duration-300";
                    } else {
                        dot.className = "h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all duration-300";
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

        if (viewName === 'onboarding') {
            if(this.els.mainHeader) this.els.mainHeader.style.display = 'none';
            if(this.els.mainNav) this.els.mainNav.style.display = 'none';
            if(this.els.globalFab) this.els.globalFab.style.opacity = '0';
            if(this.els.globalFab) this.els.globalFab.style.pointerEvents = 'none';
        } else {
            if(this.els.mainHeader) this.els.mainHeader.style.display = 'flex';
            if(this.els.mainNav) this.els.mainNav.style.display = 'block';
            
            if(this.els.globalFab) {
                if (['dashboard', 'catalog'].includes(viewName)) {
                    this.els.globalFab.style.opacity = '1';
                    this.els.globalFab.style.pointerEvents = 'auto';
                } else {
                    this.els.globalFab.style.opacity = '0';
                    this.els.globalFab.style.pointerEvents = 'none';
                }
            }
            
            if (['dashboard', 'catalog', 'inspiration'].includes(viewName)) {
                if(this.els.btnBack) {
                    this.els.btnBack.classList.add('hidden');
                    this.els.btnBack.classList.remove('flex');
                }
                if(this.els.headerTitle) {
                    if (viewName === 'dashboard') this.els.headerTitle.textContent = 'Tikk';
                    if (viewName === 'catalog') this.els.headerTitle.textContent = 'Plantillas';
                    if (viewName === 'inspiration') this.els.headerTitle.textContent = 'Explorar';
                }
            } else {
                if(this.els.btnBack) {
                    this.els.btnBack.classList.remove('hidden');
                    this.els.btnBack.classList.add('flex');
                }
                const isAdd = viewName === 'add';
                if(this.els.headerTitle) this.els.headerTitle.textContent = isAdd ? (this.data.selectedDateId ? 'Editar Ficha' : 'Nueva Ficha') : 'Detalle';
                
                if (isAdd && !this.data._editingNow) {
                    this.data.selectedDateId = null;
                    if(!this.data._usingTemplate) {
                        this.els.formAdd.reset();
                        this.els.formTitle.textContent = 'Nueva Ficha';
                        this.els.inputEmoji.value = '⭐';
                    }
                    this.data._usingTemplate = false;
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
                btn.classList.add('text-brand-500');
                btn.classList.remove('text-slate-400', 'dark:text-slate-500');
            } else {
                btn.classList.remove('text-brand-500');
                btn.classList.add('text-slate-400', 'dark:text-slate-500');
            }
        });

        if (viewName === 'detail' && this.data.selectedDateId) {
            this.startDetailCounter();
        }

        this.data.currentView = viewName;
    },

    loadTemplate(title, cat, emoji, recurr) {
        this.data.selectedDateId = null;
        this.data._editingNow = false;
        this.data._usingTemplate = true;
        
        this.els.formAdd.reset();
        this.els.formTitle.textContent = 'Auto-creando Ficha';
        this.els.inputTitle.value = title;
        this.els.inputCategory.value = cat;
        this.els.inputEmoji.value = emoji;
        this.els.inputRecurrence.value = recurr;
        
        this.navigate('add');
    },

    parseDateMath(dateStr, recurrence) {
        let origDate = dayjs(dateStr);
        let now = dayjs();

        const isFutureOrig = origDate.isAfter(now);
        const yearsOrigin = Math.abs(isFutureOrig ? origDate.diff(now, 'year') : now.diff(origDate, 'year'));

        if (recurrence === 'none') {
            return {
                isFuture: isFutureOrig,
                years: yearsOrigin,
                nextDate: origDate,
                origDate
            };
        } else {
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
            return {
                isFuture: isFutureOrig, // Origin is the core identity
                years: recurrence === 'annual' ? Math.abs(now.diff(origDate, 'year')) : Math.abs(now.diff(origDate, 'month')), 
                nextDate: next,
                origDate
            };
        }
    },

    saveDate() {
        const title = this.els.inputTitle.value.trim();
        const dateStr = this.els.inputDate.value;
        const recurrence = this.els.inputRecurrence.value;
        const cat = this.els.inputCategory.value;
        const emoj = this.els.inputEmoji.value.trim() || '⭐';
        const anecdote = this.els.inputAnecdote.value.trim();

        if (!title || !dateStr) {
            alert("Título y Fecha son obligatorios para crear una ficha.");
            return;
        }

        if (this.data.selectedDateId) {
            const item = this.data.dates.find(d => d.id === this.data.selectedDateId);
            if (item) {
                item.title = title;
                item.date = dateStr;
                item.recurrence = recurrence;
                item.category = cat;
                item.emoji = emoj;
                item.anecdote = anecdote;
            }
            this.data._editingNow = false;
            this.data.selectedDateId = null;
        } else {
            const newDate = {
                id: Date.now().toString(),
                title,
                date: dateStr,
                recurrence,
                category: cat,
                emoji: emoj,
                anecdote,
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
        
        this.els.formTitle.textContent = 'Editar Ficha';
        this.els.inputTitle.value = item.title;
        this.els.inputDate.value = item.date;
        this.els.inputRecurrence.value = item.recurrence || 'none';
        this.els.inputCategory.value = item.category || 'custom';
        this.els.inputEmoji.value = item.emoji || '⭐';
        this.els.inputAnecdote.value = item.anecdote || '';
        
        this.navigate('add');
    },

    deleteDate(id) {
        if (confirm('¿Extirpar por completo este recuerdo de la línea temporal?')) {
            this.data.dates = this.data.dates.filter(d => d.id !== id);
            this.saveToStorage();
            if (this.data.selectedDateId === id) this.data.selectedDateId = null;
            if (this.data.currentView === 'detail') this.navigate('dashboard');
            this.renderDashboard();
        } else {
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

        const badgeText = { 'daily': 'DÍAS', 'weekly': 'SEM.', 'monthly': 'MESES', 'semestral': 'CICLOS', 'annual': 'AÑOS' };

        this.data.dates.forEach(item => {
            const timeData = this.parseDateMath(item.date, item.recurrence || 'none');
            const formattedDate = dayjs(item.date).format('D MMM YYYY');
            const isRecurrent = item.recurrence !== 'none';
            const cat = item.category || 'custom';
            
            const cardOuter = document.createElement('div');
            cardOuter.className = 'swipe-card-wrapper';
            
            const bgActions = document.createElement('div');
            bgActions.className = 'swipe-actions-bg';
            bgActions.innerHTML = `
                <div class="swipe-action-left" onclick="window.app.editDate('${item.id}')">EDITAR</div>
                <div class="swipe-action-right" onclick="window.app.deleteDate('${item.id}')">BORRAR</div>
            `;
            
            const cardInner = document.createElement('div');
            cardInner.className = `swipe-surface flex items-center justify-between p-4 cursor-pointer cat-${cat}`;
            cardInner.dataset.id = item.id;
            
            cardInner.onclick = (e) => {
                this.data.selectedDateId = item.id;
                this.navigate('detail');
            };
            
            let badgeWord = isRecurrent ? badgeText[item.recurrence] : 'AÑOS';

            cardInner.innerHTML = `
                <div class="flex items-center min-w-0 pr-2 pointer-events-none">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-white/70 dark:bg-black/20 rounded-[1.2rem] flex flex-col items-center justify-center border border-white/40 dark:border-black/10 font-bold text-center mr-4">
                        <span class="text-2xl">${item.emoji || '⭐'}</span>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-[16px] font-bold tracking-tight leading-tight mb-1 truncate">${item.title}</h3>
                        <p class="text-[12px] font-semibold opacity-70 flex items-center line-clamp-1">
                            ${formattedDate} 
                            ${item.anecdote ? ' • 💭' : ''}
                        </p>
                    </div>
                </div>
                
                <div class="text-right flex-shrink-0 ml-3 bg-white/60 dark:bg-black/20 backdrop-blur-sm py-2 px-3 rounded-[1rem] pointer-events-none min-w-[60px] border border-white/20 dark:border-black/10">
                    <span class="text-xl font-black tracking-tighter block leading-none">${timeData.years}</span>
                    <span class="text-[8px] font-black uppercase tracking-widest mt-0.5 block opacity-70">${badgeWord}</span>
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
                surface.style.transform = `translateX(100%)`;
                setTimeout(() => {
                    surface.style.transform = `translateX(0px)`;
                    this.editDate(id);
                }, 200);
            } else if (x < -this.swipeState.threshold) {
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

    // Generative AI local replacements
    regenerateMessage() {
        this.data.msgStyleIndex++;
        if(this.forceDetailCounterUpdate) this.forceDetailCounterUpdate(true);
    },

    forceDetailCounterUpdate: null,

    startDetailCounter() {
        const item = this.data.dates.find(d => d.id === this.data.selectedDateId);
        if (!item) {
            this.navigate('dashboard');
            return;
        }

        if (!this.els.detailSubtitle || !this.els.detailCounter) return;

        this.els.headerTitle.textContent = "Detalle";
        this.els.detailHeaderDate.textContent = item.title;
        this.els.detailEmoji.textContent = item.emoji || '⭐';
        
        let c = item.category || 'custom';
        const colors_light = {
            amor: 'text-brand-500 bg-brand-50 border-white',
            salud: 'text-green-500 bg-green-50 border-white',
            trabajo: 'text-blue-500 bg-blue-50 border-white',
            personal: 'text-orange-500 bg-orange-50 border-white',
            mascota: 'text-purple-500 bg-purple-50 border-white',
            custom: 'text-slate-600 bg-slate-100 border-white'
        };
        const colors_dark = {
            amor: 'dark:text-brand-400 dark:bg-red-950/30 dark:border-slate-900',
            salud: 'dark:text-green-400 dark:bg-green-950/30 dark:border-slate-900',
            trabajo: 'dark:text-blue-400 dark:bg-blue-950/30 dark:border-slate-900',
            personal: 'dark:text-orange-400 dark:bg-orange-950/30 dark:border-slate-900',
            mascota: 'dark:text-purple-400 dark:bg-purple-950/30 dark:border-slate-900',
            custom: 'dark:text-slate-300 dark:bg-slate-800 dark:border-slate-900'
        };

        this.els.detailEmojiBox.className = `w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-sm mb-4 border-4 z-10 ${colors_light[c] || colors_light.custom} ${colors_dark[c] || colors_dark.custom}`;

        if (item.anecdote && item.anecdote.trim() !== '') {
            this.els.detailAnecdoteBox.classList.remove('hidden');
            this.els.detailAnecdoteText.textContent = item.anecdote;
        } else {
            this.els.detailAnecdoteBox.classList.add('hidden');
            this.els.detailAnecdoteText.textContent = '';
        }

        const info = this.parseDateMath(item.date, item.recurrence || 'none');
        
        // BIG COUNTER: ALWAYS the difference to the ORIGIN date.
        // It's the only way to say "Tengo 25 años de edad" or "Fideo lleva 10 meses con nosotros".
        const isFutureOrigin = info.isFuture;
        
        if (isFutureOrigin) {
            this.els.detailSubtitle.textContent = "Cuenta regresiva histórica";
            this.els.detailExactPrefix.textContent = "Faltan:";
            this.els.detailExactSuffix.textContent = "para el gran día.";
        } else {
            this.els.detailSubtitle.textContent = item.recurrence !== 'none' ? "Edad / Tiempo transcurrido" : "Tiempo histórico";
            this.els.detailExactPrefix.textContent = "Resumen de vida:";
            this.els.detailExactSuffix.textContent = "";
        }

        const updateCounter = (forceRegenMessage = false) => {
            const now = dayjs();
            const origEvent = dayjs(info.origDate);
            const a = isFutureOrigin ? origEvent : now;
            const b = isFutureOrigin ? now : origEvent;
            
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

            let start = b;
            let end = a;
            
            let exactYears = end.diff(start, 'year'); start = start.add(exactYears, 'year');
            let exactMonths = end.diff(start, 'month'); start = start.add(exactMonths, 'month');
            let exactDays = end.diff(start, 'day'); start = start.add(exactDays, 'day');
            let exactHours = end.diff(start, 'hour'); start = start.add(exactHours, 'hour');
            let exactMinutes = end.diff(start, 'minute'); start = start.add(exactMinutes, 'minute');
            let exactSeconds = end.diff(start, 'second');

            let parts = [];
            if (exactYears > 0) parts.push(`${exactYears} ${exactYears === 1 ? 'año' : 'años'}`);
            if (exactMonths > 0) parts.push(`${exactMonths} ${exactMonths === 1 ? 'mes' : 'meses'}`);
            if (exactDays > 0) parts.push(`${exactDays} ${exactDays === 1 ? 'día' : 'días'}`);
            if (exactHours > 0) parts.push(`${exactHours} ${exactHours === 1 ? 'hr' : 'hrs'}`);
            if (exactMinutes > 0) parts.push(`${exactMinutes} ${exactMinutes === 1 ? 'min' : 'mins'}`);
            if (parts.length > 0 || exactSeconds >= 0) {
                parts.push(`${exactSeconds}s`);
            }

            let exactStr = "";
            if (parts.length > 1) {
                const lastToken = parts.pop();
                exactStr = parts.join(', ') + ' y ' + lastToken;
            } else {
                exactStr = parts[0];
            }
            this.els.detailExactTime.textContent = exactStr;

            // Recurrent Extra Box (The Countdown)
            if (item.recurrence !== 'none') {
                this.els.detailNextBox.classList.remove('hidden');
                
                // If it's recurrent, info.nextDate has the literal NEXT OCCURRENCE based on now.
                const missingDays = info.nextDate.diff(now.startOf('day'), 'day');
                
                let nextTxt = "";
                if (missingDays === 0) nextTxt = "¡Es hoy! 🎉";
                else if (missingDays === 1) nextTxt = "Mañana ⏳";
                else nextTxt = `en ${missingDays} d`;
                
                this.els.detailNextDays.textContent = nextTxt;
            } else {
                this.els.detailNextBox.classList.add('hidden');
            }

            // Generative Texts Logic
            if (!this.els.whatsappMessage.dataset.userEdited || forceRegenMessage) {
                let anecTxt = item.anecdote ? `\n\n💬 PD: "${item.anecdote}"` : "";
                
                const variationsPast = [
                    `Qué locura. Ya han pasado ${total.toLocaleString('es-ES')} ${this.data.detailUnit} desde ${item.title}... cómo vuela el tiempo ✨ (Fueron exactamente ${exactStr}).${anecTxt} ${item.emoji}`,
                    `Hoy pensaba en ${item.title}. Han volado ${exactStr} desde entonces. Qué increíble. ${item.emoji}${anecTxt}`,
                    `Hace la asombrosa cantidad de ${total.toLocaleString('es-ES')} ${this.data.detailUnit} atrás celebramos ${item.title}. ¿Recuerdas? 🥹${anecTxt}`,
                    `Dato de vida: Han pasado ${exactStr} desde ${item.title}. Se siente como si hubiera sido ayer. ${item.emoji}${anecTxt}`
                ];

                const variationsFuture = [
                    `¡Ya no queda nada! Faltan ${total.toLocaleString('es-ES')} ${this.data.detailUnit} para ${item.title} 😱 (Exactamente ${exactStr}).${anecTxt} ${item.emoji}`,
                    `El tiempo corre. Faltan ${exactStr} reloj para ${item.title}. Prepárate 🚀${anecTxt}`,
                    `⏳ Cuenta regresiva: Solo nos separan ${total.toLocaleString('es-ES')} ${this.data.detailUnit} de ${item.title}.${anecTxt} ${item.emoji}`
                ];
                
                const arrayToUse = isFutureOrigin ? variationsFuture : variationsPast;
                const index = this.data.msgStyleIndex % arrayToUse.length;
                this.els.whatsappMessage.value = arrayToUse[index];
                
                if(forceRegenMessage) {
                    this.els.whatsappMessage.dataset.userEdited = 'false';
                }
            }
            
            this.els.whatsappMessage.oninput = () => {
                this.els.whatsappMessage.dataset.userEdited = 'true';
            };
        };

        this.forceDetailCounterUpdate = updateCounter;
        updateCounter();
        this.data.intervalId = setInterval(() => updateCounter(false), 1000); 
    },

    sendWhatsapp() {
        const txt = this.els.whatsappMessage.value;
        const msg = encodeURIComponent(txt);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    },

    async setupNotifications() {
        const item = this.data.dates.find(d => d.id === this.data.selectedDateId);
        if (!item) return;

        const info = this.parseDateMath(item.date, item.recurrence || 'none');
        const evTime = info.nextDate; 
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
DESCRIPTION:¡Notificación inteligente de Tikk PWA! ${item.anecdote ? 'Detalle: '+item.anecdote : ''}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:¡Llegó la hora de ${item.title}!
TRIGGER:-PT0M
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Mañana: ${item.title}
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
                    text: 'Agrega este recordatorio con alarma sonora nativa.'
                });
            } else {
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

    acquireLocation() {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización.');
            return;
        }

        const btn = document.querySelector('#geo-prompt-box button');
        const originalText = btn.textContent;
        btn.innerHTML = `Analizando...`;
        
        navigator.geolocation.getCurrentPosition((pos) => {
            this.data.coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };
            this.els.geoPromptBox.classList.add('hidden');
            this.generateInspirationCards();
        }, (err) => {
            alert('Acepta el acceso a GPS para escanear diamantes locales.');
            btn.textContent = originalText;
        });
    },

    generateInspirationCards() {
        if (!this.data.coords) return;
        this.els.inspirationGrid.classList.remove('hidden');
        this.els.inspirationGrid.innerHTML = '';
        
        const terms = [
            { t: "Cenas Románticas", ic: "🍽️", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-400" },
            { t: "Aventuras al Aire Libre", ic: "🌳", bg: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40 text-green-800 dark:text-green-400" },
            { t: "Tiendas Secretas", ic: "🛍️", bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40 text-purple-800 dark:text-purple-400" },
            { t: "Cafeterías Únicas", ic: "☕", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40 text-orange-800 dark:text-orange-400" },
            { t: "Bares y Copas", ic: "🍷", bg: "bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-800 text-white dark:text-slate-300" },
            { t: "Arte y Teatros", ic: "🎨", bg: "bg-brand-50 dark:bg-brand-950/30 border-brand-100 dark:border-brand-900/40 text-brand-800 dark:text-brand-400" }
        ];

        terms.forEach(c => {
            const url = `https://www.google.com/maps/search/${encodeURIComponent(c.t)}/@${this.data.coords.lat},${this.data.coords.lng},14z/data=!3m1!4b1!4m2!2m1!6e5`;
            const card = `<a href="${url}" target="_blank" class="${c.bg} border rounded-2xl p-5 flex items-center justify-between shadow-sm active:scale-95 transition-all outline-none">
                <div class="flex items-center gap-4">
                    <span class="text-3xl drop-shadow-sm">${c.ic}</span>
                    <span class="font-bold leading-tight">${c.t}</span>
                </div>
                <svg class="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
            </a>`;
            this.els.inspirationGrid.innerHTML += card;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => window.app.init());