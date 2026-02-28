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
        font-family: sans-serif; font-size: 14px; transition: 0.3s;
    }
    .btn-robin:hover { background: #333; border-color: #666; }
`;
document.head.appendChild(estilos);

// 2. BOTONES LIMPIOS (SIN RESET KEY)
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

recognition.onstart = () => console.log("🎙️ Escuchando...");
recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch(e){} };

function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    lectura.onstart = () => { iaHablando = true; recognition.stop(); };
    lectura.onend = () => { iaHablando = false; setTimeout(() => { if(sistemaIniciado) recognition.start(); }, 500); };
    window.speechSynthesis.speak(lectura);
}

// 5. LÓGICA (CON ATAJOS PARA AHORRAR)
recognition.onresult = async (event) => {
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("👂 Oído:", text);
    
    if (/robin|robín|rubín|rubén/.test(text)) {
        if (text.includes("siguiente") || text.includes("avanza")) return procesarAccion("SIGUIENTE");
        if (text.includes("atrás") || text.includes("vuelve") || text.includes("anterior")) return procesarAccion("ATRAS");
        if (text.includes("inicio") || text.includes("principio")) return procesarAccion("INICIO");

        const comando = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        const contexto = (document.querySelector('.reveal .present')?.innerText || "").substring(0, 500); // Limitamos para evitar error 400
        const respuestaIA = await consultarIA(comando, contexto);
        procesarAccion(respuestaIA);
    }
};

// 6. IA (MODELO ESTABLE)
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: `Eres Robin. Si piden navegar responde "SIGUIENTE", "ATRAS" o "INICIO". Si no, responde breve (<15 palabras) usando este contexto: ${contexto}` },
                    { role: "user", content: frase }
                ],
                temperature: 0
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) { return "ERROR"; }
}

// 7. ACCIONES
function procesarAccion(res) {
    console.log("🤖 Acción:", res);
    if (res.includes("SIGUIENTE")) Reveal.next();
    else if (res.includes("ATRAS")) Reveal.prev();
    else if (res.includes("INICIO")) Reveal.slide(0);
    else if (res !== "ERROR") responderConVoz(res);
}

// 8. CLIC INICIAL
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin listo");
        recognition.start();
    }
};








