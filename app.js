// 1. CONFIGURACIÓN
let API_KEY_GROQ = prompt("Introduce tu API KEY de Groq:");
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;

const avatar = document.getElementById('jose-avatar');

// 2. RECONOCIMIENTO DE VOZ (STT)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

function reiniciarMicrofono() {
    if (sistemaIniciado && !iaHablando) {
        setTimeout(() => {
            try { 
                recognition.start(); 
                avatar.className = 'jose-escuchando';
                console.log("🎤 Micro Escuchando..."); 
            } catch(e) {}
        }, 2000); 
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("👂 José escuchó:", text);

    if (!text.includes("josé") && !text.includes("jose")) return;

    // --- NAVEGACIÓN MEJORADA ---
    console.log("🔍 INVESTIGACIÓN:", {
    original: text,
    longitud: text.length,
    tienePrincipio: text.includes("principio")
    });
    
    if (text.includes("siguiente") || text.includes("sigamos") || text.includes("adelante")) {
        console.log("Sigamos adelante");
        window.Reveal.next();
        return;
    }
    if (text.includes("atrás") || text.includes("regresa") || text.includes("anterior")) {
        console.log("Regresando");
        window.Reveal.prev();
        return;
    }
    if (text.includes("inicio") || text.includes("primera") || text.includes("principio")) {
        console.log("Volviendo al inicio...");
        window.Reveal.slide(0);
        return;
    }
    if (text.includes("última") || text.includes("final")) {
        console.log("Vamos al final...");
        window.Reveal.slide(window.Reveal.getTotalSlides() - 1);
        return;
    }
    // Ir a número específico (Ej: "José ve a la diapositiva 3")
    if (text.includes("diapositiva") || text.includes("lámina")) {
        const num = text.match(/\d+/);
        if (num) {
            window.Reveal.slide(parseInt(num[0]) - 1);
            return;
        }
    }

    // --- CONSULTA A GROQ ---
    const slideActual = document.querySelector('.reveal .present');
    const contenidoSlide = slideActual ? slideActual.innerText : "UDB Presentation";
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();

    avatar.className = 'jose-hablando';
    const respuesta = await consultarIA(comandoLimpio, contenidoSlide);
    responderConVoz(respuesta);
};

recognition.onend = () => { if (!iaHablando) reiniciarMicrofono(); };
recognition.onerror = (e) => { reiniciarMicrofono(); };

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';

    lectura.onstart = () => { 
        iaHablando = true; 
        avatar.className = 'jose-hablando';
        try { recognition.stop(); } catch(e) {} 
    };
    lectura.onend = () => { 
        iaHablando = false; 
        avatar.className = 'jose-idle';
        reiniciarMicrofono(); 
    };
    window.speechSynthesis.speak(lectura);
}

// 4. CEREBRO IA
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {role: "system", content: "Eres José, asistente de la UDB. Responde muy breve basándote en la slide."},
                    {role: "user", content: `Slide: ${contexto}. Pregunta: ${frase}`}
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "Lo siento, tuve un pequeño error de conexión."; }
}

// 5. INICIALIZACIÓN
document.addEventListener('click', () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        reiniciarMicrofono();
        responderConVoz("José activado. Estoy listo para ayudarte.");
    }
}, { once: true });
















































