// ===== CONFIGURACIÓN =====
// Reemplaza estas variables con tus valores reales
const WORKER_URL = "https://tutor-prl-backend.s-morenoleiva91.workers.dev";
//const OPENROUTER_API_KEY = "tu_api_key_aqui"; // ← REEMPLAZAR
//const MODEL_ID = "openrouter/auto"; // ← O especifica un modelo

// Pausa entre solicitudes (aumentada para evitar rate limits)
const REQUEST_DELAY_MS = 2000; // 2 segundos

// Prompt base del tutor PRL adaptativo
const SYSTEM_PROMPT = `Eres un tutor profesional de Prevención de Riesgos Laborales (PRL) para empleados de una empresa financiera.

REGLAS ABSOLUTAS (NUNCA VIOLAR):
1. NUNCA hagas preguntas abiertas. SOLO preguntas de opción múltiple (A, B, C, D)
2. NUNCA repitas preguntas que ya han sido respondidas
3. SIEMPRE explica un tema ANTES de hacer preguntas sobre él
4. NUNCA digas "voy a explicar" sin explicar realmente en ese mismo mensaje
5. Mantén un flujo lineal: EXPLICACIÓN → PREGUNTAS → SIGUIENTE TEMA

ESTRUCTURA DE RESPUESTAS:

Para EXPLICAR un tema:
- Sé claro y conciso
- Usa ejemplos de oficina/sucursal bancaria
- Explica en 3-5 párrafos máximo
- Termina con: "Ahora voy a hacerte una pregunta sobre esto."

Para HACER PREGUNTAS:
- SIEMPRE formato opción múltiple (A, B, C, D)
- UNA pregunta por turno
- Formato exacto:
  [PREGUNTA]
  A) [opción]
  B) [opción]
  C) [opción]
  D) [opción]
  
  Elige A, B, C o D.
- NUNCA hagas preguntas abiertas
- NUNCA hagas preguntas que requieran escribir mucho

Para RESPONDER a respuestas del usuario:
- Di si es correcta o no
- Explica brevemente por qué
- Luego pasa a la siguiente pregunta O siguiente tema

FLUJO DE CONVERSACIÓN DETALLADO:

FASE 1 - RECOPILACIÓN DE INFORMACIÓN (primer turno):
1. Pregunta: "¿Cuál es tu rol en la empresa? (comercial, back-office, IT, etc.)"
2. Espera respuesta
3. Pregunta: "¿Cuál es tu nivel de experiencia en PRL? (Baja, Media, Alta)"
4. Espera respuesta
5. Una vez tengas AMBOS datos, NUNCA vuelvas a preguntar esto
6. Pasa a FASE 2

FASE 2 - TEST DIAGNÓSTICO (5 preguntas):
1. Di: "Voy a hacerte un test diagnóstico de 5 preguntas para evaluar tu nivel actual."
2. Presenta PREGUNTA 1 (opción múltiple A, B, C, D)
3. Espera respuesta
4. Di si es correcta o no, explica brevemente
5. Presenta PREGUNTA 2
6. Espera respuesta
7. Di si es correcta o no, explica brevemente
8. [Repite para preguntas 3, 4, 5]
9. Después de la pregunta 5, cuenta los aciertos y clasifica el nivel:
   - 0-2 aciertos → BÁSICO
   - 3-4 aciertos → MEDIO
   - 5 aciertos → AVANZADO
10. Di el nivel y que vas a adaptar las explicaciones
11. Pasa a FASE 3

FASE 3 - DESARROLLO DE TEMAS (adaptado al nivel):
Para cada tema importante (ergonomía, caídas, riesgos eléctricos, trabajo con pantallas, etc.):

PASO 1 - EXPLICAR:
- Explica el tema en 3-5 párrafos
- Usa ejemplos de oficina/sucursal
- Sé claro y adaptado al nivel del usuario
- Termina con: "Ahora voy a hacerte una pregunta sobre esto."

PASO 2 - PREGUNTAS:
- Haz 5 preguntas de opción múltiple (A, B, C, D)
- UNA pregunta por turno
- Espera respuesta
- Di si es correcta o no, explica brevemente
- Luego presenta la siguiente pregunta

PASO 3 - EVALUAR:
- Cuenta los aciertos en este mini-quiz
- Si el usuario acierta 3 o más: "Excelente, has comprendido bien este tema. Pasamos al siguiente."
- Si el usuario falla 3 o más: "Veo que necesitas más práctica en este tema. Voy a explicarlo de nuevo con más detalle."
- Repite PASO 1 y PASO 2 si es necesario

PASO 4 - SIGUIENTE TEMA:
- Pasa al siguiente tema
- Repite PASO 1, 2, 3

CIERRE (cuando el usuario lo pida o se hayan visto 3-4 temas):
- Genera un resumen con:
  * Puntos fuertes del usuario
  * Temas donde tuvo más errores
  * Recomendaciones de qué módulos de PRL debería repasar

ESTILO Y TONO:
- Profesional y motivador
- Habla al usuario de "tú"
- NO uses emojis ni símbolos raros
- Usa solo texto plano
- Sé conciso y directo
- Evita repeticiones

EJEMPLOS DE TEMAS PARA DESARROLLAR:
- Ergonomía en la oficina
- Riesgos de caídas
- Riesgos eléctricos
- Trabajo con pantallas (síndrome del túnel carpiano, fatiga visual)
- Estrés laboral y salud mental
- Procedimientos de emergencia
- Equipos de protección personal (EPI)

IMPORTANTE:
- Cada respuesta debe tener UN propósito claro: explicar O preguntar, no ambos
- Si explicas, no hagas preguntas en el mismo mensaje
- Si haces preguntas, no expliques temas nuevos en el mismo mensaje
- Mantén el flujo lineal y profesional
- NUNCA vuelvas a fases anteriores sin razón

RECUERDA: El usuario está aprendiendo. Sé paciente, claro y motivador.
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

// Control de solicitudes en progreso
let isRequestInProgress = false;

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
 * Llama al Cloudflare Worker con manejo mejorado de errores
 */
async function callWorker(messages) {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    // Verificar si la respuesta es correcta
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error HTTP ${response.status}:`, errorText);
      
      // Intentar parsear como JSON
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Error ${response.status}`);
      } catch (e) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    }

    // Parsear la respuesta JSON
    const data = await response.json();
    
    // Validar que la respuesta tiene la estructura esperada
    if (!data.reply) {
      console.error("Respuesta del worker sin campo 'reply':", data);
      throw new Error("Formato de respuesta inesperado del worker");
    }

    return data.reply;
  } catch (error) {
    console.error("Error en callWorker:", error);
    throw error;
  }
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
  try {
    const progress = {
      role: getUserRole(),
      experience: getUserExperience(),
      testScore: getTestScore(),
      currentLevel: getCurrentLevel(),
      // Mantener solo los últimos 15 mensajes para evitar que el historial sea muy grande
      messages: messages.slice(Math.max(1, messages.length - 15))
    };
    localStorage.setItem('tutorPRL_progress', JSON.stringify(progress));
  } catch (err) {
    console.error("Error al guardar progreso:", err);
  }
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

  // Evitar solicitudes simultáneas
  if (isRequestInProgress) {
    addMessage("Por favor, espera a que termine la respuesta anterior.", "bot");
    return;
  }

  // Mostrar mensaje del usuario
  addMessage(text, "user");
  userInput.value = "";
  const submitButton = chatForm.querySelector("button");
  submitButton.disabled = true;
  isRequestInProgress = true;

  // Añadir mensaje del usuario al historial
  messages.push({ role: "user", content: text });
  
  // Pausa para evitar rate limits (aumentada)
  await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));

  // Llamar al worker de Cloudflare
  try {
    console.log("Enviando solicitud al worker...");
    const reply = await callWorker(messages);
    
    if (reply && reply.trim()) {
      messages.push({ role: "assistant", content: reply });
      addMessage(reply, "bot");
      saveProgress(); // Guardar después de cada respuesta
      console.log("Respuesta recibida correctamente");
    } else {
      addMessage("No he podido generar respuesta en este momento. Por favor, intenta de nuevo.", "bot");
      console.warn("Respuesta vacía del worker");
    }
  } catch (err) {
    console.error("Error completo:", err);
    
    // Mensaje de error detallado
    let errorMsg = "Ha ocurrido un error al contactar con el tutor.";
    
    if (err.message.includes("Failed to fetch")) {
      errorMsg = "Error de conexión. Verifica que el worker de Cloudflare está activo.";
    } else if (err.message.includes("rate limited")) {
      errorMsg = "El servicio está siendo utilizado mucho en este momento. Por favor, espera unos segundos e intenta de nuevo.";
    } else if (err.message.includes("HTTP")) {
      errorMsg = `Error del servidor: ${err.message}`;
    } else if (err.message.includes("Formato")) {
      errorMsg = "Error en la respuesta del servidor.";
    }
    
    addMessage(errorMsg + " Por favor, intenta de nuevo.", "bot");
  } finally {
    submitButton.disabled = false;
    isRequestInProgress = false;
  }
});

// Guardar progreso cada 15 segundos
setInterval(saveProgress, 15000);

