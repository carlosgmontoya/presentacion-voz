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

// 2. SALIDA DE VOZ (TTS) - REFORZADA
function responderConVoz(mensaje) {
    if (!mensaje) return;
    console.log("🗣️ Robin dice:", mensaje);
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';
    lectura.rate = 1.0; 
    
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
    
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        const slideActual = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, slideActual);
        procesarAccion(respuestaIA);
    }
};

recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch (e) {} };

// 4. CEREBRO DE ROBIN (AMABILIDAD Y REGLA DEL CERO)
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
                        content: `Eres Robin, un asistente muy amable, carismático y educado.
                        REGLA DE ORO: La primera diapositiva (inicio/portada) es la DIAPOSITIVA 0.
                        
                        MAPA ACTUAL:
                        ${mapaDiapositivas}
                        
                        FORMATO DE RESPUESTA OBLIGATORIO:
                        ACCION: [SIGUIENTE, ATRAS, IR_A_X, LEER, NADA]
                        VOZ: [Tu respuesta amable, carismática y completa para Carlos]`
                    },
                    { role: "user", content: `Slide actual: ${contextoActual}. Usuario dice: ${frase}` }
                ],
                temperature: 0.5 // Subimos un poco para recuperar carisma
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "ACCION: NADA\nVOZ: Lo siento Carlos, mi conexión ha fallado."; }
}

// 5. CONTROLADOR DE ACCIONES (PRECISIÓN Y VOZ)
function procesarAccion(rawResponse) {
    const lineas = rawResponse.split('\n');
    let accion = "NADA";
    let voz = "";

    lineas.forEach(l => {
        if (l.toUpperCase().startsWith("ACCION:")) accion = l.replace(/ACCION:/i, "").trim().toUpperCase();
        if (l.toUpperCase().startsWith("VOZ:")) voz = l.replace(/VOZ:/i, "").trim();
    });

    console.log("🤖 Robin analizó:", accion);

    // 1. Ejecutar Acción Técnica
    if (accion.startsWith("IR_A_")) {
        const idx = parseInt(accion.split("_").pop());
        if (!isNaN(idx)) Reveal.slide(idx);
    } else if (accion === "SIGUIENTE") {
        Reveal.next();
    } else if (accion === "ATRAS") {
        Reveal.prev();
    } else if (accion === "LEER") {
        const textoReal = document.querySelector('.reveal .present').innerText;
        voz = voz + " . " + textoReal;
    }

    // 2. SIEMPRE responder con voz (Amabilidad garantizada)
    if (voz) {
        responderConVoz(voz);
    } else {
        responderConVoz("Claro Carlos, ¿en qué más puedo ayudarte?");
    }
}

// 6. INICIO
document.body.onclick = () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        mapaDiapositivas = Array.from(slides).map((s, i) => `Slide ${i}: ${s.innerText.substring(0, 60)}`).join('\n');
        sistemaIniciado = true;
        responderConVoz("¡Hola Carlos! Ya estoy vinculado y listo para ayudarte con tu presentación. ¿Por dónde empezamos?");
    }
};




















