// 1. CONFIGURACIÓN Y ESTADO
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY');
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

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
document.getElementById('btn-prev').onclick = () => Reveal.prev();
document.getElementById('btn-next').onclick = () => Reveal.next();

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
        procesarAccion(respuestaIA, text); 
    }
};

recognition.onend = () => { if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch (e) {} };

// 5. CEREBRO DE ROBIN (AMABILIDAD + BREVEDAD)
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
                        content: `Eres Robin, un asistente amable y profesional. 
                        REGLAS:
                        1. Sé muy breve (máximo 2 frases).
                        2. Si saludan: Acción SALUDO. Responde con calidez.
                        3. Si piden LEER: Acción LEER.
                        4. Si preguntan CONCEPTOS: Acción EXPLICAR.
                        5. Navegación: IR_A_0 (inicio), SIGUIENTE, ATRAS.
                        MAPA: ${mapaDiapositivas}
                        FORMATO: ACCION: [COMANDO] / VOZ: [Respuesta]`
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

// 6. CONTROLADOR DE ACCIONES
function procesarAccion(rawResponse, textoEscuchado) {
    const accionMatch = rawResponse.match(/ACCION:\s*([\w_]+)/i);
    const vozMatch = rawResponse.match(/VOZ:\s*(.*)/is);
    let accion = accionMatch ? accionMatch[1].trim().toUpperCase() : "NADA";
    let voz = vozMatch ? vozMatch[1].trim() : "";

    // Blindaje de lectura técnica
    if ((textoEscuchado.includes("leer") || textoEscuchado.includes("lea")) && !textoEscuchado.includes("explica")) {
        accion = "LEER";
    }

    console.log("%c🤖 IA DECIDIÓ: " + accion, "color: #3498db; font-weight: bold;");

    if (accion.startsWith("IR_A_")) {
        const idx = parseInt(accion.split("_").pop());
        if (!isNaN(idx)) Reveal.slide(idx);
    } else if (accion === "SIGUIENTE") {
        Reveal.next();
    } else if (accion === "ATRAS") {
        Reveal.prev();
    } else if (accion === "LEER") {
        const textoReal = document.querySelector('.reveal .present').innerText;
        voz = "En esta diapositiva dice: " + textoReal;
    }
    
    // Si la acción es SALUDO o EXPLICAR, usamos directamente la 'voz' que generó la IA
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
        responderConVoz("Hola, soy Robin. Estoy listo para asistirle.");
    }
};

























