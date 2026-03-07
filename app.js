// 1. CONFIGURACIÓN
let API_KEY_GROQ = prompt("Introduce tu API KEY de Groq:");
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;

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
                console.log("%c 🎤 Escuchando...", "color: #2ecc71;");
            } catch (e) { /* Ya está activo */ }
        }, 2500);
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("👂 Escuchado:", text);

    // Si no mencionas a "José", ignoramos
    if (!text.includes("josé") && !text.includes("jose")) return;

    // --- NUEVO: LÓGICA DE NAVEGACIÓN REVEAL.JS ---
    // Agregamos variantes para que sea más fácil que te entienda
    if (text.includes("siguiente") || text.includes("avanza") || text.includes("pasa")) {
        console.log("➡️ Avanzando diapositiva...");
        Reveal.next();
        return;
    }
    if (text.includes("atrás") || text.includes("regresa") || text.includes("anterior")) {
        console.log("⬅️ Retrocediendo diapositiva...");
        Reveal.prev();
        return;
    }
    if (text.includes("inicio") || text.includes("primera")) {
        Reveal.slide(0);
        return;
    }

    // --- LÓGICA DE LECTURA ---
    const slideActual = document.querySelector('.reveal .present');
    const contenidoSlide = slideActual ? slideActual.innerText : "Universidad Don Bosco";

    if (text.includes("lee") || text.includes("leer") || text.includes("qué dice")) {
        responderConVoz("En esta lámina dice: " + contenidoSlide);
        return;
    }

    // --- CONSULTA IA (Si no fue un comando de navegación) ---
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();
    console.log("%c 🧠 Consultando a Groq...", "color: #3498db;");
    const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
    responderConVoz(respuestaIA);
};

recognition.onerror = (e) => {
    if (e.error !== 'no-speech') console.warn("⚠️ Error micro:", e.error);
    reiniciarMicrofono();
};

recognition.onend = () => { if (!iaHablando) reiniciarMicrofono(); };

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje.replace("VOZ: ", ""));
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

// 4. CEREBRO IA
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
                    {role: "system", content: "Eres José, asistente de la UDB. Responde en una sola frase muy corta basándote en el contexto proporcionado."},
                    {role: "user", content: `Contexto: ${contexto}. Pregunta: ${frase}`}
                ],
                temperature: 0.5
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "Lo siento, no pude conectar con mi cerebro artificial."; }
}

// 5. INICIALIZACIÓN
document.addEventListener('click', () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        console.log("%c ✅ SISTEMA ACTIVADO", "background: #2ecc71; color: white; padding: 5px;");
        reiniciarMicrofono();
        responderConVoz("José activado. Di: José siguiente, para avanzar.");
    }
}, { once: true });






































