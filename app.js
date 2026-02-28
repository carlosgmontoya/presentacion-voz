// 5. CONEXIÓN CON GROQ (LLAMA 3.3) - VERSIÓN ULTRA ESTRICTA
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
                        REGLAS CRÍTICAS DE NAVEGACIÓN:
                        1. Si el usuario pide retroceder, ir atrás o volver: responde SOLO "ATRAS".
                        2. Si el usuario pide avanzar o siguiente: responde SOLO "SIGUIENTE".
                        3. Si el usuario pide el inicio: responde SOLO "INICIO".
                        4. Para cualquier otra pregunta, responde amable en menos de 15 palabras usando este contenido: ${contexto}.
                        
                        ¡NO te confundas entre ATRAS y SIGUIENTE!` 
                    },
                    { role: "user", content: frase }
                ],
                temperature: 0.0 // Bajamos a 0 para que sea totalmente preciso y no "invente"
            })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim().toUpperCase();
    } catch (e) { 
        return "ERROR"; 
    }
}





