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

// VARIABLES DE ESTADO
let iaHablando = false;
let sistemaIniciado = false;

// 2. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onend = () => {
    if (sistemaIniciado && !iaHablando) {
        try { recognition.start(); } catch (e) { console.log("Reintentando micro..."); }
    }
};

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';

    lectura.onstart = () => {
        iaHablando = true;
        recognition.stop(); 
    };

    lectura.onend = () => {
        iaHablando = false;
        setTimeout(() => {
            if (sistemaIniciado) {
                try { recognition.start(); } catch (e) {}
            }
        }, 700);
    };

    window.speechSynthesis.speak(lectura);
}

// 4. LÓGICA DE ESCUCHA CON PALABRA DE ACTIVACIÓN "SAM"
recognition.onresult = async (event) => {
    if (iaHablando) return; 

    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    // FILTRO: Solo procesa si mencionas "Sam"
    if (text.includes("sam")) {
        console.log("🎤 Sam escuchó:", text);
        
        // Opcional: Limpiar el nombre "Sam" del comando para que no confunda a la IA
        const comandoLimpio = text.replace("sam", "").trim();
        
        const contenidoSlide = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
        procesarAccion(respuestaIA);
    } else {
        console.log("☁️ Ignorado (no dijiste Sam):", text);
    }
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
                        content: `Tu nombre es Sam. Eres un asistente de presentación.
                        REGLAS:
                        - Comandos de navegación: responde SOLO "SIGUIENTE", "ATRAS" o "INICIO".
                        - Preguntas: responde amable (máx 15 palabras).
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
        return "ERROR"; 
    }
}

// 6. CONTROLADOR DE REVEAL.JS
function procesarAccion(res) {
    console.log("🤖 Sam decidió:", res);

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

// 7. ACTIVACIÓN INICIAL
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Sam está listo. Llámame por mi nombre cuando me necesites.");
    }
};

