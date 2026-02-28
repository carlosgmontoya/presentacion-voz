// 1. CONFIGURACIÓN Y ESTADO
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY');
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!API_KEY_GROQ) {
    const userKey = prompt("Introduce tu API KEY de Groq:");
    if (userKey) { localStorage.setItem('GROQ_KEY', userKey); location.reload(); }
}

let iaHablando = false;
let sistemaIniciado = false;
let mapaDiapositivas = ""; 

// 2. SALIDA DE VOZ (TTS) - REGISTRO EN CONSOLA
function responderConVoz(mensaje) {
    if (!mensaje) return;
    
    // MUESTRA LO QUE ROBIN LOCUTA
    console.log("%c🗣️ ROBIN DICE: " + mensaje, "color: #9b59b6; font-weight: bold;"); 

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

// 3. RECONOCIMIENTO DE VOZ (STT) - REGISTRO EN CONSOLA
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    // REGISTRO DE TODO LO ESCUCHADO
    console.log("%c👂 ESCUCHADO: " + text, "color: #7f8c8d; font-style: italic;");

    if (text.includes("robin") || text.includes("robín") || text.includes("rubén")) {
        // RESALTA LA LLAMADA DETECTADA
        console.log("%c🔔 LLAMADA DETECTADA: " + text, "color: #f1c40f; font-weight: bold; border-left: 4px solid #f1c40f; padding-left: 5px;"); 
        
        const comandoLimpio = text.replace(/robin|robín|rubén/g, "").trim();
        const slideActual = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, slideActual);
        procesarAccion(respuestaIA);
    }
};

recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch (e) {} };

// 4. CEREBRO DE ROBIN (AMABILIDAD Y MAPA)
async function consultarIA(frase, contextoActual) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Eres Robin, un asistente amable y profesional. No uses nombres de personas.
                        REGLA DE ORO: La primera diapositiva (inicio) es la 0.
                        MAPA DE LA PRESENTACIÓN:
                        ${mapaDiapositivas}
                        
                        RESPONDE SIEMPRE EN ESTE FORMATO:
                        ACCION: [SIGUIENTE, ATRAS, IR_A_X, LEER, NADA]
                        VOZ: [Tu respuesta amable y breve]`
                    },
                    { role: "user", content: `Contexto: ${contextoActual}. Usuario dice: ${frase}` }
                ],
                temperature: 0.3
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "ACCION: NADA\nVOZ: Lo siento, hubo un error de conexión."; }
}

// 5. CONTROLADOR DE ACCIONES - REGISTRO TÉ






















