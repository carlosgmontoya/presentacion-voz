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

recognition.onstart = () => console.log("🎙️ Robin escuchando...");
recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch(e){} };

function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    lectura.onstart = () => { iaHablando = true; recognition.stop(); };
    lectura.onend = () => { iaHablando = false; setTimeout(() => { if(sistemaIniciado) recognition.start(); }, 600); };
    window.speechSynthesis.speak(lectura);
}

// 5. LÓGICA DE INTERPRETACIÓN MEJORADA
recognition.onresult = async (event) => {
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("👂 Usuario dice:", text);
    
    // Detectar si mencionas a Robin en cualquier parte de la frase
    if (/robin|robín|rubín|rubén/.test(text)) {
        
        // Atajos ultra-rápidos (para no esperar a la IA en lo obvio)
        if (text.includes("siguiente") || text.includes("pasa")) return procesarAccion("SIGUIENTE");
        if (text.includes("atrás") || text.includes("vuelve")) return procesarAccion("ATRAS");

        // Para todo lo demás, que la IA interprete la intención
        const comando = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        const slideActual = document.querySelector('.reveal .present');
        const contexto = (slideActual?.innerText || "").substring(0, 800); 
        
        const respuestaIA = await consultarIA(comando, contexto);
        procesarAccion(respuestaIA);
    }
};

// 6. IA CON CAPACIDAD DE INTERPRETACIÓN
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
                        content: `Eres Robin, un asistente inteligente para presentaciones. 
                        TU OBJETIVO: Interpretar la voluntad del usuario.
                        1. Si el usuario quiere avanzar, ir al final o seguir: Responde solo "SIGUIENTE".
                        2. Si quiere retroceder o ver lo anterior: Responde solo "ATRAS".
                        3. Si quiere ir al inicio o empezar: Responde solo "INICIO".
                        4. Si hace una pregunta sobre el contenido: Responde de forma natural y breve (máximo 20 palabras) usando este contexto: ${contexto}` 
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.2 // Un poco de temperatura para que no sea tan robótico
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (e) { 
        return "Lo siento, tuve un problema con la conexión."; 
    }
}

// 7. EJECUCIÓN
function procesarAccion(res) {
    console.log("🤖 Robin interpretó:", res);
    const comando = res.toUpperCase();

    if (comando.includes("SIGUIENTE")) { Reveal.next(); }
    else if (comando.includes("ATRAS")) { Reveal.prev(); }
    else if (comando.includes("INICIO")) { Reveal.slide(0); }
    else { responderConVoz(res); } // Hablar si es una respuesta de texto
}

// 8. ACTIVACIÓN
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin listo. ¿En qué puedo ayudarte?");
        recognition.start();
    }
};










