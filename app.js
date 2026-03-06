// 1. CONFIGURACIÓN Y ESTADO
let API_KEY_GROQ = localStorage.getItem('GROQ_KEY');

if (!API_KEY_GROQ || API_KEY_GROQ === "null" || API_KEY_GROQ === "") {
    API_KEY_GROQ = prompt("Introduce tu API KEY de Groq:");
    if (API_KEY_GROQ) localStorage.setItem('GROQ_KEY', API_KEY_GROQ);
}

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;

// 2. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    console.log("%c🗣️ JOSÉ DICE: " + mensaje, "color: #9b59b6; font-weight: bold;");
    
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    
    lectura.onstart = () => { 
        iaHablando = true; 
        try { recognition.stop(); } catch(e) {} 
    };
    
    lectura.onend = () => {
        iaHablando = false;
        reiniciarMicrofono();
    };
    window.speechSynthesis.speak(lectura);
}

// 3. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

function reiniciarMicrofono() {
    if (sistemaIniciado && !iaHablando) {
        setTimeout(() => {
            try { recognition.start(); } catch(e) {}
        }, 400);
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    // LOG DE ESCUCHA (AMARILLO)
    console.log("%c👂 ESCUCHADO: " + text, "color: #f1c40f; font-weight: bold;");

    if (!text.includes("josé") && !text.includes("jose")) return;

    // --- NAVEGACIÓN (LOGS VERDES) ---
    if (text.includes("siguiente") || text.includes("avanza")) {
        console.log("%c🚀 NAVEGACIÓN: Siguiente", "color: #2ecc71; font-weight: bold;");
        Reveal.next();
        return;
    }
    if (text.includes("atrás") || text.includes("regresa") || text.includes("anterior")) {
        console.log("%c🚀 NAVEGACIÓN: Atrás", "color: #2ecc71; font-weight: bold;");
        Reveal.prev();
        return;
    }
    if (text.includes("inicio") || text.includes("principio")) {
        console.log("%c🚀 NAVEGACIÓN: Inicio", "color: #2ecc71; font-weight: bold;");
        Reveal.slide(0);
        return;
    }
    if (text.includes("final") || text.includes("última")) {
        console.log("%c🚀 NAVEGACIÓN: Final", "color: #2ecc71; font-weight: bold;");
        const total = document.querySelectorAll('.reveal .slides section').length;
        Reveal.slide(total - 1);
        return;
    }

    // --- CONSULTA IA (LOG AZUL) ---
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();
    const slideActual = document.querySelector('.reveal .present');
    const textoSlide = slideActual ? slideActual.innerText : "";
    
    if (text.includes("lee") || text.includes("leer")) {
        console.log("%c📖 ACCIÓN: Leyendo diapositiva", "color: #3498db;");
        responderConVoz("En esta diapositiva dice: " + textoSlide);
        return;
    }

    console.log("%c🧠 PROCESANDO EN GROQ...", "color: #3498db; font-weight: bold;");
    const respuestaIA = await consultarIA(comandoLimpio, textoSlide);
    const vozMatch = respuestaIA.match(/VOZ:\s*(.*)/is);
    responderConVoz(vozMatch ? vozMatch[1].trim() : respuestaIA);
};

recognition.onend = () => {
    if (sistemaIniciado && !iaHablando) {
        console.log("%c🎤 Micrófono en espera...", "color: #7f8c8d;");
        reiniciarMicrofono();
    }
};

recognition.onerror = (e) => {
    console.error("%c❌ Error de micro: " + e.error, "color: #e74c3c;");
    reiniciarMicrofono();
};

// 4. CEREBRO DE JOSÉ
async function consultarIA(frase, contextoActual) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3-8b-8192", 
                messages: [
                    { role: "system", content: "Eres José, asistente UDB. Responde breve (1 frase). FORMATO: VOZ: [Respuesta]" },
                    { role: "user", content: `Slide: ${contextoActual}. Usuario: ${frase}` }
                ],
                temperature: 0.5
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "VOZ: Error de red."; }
}

// 5. INICIO
const iniciar = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        console.log("%c✅ SISTEMA INICIADO CORRECTAMENTE", "color: #2ecc71; background: #1a1a1a; padding: 5px; font-size: 12px;");
        responderConVoz("José activado.");
    }
};

document.addEventListener('click', iniciar, { once: true });
document.addEventListener('keydown', iniciar, { once: true });
































