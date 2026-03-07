// 1. CONFIGURACIÓN
let API_KEY_GROQ = prompt("Introduce tu API KEY de Groq:");
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;

// 2. RECONOCIMIENTO DE VOZ (STT)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

// FUNCIÓN CLAVE: Reinicio seguro con tiempo de espera largo
function reiniciarMicrofono() {
    if (sistemaIniciado && !iaHablando) {
        // En Edge, un delay de 2.5s evita el error 'network'
        setTimeout(() => {
            try {
                recognition.start();
                console.log("%c 🎤 Escuchando...", "color: #2ecc71;");
            } catch (e) {
                // Si ya está corriendo, no hacemos nada
            }
        }, 2500);
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("👂 Escuchado:", text);

    if (!text.includes("josé") && !text.includes("jose")) return;

    // Lógica de IA...
    const comando = text.replace(/josé|jose/g, "").trim();
    const respuesta = await consultarIA(comando, "Contexto de prueba");
    responderConVoz(respuesta);
};

recognition.onerror = (e) => {
    if (e.error === 'network') {
        console.warn("⚠️ Edge perdió conexión con el servidor de voz. Reintentando...");
    }
    reiniciarMicrofono();
};

recognition.onend = () => {
    if (!iaHablando) reiniciarMicrofono();
};

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje.replace("VOZ: ", ""));
    lectura.lang = 'es-ES';

    lectura.onstart = () => {
        iaHablando = true;
        try { recognition.stop(); } catch(e) {}
    };

    lectura.onend = () => {
        iaHablando = false;
        reiniciarMicrofono();
    };
    window.speechSynthesis.speak(lectura);
}

// 4. CONSULTA IA
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
                    {role: "system", content: "Eres José. Responde corto."},
                    {role: "user", content: frase}
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "Error de conexión con la IA."; }
}

// 5. INICIALIZACIÓN
document.addEventListener('click', () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        reiniciarMicrofono(); // Arrancamos el micro aquí
        responderConVoz("Sistema iniciado en Edge.");
    }
}, { once: true });





































