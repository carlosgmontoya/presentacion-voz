// CONFIGURACIÓN GROQ MULTIMODAL
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY'); // Busca la llave en el navegador
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!API_KEY_GROQ) {
    const userKey = prompt("Por favor, introduce tu API KEY de Groq para activar el control por voz:");
    if (userKey) {
        localStorage.setItem('GROQ_KEY', userKey);
        location.reload();
    }
}

// 2. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

// Reinicio automático infinito del micrófono
recognition.onend = () => {
    try { recognition.start(); } catch (e) {}
};

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    lectura.rate = 1.1;

    // Gestión de colisiones: Apagar micro mientras la IA habla
    lectura.onstart = () => recognition.stop();
    lectura.onend = () => { try { recognition.start(); } catch (e) {} };

    window.speechSynthesis.speak(lectura);
}

// 4. LÓGICA PRINCIPAL
recognition.onresult = async (event) => {
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("🎤 Usuario:", text);

    const contenidoSlide = document.querySelector('.reveal .present').innerText || "";

    const respuestaIA = await consultarIA(text, contenidoSlide);
    procesarAccion(respuestaIA);
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
                        content: `Eres un asistente de voz. 
                        REGLAS:
                        - Si piden avanzar/siguiente: responde SOLO "SIGUIENTE".
                        - Si piden retroceder/atrás: responde SOLO "ATRAS".
                        - Si piden la última/final: responde SOLO "ULTIMA".
                        - Si piden inicio: responde SOLO "INICIO".
                        - Si preguntan sobre el contenido, responde de forma amable y CORTA (máximo 15 palabras).
                        CONTENIDO: ${contexto}` 
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.2
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) { return "ERROR"; }
}

// 6. CONTROLADOR DE REVEAL.JS
function procesarAccion(res) {
    console.log("🤖 IA decidió:", res);

    if (res.includes("SIGUIENTE")) {
        responderConVoz("Siguiente.");
        Reveal.next();
    } else if (res.includes("ATRAS")) {
        responderConVoz("Atrás.");
        Reveal.prev();
    } else if (res.includes("INICIO")) {
        responderConVoz("Al inicio.");
        Reveal.slide(0);
    } else if (res.includes("ULTIMA")) {
        responderConVoz("Al final.");
        Reveal.slide(Reveal.getTotalSlides());
    } else if (res !== "ERROR") {
        // Responder a preguntas sobre la slide
        responderConVoz(res.toLowerCase());
    }
}

// 7. INICIO MANUAL (Requisito del navegador)
document.body.onclick = () => {
    responderConVoz("Sistema listo. Control por voz activo.");
};