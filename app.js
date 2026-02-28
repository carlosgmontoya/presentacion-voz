// 1. CONFIGURACIÓN
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY');
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

let iaHablando = false;
let sistemaIniciado = false;
let mapaDiapositivas = ""; 

// 2. SALIDA DE VOZ (TTS) - PRIORIDAD ALTA
function responderConVoz(mensaje) {
    if (!mensaje) return;
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

// 3. RECONOCIMIENTO (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    if (text.includes("robin") || text.includes("robín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA:", text);
        const comando = text.replace(/robin|robín|rubén/g, "").trim();
        const slideTexto = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comando, slideTexto);
        procesarAccion(respuestaIA);
    }
};

// 4. CEREBRO DE ROBIN (SIMPLIFICADO PARA ENTENDIMIENTO TOTAL)
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Eres Robin, asistente de Carlos. Tu misión es ayudar con la presentación.
                        MAPA: ${mapaDiapositivas}
                        REGLA: Portada/Inicio es siempre Diapositiva 0.
                        
                        FORMATO DE RESPUESTA:
                        ACCION: [IR_A_X, SIGUIENTE, ATRAS, LEER, NADA]
                        VOZ: [Tu respuesta amable o explicación breve]`
                    },
                    { role: "user", content: `Slide actual: ${contexto}. Carlos dice: ${frase}` }
                ],
                temperature: 0.4
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "ACCION: NADA\nVOZ: Error de conexión."; }
}

// 5. CONTROLADOR DE ACCIONES
function procesarAccion(raw) {
    const lineas = raw.split('\n');
    let accion = "NADA";
    let voz = "";

    lineas.forEach(l => {
        if (l.toUpperCase().startsWith("ACCION:")) accion = l.replace(/ACCION:/i, "").trim().toUpperCase();
        if (l.toUpperCase().startsWith("VOZ:")) voz = l.replace(/VOZ:/i, "").trim();
    });

    // Ejecutar movimiento
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

    // SIEMPRE HABLAR (Incluso si explica conclusiones o temas)
    responderConVoz(voz || "Entendido, Carlos.");
}

// 6. INICIO
document.body.onclick = () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        mapaDiapositivas = Array.from(slides).map((s, i) => `Slide ${i}: ${s.innerText.substring(0, 50)}`).join('\n');
        sistemaIniciado = true;
        responderConVoz("Sistema listo. ¿Qué diapositiva vemos ahora?");
    }
};





















