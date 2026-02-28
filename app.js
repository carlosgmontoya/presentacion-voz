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
let mapaDiapositivas = ""; 

// --- BOTONES DE RESPALDO ---
const contenedorBotones = document.createElement('div');
contenedorBotones.style = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; gap: 10px;";
contenedorBotones.innerHTML = `
    <button id="btn-prev" style="padding: 10px 20px; cursor: pointer; border-radius: 5px; border: none; background: #333; color: white; font-weight: bold;">⬅️ ATRÁS</button>
    <button id="btn-next" style="padding: 10px 20px; cursor: pointer; border-radius: 5px; border: none; background: #333; color: white; font-weight: bold;">SIGUIENTE ➡️</button>
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
        try { recognition.start(); } catch (e) {}
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

// --- NUEVA FUNCIÓN: LEER CONTENIDO REAL ---
function leerDiapositivaActual() {
    const texto = document.querySelector('.reveal .present').innerText;
    responderConVoz("En esta diapositiva dice lo siguiente: " + texto);
}

// 4. LÓGICA DE ESCUCHA
recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        // Atajo directo para leer sin pasar por la IA si es muy evidente
        if (comandoLimpio.includes("lee") || comandoLimpio.includes("leer") || comandoLimpio.includes("qué dice")) {
            leerDiapositivaActual();
            return;
        }

        const slideActual = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, slideActual);
        procesarAccion(respuestaIA);
    }
};

// 5. CONEXIÓN CON GROQ (MEJORADA PARA LECTURA)
async function consultarIA(frase, contextoActual) {
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
                        content: `Eres Robin, asistente de voz. 
                        MAPA: ${mapaDiapositivas}
                        
                        REGLAS:
                        1. Si piden leer la diapositiva: responde "ACCION_LEER".
                        2. Si piden ir a un tema: responde "IR_A_X" (X es el número).
                        3. Si piden siguiente/atrás: responde SOLO "SIGUIENTE" o "ATRAS".
                        4. Para dudas sobre la slide actual "${contextoActual}": responde breve.`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.3
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (e) { return "ERROR"; }
}

// 6. CONTROLADOR DE ACCIONES (CORREGIDO PARA EVITAR SALTOS FALSOS)
function procesarAccion(res) {
    console.log("🤖 Robin decidió:", res);
    const resUpper = res.toUpperCase();

    if (resUpper === "ACCION_LEER") {
        leerDiapositivaActual();
        return;
    }

    if (resUpper.startsWith("IR_A_")) {
        const index = parseInt(resUpper.split("_").pop());
        if (!isNaN(index)) {
            Reveal.slide(index);
            responderConVoz("Cambiando a esa sección.");
            return;
        }
    }

    // Solo avanzamos si la respuesta es EXCLUSIVAMENTE el comando
    if (resUpper === "SIGUIENTE") {
        Reveal.next();
        responderConVoz("Pasamos a la siguiente.");
    } else if (resUpper === "ATRAS") {
        Reveal.prev();
        responderConVoz("Volvemos atrás.");
    } else if (res !== "ERROR") {
        responderConVoz(res);
    }
}

// 7. INICIO
function generarMapa() {
    const slides = document.querySelectorAll('.reveal .slides section');
    mapaDiapositivas = Array.from(slides).map((s, i) => `Slide ${i}: ${s.innerText.substring(0, 50)}`).join('\n');
}

document.body.onclick = () => {
    if (!sistemaIniciado) {
        generarMapa();
        sistemaIniciado = true;
        responderConVoz("Sistema listo. Puedo leer tus diapositivas si me lo pides.");
    }
};

















