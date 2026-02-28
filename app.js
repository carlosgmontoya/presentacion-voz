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
        try { recognition.start(); } catch (e) { console.log("☁️ Sistema en espera..."); }
    }
};

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    // Imprimimos en consola lo que Robin va a decir
    console.log("🗣️ Robin dice:", mensaje);

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
    
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        // Registro visual de la instrucción detectada
        console.log("🔔 ROBIN ACTIVADO. Instrucción recibida:", text);
        
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Dime?");
            return;
        }
        const contenidoSlide = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
        procesarAccion(respuestaIA);
    } else {
        // Log de lo que Robin ignora para que sepas que sigue escuchando
        console.log("👂 Escuchado (ignorando):", text);
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
                        content: `Tu nombre es Robin. Asistente de voz.
                        REGLAS:
                        - Retroceder/atrás/volver: responde SOLO "ATRAS".
                        - Avanzar/siguiente: responde SOLO "SIGUIENTE".
                        - Inicio: responde SOLO "INICIO".
                        - Otros: responde breve (15 palabras) usando: ${contexto}.`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.0 // Precisión máxima
            })
        });
        const data = await response.json();
        const resultado = data.choices[0].message.content.trim().toUpperCase();
        
        // Aquí mostramos el "razonamiento" o decisión final de la IA
        console.log("🤖 Robin decidió:", resultado);
        return resultado;
    } catch (e) {
        console.error("❌ Error de red:", e);
        return "ERROR";
    }
}

// 6. CONTROLADOR DE REVEAL.JS
function procesarAccion(res) {
    if (res.includes("SIGUIENTE") && !res.includes("ATRAS")) {
        Reveal.next();
        responderConVoz("Cambiando diapositiva.");
    } else if (res.includes("ATRAS") || res.includes("VOLVER")) {
        Reveal.prev();
        responderConVoz("Retrocediendo.");
    } else if (res.includes("INICIO")) {
        Reveal.slide(0);
        responderConVoz("Volviendo al inicio.");
    } else if (res !== "ERROR") {
        responderConVoz(res.toLowerCase());
    }
}

// 7. ACTIVACIÓN INICIAL
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin activo. Registrando actividad en consola.");
        console.log("✅ Sistema vinculado. Historial listo.");
    }
};











