// 1. CONFIGURACIÓN
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY');
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!API_KEY_GROQ) {
    const userKey = prompt("Introduce tu API KEY de Groq:");
    if (userKey) localStorage.setItem('GROQ_KEY', userKey);
}

let iaHablando = false;
let sistemaIniciado = false;

// 2. RECONOCIMIENTO DE VOZ
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
}
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

recognition.onstart = () => console.log("🎙️ Micrófono activo...");
recognition.onerror = (e) => console.error("❌ Error de micro:", e.error);

recognition.onend = () => {
    if (sistemaIniciado && !iaHablando) {
        try { recognition.start(); } catch (e) {}
    }
};

// 3. SALIDA DE VOZ
function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    lectura.onstart = () => { iaHablando = true; recognition.stop(); };
    lectura.onend = () => {
        iaHablando = false;
        setTimeout(() => { if (sistemaIniciado) recognition.start(); }, 500);
    };
    window.speechSynthesis.speak(lectura);
}

// 4. LÓGICA DE ESCUCHA
recognition.onresult = async (event) => {
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("👂 Escuchado:", text); // Esto DEBE aparecer en tu consola azul
    
    if (/robin|robín|rubín|rubén/.test(text)) {
        const comando = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        if (comando.length < 2) {
            responderConVoz("¿Dime?");
            return;
        }
        const contexto = document.querySelector('.reveal .present')?.innerText || "";
        const respuestaIA = await consultarIA(comando, contexto);
        procesarAccion(respuestaIA);
    }
};

// 5. API IA
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY_GROQ}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Eres Robin. Si piden avanzar: "SIGUIENTE". Si piden volver: "ATRAS". Si piden inicio: "INICIO". De lo contrario, responde breve (<15 palabras) sobre: ${contexto}`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) {
        return "ERROR";
    }
}

// 6. ACCIONES
function procesarAccion(res) {
    console.log("🤖 Robin dice:", res);
    if (res.includes("SIGUIENTE")) { Reveal.next(); }
    else if (res.includes("ATRAS")) { Reveal.prev(); }
    else if (res.includes("INICIO")) { Reveal.slide(0); }
    else { responderConVoz(res); }
}

// 7. ACTIVACIÓN
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        console.log("🚀 Sistema Robin Iniciado");
        responderConVoz("Sistema activado");
        recognition.start();
    }
};






