// 1. CONFIGURACIÓN
// Eliminamos localStorage para que no se guarde y lo pida siempre en cada F5
let API_KEY_GROQ = prompt("Introduce tu API KEY de Groq para esta sesión:");

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

    // NAVEGACIÓN RÁPIDA
    if (text.includes("siguiente") || text.includes("avanza")) { Reveal.next(); return; }
    if (text.includes("atrás") || text.includes("regresa") || text.includes("anterior")) { Reveal.prev(); return; }
    if (text.includes("inicio") || text.includes("principio")) { Reveal.slide(0); return; }
    if (text.includes("final") || text.includes("última")) { 
        Reveal.slide(Reveal.getTotalSlides() - 1); 
        return; 
    }

    const slideActual = document.querySelector('.reveal .present');
    const contenidoSlide = slideActual ? slideActual.innerText : "";

    if (text.includes("lee") || text.includes("leer")) {
        responderConVoz("En esta diapositiva dice: " + contenidoSlide);
        return;
    }
    
    // CONSULTA IA
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();
    const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
    const vozMatch = respuestaIA.match(/VOZ:\s*(.*)/is);
    responderConVoz(vozMatch ? vozMatch[1].trim() : respuestaIA);
};

recognition.onerror = (e) => {
    console.error("%c❌ ERROR DETECTADO: " + e.error, "color: #e74c3c;");
    if (e.error === 'network') {
        try { recognition.stop(); } catch(i) {}
        setTimeout(() => reiniciarMicrofono(), 2000);
    } else {
        reiniciarMicrofono();
    }
};

recognition.onend = () => { if (!iaHablando) reiniciarMicrofono(); };

// 4. CEREBRO IA (Con validación de error 400)
async function consultarIA(frase, contexto) {
    if (!frase || frase.length < 2) return "VOZ: Dime, ¿en qué puedo ayudarte?";

    const contextoSeguro = contexto && contexto.trim().length > 0 
        ? contexto.substring(0, 500) 
        : "Presentación Universidad Don Bosco";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${API_KEY_GROQ}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", 
                messages: [
                    {role: "system", content: "Eres José, asistente UDB. Responde en una frase corta. FORMATO: VOZ: [Respuesta]"},
                    {role: "user", content: `Contexto: ${contextoSeguro}. Pregunta: ${frase}`}
                ],
                temperature: 0.5
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error("Error de API:", data.error.message);
            return "VOZ: Revisa si la API Key es correcta.";
        }
        return data.choices[0].message.content;
    } catch (e) { return "VOZ: Error de conexión."; }
}

// 5. INICIALIZACIÓN
const iniciar = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        console.log("%c✅ SISTEMA LISTO", "color: #ffffff; background: #2ecc71; padding: 5px;");
        responderConVoz("José activado.");
    }
};
document.addEventListener('click', iniciar, { once: true });



































