// Datos oficiales de Mi ficha.
// El contenido marcado como demostrativo se sustituye por información confirmada.
// El moderador actualiza horario, actividades, clases, recursos y documentos aquí.
// Los archivos no se guardan en este manifiesto: se alojan en una URL compartida
// y el manifiesto conserva su metadata y sus relaciones.
export const FICHA = {
  meta: {
    programa: "Tecnólogo ADSO (ejemplo editable)",
    codigo: "228118",
    version: "v2 · demostración",
    ficha: "Por configurar",
    actualizado: "2026-11-17",
    fuente: "Horario transcrito de la imagen compartida; Matemáticas reemplaza Evaluar requisitos los lunes desde el 2 de noviembre de 2026. Las materias del sábado siguen por confirmar.",
    esDemostracion: true
  },
  competencias: [
    { id: "logica-programacion", codigo: "LP-01", nombre: "Lógica de programación", tipo: "principal", orden: 1, activa: true, forma: "circulo", token: "logica-programacion" },
    { id: "competencia-por-configurar", codigo: "COMP-02", nombre: "Competencia por configurar", tipo: "principal", orden: 2, activa: true, forma: "cuadrado", token: "pendiente" },
    { id: "evaluar-requisitos", codigo: "Por confirmar", nombre: "Evaluación de requisitos", tipo: "principal", orden: 2, activa: true, enAprende: true, forma: "rombo", token: "evaluar-requisitos" },
    { id: "comunicacion", codigo: "Por confirmar", nombre: "Comunicación", tipo: "transversal", orden: 4, activa: true, enAprende: true, forma: "triangulo", token: "comunicacion" },
    { id: "tics", codigo: "Por confirmar", nombre: "TICs", tipo: "transversal", orden: 3, activa: true, enAprende: true, forma: "cuadrado", token: "tics" },
    { id: "establecer-requisitos", codigo: "Por confirmar", nombre: "Establecer requisitos", tipo: "principal", orden: 1, activa: true, enAprende: true, forma: "circulo", token: "establecer-requisitos" },
    { id: "matematicas", codigo: "Por confirmar", nombre: "Matemáticas", tipo: "transversal", orden: 5, activa: true, enAprende: true, forma: "hexagono", token: "matematicas" },
    { id: "clase-sabado-por-confirmar", codigo: "Por confirmar", nombre: "Clase por confirmar", tipo: "transversal", orden: 8, activa: true, forma: "circulo", token: "pendiente" }
  ],
  instructores: [
    { id: "instructor-por-configurar", nombre: "Instructor por configurar" },
    { id: "jair-castaneda", nombre: "Jair Castañeda" },
    { id: "sandra-lizcano", nombre: "Sandra Lizcano" },
    { id: "yonel-torres", nombre: "Yonel Torres" },
    { id: "gloria-romero", nombre: "Gloria Romero" },
    { id: "yilliam-romero", nombre: "Yilliam Romero" }
  ],
  // Horario transcrito de la imagen compartida. Día: 1=lunes ... 6=sábado.
  // El nombre de las dos clases del sábado no aparece en la imagen.
  horario: [
    { id: "lunes-evaluar-requisitos", dia: 1, inicio: "18:00", fin: "22:00", competenciaId: "evaluar-requisitos", instructorId: "jair-castaneda", vigenteDesde: null, vigenteHasta: "2026-11-01", fuente: "Horario compartido por el usuario" },
    { id: "lunes-matematicas", dia: 1, inicio: "18:00", fin: "22:00", competenciaId: "matematicas", instructorId: "yilliam-romero", vigenteDesde: "2026-11-02", vigenteHasta: null, fuente: "Horario compartido por el usuario; vigencia interpretada desde 2-11-2026" },
    { id: "martes-comunicacion", dia: 2, inicio: "18:00", fin: "22:00", competenciaId: "comunicacion", instructorId: "sandra-lizcano", fuente: "Horario compartido por el usuario" },
    { id: "miercoles-evaluar-requisitos", dia: 3, inicio: "18:00", fin: "22:00", competenciaId: "evaluar-requisitos", instructorId: "jair-castaneda", fuente: "Horario compartido por el usuario" },
    { id: "jueves-tics", dia: 4, inicio: "18:00", fin: "22:00", competenciaId: "tics", instructorId: "yonel-torres", fuente: "Horario compartido por el usuario" },
    { id: "viernes-establecer-requisitos", dia: 5, inicio: "18:00", fin: "22:00", competenciaId: "establecer-requisitos", instructorId: "gloria-romero", fuente: "Horario compartido por el usuario" },
    { id: "sabado-mediodia-por-confirmar", dia: 6, inicio: "12:00", fin: "16:00", competenciaId: "clase-sabado-por-confirmar", titulo: "Clase por confirmar", instructorId: "gloria-romero", fuente: "Horario compartido por el usuario" },
    { id: "sabado-tarde-por-confirmar", dia: 6, inicio: "16:00", fin: "22:00", competenciaId: "clase-sabado-por-confirmar", titulo: "Clase por confirmar", instructorId: "jair-castaneda", fuente: "Horario compartido por el usuario" }
  ],
  horarioNotas: [],
  // El vocero publica comunicados editando este manifiesto; sin backend ni acceso de edición.
  comunicados: [],
  actividades: [
    {
      id: "actividad-diagrama",
      competenciaId: "logica-programacion",
      titulo: "Reconocer las figuras del diagrama",
      descripcion: "Identificar la función de las figuras básicas de un diagrama de flujo.",
      paraQueSirve: "Relacionar cada símbolo con la acción que representa dentro de un algoritmo.",
      instrucciones: ["Revisar las figuras de inicio, proceso, decisión y salida.", "Construir un recorrido breve y comprobar su secuencia."],
      entregables: ["Diagrama de flujo exportado o enlace al trabajo."],
      apertura: "2026-11-10",
      limite: "2026-11-16",
      fuente: "Ejemplo editable; confirmar con el instructor.",
      actualizado: "2026-11-17",
      leccionIds: ["terminals"],
      ejercicioIds: [],
      documentoIds: []
    },
    {
      id: "actividad-comparaciones",
      competenciaId: "logica-programacion",
      titulo: "Aplicar operadores de comparación",
      descripcion: "Resolver condiciones usando operadores relacionales.",
      paraQueSirve: "Entender cómo una condición determina el camino que sigue un algoritmo.",
      instrucciones: ["Identificar los operandos.", "Evaluar cada comparación con sus valores.", "Comprobar el resultado verdadero o falso."],
      entregables: ["Solución de los ejercicios asignados."],
      apertura: "2026-11-11",
      limite: "2026-11-18",
      fuente: "Ejemplo editable; confirmar con el instructor.",
      actualizado: "2026-11-17",
      leccionIds: ["comparisons"],
      ejercicioIds: [5, 6, 7],
      documentoIds: []
    },
    {
      id: "actividad-ciclos",
      competenciaId: "logica-programacion",
      titulo: "Practicar ciclos",
      descripcion: "Diferenciar ciclos Para, Mientras y Hacer–Mientras.",
      paraQueSirve: "Elegir una estructura de repetición según la condición de entrada y salida.",
      instrucciones: ["Comparar cuándo se evalúa la condición.", "Seguir una iteración de cada ciclo.", "Verificar el criterio de terminación."],
      entregables: ["Pseudocódigo y tabla de seguimiento."],
      apertura: "2026-11-12",
      limite: "2026-11-21",
      fuente: "Ejemplo editable; confirmar con el instructor.",
      actualizado: "2026-11-17",
      leccionIds: ["for", "while", "do-while"],
      ejercicioIds: [10, 11, 12, 13, 14, 15, 16, 19, 20],
      documentoIds: []
    },
    {
      id: "actividad-validacion",
      competenciaId: "logica-programacion",
      titulo: "Validar datos y usar centinelas",
      descripcion: "Construir una lectura repetida con condición de validación o centinela.",
      paraQueSirve: "Evitar procesar datos inválidos y controlar el final de una entrada.",
      instrucciones: ["Definir el rango válido o el valor centinela.", "Comprobar la condición de repetición.", "Evitar procesar el centinela como dato."],
      entregables: ["Algoritmo validado con casos normales y límite."],
      apertura: "2026-11-13",
      limite: null,
      fuente: "Ejemplo editable; confirmar con el instructor.",
      actualizado: "2026-11-17",
      leccionIds: ["validation-sentinel"],
      ejercicioIds: [19, 20],
      documentoIds: []
    }
  ],
  clases: [
    {
      id: "clase-ejemplo-01",
      fecha: "2026-11-16",
      competenciaId: "logica-programacion",
      titulo: "Figuras y comparaciones",
      temas: [
        { id: "tema-figuras", texto: "Figuras del diagrama de flujo", leccionId: "terminals", ejercicioIds: [] },
        { id: "tema-comparaciones", texto: "Operadores de comparación", leccionId: "comparisons", ejercicioIds: [5, 6, 7] }
      ],
      documentoIds: []
    },
    {
      id: "clase-ejemplo-02",
      fecha: "2026-11-17",
      competenciaId: "logica-programacion",
      titulo: "Ciclos y control de repetición",
      temas: [
        { id: "tema-for", texto: "Ciclo Para", leccionId: "for", ejercicioIds: [10, 11, 12, 13] },
        { id: "tema-while", texto: "Ciclo Mientras", leccionId: "while", ejercicioIds: [14, 15, 16] },
        { id: "tema-do-while", texto: "Ciclo Hacer–Mientras", leccionId: "do-while", ejercicioIds: [19, 20] }
      ],
      documentoIds: []
    }
  ],
  // Registro editorial de archivos compartidos. En el paso 5 se define el contrato;
  // la carga binaria requerirá almacenamiento compartido y se conecta en la fase UI.
  documentos: [],
  recursos: [
    {
      id: "recurso-sena-ejemplo-01",
      espacio: "sena",
      tipo: "guia",
      titulo: "Guía de aprendizaje (pendiente de cargar)",
      url: null,
      documentoId: null,
      tema: "Fundamentos",
      competenciaId: "logica-programacion",
      fuente: "Pendiente de confirmar por el moderador",
      fecha: null,
      programa: "Tecnólogo ADSO (ejemplo editable)",
      codigo: "228118",
      version: "Por confirmar"
    },
    {
      id: "recurso-sena-ejemplo-02",
      espacio: "sena",
      tipo: "material",
      titulo: "Material de formación (pendiente de cargar)",
      url: null,
      documentoId: null,
      tema: "Lógica de programación",
      competenciaId: "logica-programacion",
      fuente: "Pendiente de confirmar por el moderador",
      fecha: null,
      programa: "Tecnólogo ADSO (ejemplo editable)",
      codigo: "228118",
      version: "Por confirmar"
    },
    {
      id: "recurso-extra-ejemplo-01",
      espacio: "extra",
      tipo: "recurso",
      titulo: "Recurso complementario (pendiente de configurar)",
      url: null,
      documentoId: null,
      tema: "Algoritmos",
      competenciaId: "logica-programacion",
      fuente: "Pendiente de seleccionar",
      fecha: null,
      programa: "Tecnólogo ADSO (ejemplo editable)",
      codigo: "228118",
      version: "Por confirmar"
    }
  ],
  accesos: [
    { id: "zajuna", nombre: "Zajuna", url: "https://zajuna.sena.edu.co/" },
    { id: "sofia-plus", nombre: "SOFIA Plus", url: "https://oferta.senasofiaplus.edu.co/sofia-oferta/" },
    { id: "biblioteca", nombre: "Biblioteca SENA", url: "https://biblioteca.sena.edu.co/" },
    { id: "correo", nombre: "Correo institucional", url: "https://outlook.office.com/mail/" }
  ]
};
