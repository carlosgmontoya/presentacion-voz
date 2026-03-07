// 1. CONFIGURACIÓN (Pide la API KEY en cada F5)
let API_KEY_GROQ = prompt("Introduce tu API KEY de Groq para esta sesión:");
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;

// 2. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    console.log("%c 🗣️ JOSÉ DICE: " + mensaje, "color: #9b59b6; font-weight: bold;");
    
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    
    lectura.onstart = () => { 
        iaHablando = true; 
        try { recognition.stop(); } catch(e) {} 
    };
    
    lectura.onend = () => {
        iaHablando = false;
        reiniciarMicrofono();
    };
    window.speechSynthesis.speak(lectura);
}

// 3. RECONOCIMIENTO DE VOZ (STT)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    alert("Tu navegador no soporta reconocimiento de voz. Prueba con Google Chrome.");
}

const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

function reiniciarMicrofono() {
    if (sistemaIniciado && !iaHablando) {
        setTimeout(() => {
            try { 
                recognition.start(); 
                console.log("%c 🎤 Micrófono activo y escuchando...", "color: #34495e; font-style: italic;");
            } catch(e) {
                // El error suele ocurrir si ya está encendido, lo ignoramos de forma segura
            }
        }, 400);
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("%c 👂 ESCUCHADO: " + text, "color: #f1c40f; font-weight: bold;");

    // Si no mencionas a José, ignoramos el comando
    if (!text.includes("josé") && !text.includes("jose")) return;

    // --- NAVEGACIÓN LOCAL (Requiere Reveal.js cargado en el HTML) ---
    if (text.includes("siguiente") || text.includes("avanza")) { Reveal.next(); return; }
    if (text.includes("atrás") || text.includes("regresa")) { Reveal.prev(); return; }
    if (text.includes("inicio")) { Reveal.slide(0); return; }
    if (text.includes("final")) { Reveal.slide(Reveal.getTotalSlides() - 1); return; }

    // --- CONSULTA IA ---
    const slideActual = document.querySelector('.reveal .present');
    const contenidoSlide = slideActual ? slideActual.innerText : "Universidad Don Bosco";
    
    if (text.includes("lee") || text.includes("leer")) {
        responderConVoz("En esta lámina dice: " + contenidoSlide);
        return;
    }

    const comandoLimpio = text.replace(/josé|jose/g, "").trim();
    console.log("%c 🧠 PENSANDO...", "color: #3498db;");
    const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
    responderConVoz(respuestaIA.replace("VOZ: ", ""));
};

recognition.onerror = (e) => {
    if (e.error !== 'no-speech') {
        console.error("%c ❌ ERROR MIC: " + e.error, "color: #e74c3c;");
    }
    reiniciarMicrofono();
};

recognition.onend = () => { 
    if (!iaHablando) reiniciarMicrofono(); 
};

// 4. CEREBRO IA
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
                    {role: "system", content: "Eres José, asistente UDB. Responde de forma muy breve (máximo 15 palabras). FORMATO: VOZ: [Respuesta]"},
                    {role: "user", content: `Contexto diapositiva: ${contexto.substring(0, 500)}. Pregunta: ${frase}`}
                ],
                temperature: 0.6
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Error Groq:", data.error.message);
            return "VOZ: Hay un error con la clave de acceso.";
        }
        
        return data.choices[0].message.content;
    } catch (e) { 
        return "VOZ: No tengo conexión a internet."; 
    }
}

// 5. INICIALIZACIÓN (Se activa con el primer click en cualquier parte)
const iniciarSistema = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        console.log("%c ✅ SISTEMA JOSÉ INICIALIZADO", "color: #ffffff; background: #2ecc71; padding: 5px; border-radius: 3px;");
        
        // El ajuste clave: Arrancar el micro tras el click inicial
        reiniciarMicrofono(); 
        responderConVoz("José activado. ¿En qué puedo ayudarte?");
    }
};

document.addEventListener('click', iniciarSistema, { once: true });





































