// 1. CONFIGURACIÓN GROQ
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY');
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!API_KEY_GROQ) {
    const userKey = prompt("Introduce tu API KEY de Groq:");
    if (userKey) {
        localStorage.setItem('GROQ_KEY', userKey);
        location.reload();
    }
}

// VARIABLES DE ESTADO PARA EVITAR ERRORES
let iaHablando = false;
let sistemaIniciado = false;

// 2. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

// Reinicio automático inteligente
recognition.onend = () => {
    // Solo reinicia si el sistema fue activado y la IA no está hablando
    if (sistemaIniciado && !iaHablando) {
        try { 
            recognition.start(); 
        } catch (e) { 
            console.log("Micro ya activo o esperando..."); 
        }
    }
};

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';

    lectura.onstart = () => {
        iaHablando = true;
        recognition.stop(); // Apagamos el micro para que no haya eco
    };

    lectura.onend = () => {
        iaHablando = false;
        // Pausa de seguridad antes de volver a escuchar
        setTimeout(() => {
            if (sistemaIniciado) {
                try { recognition.start(); } catch (e) {}
            }
        }, 700);
    };

    window.speechSynthesis.speak(lectura);
}

// 4. LÓGICA DE ESCUCHA
recognition.onresult = async (event) => {
    if (iaHablando) return; 

    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("🎤 Usuario dijo:", text); // Ver en consola

    const contenidoSlide = document.querySelector('.reveal .present').innerText || "";
    const respuestaIA = await consultarIA(text, contenidoSlide);
    procesarAccion(respuestaIA);
};

// 5. CONEXIÓN CON GROQ (LLAMA 3.3)
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
                        content: `Eres un asistente de voz para una presentación.
                        REGLAS:
                        - Si piden avanzar/siguiente: responde SOLO "SIGUIENTE".
                        - Si piden retroceder/atrás: responde SOLO "ATRAS".
                        - Si piden inicio: responde SOLO "INICIO".
                        - Para dudas, responde breve (máx 15 palabras).
                        CONTENIDO ACTUAL: ${contexto}` 
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.2
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) { 
        console.error("Error de conexión:", e); //
        return "ERROR"; 
    }
}

// 6. CONTROLADOR DE REVEAL.JS
function procesarAccion(res) {
    console.log("🤖 IA decidió:", res);

    if (res.includes("SIGUIENTE")) {
        Reveal.next();
        responderConVoz("Siguiente.");
    } else if (res.includes("ATRAS")) {
        Reveal.prev();
        responderConVoz("Atrás.");
    } else if (res.includes("INICIO")) {
        Reveal.slide(0);
        responderConVoz("Al inicio.");
    } else if (res !== "ERROR") {
        responderConVoz(res.toLowerCase());
    }
}

// 7. ACTIVACIÓN POR CLIC (REQUISITO DE NAVEGADOR)
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Control por voz activado.");
        console.log("✅ Sistema iniciado correctamente.");
    }
};
