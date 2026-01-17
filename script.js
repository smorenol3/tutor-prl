// ⚠️ PON AQUÍ TU API KEY DE OPENROUTER (solo para prototipo, no para producción)
const OPENROUTER_API_KEY = "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";

// Modelo gratuito (ajusta si usas otro)
const MODEL_ID = "tngtech/deepseek-r1t2-chimera:free"; // ejemplo de modelo gratis

// Prompt base del tutor PRL adaptativo
const SYSTEM_PROMPT = `
Eres un tutor inteligente adaptativo de Prevención de Riesgos Laborales (PRL) para empleados de una empresa financiera (oficina, sucursal, call center).

Objetivo: ayudar al usuario a aprender PRL de forma personalizada, evaluando su nivel y adaptando explicaciones, ejemplos y preguntas.

Reglas:
1) Empieza siempre pidiendo al usuario:
   - Su rol (comercial, back‑office, IT, etc.).
   - Su experiencia en PRL (baja, media, alta).
2) A continuación, realiza un test diagnóstico de 5 preguntas tipo opción múltiple (A, B, C) sobre PRL básica.
   - Muestra una pregunta cada vez.
   - Después de cada respuesta, indica si es correcta y explica brevemente por qué.
3) En función de los aciertos del test diagnóstico:
   - 0–2 aciertos → nivel básico: explica los conceptos muy paso a paso, con lenguaje sencillo y ejemplos de oficina.
   - 3–4 aciertos → nivel medio: haz recordatorios breves y céntrate en casos prácticos.
   - 5 aciertos → nivel avanzado: profundiza en detalles normativos y casos más complejos.
4) Para cada tema importante de PRL (por ejemplo, ergonomía en oficina, caídas, riesgos eléctricos, trabajo con pantallas):
   - Explica el concepto adaptado al nivel del usuario.
   - Pon al menos un ejemplo situado en una sucursal bancaria u oficina.
   - Formula un mini‑quiz de 3 preguntas (A, B, C), mostrando una a una y esperando la respuesta.
   - Si el usuario falla 2 o más preguntas, vuelve a explicar el tema con más ejemplos y formula otras 3 preguntas diferentes.
5) Mantén un tono claro, respetuoso y motivador.
6) Al final de la conversación, genera un resumen con:
   - Puntos fuertes del usuario.
   - Temas donde ha tenido más errores.
   - Recomendaciones de qué módulos de PRL debería repasar y con qué prioridad.

Responde siempre en español y habla al usuario de tú.
`;

const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// Historial de mensajes en formato OpenAI/OpenRouter
const messages = [
  { role: "system", content: SYSTEM_PROMPT }
];

// Función para pintar mensajes en pantalla
function addMessage(text, sender = "bot") {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.textContent = text;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Mensaje inicial del tutor
addMessage("Hola, soy tu tutor de PRL en entorno financiero. Para empezar, cuéntame tu rol (comercial, back-office, IT…) y tu experiencia en PRL (baja, media, alta).", "bot");

// Manejo del envío del formulario
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // Mostrar mensaje del usuario
  addMessage(text, "user");
  userInput.value = "";
  chatForm.querySelector("button").disabled = true;

  // Añadir mensaje del usuario al historial
  messages.push({ role: "user", content: text });

  // Llamar a la API de OpenRouter
  try {
    const reply = await callOpenRouter(messages);
    if (reply) {
      messages.push({ role: "assistant", content: reply });
      addMessage(reply, "bot");
    } else {
      addMessage("No he podido generar respuesta en este momento.", "bot");
    }
  } catch (err) {
    console.error(err);
    addMessage("Ha ocurrido un error al contactar con el tutor.", "bot");
  } finally {
    chatForm.querySelector("button").disabled = false;
  }
});

// Función que llama a la API de OpenRouter
async function callOpenRouter(messages) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      // Opcionales pero recomendados por OpenRouter
      "HTTP-Referer": "https://github.com/smorenol3/tutor-prl.git",
      "X-Title": "Tutor PRL Financiero"
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: messages,
      stream: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Error API:", text);
    throw new Error("Error en la API");
  }

  const data = await response.json();
  // Formato estándar tipo OpenAI/OpenRouter [web:102][web:103]
  return data.choices?.[0]?.message?.content || "";
}
