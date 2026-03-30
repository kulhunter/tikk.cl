/**
 * Tikk - PWA Logic
 * Arquitectura SPA Vanilla JS usando LocalStorage
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
            text: "Celebra y mide con exactitud el tiempo desde tus momentos más hermosos.",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`
        },
        {
            title: "Calcula todo",
            text: "Mira crecer los minutos desde tu aniversario, o averigua exactamente cuánto falta para ese cumpleaños especial.",
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>`
        },
        {
            title: "WhatsApp y Eventos",
            text: "Envía mensajes épicos uniendo la matemática con el corazón, y guarda recordatorios en tu calendario nativo.",
            icon: `<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />`
        }
    ],

    init() {
        this.loadData();
        this.cacheDOM();
        this.bindEvents();
        this.renderDashboard();
        
        const onboarded = localStorage.getItem('tikk_onboarded_2');
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
            mainHeader: document.getElementById('main-header'),
            mainNav: document.getElementById('main-nav'),
            datesList: document.getElementById('dates-list'),
            emptyState: document.getElementById('empty-state'),
            formAdd: document.getElementById('form-add'),
            inputTitle: document.getElementById('input-title'),
            inputDate: document.getElementById('input-date'),
            inputAnnual: document.getElementById('input-annual'),
            headerTitle: document.getElementById('header-title'),
            btnBack: document.getElementById('btn-back'),
            navBtns: document.querySelectorAll('.nav-btn'),
            
            // Detail elements
            detailCounter: document.getElementById('detail-counter'),
            detailTitle: document.getElementById('detail-title'),
            detailDate: document.getElementById('detail-date'),
            detailSubtitle: document.getElementById('detail-subtitle'),
            detailUnitSelector: document.getElementById('detail-unit-selector'),
            detailExactTime: document.getElementById('detail-exact-time'),
            detailExactPrefix: document.getElementById('detail-exact-prefix'),
            detailExactSuffix: document.getElementById('detail-exact-suffix'),
            detailNextBox: document.getElementById('detail-next-box'),
            detailNextDays: document.getElementById('detail-next-days'),
            detailCardBlob: document.getElementById('detail-card-blob'),
            whatsappMessage: document.getElementById('whatsapp-message'),
            
            // Onboarding 
            onboardingTitle: document.getElementById('onboarding-title'),
            onboardingText: document.getElementById('onboarding-text'),
            onboardingIcon: document.getElementById('onboarding-icon'),
            onboardingBtn: document.getElementById('onboarding-btn')
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
            localStorage.setItem('tikk_onboarded_2', 'true');
            this.navigate('dashboard');
        }
    },

    renderOnboarding() {
        const slide = this.onboardingData[this.data.onboardingSlide];
        this.els.onboardingIcon.style.opacity = '0';
        this.els.onboardingTitle.style.opacity = '0';
        this.els.onboardingText.style.opacity = '0';
        
        setTimeout(() => {
            this.els.onboardingIcon.innerHTML = `<svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">${slide.icon}</svg>`;
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
                if (i === this.data.onboardingSlide) {
                    dot.className = "h-2 w-6 rounded-full bg-rose-500 transition-all duration-300";
                } else {
                    dot.className = "h-2 w-2 rounded-full bg-slate-200 transition-all duration-300";
                }
            }
        }, 150);
    },

    parseYearsPassed(eventDateStr, isAnnual) {
        let date = dayjs(eventDateStr);
        let now = dayjs();
        
        if (isAnnual) {
            let next = date.year(now.year());
            if (next.isBefore(now, 'day')) {
                next = next.add(1, 'year');
            }
            return {
                isFuture: next.isAfter(now),
                years: next.diff(date, 'year'),
                nextDate: next
            };
        }
        
        const isFuture = date.isAfter(now);
        const years = Math.abs(now.diff(date, 'year'));
        return { isFuture, years, nextDate: date };
    },

    saveDate() {
        const title = this.els.inputTitle.value.trim();
        const dateStr = this.els.inputDate.value;
        const isAnnual = this.els.inputAnnual.checked;

        if (!title || !dateStr) {
            alert("Por favor, ponle un nombre y elige una fecha.");
            return;
        }

        const newDate = {
            id: Date.now().toString(),
            title,
            date: dateStr,
            isAnnual,
            createdAt: new Date().toISOString()
        };

        this.data.dates.push(newDate);
        this.saveToStorage();
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
        if (!this.views[viewName]) return;

        if (this.data.intervalId) {
            clearInterval(this.data.intervalId);
            this.data.intervalId = null;
        }

        if (viewName === 'onboarding') {
            this.els.mainHeader.classList.add('hidden');
            this.els.mainNav.classList.add('hidden');
        } else {
            this.els.mainHeader.classList.remove('hidden');
            this.els.mainNav.classList.remove('hidden');
            
            if (viewName === 'dashboard' || viewName === 'settings') {
                this.els.btnBack.classList.add('hidden');
                this.els.btnBack.classList.remove('flex');
                this.els.headerTitle.textContent = viewName === 'dashboard' ? 'Tikk' : 'Acerca de Tikk';
            } else {
                this.els.btnBack.classList.remove('hidden');
                this.els.btnBack.classList.add('flex');
                this.els.headerTitle.textContent = viewName === 'add' ? 'Crear' : 'Detalle';
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
                }, 300);
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
                btn.classList.remove('text-slate-400', 'hover:text-slate-600');
            } else {
                btn.classList.remove('text-rose-500');
                btn.classList.add('text-slate-400', 'hover:text-slate-600');
            }
        });

        if (viewName === 'detail' && this.data.selectedDateId) {
            this.startDetailCounter();
        }

        this.data.currentView = viewName;
    },

    renderDashboard() {
        // Sort chronologically by original date
        this.data.dates.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (this.data.dates.length === 0) {
            this.els.emptyState.classList.remove('hidden');
            this.els.datesList.innerHTML = '';
            return;
        }

        this.els.emptyState.classList.add('hidden');
        this.els.datesList.innerHTML = '';

        this.data.dates.forEach(item => {
            const timeData = this.parseYearsPassed(item.date, item.isAnnual);
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
                    <span class="text-2xl font-black ${timeData.isFuture && !item.isAnnual ? 'text-blue-500' : 'text-rose-500'} tracking-tighter block leading-none">${timeData.years}</span>
                    <span class="text-[10px] font-bold ${timeData.isFuture && !item.isAnnual ? 'text-blue-300' : 'text-rose-300'} uppercase tracking-widest mt-1 block">Años</span>
                </div>
            `;
            
            this.els.datesList.appendChild(card);
        });
    },

    updateDetailUnit() {
        this.data.detailUnit = this.els.detailUnitSelector.value;
        this.forceDetailCounterUpdate();
    },

    forceDetailCounterUpdate: null,

    startDetailCounter() {
        const dateItem = this.data.dates.find(d => d.id === this.data.selectedDateId);
        if (!dateItem) {
            this.navigate('dashboard');
            return;
        }

        this.els.headerTitle.textContent = dateItem.title;
        this.els.detailTitle.textContent = dateItem.title;
        this.els.detailDate.textContent = dayjs(dateItem.date).format('D [de] MMMM, YYYY');
        
        const nowInitial = dayjs();
        const targetDate = dayjs(dateItem.date);
        const isFutureGlobal = targetDate.isAfter(nowInitial);

        if (isFutureGlobal) {
            this.els.detailSubtitle.textContent = "Faltan exactamente";
            this.els.detailCardBlob.classList.replace('bg-slate-100', 'bg-blue-100');
            this.els.detailSubtitle.classList.replace('text-rose-500', 'text-blue-500');
            this.els.detailExactPrefix.textContent = "Faltan";
            this.els.detailExactSuffix.textContent = "para esa fecha.";
        } else {
            this.els.detailSubtitle.textContent = "Ya han pasado";
            this.els.detailCardBlob.classList.replace('bg-blue-100', 'bg-slate-100');
            this.els.detailSubtitle.classList.replace('text-blue-500', 'text-rose-500');
            this.els.detailExactPrefix.textContent = "Han pasado";
            this.els.detailExactSuffix.textContent = "desde esa fecha.";
        }

        const updateCounter = () => {
            const now = dayjs();
            const pastGlobal = dayjs(dateItem.date);
            const isFuture = pastGlobal.isAfter(now);
            
            // Giant Counter logic (Total unit limit)
            let totalVal = 0;
            const diffTarget = isFuture ? pastGlobal : now;
            const diffStart = isFuture ? now : pastGlobal;
            
            switch(this.data.detailUnit) {
                case 'segundos': totalVal = diffTarget.diff(diffStart, 'second'); break;
                case 'minutos': totalVal = diffTarget.diff(diffStart, 'minute'); break;
                case 'horas': totalVal = diffTarget.diff(diffStart, 'hour'); break;
                case 'días': totalVal = diffTarget.diff(diffStart, 'day'); break;
                case 'semanas': totalVal = diffTarget.diff(diffStart, 'week'); break;
                case 'meses': totalVal = diffTarget.diff(diffStart, 'month'); break;
                case 'años': totalVal = diffTarget.diff(diffStart, 'year'); break;
                default: totalVal = diffTarget.diff(diffStart, 'minute');
            }
            
            this.els.detailCounter.textContent = totalVal.toLocaleString('es-ES');

            // Exact breakdown builder
            let temp = diffStart;
            let years = diffTarget.diff(temp, 'year');
            temp = temp.add(years, 'year');
            let months = diffTarget.diff(temp, 'month');
            temp = temp.add(months, 'month');
            let days = diffTarget.diff(temp, 'day');
            temp = temp.add(days, 'day');
            let hours = diffTarget.diff(temp, 'hour');
            temp = temp.add(hours, 'hour');
            let minutes = diffTarget.diff(temp, 'minute');
            
            let parts = [];
            if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
            if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
            if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
            if (parts.length > 0 || minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
            if (parts.length === 0) parts.push("0 minutos");
            
            let exactStr = "";
            if (parts.length > 1) {
                const last = parts.pop();
                exactStr = parts.join(', ') + ' y ' + last;
            } else {
                exactStr = parts[0];
            }
            this.els.detailExactTime.textContent = exactStr;

            // Handle annual recurrence display
            if (dateItem.isAnnual && !isFutureGlobal) {
                this.els.detailNextBox.classList.remove('hidden');
                let next = dayjs(dateItem.date).year(now.year());
                if (next.isBefore(now, 'day')) {
                    next = next.add(1, 'year');
                }
                const daysToNext = next.diff(now.startOf('day'), 'day');
                this.els.detailNextDays.textContent = `${daysToNext} ${daysToNext === 1 ? 'día' : 'días'}`;
            } else {
                this.els.detailNextBox.classList.add('hidden');
            }

            // WhatsApp Message Box
            const verb = isFutureGlobal ? "Falta" : "Han pasado";
            const verbSec = isFutureGlobal ? "para" : "desde";
            const defaultTxt = `${verb} exactamente un total de ${totalVal.toLocaleString('es-ES')} ${this.data.detailUnit} (${exactStr}) ${verbSec} ${dateItem.title}... ¡Qué locura cómo vuela el tiempo! 🤯❤️`;
            
            // Only update whatsapp textarea if user hasn't typed anything custom!
            // We use a custom attribute to track if user edited it
            if (!this.els.whatsappMessage.dataset.custom) {
                this.els.whatsappMessage.value = defaultTxt;
            }
            
            this.els.whatsappMessage.oninput = () => {
                this.els.whatsappMessage.dataset.custom = 'true';
            };
        };

        this.forceDetailCounterUpdate = updateCounter;
        updateCounter();
        this.data.intervalId = setInterval(updateCounter, 1000); // 1s interval because of seconds option
    },

    sendWhatsapp() {
        const msg = this.els.whatsappMessage.value;
        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    },

    downloadICS() {
        const dateItem = this.data.dates.find(d => d.id === this.data.selectedDateId);
        if (!dateItem) return;
        
        const now = dayjs();
        let target = dayjs(dateItem.date);
        let summary = dateItem.title;

        if (dateItem.isAnnual) {
            target = target.year(now.year());
            if (target.isBefore(now, 'day')) {
                target = target.add(1, 'year');
            }
        }

        const formatICSDate = (d) => d.format('YYYYMMDDTHHmmss');
        const dtstart = formatICSDate(target);
        const dtend = formatICSDate(target.add(1, 'hour')); // Default 1 hr event
        const stamp = formatICSDate(now);

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tikk PWA//ES
BEGIN:VEVENT
UID:${dateItem.id}@tikk.cl
DTSTAMP:${stamp}Z
DTSTART:${dtstart}Z
DTEND:${dtend}Z
SUMMARY:${summary}
DESCRIPTION:¡Momento registrado en Tikk!
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:¡Falta 1 mes para ${summary}!
TRIGGER:-P4W
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:¡Falta 1 semana para ${summary}!
TRIGGER:-P1W
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:¡Falta 1 día para ${summary}!
TRIGGER:-P1D
END:VALARM
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${summary.replace(/\\s+/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

document.addEventListener('DOMContentLoaded', () => window.app.init());