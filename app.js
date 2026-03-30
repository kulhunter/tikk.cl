// Base de datos local (LocalStorage)
let fechas = JSON.parse(localStorage.getItem('tikk_fechas')) || [];

// 1. NAVEGACIÓN SPA (Single Page Application)
function navegar(pantallaId) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(pantallaId).classList.add('activa');
    if (pantallaId === 'dashboard') renderizarDashboard();
}

// 2. GUARDAR FECHA
function guardarFecha() {
    const titulo = document.getElementById('input-titulo').value;
    const fecha = document.getElementById('input-fecha').value;
    
    if (!titulo || !fecha) {
        alert("¡Llena todos los campos!");
        return;
    }

    const nuevaFecha = {
        id: Date.now().toString(),
        titulo: titulo,
        fechaOriginal: fecha
    };

    fechas.push(nuevaFecha);
    localStorage.setItem('tikk_fechas', JSON.stringify(fechas));
    
    document.getElementById('input-titulo').value = '';
    document.getElementById('input-fecha').value = '';
    navegar('dashboard');
}

// 3. RENDERIZAR DASHBOARD
function renderizarDashboard() {
    const lista = document.getElementById('lista-fechas');
    lista.innerHTML = '';

    if (fechas.length === 0) {
        lista.innerHTML = '<p class="text-slate-400 text-center py-8">Aún no tienes fechas importantes guardadas. ¡Agrega una!</p>';
        return;
    }

    fechas.forEach(item => {
        // Usamos Day.js para los cálculos base
        const fechaPasada = dayjs(item.fechaOriginal);
        const hoy = dayjs();
        const anos = hoy.diff(fechaPasada, 'year');

        const card = document.createElement('article');
        card.className = "bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer active:scale-95 transition-transform";
        card.onclick = () => verDetalle(item.id);
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <span class="text-2xl bg-rose-50 p-2 rounded-full">✨</span>
                    <div>
                        <h3 class="font-bold text-lg text-slate-800">${item.titulo}</h3>
                        <p class="text-xs text-slate-500">${dayjs(item.fechaOriginal).format('DD / MM / YYYY')}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-black text-rose-600">${anos}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Años</p>
                </div>
            </div>
        `;
        lista.appendChild(card);
    });
}

// 4. VER DETALLE Y GENERAR MENSAJES (LA MAGIA)
function verDetalle(id) {
    const item = fechas.find(f => f.id === id);
    const fechaPasada = dayjs(item.fechaOriginal);
    const hoy = dayjs();
    
    // El cálculo exagerado y de valor (minutos)
    const minutos = hoy.diff(fechaPasada, 'minute').toLocaleString('es-CL');
    const anos = hoy.diff(fechaPasada, 'year');

    // Mensaje épico pre-armado
    const mensajeEmotivo = `Han pasado exactamente ${anos} años (¡que son ${minutos} minutos!) desde nuestro ${item.titulo}, y cada minuto ha valido totalmente la pena. ❤️`;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensajeEmotivo)}`;

    const contenedor = document.getElementById('detalle-contenido');
    contenedor.innerHTML = `
        <button onclick="navegar('dashboard')" class="text-slate-400 mb-4 font-semibold text-sm flex items-center gap-1">← Volver</button>
        <h2 class="text-2xl font-bold mb-1">${item.titulo}</h2>
        <p class="text-slate-500 mb-6">Inició el ${fechaPasada.format('DD/MM/YYYY')}</p>

        <div class="bg-rose-50 rounded-2xl p-6 text-center mb-6 shadow-inner border border-rose-100">
            <p class="text-xs text-rose-500 font-bold tracking-widest mb-2 uppercase">Han pasado exactamente</p>
            <p class="text-4xl font-black text-rose-600 mb-1">${minutos}</p>
            <p class="text-sm text-rose-500 font-medium">minutos de historia juntos</p>
        </div>

        <div class="space-y-3">
            <p class="text-sm font-semibold text-slate-600">Mensaje sugerido:</p>
            <div class="bg-slate-100 p-4 rounded-xl text-sm italic text-slate-600">"${mensajeEmotivo}"</div>
            
            <a href="${urlWhatsApp}" target="_blank" rel="noopener noreferrer" class="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#20b858] transition-colors shadow-lg shadow-green-200 mt-4 block text-center">
                Enviar por WhatsApp
            </a>
            
            <button onclick="eliminarFecha('${id}')" class="w-full text-red-400 font-semibold py-3 text-sm mt-2">Eliminar fecha</button>
        </div>
    `;
    navegar('detalle');
}

// 5. ELIMINAR FECHA
function eliminarFecha(id) {
    if(confirm('¿Seguro que quieres olvidar esta fecha?')) {
        fechas = fechas.filter(f => f.id !== id);
        localStorage.setItem('tikk_fechas', JSON.stringify(fechas));
        navegar('dashboard');
    }
}

// 6. GEOLOCALIZACIÓN PARA MONETIZACIÓN
function obtenerUbicacion() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // Aquí en un futuro enviarías las coordenadas a Google Maps API
            // Por ahora simularemos la ciudad basados en que estamos en Chile
            document.getElementById('user-location').innerText = "📍 En tu ciudad";
            document.getElementById('ad-title').innerText = "5 lugares románticos cerca de ti";
        }, function(error) {
            console.log("Geolocalización denegada o fallida.");
            document.getElementById('user-location').innerText = "📍 Global";
        });
    }
}

// INICIAR APP
renderizarDashboard();
obtenerUbicacion();