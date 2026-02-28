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
        try { recognition.start(); } catch (e) { console.log("☁️ Esperando micro..."); }
    }
};

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
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

// 4. LÓGICA DE ESCUCHA
recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    // Filtro para Robin y sus variantes fonéticas detectadas
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Dime, Carlos? ¿En qué puedo ayudarte?");
            return;
        }
        const contenidoSlide = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
        procesarAccion(respuestaIA);
    } else {
        console.log("👂 Escuchado (fondo):", text);
    }
};

// 5. CONEXIÓN CON GROQ (LLAMA 3.3) - MODO CONVERSACIONAL EQUILIBRADO
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
                        content: `Eres Robin, un asistente de voz inteligente, carismático y útil. 
                        Tu objetivo es conversar con el usuario y ayudarle con su presentación.
                        
                        REGLAS DE RESPUESTA:
                        1. Si el usuario quiere ir atrás/regresar: responde SOLO la palabra "ATRAS".
                        2. Si el usuario quiere avanzar/siguiente: responde SOLO la palabra "SIGUIENTE".
                        3. Si el usuario quiere ir al inicio: responde SOLO la palabra "INICIO".
                        4. Si el usuario te saluda o te hace una pregunta, conversa de forma natural, breve (máx 25 palabras) y usa este contexto si es necesario: ${contexto}.
                        
                        ¡Sé amable y no respondas solo en mayúsculas a menos que sea un comando de navegación!`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.7 // Subimos la temperatura para que tenga "personalidad" al hablar
            })
        });
        const data = await response.json();
        const resultado = data.choices[0].message.content.trim();
        console.log("🤖 Robin analizó:", resultado);
        return resultado;
    } catch (e) {
        return "ERROR";
    }
}

// 6. CONTROLADOR DE ACCIONES
function procesarAccion(res) {
    const resUpper = res.toUpperCase();
    
    if (resUpper.includes("SIGUIENTE") && resUpper.length < 15) {
        Reveal.next();
        responderConVoz("Claro, pasemos a la siguiente.");
    } else if ((resUpper.includes("ATRAS") || resUpper.includes("VOLVER")) && resUpper.length < 15) {
        Reveal.prev();
        responderConVoz("Sin problema, volvemos atrás.");
    } else if (resUpper.includes("INICIO") && resUpper.length < 15) {
        Reveal.slide(0);
        responderConVoz("Volviendo a la portada.");
    } else if (res !== "ERROR") {
        // Si no es un comando corto, es una respuesta conversacional
        responderConVoz(res);
    }
}

// 7. INICIO
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Hola Carlos, soy Robin. Sistema vinculado y listo para charlar.");
    }
};












