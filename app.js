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

// --- NUEVO: BOTONES DE NAVEGACIÓN (RESPALDO) ---
const contenedorBotones = document.createElement('div');
contenedorBotones.style = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; gap: 10px;";
contenedorBotones.innerHTML = `
    <button id="btn-prev" style="padding: 10px 20px; cursor: pointer; border-radius: 5px; border: none; background: #333; color: white;">⬅️ Atrás</button>
    <button id="btn-next" style="padding: 10px 20px; cursor: pointer; border-radius: 5px; border: none; background: #333; color: white;">Siguiente ➡️</button>
`;
document.body.appendChild(contenedorBotones);

document.getElementById('btn-prev').onclick = () => Reveal.prev();
document.getElementById('btn-next').onclick = () => Reveal.next();

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

// 4. LÓGICA DE ESCUCHA CON FILTRO "ROBIN"
recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Dime? Estoy escuchándote.");
            return;
        }
        const contenidoSlide = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
        procesarAccion(respuestaIA);
    }
};

// 5. CONEXIÓN CON GROQ (MODO CONVERSACIONAL)
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
                        content: `Eres Robin, un asistente conversacional y controlador de diapositivas.
                        1. Si el usuario pide ir atrás, volver o anterior: responde SOLO "ATRAS".
                        2. Si el usuario pide siguiente o avanzar: responde SOLO "SIGUIENTE".
                        3. Si el usuario pide el inicio: responde SOLO "INICIO".
                        4. Para todo lo demás (saludos, preguntas, charla): responde de forma natural, amistosa y breve (máx 30 palabras). 
                        Usa este contexto de la diapositiva si te preguntan algo técnico: ${contexto}`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.7 // Aumentamos para que pueda conversar
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (e) {
        return "ERROR";
    }
}

// 6. CONTROLADOR DE ACCIONES
function procesarAccion(res) {
    const resUpper = res.toUpperCase();
    console.log("🤖 Robin decidió:", res);
    
    // Si la respuesta es un comando puro
    if (resUpper === "SIGUIENTE") {
        Reveal.next();
        responderConVoz("Cambiando diapositiva.");
    } else if (resUpper === "ATRAS") {
        Reveal.prev();
        responderConVoz("Regresando.");
    } else if (resUpper === "INICIO") {
        Reveal.slide(0);
        responderConVoz("Vamos al comienzo.");
    } else {
        // Si no es comando, es conversación pura
        responderConVoz(res);
    }
}

// 7. ACTIVACIÓN
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Sistema activo. Puedes hablar conmigo o usar los botones de la pantalla.");
    }
};













