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
let mapaDiapositivas = ""; // Aquí guardaremos los títulos de tus slides

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
    lectura.onstart = () => { iaHablando = true; recognition.stop(); };
    lectura.onend = () => {
        iaHablando = false;
        setTimeout(() => { if (sistemaIniciado) try { recognition.start(); } catch (e) {} }, 700);
    };
    window.speechSynthesis.speak(lectura);
}

// 4. LÓGICA DE ESCUCHA
recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Dime?");
            return;
        }

        const slideActual = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, slideActual);
        procesarAccion(respuestaIA);
    }
};

// 5. CEREBRO CON MAPA DE DIAPOSITIVAS
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
                        content: `Eres Robin. Controlas esta presentación que tiene estos temas:
                        ${mapaDiapositivas}
                        
                        REGLAS DE NAVEGACIÓN:
                        1. Si piden ir a un tema específico (ej: conclusiones): responde "IR_A_X" (donde X es el número de esa slide).
                        2. Si piden siguiente/avanzar: responde "SIGUIENTE".
                        3. Si piden atrás/volver: responde "ATRAS".
                        4. Para conversar o preguntas sobre "${contextoActual}": responde breve y amable (máx 25 palabras).`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.5
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (e) { return "ERROR"; }
}

// 6. CONTROLADOR DE ACCIONES MEJORADO
function procesarAccion(res) {
    console.log("🤖 Robin decidió:", res);
    const resUpper = res.toUpperCase();

    if (resUpper.startsWith("IR_A_")) {
        const numSlide = parseInt(resUpper.replace("IR_A_", ""));
        if (!isNaN(numSlide)) {
            Reveal.slide(numSlide);
            responderConVoz("Entendido, saltamos a esa diapositiva.");
            return;
        }
    }

    if (resUpper.includes("SIGUIENTE")) {
        Reveal.next();
        responderConVoz("Siguiente.");
    } else if (resUpper.includes("ATRAS")) {
        Reveal.prev();
        responderConVoz("Atrás.");
    } else if (res !== "ERROR") {
        responderConVoz(res);
    }
}

// 7. ESCANEO DE DIAPOSITIVAS Y ACTIVACIÓN
function generarMapa() {
    const slides = document.querySelectorAll('.reveal .slides section');
    mapaDiapositivas = Array.from(slides).map((s, i) => `Slide ${i}: ${s.innerText.substring(0, 50)}`).join('\n');
}

document.body.onclick = () => {
    if (!sistemaIniciado) {
        generarMapa(); // Escanea los títulos antes de empezar
        sistemaIniciado = true;
        responderConVoz("Hola Carlos, ya conozco tus diapositivas. ¿A cuál quieres ir?");
    }
};













