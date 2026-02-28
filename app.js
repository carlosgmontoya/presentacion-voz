// 1. CONFIGURACIÓN GROQ
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

// 2. RECONOCIMIENTO DE VOZ (STT)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onend = () => {
    if (sistemaIniciado && !iaHablando) {
        try { recognition.start(); } catch (e) {}
    }
};

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';

    lectura.onstart = () => {
        iaHablando = true;
        recognition.stop(); 
    };

    lectura.onend = () => {
        iaHablando = false;
        setTimeout(() => {
            if (sistemaIniciado) {
                try { recognition.start(); } catch (e) {}
            }
        }, 700);
    };

    window.speechSynthesis.speak(lectura);
}

// 4. LÓGICA DE ESCUCHA CON FILTRO DE NOMBRE "ROBIN"
recognition.onresult = async (event) => {
    if (iaHablando) return; 

    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    // FILTRO ESTRICTO: Solo si mencionas a Robin o variaciones fonéticas comunes
    if (text.includes("robin") || text.includes("robín") || text.includes("rubín")) {
        console.log("🎤 Robin activado por:", text);
        
        // Limpiamos el nombre para que la IA reciba solo la orden
        const comandoLimpio = text.replace(/robin|robín|rubín/g, "").trim();
        
        // Si después de decir "Robin" no dijiste nada más, no enviamos nada a la IA
        if (comandoLimpio.length < 2) {
            responderConVoz("¿Dime?");
            return;
        }

        const contenidoSlide = document.querySelector('.reveal .present').innerText || "";
        const respuestaIA = await consultarIA(comandoLimpio, contenidoSlide);
        procesarAccion(respuestaIA);
    } else {
        // Esto aparecerá en consola pero NO activará a la IA
        console.log("☁️ Ignorando conversación de fondo...");
    }
};

// 5. CONEXIÓN CON GROQ
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
                        content: `Tu nombre es Robin. Eres un asistente de voz.
                        REGLAS:
                        - Comandos: responde SOLO "SIGUIENTE", "ATRAS" o "INICIO".
                        - Preguntas: responde amable y muy breve (máx 15 palabras).
                        CONTENIDO: ${contexto}` 
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.1 // Bajamos la temperatura para que sea más preciso
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) { return "ERROR"; }
}

// 6. CONTROLADOR
function procesarAccion(res) {
    console.log("🤖 Robin decidió:", res);
    if (res.includes("SIGUIENTE")) { Reveal.next(); responderConVoz("Siguiente."); }
    else if (res.includes("ATRAS")) { Reveal.prev(); responderConVoz("Atrás."); }
    else if (res.includes("INICIO")) { Reveal.slide(0); responderConVoz("Al inicio."); }
    else if (res !== "ERROR") { responderConVoz(res.toLowerCase()); }
}

// 7. ACTIVACIÓN INICIAL
document.body.onclick = () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        responderConVoz("Robin activo.");
        console.log("✅ Sistema iniciado correctamente.");
    }
};


