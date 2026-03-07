// 1. CONFIGURACIÓN
let API_KEY_GROQ = prompt("Introduce tu API KEY de Groq:");
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
let iaHablando = false;
let sistemaIniciado = false;

const avatar = document.getElementById('jose-avatar');

// 2. RECONOCIMIENTO DE VOZ (STT)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

function reiniciarMicrofono() {
    if (sistemaIniciado && !iaHablando) {
        setTimeout(() => {
            try { 
                recognition.start(); 
                avatar.className = 'jose-escuchando';
                console.log("🎤 Micro Escuchando..."); 
            } catch(e) {}
        }, 2000); 
    }
}

recognition.onresult = async (event) => {
    if (iaHablando) return;
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("👂 José escuchó:", text);

    // 1. Creamos una versión "pura" de lo que escuchó el micro
    const ordenLimpia = text.replace(/josé|jose/g, "").trim();

    // 2. (Opcional pero recomendado) Para ver en consola si ahora sí lo detecta
    console.log("🔍 Orden sin nombre:", ordenLimpia);
    
    if (!text.includes("josé") && !text.includes("jose")) return;

    // --- NAVEGACIÓN MEJORADA ---
    //console.log("🔍 INVESTIGACIÓN:", {
    //original: text,
    //longitud: text.length,
    //tienePrincipio: text.includes("principio")
    //});
    
    if (ordenLimpia.includes("siguiente") || ordenLimpia.includes("sigamos") || ordenLimpia.includes("adelante")) {
        console.log("Sigamos adelante");
        window.Reveal.next();
        return;
    }
    if (ordenLimpia.includes("atrás") || ordenLimpia.includes("regresa") || ordenLimpia.includes("anterior")) {
        console.log("Regresando");
        window.Reveal.prev();
        return;
    }
    if (ordenLimpia.includes("inicio") || ordenLimpia.includes("primera") || ordenLimpia.includes("principio")) {
        console.log("Volviendo al inicio...");
        window.Reveal.slide(0);
        return;
    }
    if (ordenLimpia.includes("última") || ordenLimpia.includes("final")) {
        console.log("Vamos al final...");
        window.Reveal.slide(window.Reveal.getTotalSlides() - 1);
        return;
    }
    // --- IR A DIAPOSITIVA (Números y Letras) ---
    if (ordenLimpia.includes("diapositiva") || ordenLimpia.includes("lámina") || ordenLimpia.includes("página")) {
        // Mapa para traducir palabras comunes a números
        const numerosLetras = {
            "uno": 1, "primera": 1, "primero": 1,
            "dos": 2, "segunda": 2, "segundo": 2,
            "tres": 3, "tercera": 3, "tercero": 3,
            "cuatro": 4, "cuarta": 4,
            "cinco": 5, "quinta": 5
        };

    let num = null;

    // 1. Intentamos buscar un número físico (ej: "5")
    const coincidenciaDigito = ordenLimpia.match(/\d+/);
    if (coincidenciaDigito) {
        num = parseInt(coincidenciaDigito[0]);
    } else {
        // 2. Si no hay dígitos, buscamos si dijo la palabra (ej: "dos")
        Object.keys(numerosLetras).forEach(palabra => {
            if (ordenLimpia.includes(palabra)) {
                num = numerosLetras[palabra];
            }
        });
    }

    if (num !== null) {
        console.log(`🔢 Saltando a la diapositiva: ${num}`);
        window.Reveal.slide(num - 1); // Reveal usa índice 0 (0 es la primera)
        return;
    }
}

    // --- CONSULTA A GROQ ---
    const slideActual = document.querySelector('.reveal .present');
    const contenidoSlide = slideActual ? slideActual.innerText : "UDB Presentation";
    //const comandoLimpio = text.replace(/josé|jose/g, "").trim();

    avatar.className = 'jose-hablando';
    const respuesta = await consultarIA(ordenLimpia, contenidoSlide);
    responderConVoz(respuesta);
};

recognition.onend = () => { if (!iaHablando) reiniciarMicrofono(); };
recognition.onerror = (e) => { reiniciarMicrofono(); };

// 3. SALIDA DE VOZ (TTS)
function responderConVoz(mensaje) {
    if (!mensaje) return;
    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-ES';

    lectura.onstart = () => { 
        iaHablando = true; 
        avatar.className = 'jose-hablando';
        try { recognition.stop(); } catch(e) {} 
    };
    lectura.onend = () => { 
        iaHablando = false; 
        avatar.className = 'jose-idle';
        reiniciarMicrofono(); 
    };
    window.speechSynthesis.speak(lectura);
}

// 4. CEREBRO IA
async function consultarIA(frase, contexto) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY_GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {role: "system", content: "Eres José, asistente de la UDB. Responde muy breve basándote en la slide."},
                    {role: "user", content: `Slide: ${contexto}. Pregunta: ${frase}`}
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "Lo siento, tuve un pequeño error de conexión."; }
}

// 5. INICIALIZACIÓN
document.addEventListener('click', () => {
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        reiniciarMicrofono();
        responderConVoz("José activado. Estoy listo para ayudarte.");
    }
}, { once: true });




















































