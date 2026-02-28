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

// Reinicio automático inteligente para evitar errores de estado
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
        recognition.stop(); // Se apaga para no escucharse a sí mismo
    };

    lectura.onend = () => {
        iaHablando = false;
        // Pausa de seguridad para evitar ecos
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
    
    // FILTRO DE NOMBRE: Solo procesa si mencionas a Robin o variantes detectadas
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 ROBIN ACTIVADO. Instrucción recibida:", text);
        
        // Limpiamos el nombre de la frase para enviar solo la orden a la IA
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        // Si solo dijiste el nombre sin comando, Robin responde para confirmar que escucha
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Dime?");
            return;
        }

        const contenidoSlide = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
        procesarAccion(respuestaIA);
    } else {
        // Ignora conversaciones con el público donde no se use el nombre
        console.log("☁️ Ignorando conversación ajena a Robin:", text);
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
                        content: `Eres Robin, un asistente de voz. 
                        REGLAS:
                        - Comandos: responde SOLO "SIGUIENTE", "ATRAS" o "INICIO".
                        - Consultas: responde amablemente en 20 palabras.
                        CONTENIDO: ${contexto}` 
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.1 // Baja temperatura para evitar respuestas al azar
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) { 
        console.error("Error de red:", e); //
        return "ERROR"; 
    }
}

// 6. CONTROLADOR DE REVEAL.JS
function procesarAccion(res) {
    console.log("🤖 Robin decidió:", res);

    if (res.includes("SIGUIENTE")) {
        Reveal.next();
        responderConVoz("Siguiente diapositiva.");
    } else if (res.includes("ATRAS")) {
        Reveal.prev();
        responderConVoz("Regresando.");
    } else if (res.includes("INICIO")) {
        Reveal.slide(0);
        responderConVoz("Al inicio.");
    } else if (res !== "ERROR") {
        responderConVoz(res.toLowerCase());
    }
}

// 7. ACTIVACIÓN INICIAL (Requisito del navegador)
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin listo. Llámame cuando me necesites.");
        console.log("✅ Sistema vinculado correctamente."); //
    }
};




