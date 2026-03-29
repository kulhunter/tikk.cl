import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { 
  Plus, ChevronLeft, Trash2, Share, MessageCircle, 
  History, Edit2, Smartphone, RefreshCw, LayoutTemplate, Palette, Sparkles, ExternalLink, Bell
} from 'lucide-react';
import './index.css';

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
  if (months < 0) { years -= 1; months += 12; }
  let hours = end.getHours() - start.getHours();
  let mins = end.getMinutes() - start.getMinutes();
  if (mins < 0) { hours -= 1; mins += 60; }
  if (hours < 0) { days -= 1; hours += 24; }
  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    if (months < 0) { years -= 1; months += 12; }
  }
  let nextAnniversary = new Date(target);
  nextAnniversary.setFullYear(now.getFullYear());
  if (nextAnniversary < now) nextAnniversary.setFullYear(now.getFullYear() + 1);
  const nextNumber = nextAnniversary.getFullYear() - target.getFullYear();
  const daysToNext = Math.ceil(Math.abs(nextAnniversary - now) / (1000 * 60 * 60 * 24));
  return { isPast, years, months, days, hours, mins, nextAnniversary, daysToNext, nextNumber };
};

const pad = (num) => num.toString().padStart(2, '0');
const getContrastColor = (hex) => {
  if (!hex) return '#FFFFFF';
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#000000' : '#FFFFFF';
};

const getStatusColor = (isPast, textColor) => textColor === '#000000' ? (isPast ? '#000000' : '#00A040') : (isPast ? '#FFFFFF' : '#00FF00');

export default function App() {
  const [view, setView] = useState('list');
  const [globalBg, setGlobalBg] = useState(() => localStorage.getItem('tikk_globalBg') || '#050505');
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [milestones, setMilestones] = useState(() => {
    const saved = localStorage.getItem('tikk_milestones');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Matrimonio', person: 'Val', relationship: 'partner', emoji: '💍', bg: '#111111', date: new Date(Date.now() - 100000000000).toISOString() },
      { id: '2', title: 'Nacimiento', person: 'Lucía', relationship: 'child', emoji: '🍼', bg: '#F8F4F0', date: new Date(Date.now() - 400000000000).toISOString() }
    ];
  });

  useEffect(() => { localStorage.setItem('tikk_globalBg', globalBg); }, [globalBg]);
  useEffect(() => { localStorage.setItem('tikk_milestones', JSON.stringify(milestones)); }, [milestones]);

  const globalText = getContrastColor(globalBg);
  const activeM = milestones.find(m => m.id === activeMilestoneId);

  return (
    <div className="min-h-screen w-full transition-colors duration-500" style={{ backgroundColor: globalBg, color: globalText }}>
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <ListView 
            key="list"
            milestones={milestones} 
            globalBg={globalBg} 
            setGlobalBg={setGlobalBg} 
            globalText={globalText} 
            onCreate={() => {setActiveMilestoneId(null); setView('form')}} 
            onSelect={(id) => {setActiveMilestoneId(id); setView('detail')}} 
            onEdit={(id) => {setActiveMilestoneId(id); setView('form')}} 
            onDelete={setItemToDelete} 
          />
        )}
        {view === 'form' && (
          <FormView 
            key="form"
            milestone={activeM} 
            globalText={globalText} 
            globalBg={globalBg} 
            onCancel={() => setView('list')} 
            onSave={(data) => {
              if (activeMilestoneId) setMilestones(milestones.map(m => m.id === activeMilestoneId ? {...m, ...data} : m));
              else setMilestones([...milestones, {...data, id: Date.now().toString()}]);
              setView('list');
            }} 
          />
        )}
        {view === 'detail' && (
          <DetailView 
            key="detail"
            milestone={activeM} 
            onBack={() => setView('list')} 
            onEdit={() => setView('form')} 
            onDelete={() => setItemToDelete(activeMilestoneId)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4" onClick={() => setItemToDelete(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[#111111] rounded-[32px] p-6 text-center border border-white/10">
              <h3 className="text-xl font-serif italic mb-2 text-white">¿Eliminar ficha?</h3>
              <button onClick={() => {setMilestones(milestones.filter(m => m.id !== itemToDelete)); setItemToDelete(null); setView('list');}} className="w-full bg-red-600/20 text-red-500 py-4 rounded-2xl mb-3 border border-red-500/30">Eliminar</button>
              <button onClick={() => setItemToDelete(null)} className="w-full bg-white text-black py-4 rounded-2xl">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ListView({ milestones, globalBg, setGlobalBg, globalText, onCreate, onSelect, onEdit, onDelete }) {
  const colorRef = useRef(null);
  const btnStyle = globalText === '#000000' ? 'bg-black/5' : 'bg-white/5';
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-6 max-w-md mx-auto">
      <header className="flex justify-between items-center py-8">
        <div><h1 className="text-4xl font-black tracking-tighter">TIKK.</h1><p className="text-[9px] font-mono tracking-widest opacity-60">TIMELINE</p></div>
        <div className="flex gap-3">
          <button onClick={() => colorRef.current.click()} className={`w-12 h-12 rounded-full border flex items-center justify-center ${btnStyle}`}><Palette size={20}/></button>
          <input type="color" ref={colorRef} className="hidden" value={globalBg} onChange={e => setGlobalBg(e.target.value)} />
          <button onClick={onCreate} className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl" style={{ backgroundColor: globalText, color: globalBg }}><Plus size={28}/></button>
        </div>
      </header>
      <div className="space-y-4">
        {milestones.map(m => (
          <div key={m.id} onClick={() => onSelect(m.id)} className="p-6 rounded-[24px] border border-white/10 cursor-pointer relative overflow-hidden" style={{ backgroundColor: m.bg || '#111111', color: getContrastColor(m.bg) }}>
             <div className="flex items-center gap-4">
               <span className="text-4xl">{m.emoji}</span>
               <div>
                 <h3 className="text-xl font-serif italic">{m.title}</h3>
                 <p className="text-[10px] font-mono opacity-70">DE {m.person?.toUpperCase()}</p>
               </div>
             </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function FormView({ milestone, globalText, globalBg, onCancel, onSave }) {
  const [title, setTitle] = useState(milestone?.title || '');
  const [person, setPerson] = useState(milestone?.person || '');
  const [date, setDate] = useState(milestone?.date ? new Date(milestone.date).toISOString().slice(0, 16) : '');
  const [bg, setBg] = useState(milestone?.bg || '#111111');
  const [emoji, setEmoji] = useState(milestone?.emoji || '✨');

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="p-6 max-w-md mx-auto min-h-screen flex flex-col">
      <header className="flex justify-between items-center py-6">
        <button onClick={onCancel} className="p-2 rounded-full border border-white/10 flex items-center justify-center"><ChevronLeft/></button>
        <span className="font-mono text-[10px] tracking-widest uppercase">Ficha</span>
        <div className="w-10"/>
      </header>
      <div className="space-y-6 flex-1">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título..." className="w-full bg-transparent text-3xl font-serif italic outline-none border-b border-white/10 pb-2" />
        <input type="text" value={person} onChange={e => setPerson(e.target.value)} placeholder="Persona..." className="w-full bg-transparent border border-white/10 p-4 rounded-2xl outline-none" />
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-transparent border border-white/10 p-4 rounded-2xl outline-none" style={{ colorScheme: 'dark' }} />
        <div className="flex items-center justify-between p-4 border border-white/10 rounded-2xl">
          <span className="text-xs font-mono opacity-60 uppercase">Color de fondo</span>
          <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-10 h-10 rounded-full border-none" />
        </div>
      </div>
      <button onClick={() => onSave({ title, person, date: new Date(date).toISOString(), bg, emoji })} className="w-full py-4 rounded-2xl font-bold mt-8 shadow-lg" style={{ backgroundColor: globalText, color: globalBg }}>GUARDAR</button>
    </motion.div>
  );
}

function DetailView({ milestone, onBack, onEdit, onDelete }) {
  const [t, setT] = useState(calculateTimeDiff(milestone.date));
  useEffect(() => { const i = setInterval(() => setT(calculateTimeDiff(milestone.date)), 1000); return () => clearInterval(i); }, [milestone]);
  const contrast = getContrastColor(milestone.bg);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="min-h-screen flex flex-col p-6" style={{ backgroundColor: milestone.bg, color: contrast }}>
      <header className="flex justify-between py-6">
        <button onClick={onBack} className="p-3 rounded-full border border-white/10 flex items-center justify-center"><ChevronLeft/></button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-3 rounded-full border border-white/10 flex items-center justify-center"><Edit2 size={18}/></button>
          <button onClick={onDelete} className="p-3 rounded-full border border-white/10 text-red-400 flex items-center justify-center"><Trash2 size={18}/></button>
        </div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <span className="text-8xl mb-6">{milestone.emoji}</span>
        <h2 className="text-5xl font-serif italic mb-2">{milestone.title}</h2>
        <p className="text-xl opacity-80 mb-12">de {milestone.person}</p>
        <div className="flex gap-8">
          <div className="flex flex-col"><span className="text-6xl font-mono">{pad(t.years)}</span><span className="text-[10px] uppercase tracking-widest opacity-60">Años</span></div>
          <div className="flex flex-col"><span className="text-6xl font-mono">{pad(t.months)}</span><span className="text-[10px] uppercase tracking-widest opacity-60">Meses</span></div>
          <div className="flex flex-col"><span className="text-6xl font-mono">{pad(t.days)}</span><span className="text-[10px] uppercase tracking-widest opacity-60">Días</span></div>
        </div>
      </div>
    </motion.div>
  );
}
// ... (manten todo el código que ya tienes arriba)

// PEGA ESTO AL FINAL DE TU ARCHIVO App.jsx
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);