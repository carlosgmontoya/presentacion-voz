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
            try { recognition.start(); console.log("%c 🎤 Micro Activo", "color: #2ecc71;"); } catch(e) {}
        }, 2000); 
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("👂 Escuchado:", text);

    if (!text.includes("josé") && !text.includes("jose")) return;

// --- NAVEGACIÓN MEJORADA (Reemplaza tu bloque de navegación anterior) ---
if (text.includes("siguiente") || text.includes("avanza") || text.includes("pasa") || text.includes("adelante")) {
    window.Reveal.next();
    return;
}
if (text.includes("atrás") || text.includes("regresa") || text.includes("anterior")) {
    window.Reveal.prev();
    return;
}

// NUEVO: Ir a la última diapositiva
if (text.includes("última") || text.includes("final")) {
    console.log("➡️ Yendo al final...");
    // Reveal.getTotalSlides() nos da el número total de láminas
    window.Reveal.slide( window.Reveal.getTotalSlides() - 1 );
    return;
}

// NUEVO: Ir a una diapositiva específica (Ej: "José, ve a la diapositiva 3")
if (text.includes("diapositiva") || text.includes("lámina")) {
    // Buscamos si hay un número en lo que dijiste
    const numero = text.match(/\d+/); 
    if (numero) {
        const indice = parseInt(numero[0]) - 1; // Restamos 1 porque en programación se empieza desde 0
        console.log("➡️ Saltando a la diapositiva:", numero[0]);
        window.Reveal.slide(indice);
        return;
    }
}

    // CONSULTA A LA IA
    const slideActual = document.querySelector('.reveal .present');
    const contenidoSlide = slideActual ? slideActual.innerText : "UDB";
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();

    console.log("🧠 Pensando...");
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
    lectura.onstart = () => { iaHablando = true; try { recognition.stop(); } catch(e) {} };
    lectura.onend = () => { iaHablando = false; reiniciarMicrofono(); };
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
                    {role: "system", content: "Eres José, asistente UDB. Responde muy corto (máximo 15 palabras)."},
                    {role: "user", content: `Slide actual: ${contexto}. Pregunta: ${frase}`}
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "Error de conexión."; }
}

// 5. INICIO
document.addEventListener('click', () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        reiniciarMicrofono();
        responderConVoz("José activado. Di: José y la instrucción para navegar.");
    }
}, { once: true });









































