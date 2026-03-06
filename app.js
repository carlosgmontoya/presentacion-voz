// 1. CONFIGURACIÓN Y ESTADO
let API_KEY_GROQ = localStorage.getItem('GROQ_KEY');

// Pedir la llave si no existe
if (!API_KEY_GROQ || API_KEY_GROQ === "null" || API_KEY_GROQ === "") {
    API_KEY_GROQ = prompt("Por favor, introduce tu API KEY de Groq para activar a José:");
    if (API_KEY_GROQ) {
        localStorage.setItem('GROQ_KEY', API_KEY_GROQ);
    }
}

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;
let mapaDiapositivas = ""; 

// 2. FUNCIÓN DE RESALTADO VISUAL (Puntero de voz)
function resaltarTexto(palabra) {
    const slideActual = document.querySelector('.reveal .present');
    if (!slideActual) return;

    const contenidoOriginal = slideActual.innerHTML;
    // Busca la palabra ignorando mayúsculas/minúsculas
    const regex = new RegExp(`(${palabra})`, 'gi');
    
    // Aplica un estilo de resaltado temporal
    slideActual.innerHTML = contenidoOriginal.replace(regex, `<span class="voice-highlight" style="background-color: #ffcc00; color: #000; padding: 0 5px; border-radius: 4px; box-shadow: 0 0 10px #ffcc00;">$1</span>`);
    
    // Quitar el resaltado tras 5 segundos para limpiar la vista
    setTimeout(() => {
        slideActual.innerHTML = contenidoOriginal;
    }, 5000);
}

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    console.log("%c🗣️ JOSÉ DICE: " + mensaje, "color: #9b59b6; font-weight: bold;");
    
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    
    lectura.onstart = () => { 
        iaHablando = true; 
        try { recognition.stop(); } catch(e) {} 
    };
    
    lectura.onend = () => {
        iaHablando = false;
        // Reinicio controlado del micrófono
        if (sistemaIniciado) {
            setTimeout(() => { 
                if (!iaHablando) try { recognition.start(); } catch(e) {} 
            }, 400);
        }
    };
    window.speechSynthesis.speak(lectura);
}

// 4. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

recognition.onresult = async (event) => {
    if (iaHablando) return;
    
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("%c👂 ESCUCHADO: " + text, "color: #7f8c8d; font-style: italic;");

    // FILTRO OBLIGATORIO: Solo responde si dices "José"
    if (!text.includes("josé") && !text.includes("jose")) return;

    // --- A. NAVEGACIÓN INSTANTÁNEA (Sin lag de IA) ---
    if (text.includes("siguiente") || text.includes("avanza")) {
        Reveal.next();
        return;
    }
    if (text.includes("atrás") || text.includes("regresa") || text.includes("anterior")) {
        Reveal.prev();
        return;
    }
    if (text.includes("inicio") || text.includes("principio")) {
        Reveal.slide(0);
        responderConVoz("Volviendo al inicio.");
        return;
    }
    if (text.includes("final") || text.includes("última")) {
        const total = document.querySelectorAll('.reveal .slides section').length;
        Reveal.slide(total - 1);
        responderConVoz("Yendo al final.");
        return;
    }

    // --- B. RESALTADO VISUAL ---
    if (text.includes("resalta") || text.includes("marca")) {
        const palabras = text.split(" ");
        const objetivo = palabras[palabras.length - 1]; // Toma la última palabra dicha
        resaltarTexto(objetivo);
        return;
    }

    // --- C. CONSULTAS COMPLEJAS (Groq API) ---
    const comandoLimpio = text.replace(/josé|jose/g, "").trim();
    const slideActualTexto = document.querySelector('.reveal .present').innerText || "";
    
    console.log("%c🧠 PROCESANDO CONSULTA...", "color: #f1c40f;");
    const respuestaIA = await consultarIA(comandoLimpio, slideActualTexto);
    
    // Lógica para lectura de diapositiva
    if (text.includes("lee") || text.includes("leer")) {
        responderConVoz("En esta diapositiva dice: " + slideActualTexto);
    } else {
        const vozMatch = respuestaIA.match(/VOZ:\s*(.*)/is);
        const respuestaFinal = vozMatch ? vozMatch[1].trim() : respuestaIA;
        responderConVoz(respuestaFinal);
    }
};

recognition.onend = () => { 
    if (sistemaIniciado && !iaHablando) {
        try { recognition.start(); } catch (e) {} 
    } 
};

// 5. CEREBRO DE JOSÉ (API GROQ)
async function consultarIA(frase, contextoActual) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${API_KEY_GROQ}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Modelo optimizado para velocidad
                messages: [
                    {
                        role: "system",
                        content: `Eres José, asistente de la UDB. Sé breve (1 frase). 
                        MAPA DE DIAPOSITIVAS: ${mapaDiapositivas.substring(0, 500)}
                        FORMATO: VOZ: [Tu respuesta]`
                    },
                    { role: "user", content: `Contexto actual: ${contextoActual}. Usuario dice: ${frase}` }
                ],
                temperature: 0.4
            })
        });

        if (response.status === 401) {
            localStorage.removeItem('GROQ_KEY');
            return "VOZ: La llave API es incorrecta.";
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "VOZ: Error de conexión con mi cerebro virtual."; }
}

// 6. INICIALIZACIÓN POR INTERACCIÓN
const iniciarJose = () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        mapaDiapositivas = Array.from(slides).map((s, i) => {
            let t = s.querySelector('h1, h2')?.innerText || "Slide " + i;
            return `P${i}: ${t}`;
        }).join('| ');

        sistemaIniciado = true;
        responderConVoz("José activado. Estoy listo para la presentación.");
        console.log("✅ JOSÉ INICIADO");
    }
};

// Se activa al hacer clic o presionar una tecla (requisito del navegador)
document.addEventListener('click', iniciarJose, { once: true });
document.addEventListener('keydown', iniciarJose, { once: true });































