// Tu URL del Worker (cámbiala por la tuya)
const WORKER_URL = "https://tutor-prl-backend.s-morenoleiva91.workers.dev/";

async function callMyBackend(messages) {
  const response = await fetch(`${WORKER_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  
  if (!response.ok) {
    throw new Error('Error en el backend');
  }
  
  const data = await response.json();
  return data.reply;
}

chatForm.addEventListener("submit", async (e) => {  // ← async aquí
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;


// Prompt base del tutor PRL adaptativo
const SYSTEM_PROMPT = `Eres un tutor inteligente adaptativo de Prevención de Riesgos Laborales (PRL) para empleados de una empresa financiera (oficina, sucursal, call center).

Objetivo: ayudar al usuario a aprender PRL de forma personalizada, evaluando su nivel y adaptando explicaciones, ejemplos y preguntas.

REGLAS DE CONVERSACIÓN MUY IMPORTANTES:
- La conversación es por TURNOS.
- En cada turno SOLO haces UNA pregunta.
- Nunca muestres la respuesta correcta ANTES de que el usuario responda.
- Siempre espera a que el usuario responda con A, B o C cuando le hayas dado opciones.
- No inventes otras letras ni otros formatos.

FLUJO GENERAL:
1) PRIMER MENSAJE:
   - Pregunta SIEMPRE:
     a) Su rol (comercial, back-office, IT, etc.).
     b) Su experiencia en PRL (baja, media, alta).
   - No hagas todavía test, solo recoge esa información.

2) TEST DIAGNÓSTICO DE 5 PREGUNTAS:
   - Después de conocer rol y experiencia, lanza un test de 5 preguntas tipo opción múltiple (A, B, C, D) sobre PRL básica.
   - Para cada pregunta:
     a) Muestra SOLO la pregunta y las opciones A, B, C, D.
     b) Escribe al final un salto de linea y: "Elige A, B, C o D."
     c) Espera la respuesta del usuario.
     d) Cuando el usuario responda, di si es correcta o no y EXPLICA brevemente por qué.
     e) NO lances la siguiente pregunta hasta después de explicar la anterior.

3) CLASIFICACIÓN DEL NIVEL:
   - Cuenta internamente cuántas respuestas correctas ha dado el usuario.
   - En función de los aciertos:
     - 0–2 aciertos → nivel BÁSICO: explica los conceptos paso a paso, con lenguaje sencillo y ejemplos de oficina.
     - 3–4 aciertos → nivel MEDIO: haz recordatorios breves y céntrate en casos prácticos.
     - 5 aciertos → nivel AVANZADO: profundiza en detalles normativos y casos complejos.

4) DESARROLLO DE TEMAS:
   Para cada tema importante de PRL (por ejemplo, ergonomía en oficina, caídas, riesgos eléctricos, trabajo con pantallas):
   - Explica el concepto adaptado al nivel detectado.
   - Pon al menos un ejemplo en una sucursal bancaria u oficina.
   - Formula un mini-quiz de 5 preguntas tipo A, B, C, D:
     a) De nuevo, una pregunta cada vez.
     b) Espera la respuesta del usuario.
     c) Di si es correcta o no y explica.
   - Si el usuario falla 3 o más de esas 5 preguntas, repite el tema con más ejemplos y haz otro mini-quiz diferente.

5) ESTILO:
   - Mantén un tono claro, respetuoso y motivador.
   - Habla al usuario de "tú".
   - NO uses emojis ni símbolos raros, solo texto.

6) CIERRE:
   - Al final de la conversación (si el usuario lo pide o se han visto varios temas), genera un resumen con:
     - Puntos fuertes del usuario.
     - Temas donde ha tenido más errores.
     - Recomendaciones de qué módulos de PRL debería repasar y con qué prioridad.

Responde siempre en español y sigue estrictamente este flujo de turnos.
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
  
  // Convertir saltos de línea en <br> y mejorar formato
  const formattedText = text
    .replace(/\n/g, '<br>')  // Saltos de línea
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Negritas
    .replace(/\*(.*?)\*/g, '<em>$1</em>');  // Cursiva
  
  div.innerHTML = formattedText;  // Usar innerHTML para formato HTML
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
// Pausa para evitar rate limits en modelos free
await new Promise(resolve => setTimeout(resolve, 6000)); // 6 segundos

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

// ===== GUARDADO DE PROGRESO =====
function saveProgress() {
  const progress = {
    role: getUserRole(),  // función para extraer del chat
    experience: getUserExperience(),
    testScore: getTestScore(),
    currentLevel: getCurrentLevel(),
    messages: messages.slice(0, 50)  // últimos 50 mensajes
  };
  localStorage.setItem('tutorPRL_progress', JSON.stringify(progress));
}

// Cargar progreso al iniciar
function loadProgress() {
  const saved = localStorage.getItem('tutorPRL_progress');
  if (saved) {
    const progress = JSON.parse(saved);
    // Restaurar mensajes si existen
    if (progress.messages) {
      progress.messages.forEach(msg => {
        if (msg.role === 'user') addMessage(msg.content, 'user');
        else if (msg.role === 'assistant') addMessage(msg.content, 'bot');
      });
    }
  }
}

// Botón para borrar progreso (añadir en HTML)
function clearProgress() {
  localStorage.removeItem('tutorPRL_progress');
  location.reload();
}

// Llamar al cargar página
loadProgress();

// Guardar cada 10 segundos
setInterval(saveProgress, 10000);


