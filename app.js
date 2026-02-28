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
        try { recognition.start(); } catch (e) { console.log("Esperando micro..."); }
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

// 4. LÓGICA DE ESCUCHA CON FILTRO "ROBIN"
recognition.onresult = async (event) => {
    if (iaHablando) return;
    
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    // Filtro de activación
    if (/robin|robín|rubín|rubén/.test(text)) {
        console.log("🔔 ROBIN ACTIVADO:", text);
        
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Dime?");
            return;
        }

        const contenidoSlide = document.querySelector('.reveal .present')?.innerText || "No hay contenido visible";
        const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
        procesarAccion(respuestaIA);
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
                        content: `Tu nombre es Robin. Eres un asistente de voz para presentaciones.
                        REGLAS CRÍTICAS:
                        1. Si piden avanzar/siguiente: responde SOLO "SIGUIENTE".
                        2. Si piden volver/atrás: responde SOLO "ATRAS".
                        3. Si piden inicio: responde SOLO "INICIO".
                        4. Otros casos: responde amable en menos de 15 palabras usando este contexto: ${contexto}.`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.0
            })
        });

        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) {
        console.error("Error de red:", e);
        return "ERROR";
    }
}

// 6. CONTROLADOR DE REVEAL.JS
function procesarAccion(res) {
    console.log("🤖 Robin decidió:", res);
    
    if (res.includes("SIGUIENTE")) {
        Reveal.next();
    } else if (res.includes("ATRAS")) {
        Reveal.prev();
    } else if (res.includes("INICIO")) {
        Reveal.slide(0);
    } else if (res !== "ERROR") {
        // Si no es un comando, habla la respuesta de la IA
        responderConVoz(res);
    }
}

// 7. ACTIVACIÓN INICIAL
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin listo. Puedes hablarme.");
        console.log("✅ Sistema iniciado.");
        try { recognition.start(); } catch(e) {}
    }
};






