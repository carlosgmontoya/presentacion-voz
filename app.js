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
let mapaDiapositivas = ""; // Registro de títulos y contenido escaneado

// --- BOTONES DE RESPALDO VISUALES ---
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

// 4. LÓGICA DE ESCUCHA CON FILTRO DE NOMBRE
recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    // Filtro para Robin y sus variantes
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Dime? Estoy listo.");
            return;
        }

        const slideActual = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, slideActual);
        procesarAccion(respuestaIA);
    }
};

// 5. CONEXIÓN CON GROQ (NAVEGACIÓN POR MAPA E ÍNDICE CERO)
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
                        content: `Eres Robin, asistente de voz. Controlas esta presentación:
                        ${mapaDiapositivas}
                        
                        REGLAS CRÍTICAS:
                        1. La diapositiva inicial/primera/portada es SIEMPRE la Diapositiva 0.
                        2. Si piden ir a un tema específico (ej: conclusiones, método): responde "IR_A_X" (X es el número del mapa).
                        3. Si piden la primera, bienvenida o el inicio: responde SOLO "IR_A_0".
                        4. Si piden siguiente o atrás: responde "SIGUIENTE" o "ATRAS".
                        5. Si es charla o duda: responde amable y breve (máx 25 palabras) usando el contexto de la slide: ${contextoActual}`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.3 // Equilibrio para precisión y fluidez
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (e) { return "ERROR"; }
}

// 6. CONTROLADOR DE ACCIONES
function procesarAccion(res) {
    console.log("🤖 Robin decidió:", res);
    const resUpper = res.toUpperCase();

    // Salto directo a diapositiva específica (incluyendo la 0)
    if (resUpper.includes("IR_A_")) {
        const partes = resUpper.split("_");
        const index = parseInt(partes[partes.length - 1]);
        
        if (!isNaN(index)) {
            Reveal.slide(index);
            responderConVoz("Entendido, saltamos a esa diapositiva.");
            return;
        }
    }

    if (resUpper.includes("SIGUIENTE")) {
        Reveal.next();
        responderConVoz("Claro, pasemos a la siguiente.");
    } else if (resUpper.includes("ATRAS")) {
        Reveal.prev();
        responderConVoz("Regresando.");
    } else if (res !== "ERROR") {
        responderConVoz(res);
    }
}

// 7. ESCANEO DE DIAPOSITIVAS Y ACTIVACIÓN
function generarMapa() {
    const slides = document.querySelectorAll('.reveal .slides section');
    mapaDiapositivas = Array.from(slides).map((s, i) => {
        return `Diapositiva ${i}: "${s.innerText.substring(0, 80).replace(/\n/g, " ")}"`;
    }).join('\n');
    console.log("🗺️ Mapa de diapositivas generado.");
}

document.body.onclick = () => {
    if (!sistemaIniciado) {
        generarMapa(); // Escanea el contenido al hacer el primer clic
        sistemaIniciado = true;
        responderConVoz("Hola Carlos, ya conozco el contenido de tus diapositivas. ¿A cuál quieres ir?");
    }
};
















