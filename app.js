// 1. CONFIGURACIÓN INICIAL
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY');
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!API_KEY_GROQ) {
    const userKey = prompt("Introduce tu API KEY de Groq:");
    if (userKey) { localStorage.setItem('GROQ_KEY', userKey); location.reload(); }
}

let iaHablando = false;
let sistemaIniciado = false;
let mapaDiapositivas = ""; 

// 2. SALIDA DE VOZ (TTS) - AMABILIDAD CONSTANTE
function responderConVoz(mensaje) {
    if (!mensaje) return;
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

// 3. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    if (text.includes("robin") || text.includes("robín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        const comandoLimpio = text.replace(/robin|robín|rubén/g, "").trim();
        const slideActual = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, slideActual);
        procesarAccion(respuestaIA);
    }
};

recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch (e) {} };

// 4. CEREBRO DE ROBIN (NAVEGACIÓN POR MAPA Y EXPLICACIÓN BREVE)
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
                        content: `Eres Robin, un asistente de presentaciones amable y profesional. 
                        No uses nombres propios para dirigirte al usuario.
                        
                        MAPA DE LA PRESENTACIÓN (Úsalo para navegar):
                        ${mapaDiapositivas}
                        
                        REGLAS:
                        1. La diapositiva inicial/portada SIEMPRE es el índice 0.
                        2. Si piden EXPLICAR: sé muy breve (máximo 25 palabras).
                        3. FORMATO DE RESPUESTA OBLIGATORIO:
                           ACCION: [IR_A_X, SIGUIENTE, ATRAS, LEER, NADA]
                           VOZ: [Tu respuesta amable]`
                    },
                    { role: "user", content: `Contexto: ${contextoActual}. Usuario dice: ${frase}` }
                ],
                temperature: 0.3 // Equilibrio entre precisión y fluidez
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "ACCION: NADA\nVOZ: Lo siento, tuve un problema de conexión."; }
}

// 5. CONTROLADOR DE ACCIONES (PRECISIÓN TÉCNICA)
function procesarAccion(rawResponse) {
    const accionMatch = rawResponse.match(/ACCION:\s*(.*)/i);
    const vozMatch = rawResponse.match(/VOZ:\s*(.*)/is);

    let accion = accionMatch ? accionMatch[1].trim().toUpperCase() : "NADA";
    let voz = vozMatch ? vozMatch[1].trim() : "";

    console.log("🤖 Acción procesada:", accion);

    if (accion.startsWith("IR_A_")) {
        const idx = parseInt(accion.split("_").pop());
        if (!isNaN(idx)) Reveal.slide(idx);
    } else if (accion === "SIGUIENTE") {
        Reveal.next();
    } else if (accion === "ATRAS") {
        Reveal.prev();
    } else if (accion === "LEER") {
        const textoReal = document.querySelector('.reveal .present').innerText;
        voz = voz + ". Dice lo siguiente: " + textoReal;
    }

    if (voz) responderConVoz(voz);
}

// 6. ACTIVACIÓN Y GENERACIÓN DEL MAPA
document.body.onclick = () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        // Genera el mapa dinámico para que Robin sepa qué hay en cada slide
        mapaDiapositivas = Array.from(slides).map((s, i) => {
            let titulo = s.querySelector('h1, h2, h3')?.innerText || s.innerText.substring(0, 30);
            return `Índice ${i}: ${titulo.replace(/\n/g, " ")}`;
        }).join('\n');
        
        sistemaIniciado = true;
        responderConVoz("Hola, soy Robin. He analizado el mapa de tu presentación y estoy listo para asistirle.");
    }
};






















