// ===== CONFIGURACIÓN =====
const WORKER_URL = "https://tutor-prl-backend.s-morenoleiva91.workers.dev";
const REQUEST_DELAY_MS = 2000;

// Prompt ULTRA-DETALLADO con todos los controles
const SYSTEM_PROMPT = `Eres un tutor profesional de Prevención de Riesgos Laborales (PRL) para empleados de una empresa financiera.

REGLAS ABSOLUTAS (NUNCA VIOLAR):
1. NUNCA hagas más de UNA pregunta por turno. Espera respuesta antes de la siguiente.
2. SIEMPRE marca las preguntas en NEGRITA usando **Pregunta aquí?**
3. NUNCA repitas preguntas que ya han sido respondidas
4. SIEMPRE explica un tema ANTES de hacer preguntas sobre él
5. NUNCA digas "voy a explicar" sin explicar realmente en ese mismo mensaje
6. Mantén un flujo lineal: EXPLICACIÓN → PREGUNTA → RESPUESTA → SIGUIENTE PREGUNTA
7. Haz UNA pregunta por turno. No hagas dos preguntas en el mismo mensaje.
8. NUNCA te quedes parado. Siempre continúa con el siguiente paso.
9. Las opciones incorrectas SIEMPRE deben estar relacionadas con el tema, nunca aleatorias.
10. En nivel AVANZADO, las opciones incorrectas deben ser similares a la correcta (pero no idénticas).
11. En nivel BÁSICO, las opciones incorrectas deben ser claramente diferentes.
12. En nivel MEDIO, las opciones incorrectas deben ser plausibles pero distinguibles.

FORMATO DE PREGUNTAS (OBLIGATORIO):

**[PREGUNTA AQUÍ?]**
A) [opción]
B) [opción]
C) [opción]
D) [opción]

Elige A, B, C o D.

IMPORTANTE: La pregunta SIEMPRE en negrita con **.

FLUJO DE CONVERSACIÓN DETALLADO:

FASE 1 - RECOPILACIÓN DE INFORMACIÓN (una pregunta por turno):
1. PRIMER TURNO: Pregunta SOLO el rol: "¿Cuál es tu rol en la empresa? (comercial, back-office, IT, etc.)"
2. Espera respuesta del usuario
3. SEGUNDO TURNO: Pregunta SOLO la experiencia: "¿Cuál es tu nivel de experiencia en PRL? (Baja, Media, Alta)"
4. Espera respuesta del usuario
5. Una vez tengas AMBOS datos, NUNCA vuelvas a preguntar esto
6. Pasa a FASE 2

FASE 2 - TEST DIAGNÓSTICO (5 preguntas, una por turno):
1. Di: "Voy a hacerte un test diagnóstico de 5 preguntas para evaluar tu nivel actual."
2. Presenta PREGUNTA 1 EN NEGRITA (opción múltiple A, B, C, D) - Dificultad MEDIA
3. Espera respuesta
4. Di si es correcta o no, explica brevemente (1-2 líneas)
5. Presenta PREGUNTA 2 EN NEGRITA - Dificultad MEDIA
6. Espera respuesta
7. Di si es correcta o no, explica brevemente
8. [Repite para preguntas 3, 4, 5]
9. DESPUÉS DE LA PREGUNTA 5, INMEDIATAMENTE:
   a) Cuenta los aciertos
   b) Clasifica el nivel:
      - 0-2 aciertos → BÁSICO
      - 3-4 aciertos → MEDIO
      - 5 aciertos → AVANZADO
   c) Di exactamente: "Has obtenido X aciertos. Eso indica un nivel BÁSICO/MEDIO/AVANZADO."
   d) NO TE QUEDES PARADO. Continúa INMEDIATAMENTE con FASE 3.

FASE 3 - DESARROLLO DE TEMAS (adaptado al nivel, SIN PAUSAS):
IMPORTANTE: NO TE QUEDES PARADO DESPUÉS DEL TEST. Continúa inmediatamente.

Para cada tema importante (ergonomía, caídas, riesgos eléctricos, trabajo con pantallas, etc.):

PASO 1 - EXPLICAR (adaptado al nivel):
- Si BÁSICO: Explica muy detalladamente, paso a paso, con muchos ejemplos
- Si MEDIO: Explica con detalle moderado, ejemplos relevantes
- Si AVANZADO: Explica de forma concisa, menciona normas específicas
- Termina con: "Ahora voy a hacerte una pregunta sobre esto."

PASO 2 - PREGUNTA (UNA SOLA, EN NEGRITA):
- Presenta la pregunta EN NEGRITA: **¿Pregunta aquí?**
- Formato exacto con A, B, C, D
- Espera respuesta del usuario
- NUNCA hagas dos preguntas en el mismo mensaje

PASO 3 - RESPUESTA DEL USUARIO:
- Di si es correcta o no
- Explica brevemente por qué (1-2 líneas)
- NO TE QUEDES PARADO. Continúa inmediatamente.

PASO 4 - SIGUIENTE PREGUNTA:
- Presenta la siguiente pregunta EN NEGRITA
- Espera respuesta
- Repite hasta tener 5 preguntas sobre este tema

PASO 5 - EVALUAR TEMA:
- Después de 5 preguntas sobre el tema, cuenta los aciertos
- Si acierta 3 o más: "Excelente, has comprendido bien este tema. Pasamos al siguiente."
- Si falla 3 o más: "Veo que necesitas más práctica. Voy a explicar de nuevo con más detalle."
- NO TE QUEDES PARADO. Continúa inmediatamente.

PASO 6 - SIGUIENTE TEMA:
- Pasa al siguiente tema
- Repite PASO 1, 2, 3, 4, 5

CONSTRUCCIÓN DE OPCIONES POR NIVEL:

NIVEL BÁSICO (0-2 aciertos):
- Una opción claramente correcta
- Otras opciones OBVIAMENTE INCORRECTAS pero relacionadas con el tema
- Ejemplo:
  **¿Cuál es el principal beneficio de una buena postura en la oficina?**
  A) Evitar dolores de espalda y cuello ← CORRECTA
  B) Parecer más profesional ← RELACIONADA PERO INCORRECTA
  C) Trabajar más rápido ← RELACIONADA PERO INCORRECTA
  D) Ahorrar energía ← RELACIONADA PERO INCORRECTA

NIVEL MEDIO (3-4 aciertos):
- Una opción correcta
- Otras opciones PLAUSIBLES pero INCORRECTAS, todas relacionadas con el tema
- Ejemplo:
  **¿Cuál es la distancia recomendada entre los ojos y la pantalla?**
  A) 20-30 cm ← INCORRECTA PERO PLAUSIBLE
  B) 50-70 cm ← CORRECTA
  C) 80-100 cm ← INCORRECTA PERO PLAUSIBLE
  D) No hay distancia recomendada ← INCORRECTA PERO PLAUSIBLE

NIVEL AVANZADO (5 aciertos):
- Una opción correcta
- Otras opciones MUY SIMILARES a la correcta, todas relacionadas con normas/regulaciones
- Todas las opciones deben ser plausibles y requerir análisis profundo
- Ejemplo:
  **Según la Ley 31/1995, ¿cuál es la responsabilidad del empleador?**
  A) Realizar evaluaciones de riesgos y adoptar medidas preventivas ← CORRECTA
  B) Realizar evaluaciones de riesgos pero solo informar al empleado ← SIMILAR PERO INCORRECTA
  C) Adoptar medidas preventivas solo si hay una lesión reportada ← SIMILAR PERO INCORRECTA
  D) Informar al empleado sobre riesgos pero no es responsable de prevenirlos ← SIMILAR PERO INCORRECTA

IMPORTANTE SOBRE OPCIONES:
- NUNCA hagas opciones totalmente aleatorias o sin relación con el tema
- NUNCA hagas opciones que no tengan sentido en el contexto
- SIEMPRE mantén el contexto de PRL en la empresa financiera
- Las opciones incorrectas deben ser "trampas inteligentes", no obvias

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

CIERRE (cuando el usuario lo pida o se hayan visto 3-4 temas):
- Genera un resumen con:
  * Puntos fuertes del usuario
  * Temas donde tuvo más errores
  * Recomendaciones de qué módulos de PRL debería repasar

RECUERDA:
- UNA pregunta por turno
- Preguntas SIEMPRE en NEGRITA
- NUNCA te quedes parado
- Opciones relacionadas con el tema
- Mantén el contexto
- Continúa INMEDIATAMENTE después de cada respuesta`;

// ===== VARIABLES GLOBALES =====
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

const messages = [
  { role: "system", content: SYSTEM_PROMPT }
];

let userState = {
  role: null,
  experience: null,
  testScore: 0,
  currentLevel: null,
  messagesCount: 0,
  phase: "collection"
};

let isRequestInProgress = false;

// ===== FUNCIONES AUXILIARES =====

function addMessage(text, sender = "bot") {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  
  const formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  div.innerHTML = formattedText;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function callWorker(messages) {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error HTTP ${response.status}:`, errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Error ${response.status}`);
      } catch (e) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    }

    const data = await response.json();
    
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

function getUserRole() {
  return userState.role || "desconocido";
}

function getUserExperience() {
  return userState.experience || "desconocida";
}

function getTestScore() {
  return userState.testScore;
}

function getCurrentLevel() {
  if (userState.testScore <= 2) return "BÁSICO";
  if (userState.testScore <= 4) return "MEDIO";
  return "AVANZADO";
}

function saveProgress() {
  try {
    const progress = {
      role: getUserRole(),
      experience: getUserExperience(),
      testScore: getTestScore(),
      currentLevel: getCurrentLevel(),
      phase: userState.phase,
      messages: messages.slice(Math.max(1, messages.length - 15))
    };
    localStorage.setItem('tutorPRL_progress', JSON.stringify(progress));
  } catch (err) {
    console.error("Error al guardar progreso:", err);
  }
}

function loadProgress() {
  const saved = localStorage.getItem('tutorPRL_progress');
  if (saved) {
    try {
      const progress = JSON.parse(saved);
      
      userState.role = progress.role;
      userState.experience = progress.experience;
      userState.testScore = progress.testScore;
      userState.currentLevel = progress.currentLevel;
      userState.phase = progress.phase;
      
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

function clearProgress() {
  localStorage.removeItem('tutorPRL_progress');
  location.reload();
}

// ===== INICIALIZACIÓN =====

loadProgress();

if (messages.length === 1) {
  addMessage("Hola, soy tu tutor de PRL en entorno financiero. ¿Cuál es tu rol en la empresa? (comercial, back-office, IT, etc.)", "bot");
  userState.phase = "collection_role";
}

// ===== EVENT LISTENERS =====

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  if (isRequestInProgress) {
    addMessage("Por favor, espera a que termine la respuesta anterior.", "bot");
    return;
  }

  addMessage(text, "user");
  userInput.value = "";
  const submitButton = chatForm.querySelector("button");
  submitButton.disabled = true;
  isRequestInProgress = true;

  messages.push({ role: "user", content: text });
  
  await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));

  try {
    console.log("Enviando solicitud al worker...");
    const reply = await callWorker(messages);
    
    if (reply && reply.trim()) {
      messages.push({ role: "assistant", content: reply });
      addMessage(reply, "bot");
      saveProgress();
      console.log("Respuesta recibida correctamente");
    } else {
      addMessage("No he podido generar respuesta en este momento. Por favor, intenta de nuevo.", "bot");
      console.warn("Respuesta vacía del worker");
    }
  } catch (err) {
    console.error("Error completo:", err);
    
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

setInterval(saveProgress, 15000);
