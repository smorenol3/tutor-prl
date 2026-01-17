// ===== CONFIGURACIÓN =====
// Reemplaza estas variables con tus valores reales
const WORKER_URL = "https://tutor-prl-backend.s-morenoleiva91.workers.dev/";
const OPENROUTER_API_KEY = "tu_api_key_aqui"; // ← REEMPLAZAR
const MODEL_ID = "openrouter/auto"; // ← O especifica un modelo

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

// ===== VARIABLES GLOBALES =====
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// Historial de mensajes en formato OpenAI/OpenRouter
const messages = [
  { role: "system", content: SYSTEM_PROMPT }
];

// Estado del usuario
let userState = {
  role: null,
  experience: null,
  testScore: 0,
  currentLevel: null,
  messagesCount: 0
};

// ===== FUNCIONES AUXILIARES =====

/**
 * Función para pintar mensajes en pantalla
 */
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

/**
 * Llama al backend (Worker) en lugar de OpenRouter
 */
async function callBackend(messages) {
  const response = await fetch(`${WORKER_URL}`, {
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

/**
 * Llama a la API de OpenRouter (alternativa)
 */
async function callOpenRouter(messages) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
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
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Extrae el rol del usuario del historial de chat
 */
function getUserRole() {
  return userState.role || "desconocido";
}

/**
 * Extrae la experiencia del usuario del historial de chat
 */
function getUserExperience() {
  return userState.experience || "desconocida";
}

/**
 * Obtiene la puntuación del test
 */
function getTestScore() {
  return userState.testScore;
}

/**
 * Obtiene el nivel actual del usuario
 */
function getCurrentLevel() {
  if (userState.testScore <= 2) return "BÁSICO";
  if (userState.testScore <= 4) return "MEDIO";
  return "AVANZADO";
}

/**
 * Guarda el progreso en localStorage
 */
function saveProgress() {
  const progress = {
    role: getUserRole(),
    experience: getUserExperience(),
    testScore: getTestScore(),
    currentLevel: getCurrentLevel(),
    messages: messages.slice(1, 51)  // Excluir system prompt, últimos 50 mensajes
  };
  localStorage.setItem('tutorPRL_progress', JSON.stringify(progress));
}

/**
 * Carga el progreso desde localStorage
 */
function loadProgress() {
  const saved = localStorage.getItem('tutorPRL_progress');
  if (saved) {
    try {
      const progress = JSON.parse(saved);
      
      // Restaurar estado del usuario
      userState.role = progress.role;
      userState.experience = progress.experience;
      userState.testScore = progress.testScore;
      userState.currentLevel = progress.currentLevel;
      
      // Restaurar mensajes si existen
      if (progress.messages && Array.isArray(progress.messages)) {
        progress.messages.forEach(msg => {
          messages.push(msg);
          if (msg.role === 'user') addMessage(msg.content, 'user');
          else if (msg.role === 'assistant') addMessage(msg.content, 'bot');
        });
      }
    } catch (err) {
      console.error("Error al cargar progreso:", err);
    }
  }
}

/**
 * Borra el progreso guardado
 */
function clearProgress() {
  localStorage.removeItem('tutorPRL_progress');
  location.reload();
}

// ===== INICIALIZACIÓN =====

// Cargar progreso al iniciar
loadProgress();

// Mensaje inicial del tutor (solo si es primera vez)
if (messages.length === 1) {
  addMessage("Hola, soy tu tutor de PRL en entorno financiero. Para empezar, cuéntame tu rol (comercial, back-office, IT…) y tu experiencia en PRL (baja, media, alta).", "bot");
}

// ===== EVENT LISTENERS =====

/**
 * Manejo del envío del formulario
 */
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
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo

  // Llamar a la API (elige una de las dos opciones)
  try {
    // Opción 1: Usar el backend (Worker)
    const reply = await callBackend(messages);
    
    // Opción 2: Usar OpenRouter (descomenta si prefieres)
    // const reply = await callOpenRouter(messages);
    
    if (reply) {
      messages.push({ role: "assistant", content: reply });
      addMessage(reply, "bot");
      saveProgress(); // Guardar después de cada respuesta
    } else {
      addMessage("No he podido generar respuesta en este momento.", "bot");
    }
  } catch (err) {
    console.error("Error:", err);
    addMessage("Ha ocurrido un error al contactar con el tutor. Por favor, intenta de nuevo.", "bot");
  } finally {
    chatForm.querySelector("button").disabled = false;
  }
});

// Guardar progreso cada 10 segundos
setInterval(saveProgress, 10000);
