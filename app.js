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

// 2. BOTONES DE RESPALDO
const contenedorBotones = document.createElement('div');
contenedorBotones.style = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; gap: 10px;";
contenedorBotones.innerHTML = `
    <button id="btn-prev" style="padding: 12px 20px; cursor: pointer; border-radius: 8px; border: none; background: rgba(0,0,0,0.7); color: white; font-weight: bold; backdrop-filter: blur(5px);">⬅️ ATRÁS</button>
    <button id="btn-next" style="padding: 12px 20px; cursor: pointer; border-radius: 8px; border: none; background: rgba(0,0,0,0.7); color: white; font-weight: bold; backdrop-filter: blur(5px);">SIGUIENTE ➡️</button>
`;
document.body.appendChild(contenedorBotones);
document.getElementById('btn-prev').onclick = () => { console.log("🔘 Botón Atrás"); Reveal.prev(); };
document.getElementById('btn-next').onclick = () => { console.log("🔘 Botón Siguiente"); Reveal.next(); };

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
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

// 4. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("%c👂 ESCUCHADO: " + text, "color: #7f8c8d; font-style: italic;");

    if (text.includes("robin") || text.includes("robín") || text.includes("rubén")) {
        console.log("%c🔔 LLAMADA DETECTADA: " + text, "color: #f1c40f; font-weight: bold;");
        const comandoLimpio = text.replace(/robin|robín|rubén/g, "").trim();
        const slideActual = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, slideActual);
        procesarAccion(respuestaIA);
    }
};

recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch (e) {} };

// 5. CEREBRO DE ROBIN (AJUSTE: PRIORIDAD TOTAL A LA LECTURA REAL)
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
                        content: `Eres Robin, asistente amable. No uses nombres.
                        IMPORTANTE: Si el usuario pide LEER, tu acción DEBE ser obligatoriamente LEER. No resumas por tu cuenta.
                        REGLA DE ORO: La primera diapositiva (inicio) es la 0.
                        MAPA: ${mapaDiapositivas}
                        FORMATO: ACCION: [SIGUIENTE, ATRAS, IR_A_X, LEER, NADA] / VOZ: [Tu respuesta]`
                    },
                    { role: "user", content: `Contexto: ${contextoActual}. Usuario: ${frase}` }
                ],
                temperature: 0.2
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "ACCION: NADA\nVOZ: Error de conexión."; }
}

// 6. CONTROLADOR DE ACCIONES (BLOQUEO DE INVENCIÓN EN LECTURA)
function procesarAccion(rawResponse) {
    const accionMatch = rawResponse.match(/ACCION:\s*(\w+)/i);
    const vozMatch = rawResponse.match(/VOZ:\s*(.*)/is);
    let accion = accionMatch ? accionMatch[1].trim().toUpperCase() : "NADA";
    let voz = vozMatch ? vozMatch[1].trim() : "";

    console.log("%c🤖 IA DECIDIÓ: " + accion, "color: #3498db; font-weight: bold;");

    if (accion.startsWith("IR_A_")) {
        const idx = parseInt(accion.split("_").pop());
        if (!isNaN(idx)) {
            console.log("%c🚀 EJECUTANDO: Reveal.slide(" + idx + ")", "color: #e67e22; font-weight: bold;");
            Reveal.slide(idx); 
        }
    } else if (accion === "SIGUIENTE") {
        Reveal.next();
    } else if (accion === "ATRAS") {
        Reveal.prev();
    } else if (accion === "LEER" || rawResponse.toLowerCase().includes("leer")) {
        // AJUSTE: Si se detecta "leer", ignoramos el texto de la IA y capturamos la slide
        const textoReal = document.querySelector('.reveal .present').innerText;
        console.log("%c📖 CAPTURANDO TEXTO REAL DE LA DIAPOSITIVA...", "color: #2ecc71; font-weight: bold;");
        voz = "Claro, con gusto leo la diapositiva para usted: " + textoReal; 
    }
    if (voz) responderConVoz(voz);
}

// 7. INICIO
document.body.onclick = () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        mapaDiapositivas = Array.from(slides).map((s, i) => {
            let t = s.querySelector('h1, h2, h3')?.innerText || s.innerText.substring(0, 40);
            return `Índice ${i}: ${t.replace(/\n/g, " ")}`;
        }).join('\n');
        sistemaIniciado = true;
        console.log("%c🗺️ MAPA GENERADO", "background: #2ecc71; color: white; padding: 2px 5px;");
        responderConVoz("Hola, soy Robin. He analizado tu presentación y estoy listo.");
    }
};























