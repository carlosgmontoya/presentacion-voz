// 1. CONFIGURACIÓN
let API_KEY_GROQ = localStorage.getItem('GROQ_KEY') || prompt("Introduce tu API KEY de Groq:");
if (API_KEY_GROQ) localStorage.setItem('GROQ_KEY', API_KEY_GROQ);

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;

// 2. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    console.log("%c JOSÉ DICE: " + mensaje, "color: #9b59b6; font-weight: bold;");
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    lectura.onstart = () => { iaHablando = true; try { recognition.stop(); } catch(e) {} };
    lectura.onend = () => { iaHablando = false; reiniciarMicrofono(); };
    window.speechSynthesis.speak(lectura);
}

// 3. RECONOCIMIENTO DE VOZ (STT) - Con Blindaje de Red
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

function reiniciarMicrofono() {
    if (sistemaIniciado && !iaHablando) {
        setTimeout(() => {
            try { 
                recognition.start(); 
                console.log("%c🎤 Micrófono activo", "color: #34495e;");
            } catch(e) {}
        }, 500);
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("%c👂 ESCUCHADO: " + text, "color: #f1c40f; font-weight: bold;");

    if (!text.includes("josé") && !text.includes("jose")) return;

    // NAVEGACIÓN
    if (text.includes("siguiente") || text.includes("avanza")) { Reveal.next(); return; }
    if (text.includes("atrás") || text.includes("regresa")) { Reveal.prev(); return; }
    
    // IA
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();
    const respuestaIA = await consultarIA(comandoLimpio, document.querySelector('.reveal .present').innerText);
    const vozMatch = respuestaIA.match(/VOZ:\s*(.*)/is);
    responderConVoz(vozMatch ? vozMatch[1].trim() : respuestaIA);
};

// --- EL ARREGLO PARA TU ERROR DE RED ---
recognition.onerror = (e) => {
    console.error("%c❌ ERROR DETECTADO: " + e.error, "color: #e74c3c;");
    
    if (e.error === 'network') {
        console.warn("Intentando reconectar con el servicio de voz en 2 segundos...");
        try { recognition.stop(); } catch(i) {}
        setTimeout(() => reiniciarMicrofono(), 2000);
    } else {
        reiniciarMicrofono();
    }
};

recognition.onend = () => { if (!iaHablando) reiniciarMicrofono(); };

// 4. CONSULTA IA
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3-8b-8192", 
                messages: [{role: "system", content: "Eres José. Responde breve. FORMATO: VOZ: [Respuesta]"},
                           {role: "user", content: `Contexto: ${contexto}. Pregunta: ${frase}`}]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "VOZ: Sin conexión."; }
}

// 5. INICIALIZACIÓN
const iniciar = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        console.log("%c✅ SISTEMA INICIADO CORRECTAMENTE", "color: #ffffff; background: #2ecc71; padding: 5px;");
        responderConVoz("José activado.");
    }
};
document.addEventListener('click', iniciar, { once: true });

































