import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { 
  Plus, ChevronLeft, Trash2, Share, MessageCircle, 
  History, Edit2, Smartphone, RefreshCw, LayoutTemplate, Palette, Sparkles, ExternalLink, Bell
} from 'lucide-react';

// ==========================================
// 1. UTILIDADES Y LÓGICA DE TIEMPO AVANZADA
// ==========================================
const calculateTimeDiff = (targetDateStr) => {
  const now = new Date();
  const target = new Date(targetDateStr);
  
  if (isNaN(target.getTime())) return null;

  const isPast = now > target;
  let start = isPast ? target : now;
  let end = isPast ? now : target;

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) { 
    years -= 1; 
    months += 12; 
  }

  let hours = end.getHours() - start.getHours();
  let mins = end.getMinutes() - start.getMinutes();
  
  if (mins < 0) { hours -= 1; mins += 60; }
  if (hours < 0) { days -= 1; hours += 24; }
  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    if (months < 0) { years -= 1; months += 12; }
  }

  let nextAnniversary = null;
  let daysToNext = 0;
  let nextNumber = 0;

  if (isPast) {
    nextAnniversary = new Date(target);
    nextAnniversary.setFullYear(now.getFullYear());
    
    if (nextAnniversary < now) {
      nextAnniversary.setFullYear(now.getFullYear() + 1);
    }
    
    nextNumber = nextAnniversary.getFullYear() - target.getFullYear();
    const diffTime = Math.abs(nextAnniversary - now);
    daysToNext = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else {
    const diffTime = Math.abs(target - now);
    daysToNext = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return { isPast, years, months, days, hours, mins, nextAnniversary, daysToNext, nextNumber };
};

const pad = (num) => num.toString().padStart(2, '0');

// Contraste automático (Blanco o Negro dependiendo del fondo elegido)
const getContrastColor = (hexcolor) => {
  if (!hexcolor) return '#FFFFFF';
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

const getStatusColor = (isPast, textColor) => {
  if (textColor === '#000000') return isPast ? '#000000' : '#00A040';
  return isPast ? '#FFFFFF' : '#00FF00';
};

const getEventLabel = (title) => {
  const t = title.toLowerCase();
  if (t.includes('naci')) return 'cumpleaños';
  if (t.includes('matrimonio') || t.includes('boda') || t.includes('novios')) return 'aniversario';
  return 'aniversario';
};

// ==========================================
// 2. BASE DE DATOS LOCAL
// ==========================================
const RELATIONSHIPS = [
  { id: 'partner', label: 'Mi Pareja' },
  { id: 'child', label: 'Mi Hijo/a' },
  { id: 'family', label: 'Familia' },
  { id: 'self', label: 'Meta Personal' },
  { id: 'other', label: 'General' }
];

const NOTIFICATIONS = [
  { id: 'none', label: 'Sin notificación' },
  { id: '1d', label: '1 día antes' },
  { id: '1w', label: '1 semana antes' },
  { id: '1m', label: '1 mes antes' }
];

const BLOG_IDEAS = {
  partner: [
    { title: "10 citas inolvidables en tu ciudad", url: "#" },
    { title: "Ideas de regalos con significado", url: "#" }
  ],
  child: [
    { title: "Lugares mágicos para celebrar su cumpleaños", url: "#" },
    { title: "Cómo atesorar las fotos familiares", url: "#" }
  ],
  default: [
    { title: "Por qué medimos el tiempo: La psicología del recuerdo", url: "#" }
  ]
};

// ==========================================
// 3. MOTOR INTELIGENTE (REACCIONES Y MENSAJES)
// ==========================================
const generateReaction = (milestone, tDiff) => {
  if (!tDiff) return "";
  const { years, months, days, hours, isPast, daysToNext, nextNumber } = tDiff;
  
  if (!isPast) return "La anticipación también es parte de la magia.";

  const eventLabel = getEventLabel(milestone.title);
  const timeStr = `${years > 0 ? years + ' años, ' : ''}${months > 0 ? months + ' meses y ' : ''}${days} días`;
  const nextStr = `Faltan ${daysToNext} días para el ${eventLabel} N°${nextNumber}.`;

  if (milestone.relationship === 'partner') {
    return `Llevamos ${timeStr} compartiendo este hermoso viaje juntos. ${nextStr}`;
  }
  if (milestone.relationship === 'child') {
    return `A la fecha tiene ${timeStr} de vida llenando todo de alegría. ${nextStr}`;
  }
  if (milestone.relationship === 'self') {
    return `Increíble disciplina. Llevas ${timeStr} de esfuerzo continuo. ${nextStr}`;
  }
  return `Han pasado ${timeStr} desde este hito. ${nextStr}`;
};

const generateProposal = (milestone, tDiff) => {
  if (!tDiff) return [];
  const { years, months, days, isPast, daysToNext, nextNumber } = tDiff;
  const t = milestone.title || 'este día';
  const p = milestone.person || '';
  const rel = milestone.relationship;

  if (!isPast) return [`¡Ya casi! Solo faltan ${daysToNext} días para ${t} ${milestone.emoji}`];

  const eventLabel = getEventLabel(t);
  
  if (rel === 'partner') {
    return [
      `¡Hola mi amor! Llevamos exactamente ${years > 0 ? years + ' años y ' : ''}${months} meses desde nuestro ${t} ❤️. Ya faltan solo ${daysToNext} días para nuestro ${eventLabel} n°${nextNumber} ${milestone.emoji}`,
      `Te elegiría mil veces más. Ya son ${years} años y ${months} meses juntos. ¡Prepárate que en ${daysToNext} días es nuestro ${eventLabel}! ${milestone.emoji}`
    ];
  }
  if (rel === 'child') {
    return [
      `¡Qué rápido pasa el tiempo! Celebro con todo el corazón que ${p} ya tiene ${years} años y ${months} meses. Faltan ${daysToNext} días para su cumpleaños n°${nextNumber} ${milestone.emoji}`,
      `Parece que fue ayer. Ya han pasado ${years} años y ${months} meses desde el nacimiento de ${p}. ¡En ${daysToNext} días celebramos su cumple n°${nextNumber}! ${milestone.emoji}`
    ];
  }
  return [
    `¡Hola ${p}! Según Tikk.cl, a la fecha llevamos ${years} años y ${months} meses desde ${t}. Faltan ${daysToNext} días para el próximo ${eventLabel} n°${nextNumber} ${milestone.emoji}`
  ];
};

// ==========================================
// 4. COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [view, setView] = useState('list');
  const [globalBg, setGlobalBg] = useState(() => localStorage.getItem('tikk_globalBg') || '#050505');
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [milestones, setMilestones] = useState(() => {
    const saved = localStorage.getItem('tikk_milestones');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      { 
        id: '1', title: 'Matrimonio', person: 'Val', relationship: 'partner', emoji: '💍', bg: '#111111', notification: '1w',
        date: new Date(new Date().getTime() - (86400000 * 16) - (86400000 * 30 * 1) - (86400000 * 365 * 3)).toISOString()
      },
      { 
        id: '2', title: 'Nacimiento', person: 'Lucía', relationship: 'child', emoji: '🍼', bg: '#F8F4F0', notification: '1m',
        date: new Date(new Date().getTime() - (86400000 * 23) - (86400000 * 30 * 6) - (86400000 * 365 * 11)).toISOString()
      }
    ];
  });

  useEffect(() => { localStorage.setItem('tikk_globalBg', globalBg); }, [globalBg]);
  useEffect(() => { localStorage.setItem('tikk_milestones', JSON.stringify(milestones)); }, [milestones]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const globalText = getContrastColor(globalBg);

  const goToList = () => { setView('list'); setActiveMilestoneId(null); };
  const goToForm = (id = null) => { setActiveMilestoneId(id); setView('form'); };
  const goToDetail = (id) => { setActiveMilestoneId(id); setView('detail'); };

  const saveMilestone = (data) => {
    if (activeMilestoneId) {
      setMilestones(milestones.map(m => m.id === activeMilestoneId ? { ...m, ...data } : m));
    } else {
      setMilestones([...milestones, { ...data, id: Date.now().toString() }]);
    }
    goToList();
  };

  const confirmDelete = (id) => setItemToDelete(id);
  const executeDelete = () => {
    setMilestones(milestones.filter(m => m.id !== itemToDelete));
    setItemToDelete(null);
    if (view === 'detail') goToList();
  };

  return (
    <div className="min-h-[100dvh] w-full font-sans transition-colors duration-500 relative selection:bg-black/20" style={{ backgroundColor: globalBg, color: globalText }}>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          {view === 'list' && <ListView key="list" milestones={milestones} globalBg={globalBg} setGlobalBg={setGlobalBg} globalText={globalText} onCreate={() => goToForm(null)} onEdit={goToForm} onSelect={goToDetail} onDelete={confirmDelete} />}
          {view === 'form' && <FormView key="form" milestone={milestones.find(m => m.id === activeMilestoneId)} globalText={globalText} globalBg={globalBg} onCancel={goToList} onSave={saveMilestone} />}
          {view === 'detail' && <DetailView key="detail" milestone={milestones.find(m => m.id === activeMilestoneId)} onBack={goToList} onEdit={() => goToForm(activeMilestoneId)} onDelete={() => confirmDelete(activeMilestoneId)} />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {itemToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setItemToDelete(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#111111] border border-white/10 rounded-[32px] p-6 pb-8 flex flex-col items-center text-center shadow-2xl">
              <div className="w-12 h-1 bg-white/20 rounded-full mb-6" />
              <h3 className="text-xl font-serif italic mb-2 text-white">¿Eliminar esta ficha?</h3>
              <p className="text-sm opacity-60 mb-8 font-mono text-white/80">Esta acción es irreversible.</p>
              <div className="w-full space-y-3">
                <button onClick={executeDelete} className="w-full bg-red-600/20 text-red-500 border border-red-500/50 py-4 rounded-2xl font-mono uppercase tracking-widest text-sm active:bg-red-600/40 transition-colors">Sí, eliminar</button>
                <button onClick={() => setItemToDelete(null)} className="w-full bg-white text-black py-4 rounded-2xl font-mono uppercase tracking-widest text-sm active:scale-[0.98] transition-transform">Mantener</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 5. VISTA: LISTA PRINCIPAL
// ==========================================
function ListView({ milestones, globalBg, setGlobalBg, globalText, onCreate, onEdit, onSelect, onDelete }) {
  const colorInputRef = useRef(null);
  
  // Clases seguras de transparencia para los botones superiores
  const isDark = globalText === '#000000';
  const btnStyle = isDark ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10';

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-[100dvh] flex flex-col p-6 max-w-md mx-auto relative">
      <header className="flex justify-between items-start py-8 mb-4">
        <div>
          <h1 className="text-[40px] leading-none font-black tracking-tighter uppercase font-sans">TIKK.</h1>
          <p className="text-[9px] font-mono tracking-[0.3em] opacity-60 uppercase mt-2">Personal Timeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => colorInputRef.current?.click()} className={`w-12 h-12 rounded-full border flex items-center justify-center active:scale-90 transition-transform ${btnStyle}`}>
            <Palette size={20} />
          </button>
          <input type="color" ref={colorInputRef} value={globalBg} onChange={(e) => setGlobalBg(e.target.value)} className="absolute opacity-0 w-0 h-0" />
          <button onClick={onCreate} className="w-14 h-14 flex items-center justify-center rounded-full shadow-lg active:scale-90 transition-transform" style={{ backgroundColor: globalText, color: globalBg }}>
            <Plus strokeWidth={2.5} size={28} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {milestones.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center mt-20 opacity-70 text-center px-4">
            <History size={32} strokeWidth={1} className="mb-6 opacity-50" />
            <p className="font-serif italic text-2xl leading-tight">El tiempo espera por ti.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <AnimatePresence>
              {milestones.map(m => (
                <MilestoneListItem key={m.id} milestone={m} onClick={() => onSelect(m.id)} onDelete={() => onDelete(m.id)} onEdit={() => onEdit(m.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MilestoneListItem({ milestone, onClick, onDelete, onEdit }) {
  const [tDiff, setTDiff] = useState(calculateTimeDiff(milestone.date));
  const x = useMotionValue(0);

  useEffect(() => {
    const timer = setInterval(() => setTDiff(calculateTimeDiff(milestone.date)), 1000);
    return () => clearInterval(timer);
  }, [milestone.date]);

  if (!tDiff) return null;

  const cardBg = milestone.bg || '#111111';
  const cardText = getContrastColor(cardBg);
  const statusColor = getStatusColor(tDiff.isPast, cardText);
  
  // Clases seguras y transparentes
  const isDark = cardText === '#000000';
  const containerStyle = isDark ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10';
  const badgeStyle = isDark ? 'bg-black/5 border-black/10' : 'bg-white/10 border-white/10';

  const displaySubtitle = milestone.person ? `DE ${milestone.person.toUpperCase()}` : null;

  return (
    <div className={`relative rounded-[24px] overflow-hidden border ${containerStyle}`}>
      <div className="absolute inset-0 flex justify-between items-center px-6 z-0">
        <div className="flex items-center gap-2 opacity-80" style={{ color: cardText }}><Edit2 size={20} /> <span className="font-mono text-xs uppercase tracking-widest">Editar</span></div>
        <div className="flex items-center gap-2 text-red-500"><span className="font-mono text-xs uppercase tracking-widest">Borrar</span> <Trash2 size={20} /></div>
      </div>
      
      <motion.div
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
        onDragEnd={(e, info) => { if (info.offset.x < -80) onDelete(); if (info.offset.x > 80) onEdit(); }}
        onClick={onClick}
        className="relative z-10 flex items-center p-6 cursor-pointer rounded-[24px] shadow-sm border border-transparent"
        style={{ x, backgroundColor: cardBg, color: cardText, borderColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full" style={{ backgroundColor: statusColor }} />
        <span className="text-4xl mr-5 ml-2 filter drop-shadow-sm">{milestone.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[22px] font-serif italic truncate leading-none mb-2 opacity-90">{milestone.title}</h3>
          
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-70 flex items-center gap-2">
            {displaySubtitle && <span className="truncate max-w-[80px] font-bold">{displaySubtitle}</span>}
            {displaySubtitle && <span>•</span>}
            <span className="font-bold">
              {tDiff.years > 0 ? `${tDiff.years}A ` : ''}{tDiff.months > 0 ? `${tDiff.months}M ` : ''}{tDiff.days}D
            </span>
          </p>
          
          {tDiff.isPast && (
            <div className={`mt-3 border py-1.5 px-3 rounded-lg flex items-center gap-2 w-max ${badgeStyle}`}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
              <p className="text-[8px] font-mono uppercase tracking-[0.1em] opacity-80">
                FALTAN {tDiff.daysToNext} DÍAS AL N°{tDiff.nextNumber}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 6. VISTA: FORMULARIO
// ==========================================
function FormView({ milestone, globalText, globalBg, onCancel, onSave }) {
  const [title, setTitle] = useState(milestone?.title || '');
  const [person, setPerson] = useState(milestone?.person || '');
  const [emoji, setEmoji] = useState(milestone?.emoji || '✨');
  const [relationship, setRelationship] = useState(milestone?.relationship || 'partner');
  const [notification, setNotification] = useState(milestone?.notification || '1w');
  const [bg, setBg] = useState(milestone?.bg || '#111111');
  const colorInputRef = useRef(null);
  
  const getLocalStr = (d) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch(e) { return ''; }
  };
  const [date, setDate] = useState(milestone ? getLocalStr(milestone.date) : '');

  const handleSave = () => {
    if (!title || !date) return;
    onSave({ title, person, emoji, relationship, bg, notification, date: new Date(date).toISOString() });
  };

  const cardText = getContrastColor(bg);
  const isDark = globalText === '#000000';
  const uiStyle = isDark ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10';
  const inputStyle = isDark ? 'border-black/20 focus-within:border-black/60' : 'border-white/20 focus-within:border-white/60';

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="min-h-[100dvh] flex flex-col p-6 max-w-md mx-auto relative z-20" style={{ backgroundColor: globalBg }}>
      <header className="flex justify-between items-center py-6 mb-2">
        <button onClick={onCancel} className={`w-11 h-11 flex items-center justify-center rounded-full border active:scale-95 transition-transform ${uiStyle}`}>
          <ChevronLeft strokeWidth={1.5} size={28} />
        </button>
        <h1 className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-80">{milestone ? 'Editar Ficha' : 'Nueva Ficha'}</h1>
        <div className="w-11" />
      </header>

      <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-32">
        <div className={`flex justify-between items-center p-4 rounded-2xl border ${uiStyle}`}>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Fondo de la Ficha</span>
          <button onClick={() => colorInputRef.current?.click()} className="flex items-center gap-2 text-xs font-serif italic px-4 py-2 rounded-full shadow-sm" style={{ backgroundColor: bg, color: cardText }}>
            <Palette size={14} /> Toca aquí
          </button>
          <input type="color" ref={colorInputRef} value={bg} onChange={e => setBg(e.target.value)} className="absolute opacity-0 w-0 h-0" />
        </div>

        <div className={`flex gap-4 items-end border-b pb-4 transition-colors ${inputStyle}`}>
          <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-16 text-5xl bg-transparent outline-none text-center" maxLength={2} placeholder="📸" />
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`flex-1 text-3xl font-serif italic bg-transparent outline-none pb-1 placeholder-current`} style={{ opacity: title ? 1 : 0.4 }} placeholder="Ej: Nacimiento..." />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 ml-1">¿Con quién es? (Opcional)</label>
          <input type="text" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Ej: Lucía, Val..." className={`w-full bg-transparent border rounded-2xl p-5 font-serif italic text-lg outline-none transition-colors ${inputStyle}`} />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 ml-1">Tipo de Relación</label>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIPS.map(rel => (
              <button 
                key={rel.id} onClick={() => setRelationship(rel.id)} 
                className={`px-4 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest border transition-all ${relationship === rel.id ? 'opacity-100' : 'opacity-40'}`}
                style={{ backgroundColor: relationship === rel.id ? globalText : 'transparent', color: relationship === rel.id ? globalBg : globalText, borderColor: globalText }}
              >
                {rel.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 ml-1">Fecha Inicial Exacta</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full bg-transparent border rounded-2xl p-5 font-mono text-sm outline-none transition-colors appearance-none ${inputStyle}`} style={{ colorScheme: isDark ? 'light' : 'dark' }} />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 ml-1 flex items-center gap-2"><Bell size={12}/> Activar Notificación</label>
          <div className={`flex gap-2 p-2 rounded-2xl border ${uiStyle}`}>
             {NOTIFICATIONS.map(n => (
                <button 
                  key={n.id} onClick={() => setNotification(n.id)}
                  className={`flex-1 text-[9px] font-mono uppercase py-3 rounded-xl transition-all ${notification === n.id ? 'font-bold' : 'opacity-60'}`}
                  style={{ backgroundColor: notification === n.id ? globalText : 'transparent', color: notification === n.id ? globalBg : globalText }}
                >
                  {n.label}
                </button>
             ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-6 right-6">
        <button onClick={handleSave} disabled={!title || !date} className="w-full py-4 rounded-2xl font-mono uppercase tracking-[0.2em] text-sm font-bold disabled:opacity-30 transition-all shadow-xl active:scale-[0.98]" style={{ backgroundColor: globalText, color: globalBg }}>
          {milestone ? 'Actualizar Ficha' : 'Guardar Ficha'}
        </button>
      </div>
    </motion.div>
  );
}

// ==========================================
// 7. VISTA: DETALLE (EL PÓSTER)
// ==========================================
function DetailView({ milestone, onBack, onEdit, onDelete }) {
  const [tDiff, setTDiff] = useState(calculateTimeDiff(milestone?.date || new Date()));
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!milestone) return;
    const timer = setInterval(() => setTDiff(calculateTimeDiff(milestone.date)), 1000);
    return () => clearInterval(timer);
  }, [milestone]);

  if (!milestone || !tDiff) return null;

  const bg = milestone.bg || '#111111';
  const textCol = getContrastColor(bg);
  const statusColor = getStatusColor(tDiff.isPast, textCol);
  
  const isDark = textCol === '#000000';
  const cardUiStyle = isDark ? 'border-black/10 bg-black/5' : 'border-white/10 bg-white/5';
  const btnSoftStyle = isDark ? 'bg-black/5' : 'bg-white/5';

  const appReaction = generateReaction(milestone, tDiff);
  const proposalOptions = generateProposal(milestone, tDiff);
  const currentProposal = proposalOptions[msgIndex % proposalOptions.length];
  const wpLink = `https://wa.me/?text=${encodeURIComponent(currentProposal)}`;

  const blogIdeas = BLOG_IDEAS[milestone.relationship] || BLOG_IDEAS.default;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }} 
      className="h-[100dvh] w-full relative overflow-y-auto no-scrollbar transition-colors duration-500" 
      style={{ backgroundColor: bg, color: textCol }}
    >
      <AnimatePresence>
        {!snapshotMode && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`sticky top-0 pt-8 pb-4 px-6 flex justify-between items-center z-20 pointer-events-auto`}>
            <button onClick={onBack} className={`w-12 h-12 flex items-center justify-center rounded-full border backdrop-blur-md active:scale-90 transition-transform ${cardUiStyle}`}><ChevronLeft strokeWidth={1.5} size={24} className="mr-1" /></button>
            <div className={`px-5 py-2 rounded-full border backdrop-blur-md ${cardUiStyle}`}>
               <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-90 font-bold">Tap en fondo para Snapshot</span>
            </div>
            <div className="w-12" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-[55vh] flex flex-col items-center justify-center px-6 cursor-pointer" onClick={() => setSnapshotMode(!snapshotMode)}>
        <div className="flex items-center gap-4 mb-6 mt-4">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 15px ${statusColor}` }} />
          <span className="font-mono text-xs tracking-[0.4em] uppercase opacity-80">{tDiff.isPast ? 'HAN PASADO' : 'FALTAN'}</span>
        </div>
        
        <div className="text-center w-full break-words">
          <span className="text-[80px] block mb-2 filter drop-shadow-xl">{milestone.emoji}</span>
          <h2 className="text-5xl md:text-6xl font-serif italic leading-tight">{milestone.title}</h2>
          {milestone.person && <p className="text-2xl font-serif italic mt-2 opacity-80">de {milestone.person}</p>}
        </div>

        {!snapshotMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-8 px-6 border py-5 w-full text-center rounded-3xl ${cardUiStyle}`}>
            <p className="font-serif text-sm opacity-90 italic leading-relaxed">"{appReaction}"</p>
          </motion.div>
        )}

        <div className="flex justify-center gap-8 w-full text-center mt-10 mb-8">
          <div className="flex flex-col items-center"><span className="font-mono text-6xl tracking-tighter tabular-nums">{pad(tDiff.years)}</span><span className="text-[10px] tracking-[0.3em] mt-4 uppercase opacity-60">Años</span></div>
          <div className="flex flex-col items-center"><span className="font-mono text-6xl tracking-tighter tabular-nums">{pad(tDiff.months)}</span><span className="text-[10px] tracking-[0.3em] mt-4 uppercase opacity-60">Meses</span></div>
          <div className="flex flex-col items-center"><span className="font-mono text-6xl tracking-tighter tabular-nums">{pad(tDiff.days)}</span><span className="text-[10px] tracking-[0.3em] mt-4 uppercase opacity-60">Días</span></div>
        </div>

        {snapshotMode && (
          <div className="mt-12 flex flex-col items-center opacity-60">
             <span className="text-[14px] font-sans font-black tracking-tighter uppercase mb-1">TIKK.</span>
             <span className="text-[8px] font-mono tracking-[0.4em] uppercase">Personal Timeline</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {!snapshotMode && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="px-6 pb-12 z-20 pointer-events-auto">
            
            <div className="mb-6">
               <span className="text-[9px] font-mono uppercase tracking-widest opacity-60 mb-3 block">Mensaje Sugerido de WhatsApp</span>
               <div className={`p-5 rounded-3xl flex items-start gap-4 relative border ${cardUiStyle}`}>
                 <p className="text-sm font-serif leading-relaxed opacity-90 italic pr-8">"{currentProposal}"</p>
                 <button onClick={() => setMsgIndex(prev => prev + 1)} className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full active:scale-90 transition-transform ${btnSoftStyle}`}>
                   <RefreshCw size={14} />
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-10">
              <button onClick={() => setSnapshotMode(true)} className="col-span-3 flex items-center justify-center gap-2 py-4 rounded-2xl font-mono uppercase tracking-[0.2em] text-xs font-bold active:scale-[0.98] transition-transform shadow-lg" style={{ backgroundColor: textCol, color: bg }}>
                <Share size={16} /> Póster Completo
              </button>
              <a href={wpLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center py-4 rounded-2xl bg-[#25D366] text-white active:scale-95 transition-transform shadow-lg border border-[#25D366]">
                <MessageCircle size={22} />
              </a>
            </div>

            <div className={`pt-6 border-t ${isDark ? 'border-black/10' : 'border-white/10'}`}>
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={14} className="opacity-60" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-80 font-bold">Ideas recomendadas en Tikk.cl</span>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                {blogIdeas.map((idea, idx) => (
                  <a key={idx} href={idea.url} className={`min-w-[220px] w-[220px] p-5 rounded-[24px] border flex flex-col gap-4 active:scale-[0.98] transition-transform ${cardUiStyle}`}>
                    <h4 className="font-serif italic text-base leading-snug opacity-90">{idea.title}</h4>
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 flex items-center gap-1 mt-auto">Leer Artículo <ExternalLink size={10} /></span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}