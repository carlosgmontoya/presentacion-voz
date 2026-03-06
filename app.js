// 1. CONFIGURACIÓN Y ESTADO
let API_KEY_GROQ = localStorage.getItem('GROQ_KEY');

if (!API_KEY_GROQ || API_KEY_GROQ === "null" || API_KEY_GROQ === "") {
    API_KEY_GROQ = prompt("Por favor, introduce tu API KEY de Groq:");
    if (API_KEY_GROQ) localStorage.setItem('GROQ_KEY', API_KEY_GROQ);
}

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;
let mapaDiapositivas = ""; 

// 2. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    
    lectura.onstart = () => {
        iaHablando = true;
        try { recognition.stop(); } catch(e) {} 
    };

    lectura.onend = () => {
        iaHablando = false;
        if (sistemaIniciado) {
            setTimeout(() => { try { recognition.start(); } catch(e) {} }, 300);
        }
    };
    window.speechSynthesis.speak(lectura);
}

// 3. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

recognition.onresult = async (event) => {
    if (iaHablando) return;
    
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("%c👂 ESCUCHADO: " + text, "color: #7f8c8d;");

    // VALIDACIÓN: ¿Me están hablando a mí (José)?
    const llamadoAJose = text.includes("josé") || text.includes("jose");
    if (!llamadoAJose) return; // Si no dicen "José", ignoramos todo.

    // --- NAVEGACIÓN ESTÁNDAR (INSTANTÁNEA) ---
    // Siguiente
    if (text.includes("siguiente") || text.includes("avanza")) {
        console.log("%c🚀 NAVEGACIÓN: Siguiente", "color: #2ecc71; font-weight: bold;");
        Reveal.next();
        return;
    }
    // Atrás
    if (text.includes("atrás") || text.includes("regresa") || text.includes("anterior")) {
        console.log("%c🚀 NAVEGACIÓN: Atrás", "color: #2ecc71; font-weight: bold;");
        Reveal.prev();
        return;
    }
    // Al principio (Inicio)
    if (text.includes("inicio") || text.includes("principio") || text.includes("primera")) {
        console.log("%c🚀 NAVEGACIÓN: Inicio", "color: #2ecc71; font-weight: bold;");
        Reveal.slide(0);
        responderConVoz("Volviendo al inicio.");
        return;
    }
    // Al final
    if (text.includes("final") || text.includes("última") || text.includes("terminar")) {
        console.log("%c🚀 NAVEGACIÓN: Final", "color: #2ecc71; font-weight: bold;");
        const totalSlides = document.querySelectorAll('.reveal .slides section').length;
        Reveal.slide(totalSlides - 1);
        responderConVoz("Yendo a la diapositiva final.");
        return;
    }

    // --- CONSULTAS COMPLEJAS (Pasan a la IA) ---
    // Si llegamos aquí, es porque dijo "José" pero no era un comando de navegación simple.
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();
    const slideActual = document.querySelector('.reveal .present').innerText || "";
    
    console.log("%c🧠 PENSANDO...", "color: #f1c40f;");
    const respuestaIA = await consultarIA(comandoLimpio, slideActual);
    procesarAccion(respuestaIA, text); 
};

recognition.onend = () => { 
    if (sistemaIniciado && !iaHablando) {
        try { recognition.start(); } catch (e) {} 
    }
};

// 4. CEREBRO DE JOSÉ
async function consultarIA(frase, contextoActual) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3-8b-8192", 
                messages: [
                    {
                        role: "system",
                        content: `Eres José, un asistente de IA para presentaciones. 
                        REGLA: Responde en máximo 15 palabras.
                        MAPA: ${mapaDiapositivas.substring(0, 800)}`
                    },
                    { role: "user", content: `Slide: ${contextoActual}. Pregunta: ${frase}` }
                ],
                temperature: 0.5
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "VOZ: Lo siento, tengo problemas de conexión."; }
}

// 5. CONTROLADOR DE ACCIONES PARA IA
function procesarAccion(rawResponse, textoEscuchado) {
    // Si el usuario pide leer
    if (textoEscuchado.includes("lee") || textoEscuchado.includes("leer")) {
        const textoReal = document.querySelector('.reveal .present').innerText;
        responderConVoz("Con gusto. Dice así: " + textoReal);
        return;
    }
    
    // Si es una respuesta normal de la IA (Voz)
    const vozMatch = rawResponse.match(/VOZ:\s*(.*)/is);
    const voz = vozMatch ? vozMatch[1].trim() : rawResponse;
    if (voz) responderConVoz(voz);
}

// 6. INICIO AL PRIMER CLIC
document.addEventListener('click', () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        mapaDiapositivas = Array.from(slides).map((s, i) => {
            let t = s.querySelector('h1, h2')?.innerText || "Diapositiva " + i;
            return `P${i}:${t}`;
        }).join('| ');

        sistemaIniciado = true;
        responderConVoz("José listo. Di mi nombre seguido de un comando.");
    }
}, { once: true });






























