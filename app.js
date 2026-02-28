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

let iaHablando = false;
let sistemaIniciado = false;

// 2. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onend = () => {
    if (sistemaIniciado && !iaHablando) {
        try { recognition.start(); } catch (e) {}
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

// 4. LÓGICA DE ESCUCHA CON FILTRO ESTRICTO "ROBIN"
recognition.onresult = async (event) => {
    if (iaHablando) return; 

    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    // FILTRO DE ACTIVACIÓN: Solo si el texto contiene variaciones de "Robin"
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 NOMBRE DETECTADO. Procesando comando:", text);
        
        // Limpiamos el nombre de la frase para que la IA no se confunda
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        // Si solo dijiste el nombre, Robin saluda
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Sí? Te escucho.");
            return;
        }

        const contenidoSlide = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
        procesarAccion(respuestaIA);
    } else {
        // Esto evita que frases como "pues no realmente" lleguen a la IA
        console.log("☁️ Conversación de fondo ignorada (sin nombre):", text);
    }
};

// 5. CEREBRO (LLAMA 3.3)
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
                        content: `Eres Robin, un asistente de presentación.
                        REGLAS:
                        - Si piden avanzar: responde SOLO "SIGUIENTE".
                        - Si piden volver: responde SOLO "ATRAS".
                        - Si preguntan: responde amablemente en máximo 20 palabras.
                        CONTENIDO ACTUAL: ${contexto}` 
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.1 
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) { return "ERROR"; }
}

// 6. CONTROLADOR
function procesarAccion(res) {
    console.log("🤖 Robin decidió:", res);
    if (res.includes("SIGUIENTE")) { Reveal.next(); responderConVoz("Cambiando."); }
    else if (res.includes("ATRAS")) { Reveal.prev(); responderConVoz("Regresando."); }
    else if (res !== "ERROR") { responderConVoz(res.toLowerCase()); }
}

// 7. ACTIVACIÓN INICIAL
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin activo.");
        console.log("✅ Sistema iniciado correctamente.");
    }
};



