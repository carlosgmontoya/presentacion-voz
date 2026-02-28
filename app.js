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

// 3. CONFIGURACIÓN (Limpia llaves viejas si hay error 401)
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let API_KEY_GROQ = localStorage.getItem('GROQ_KEY');

if (!API_KEY_GROQ) {
    API_KEY_GROQ = prompt("Introduce tu API KEY de Groq:");
    if (API_KEY_GROQ) localStorage.setItem('GROQ_KEY', API_KEY_GROQ);
}

let iaHablando = false;
let sistemaIniciado = false;

// 4. VOZ
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch(e){} };

function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    lectura.onstart = () => { iaHablando = true; recognition.stop(); };
    lectura.onend = () => { iaHablando = false; setTimeout(() => { if(sistemaIniciado) recognition.start(); }, 600); };
    window.speechSynthesis.speak(lectura);
}

// 5. LÓGICA DE INTERPRETACIÓN (COMANDOS LOCALES + IA)
recognition.onresult = async (event) => {
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("👂 Oído:", text);
    
    if (/robin|robín|rubín|rubén/.test(text)) {
        // ATAJOS LOCALES: Funcionan siempre (Evitan error 400 y 401)
        if (text.includes("siguiente") || text.includes("avanza") || text.includes("pasa")) return procesarAccion("SIGUIENTE");
        if (text.includes("atrás") || text.includes("vuelve") || text.includes("anterior")) return procesarAccion("ATRAS");
        if (text.includes("inicio") || text.includes("principio")) return procesarAccion("INICIO");

        // INTERPRETACIÓN POR IA PARA PREGUNTAS
        const comando = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        const slideActual = document.querySelector('.reveal .present');
        const contextoLimpio = (slideActual?.innerText || "").replace(/[\n\r\t]/g, " ").substring(0, 600);
        
        const respuestaIA = await consultarIA(comando, contextoLimpio);
        procesarAccion(respuestaIA);
    }
};

// 6. IA CON MODELO ACTUALIZADO (llama-3.3-70b-versatile)
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // MODELO NUEVO Y SOPORTADO
                messages: [
                    { role: "system", content: `Eres Robin. Si piden navegar responde SOLO "SIGUIENTE", "ATRAS" o "INICIO". Si no, responde breve (<15 palabras) usando: ${contexto}` },
                    { role: "user", content: frase }
                ],
                temperature: 0.2
            })
        });
        const data = await response.json();
        
        // Si hay error de API Key, la borramos para pedir una nueva
        if (response.status === 401) {
            localStorage.removeItem('GROQ_KEY');
            return "Error de autorización. Recarga la página.";
        }
        
        return data.choices[0].message.content.trim();
    } catch (e) { return "ERROR"; }
}

// 7. EJECUCIÓN
function procesarAccion(res) {
    const r = res.toUpperCase();
    if (r.includes("SIGUIENTE")) Reveal.next();
    else if (r.includes("ATRAS")) Reveal.prev();
    else if (r.includes("INICIO")) Reveal.slide(0);
    else if (res !== "ERROR") responderConVoz(res);
}

// 8. ACTIVACIÓN
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin actualizado y listo.");
        recognition.start();
    }
};










