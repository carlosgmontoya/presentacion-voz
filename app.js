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

// --- ➕ BOTONES DE RESPALDO (Vuelven a estar aquí) ---
const contenedorBotones = document.createElement('div');
contenedorBotones.style = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; gap: 10px;";
contenedorBotones.innerHTML = `
    <button id="btn-prev" style="padding: 12px 20px; cursor: pointer; border-radius: 8px; border: none; background: rgba(0,0,0,0.7); color: white; font-weight: bold; backdrop-filter: blur(5px);">⬅️ ATRÁS</button>
    <button id="btn-next" style="padding: 12px 20px; cursor: pointer; border-radius: 8px; border: none; background: rgba(0,0,0,0.7); color: white; font-weight: bold; backdrop-filter: blur(5px);">SIGUIENTE ➡️</button>
`;
document.body.appendChild(contenedorBotones);
document.getElementById('btn-prev').onclick = () => { console.log("🔘 Botón Atrás presionado"); Reveal.prev(); };
document.getElementById('btn-next').onclick = () => { console.log("🔘 Botón Siguiente presionado"); Reveal.next(); };

// 2. SALIDA DE VOZ (TTS)
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

// 3. RECONOCIMIENTO DE VOZ (STT)
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
                        content: `Eres Robin, un asistente amable. No uses nombres de personas.
                        REGLA DE ORO: La primera diapositiva (inicio) es la 0.
                        MAPA: ${mapaDiapositivas}
                        FORMATO: ACCION: [IR_A_X, SIGUIENTE, ATRAS, LEER, NADA] / VOZ: [Tu respuesta]`
                    },
                    { role: "user", content: `Contexto: ${contextoActual}. Comando: ${frase}` }
                ],
                temperature: 0.3
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "ACCION: NADA\nVOZ: Error de conexión."; }
}

// 5. CONTROLADOR DE ACCIONES - REGISTRO TÉCNICO
function procesarAccion(rawResponse) {
    const accionMatch = rawResponse.match(/ACCION:\s*(.*)/i);
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
        console.log("%c🚀 EJECUTANDO: Reveal.next()", "color: #e67e22; font-weight: bold;");
        Reveal.next();
    } else if (accion === "ATRAS") {
        console.log("%c🚀 EJECUTANDO: Reveal.prev()", "color: #e67e22; font-weight: bold;");
        Reveal.prev();
    } else if (accion === "LEER") {
        const textoReal = document.querySelector('.reveal .present').innerText;
        console.log("%c📖 LEYENDO DIAPOSITIVA...", "color: #2ecc71; font-weight: bold;");
        voz = voz + ". Dice lo siguiente: " + textoReal; 
    }
    if (voz) responderConVoz(voz);
}

// 6. INICIO
document.body.onclick = () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        mapaDiapositivas = Array.from(slides).map((s, i) => {
            let titulo = s.querySelector('h1, h2, h3')?.innerText || s.innerText.substring(0, 40);
            return `Índice ${i}: ${titulo.replace(/\n/g, " ")}`;
        }).join('\n');
        sistemaIniciado = true;
        console.log("%c🗺️ MAPA GENERADO", "background: #2ecc71; color: white; padding: 2px 5px;");
        responderConVoz("Hola, soy Robin. He analizado tu presentación y estoy listo.");
    }
};























