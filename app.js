// 1. ESTILOS (MODO OSCURO)
const estilos = document.createElement('style');
estilos.innerHTML = `
    .controles-robin {
        position: fixed; bottom: 20px; right: 20px;
        display: flex; gap: 10px; z-index: 9999;
    }
    .btn-robin {
        background: #222; color: white; border: 1px solid #444;
        padding: 10px 15px; border-radius: 8px; cursor: pointer;
        font-family: sans-serif; font-size: 18px; transition: 0.3s;
    }
    .btn-robin:hover { background: #333; border-color: #666; }
`;
document.head.appendChild(estilos);

// 2. BOTONES
const panel = document.createElement('div');
panel.className = 'controles-robin';
panel.innerHTML = `
    <button class="btn-robin" onclick="procesarAccion('ATRAS')">⬅️</button>
    <button class="btn-robin" onclick="procesarAccion('INICIO')">🏠</button>
    <button class="btn-robin" onclick="procesarAccion('SIGUIENTE')">➡️</button>
`;
document.body.appendChild(panel);

// 3. CONFIGURACIÓN
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY');
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!API_KEY_GROQ) {
    const userKey = prompt("Introduce tu API KEY de Groq:");
    if (userKey) localStorage.setItem('GROQ_KEY', userKey);
}

let iaHablando = false;
let sistemaIniciado = false;

// 4. VOZ
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onstart = () => console.log("🎙️ Robin escuchando e interpretando...");
recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch(e){} };

function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    lectura.onstart = () => { iaHablando = true; recognition.stop(); };
    lectura.onend = () => { iaHablando = false; setTimeout(() => { if(sistemaIniciado) recognition.start(); }, 600); };
    window.speechSynthesis.speak(lectura);
}

// 5. LÓGICA DE INTERPRETACIÓN TOTAL
recognition.onresult = async (event) => {
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("👂 Usuario dice:", text);
    
    // Filtro flexible para el nombre (Robin, Rubén, etc.)
    if (/robin|robín|rubín|rubén/.test(text)) {
        
        // --- NIVEL 1: ATAJOS DE NAVEGACIÓN (Prioridad absoluta y local) ---
        if (text.includes("siguiente") || text.includes("pasa") || text.includes("adelante") || text.includes("avanza")) {
            return procesarAccion("SIGUIENTE");
        }
        if (text.includes("atrás") || text.includes("vuelve") || text.includes("regresa") || text.includes("anterior")) {
            return procesarAccion("ATRAS");
        }
        if (text.includes("inicio") || text.includes("principio") || text.includes("comienzo") || text.includes("primera")) {
            return procesarAccion("INICIO");
        }
        if (text.includes("final") || text.includes("última") || text.includes("termina")) {
            return procesarAccion("FINAL");
        }

        // --- NIVEL 2: INTERPRETACIÓN POR IA (Para preguntas y dudas) ---
        const comando = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        const slideActual = document.querySelector('.reveal .present');
        
        // Limpiamos el texto para evitar el Error 400 (Bad Request)
        const contextoLimpio = (slideActual?.innerText || "")
            .replace(/[\n\r\t]/g, " ") // Quita saltos de línea que rompen el JSON
            .substring(0, 700);        // Límite seguro de caracteres
        
        const respuestaIA = await consultarIA(comando, contextoLimpio);
        procesarAccion(respuestaIA);
    }
};

// 6. IA (MODELO LIGERO CON SYSTEM PROMPT DE INTENCIONES)
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres Robin, un asistente para presentaciones. 
                        Tu contexto actual es: "${contexto}". 
                        Si el usuario quiere navegar, responde SOLO la palabra "SIGUIENTE", "ATRAS" o "INICIO". 
                        Si el usuario pregunta algo, responde de forma conversacional, amable y MUY breve (menos de 20 palabras).` 
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.3
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (e) { 
        return "ERROR"; 
    }
}

// 7. EJECUCIÓN DE ACCIONES
function procesarAccion(res) {
    console.log("🤖 Robin interpretó:", res);
    const comando = res.toUpperCase();

    if (comando.includes("SIGUIENTE")) { Reveal.next(); }
    else if (comando.includes("ATRAS")) { Reveal.prev(); }
    else if (comando.includes("INICIO")) { Reveal.slide(0); }
    else if (comando.includes("FINAL")) { Reveal.slide(Reveal.getTotalSlides()); }
    else if (res !== "ERROR") { 
        responderConVoz(res); 
    }
}

// 8. ACTIVACIÓN
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin listo. ¿En qué puedo ayudarte hoy?");
        recognition.start();
    }
};









