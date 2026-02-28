// 1. CONFIGURACIÓN
const API_KEY_GROQ = localStorage.getItem('GROQ_KEY');
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!API_KEY_GROQ) {
    const userKey = prompt("Introduce tu API KEY de Groq:");
    if (userKey) { localStorage.setItem('GROQ_KEY', userKey); location.reload(); }
}

let iaHablando = false;
let sistemaIniciado = false;
let mapaDiapositivas = ""; 

// --- BOTONES DE RESPALDO ---
const botones = document.createElement('div');
botones.style = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; gap: 10px;";
botones.innerHTML = `
    <button id="btn-prev" style="padding: 10px 20px; cursor: pointer; border-radius: 5px; border: none; background: #333; color: white;">⬅️ ATRÁS</button>
    <button id="btn-next" style="padding: 10px 20px; cursor: pointer; border-radius: 5px; border: none; background: #333; color: white;">SIGUIENTE ➡️</button>
`;
document.body.appendChild(botones);
document.getElementById('btn-prev').onclick = () => Reveal.prev();
document.getElementById('btn-next').onclick = () => Reveal.next();

// 2. RECONOCIMIENTO DE VOZ
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onend = () => {
    if (sistemaIniciado && !iaHablando) try { recognition.start(); } catch (e) {}
};

// 3. SALIDA DE VOZ
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

// 4. LÓGICA DE ESCUCHA
recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín") || text.includes("rubén")) {
        console.log("🔔 LLAMADA DETECTADA:", text);
        const comando = text.replace(/robin|robín|rubín|rubén/g, "").trim();
        
        const slideElement = document.querySelector('.reveal .present');
        const slideTexto = slideElement ? slideElement.innerText : "";
        
        const respuestaIA = await consultarIA(comando, slideTexto);
        procesarAccion(respuestaIA);
    }
};

// 5. CONEXIÓN CON GROQ (PERSONALIDAD AMABLE)
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
                        content: `Eres Robin, un asistente amable y carismático para Carlos.
                        MAPA DE DIAPOSITIVAS: ${mapaDiapositivas}
                        
                        TAREAS:
                        1. Si pide LEER: responde "ACCION_LEER".
                        2. Si pide IR a un tema: responde "IR_A_X" (X es el índice). La primera es 0.
                        3. Si pide SIGUIENTE/ATRÁS: responde solo "SIGUIENTE" o "ATRAS".
                        4. Para lo demás: conversa de forma muy amable y breve (máx 20 palabras).`
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.6
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (e) { return "ERROR"; }
}

// 6. CONTROLADOR DE ACCIONES
function procesarAccion(res) {
    console.log("🤖 Robin decidió:", res);
    const resUpper = res.toUpperCase();

    if (resUpper === "ACCION_LEER") {
        const texto = document.querySelector('.reveal .present').innerText;
        responderConVoz("Con mucho gusto. Aquí dice: " + texto);
        return;
    }

    if (resUpper.includes("IR_A_")) {
        const idx = parseInt(resUpper.split("_").pop());
        if (!isNaN(idx)) {
            Reveal.slide(idx);
            responderConVoz("Hecho, Carlos. Ya estamos ahí.");
            return;
        }
    }

    if (resUpper === "SIGUIENTE") { Reveal.next(); responderConVoz("Avanzamos."); }
    else if (resUpper === "ATRAS") { Reveal.prev(); responderConVoz("Retrocedemos."); }
    else if (res !== "ERROR") { responderConVoz(res); }
}

// 7. INICIO
document.body.onclick = () => {
    if (!sistemaIniciado) {
        const slides = document.querySelectorAll('.reveal .slides section');
        mapaDiapositivas = Array.from(slides).map((s, i) => `Slide ${i}: ${s.innerText.substring(0, 40)}`).join('\n');
        sistemaIniciado = true;
        responderConVoz("Hola Carlos, soy Robin. Estoy listo para acompañarte.");
    }
};


















