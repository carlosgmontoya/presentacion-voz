// 1. CONFIGURACIÓN Y ESTADO
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
let mapaDiapositivas = ""; 

// --- BOTONES DE RESPALDO ---
const contenedorBotones = document.createElement('div');
contenedorBotones.style = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; gap: 10px;";
contenedorBotones.innerHTML = `
    <button id="btn-prev" style="padding: 12px 20px; cursor: pointer; border-radius: 8px; border: none; background: rgba(0,0,0,0.7); color: white; font-weight: bold; backdrop-filter: blur(5px);">⬅️ ATRÁS</button>
    <button id="btn-next" style="padding: 12px 20px; cursor: pointer; border-radius: 8px; border: none; background: rgba(0,0,0,0.7); color: white; font-weight: bold; backdrop-filter: blur(5px);">SIGUIENTE ➡️</button>
`;
document.body.appendChild(contenedorBotones);
document.getElementById('btn-prev').onclick = () => Reveal.prev();
document.getElementById('btn-next').onclick = () => Reveal.next();

// 2. SALIDA DE VOZ (TTS)
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

// 3. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    // Filtro de activación: Robin, Rubén, Rubín
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        const comandoLimpio = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        const slideActual = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, slideActual);
        procesarAccion(respuestaIA);
    }
};

recognition.onend = () => {
    if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch (e) {}
};

// 5. CEREBRO DE ROBIN (FORZANDO ÍNDICE CERO)
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
                        content: `Eres Robin, un asistente amable.
                        REGLA DE ORO: La primera diapositiva (portada/inicio) es la DIAPOSITIVA 0.
                        
                        MAPA DE LA PRESENTACIÓN:
                        ${mapaDiapositivas}
                        
                        INSTRUCCIONES DE FORMATO:
                        - Si piden la primera, el inicio, la portada o bienvenida: responde "ACCION: IR_A_0".
                        - Si piden otro tema: responde "ACCION: IR_A_X" (X es el número del mapa).
                        - Si piden leer: responde "ACCION: LEER".
                        - Si piden siguiente/atrás: responde "ACCION: SIGUIENTE" o "ACCION: ATRAS".
                        - VOZ: [Tu respuesta amable aquí]`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.2 // Precisión máxima
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "ACCION: NADA\nVOZ: Error de conexión."; }
}

// 6. CONTROLADOR DE ACCIONES (VALIDACIÓN DE ÍNDICE)
function procesarAccion(rawResponse) {
    const lineas = rawResponse.split('\n');
    let accion = "";
    let voz = "";

    lineas.forEach(l => {
        if (l.toUpperCase().startsWith("ACCION:")) accion = l.replace(/ACCION:/i, "").trim().toUpperCase();
        if (l.toUpperCase().startsWith("VOZ:")) voz = l.replace(/VOZ:/i, "").trim();
    });

    console.log("🤖 Robin decidió:", accion);

    // EJECUCIÓN TÉCNICA
    if (accion.startsWith("IR_A_")) {
        const idx = parseInt(accion.split("_").pop());
        if (!isNaN(idx)) {
            console.log("🚀 Saltando a diapositiva:", idx);
            Reveal.slide(idx); 
        }
    } else if (accion === "LEER") {
        const textoReal = document.querySelector('.reveal .present').innerText;
        responderConVoz(voz + " . " + textoReal);
        return;
    } else if (accion === "SIGUIENTE") {
        Reveal.next();
    } else if (accion === "ATRAS") {
        Reveal.prev();
    }

    if (voz) responderConVoz(voz);
}

// 7. INICIO
document.body.onclick = () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        mapaDiapositivas = Array.from(slides).map((s, i) => `Slide ${i}: ${s.innerText.substring(0, 60).replace(/\n/g, " ")}`).join('\n');
        sistemaIniciado = true;
        console.log("🗺️ Mapa generado.");
        responderConVoz("Hola Carlos, sistema listo. La primera diapositiva está cargada en el índice cero.");
    }
};



















