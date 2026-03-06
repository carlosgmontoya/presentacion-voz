// 1. CONFIGURACIÓN Y ESTADO
let API_KEY_GROQ = localStorage.getItem('GROQ_KEY') || prompt("Introduce tu API KEY de Groq:");
if (API_KEY_GROQ) localStorage.setItem('GROQ_KEY', API_KEY_GROQ);

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;
let mapaDiapositivas = ""; 

// 2. SALIDA DE VOZ (TTS) - Con desbloqueo forzado
function responderConVoz(mensaje) {
    if (!mensaje) return;
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    
    lectura.onstart = () => { 
        iaHablando = true; 
        try { recognition.stop(); } catch(e) {} 
    };
    
    lectura.onend = () => {
        iaHablando = false;
        reiniciarMicrofono(); // Paracaídas 1
    };
    window.speechSynthesis.speak(lectura);
}

// 3. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

// Función de reinicio seguro
function reiniciarMicrofono() {
    if (sistemaIniciado && !iaHablando) {
        setTimeout(() => {
            try { recognition.start(); } catch(e) { 
                // Si ya está encendido, no pasa nada
            }
        }, 300);
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("%c👂 ESCUCHADO: " + text, "color: #f1c40f;");

    if (!text.includes("josé") && !text.includes("jose")) return;

    // COMANDOS DE NAVEGACIÓN
    if (text.includes("siguiente")) { console.log("%c🚀 NAVEGACIÓN: Siguiente", "color: #2ecc71;"); Reveal.next(); return; }
    if (text.includes("atrás") || text.includes("anterior")) { console.log("%c🚀 NAVEGACIÓN: Atrás", "color: #2ecc71;"); Reveal.prev(); return; }
    if (text.includes("inicio")) { console.log("%c🚀 NAVEGACIÓN: Inicio", "color: #2ecc71;"); Reveal.slide(0); return; }
    if (text.includes("final")) { console.log("%c🚀 NAVEGACIÓN: Final", "color: #2ecc71;"); Reveal.slide(Reveal.getTotalSlides()); return; }

    // CONSULTA IA
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();
    const respuestaIA = await consultarIA(comandoLimpio, document.querySelector('.reveal .present').innerText);
    const vozMatch = respuestaIA.match(/VOZ:\s*(.*)/is);
    responderConVoz(vozMatch ? vozMatch[1].trim() : respuestaIA);
};

// Paracaídas 2: Si el micro se apaga solo (por silencio largo)
recognition.onend = () => reiniciarMicrofono();

// Paracaídas 3: Si hay un error de red o micro, reintentar
recognition.onerror = (e) => {
    console.warn("Reintentando micro por error:", e.error);
    reiniciarMicrofono();
};

// 4. CEREBRO IA (Groq)
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{role: "system", content: "Eres José. Responde en 1 frase corta. Formato: VOZ: [respuesta]"},
                           {role: "user", content: `Contexto: ${contexto}. Pregunta: ${frase}`}]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "VOZ: Error de conexión."; }
}

// 5. INICIO
const activar = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("José activado y escuchando.");
        console.log("%c✅ SISTEMA LISTO", "color: #3498db; font-weight: bold;");
    }
};
document.addEventListener('click', activar, { once: true });
































