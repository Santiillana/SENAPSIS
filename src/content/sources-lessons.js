const lessonData=[
  {
    id:"req-fue-01",title:"Qué es un requisito y por qué recolectar información",term:"Requisito y necesidad",
    objective:"Distinguir una necesidad de una solución y expresar qué debe lograr la aplicación.",
    intuitive:"Pedir un plato en un restaurante sin carta obliga a adivinar. Una conversación clara evita errores antes de preparar el pedido.",
    technical:"Una necesidad expresa una dificultad o un resultado que alguien requiere. Un requisito describe una capacidad o condición verificable del sistema que responde a esa necesidad. La solución explica cómo se implementará.",
    commonError:"Escribir de inmediato una solución técnica sin comprobar primero qué necesita la persona.",
    question:"¿Cuál frase describe un requisito verificable para la tienda?",
    options:["La aplicación debe registrar cada pedido con productos y cantidades.","La tienda necesita trabajar mejor.","Usaremos una pantalla azul con botones redondos."],answer:0,
    why:"El requisito indica una capacidad observable; la necesidad es más amplia y el color ya propone una solución.",
    steps:[["La hoja está vacía","La persona analista conversa con doña Marta antes de proponer pantallas."],["Aparece la necesidad","Marta explica que a veces se pierde un pedido cuando hay muchas personas esperando."],["Se redacta un requisito","La necesidad se convierte en una condición que se puede comprobar al registrar un pedido."]],
    scene:{kind:"requirement",need:"A veces se me pierde un pedido cuando hay fila.",requirement:"R-01 · Registrar cada pedido con sus productos y cantidades.",solution:"Después decidiremos cómo se verá la pantalla."}
  },
  {
    id:"req-fue-02",title:"Qué es una fuente de información",term:"Fuente de información",
    objective:"Identificar de dónde viene un dato y qué camino recorre antes de llegar al análisis.",
    intuitive:"El agua nace en un lugar y recorre distintos tramos antes de llegar a una casa. Una información también tiene un origen y un recorrido.",
    technical:"Una fuente de información es la persona, el hecho, el registro o el material del que se obtiene un dato útil para comprender el problema y establecer requisitos.",
    commonError:"Usar un dato sin preguntar quién lo produjo, cuándo y con qué propósito.",
    question:"Para saber cómo anota hoy los pedidos, ¿cuál es la mejor fuente inicial?",
    options:["Observar o entrevistar a doña Marta mientras trabaja.","Una enciclopedia sobre comercio.","La opinión de alguien que nunca ha visitado la tienda."],answer:0,
    why:"La dueña vive el proceso y puede describir lo que ocurre en su tienda.",
    steps:[["Nace el dato","El origen puede ser una persona, un hecho o un registro."],["Se dibuja el recorrido","El dato puede pasar directamente o por documentos e índices."],["Llega al análisis","Reconocer los pasos ayuda a valorar cercanía y posibles límites."]],
    scene:{kind:"distance",origin:"Pedido recibido en la tienda",intermediaries:["Cuaderno de pedidos","Resumen mensual"],analyst:"Persona analista"}
  },
  {
    id:"req-fue-03",title:"Fuentes primarias",term:"Fuente primaria",
    objective:"Reconocer información original obtenida directamente de quien vive o produce el proceso.",
    intuitive:"En un partido, quien estuvo en la cancha puede contar lo que vio directamente.",
    technical:"Una fuente primaria aporta información original obtenida directamente de la persona que vive el proceso o del hecho observado. Incluye entrevistas, encuestas, observación, cuestionarios, grupos focales y pruebas con prototipos.",
    commonError:"Clasificar como primaria cualquier información reciente, aunque llegue interpretada por otra persona.",
    question:"¿Cuál es una fuente primaria para conocer cómo recibe pedidos la tienda?",
    options:["Entrevistar a doña Marta sobre su proceso actual.","Leer un manual escrito por el proveedor del sistema de caja.","Consultar un índice de libros sobre inventarios."],answer:0,
    why:"La información llega directamente de quien realiza el proceso.",
    steps:[["Marta y la persona analista conversan","La dueña describe cómo recibe los pedidos."],["El dato viaja directamente","No pasa por un informe que lo interprete."],["Un salto hasta el análisis","La ficha conserva el relato de la persona que vive el proceso."],["La ficha llega intacta","La analista conserva las palabras de Marta y registra cuándo las escuchó."]],
    scene:{kind:"interview",quote:"Recibo pedidos por mensajería y los anoto en un cuaderno.",requirement:"R-01 · Registrar los pedidos que llegan.",type:"primary",hops:1}
  },
  {
    id:"req-fue-04",title:"Fuentes secundarias",term:"Fuente secundaria",
    objective:"Reconocer información que otra persona ya recopiló, registró o analizó.",
    intuitive:"Alguien te cuenta lo que leyó en un documento sobre una experiencia anterior.",
    technical:"Una fuente secundaria contiene información previamente recopilada, registrada o analizada por otras personas. Puede ser un documento, manual, informe, norma, sistema existente o estudio previo.",
    commonError:"Tratar lo que dice un registro histórico como si describiera con certeza lo que pasa hoy.",
    question:"¿Qué fuente es el cuaderno de pedidos que la tienda llenó durante el mes pasado?",
    options:["Secundaria: es un registro ya elaborado sobre pedidos anteriores.","Primaria: el cuaderno habla directamente con la analista.","Terciaria: todo documento es un índice."],answer:0,
    why:"El cuaderno conserva datos previos; sirve como evidencia, pero puede estar incompleto o desactualizado.",
    steps:[["Un pedido queda registrado","La información de una venta anterior se escribe en el cuaderno."],["El registro organiza datos","Alguien revisa los pedidos y los deja documentados."],["Dos saltos hasta el análisis","La persona analista consulta el documento y considera sus límites."]],
    scene:{kind:"document",document:"Cuaderno de pedidos · mayo",quote:"Los productos más pedidos fueron arepas y jugos.",requirement:"R-04 · Mostrar primero los productos más pedidos.",type:"secondary",hops:2,limitation:"Puede estar incompleto o tener letra difícil."}
  },
  {
    id:"req-fue-05",title:"Fuentes terciarias",term:"Fuente terciaria",
    objective:"Reconocer materiales que reúnen, organizan o resumen otras fuentes.",
    intuitive:"El índice de un libro o un buscador te orienta hacia varios documentos, pero no es el origen de cada dato.",
    technical:"Una fuente terciaria reúne, indexa o resume fuentes primarias y secundarias. Algunos ejemplos son enciclopedias, bibliografías, catálogos, directorios, glosarios y bases de datos de referencia.",
    commonError:"Usar una fuente de consulta general como prueba de una necesidad particular de la tienda.",
    question:"¿Qué tipo de fuente es una enciclopedia en línea que resume qué significa inventario?",
    options:["Terciaria: orienta y resume información de otros materiales.","Primaria: observó el inventario de la tienda.","Secundaria: es el cuaderno original de pedidos."],answer:0,
    why:"La enciclopedia ayuda a comprender un término, pero no describe directamente la tienda.",
    steps:[["El índice reúne documentos","Un catálogo organiza referencias para encontrar información."],["El dato pasa por varios materiales","Puede atravesar un documento y luego un índice o resumen."],["Tres saltos hasta el análisis","Orienta la búsqueda, pero no reemplaza la evidencia del contexto."]],
    scene:{kind:"index",origin:"Definición de inventario",document:"Manual de inventarios",index:"Enciclopedia · índice temático",analyst:"Persona analista",type:"tertiary",hops:3,limitation:"No describe el inventario de esta tienda."}
  },
  {
    id:"req-fue-06",title:"Cómo distinguir las fuentes",term:"Clasificación y procedencia",
    objective:"Clasificar una fuente siguiendo el origen del dato y las interpretaciones que lo separan de quien analiza.",
    intuitive:"Ante un rumor, preguntas quién lo vio y quién lo contó antes de aceptarlo como un hecho.",
    technical:"La procedencia describe el origen y el recorrido de la información. Una fuente primaria aporta el dato directamente; una secundaria ya lo registró o interpretó; una terciaria organiza o resume varias fuentes. Algunas fronteras dependen del autor y del uso del material.",
    commonError:"Clasificar solo por el nombre del material y no revisar cómo se obtuvo su contenido.",
    question:"¿Cuál clasificación sigue mejor la procedencia de esta fuente? “Doña Marta explica en una entrevista cómo anota los pedidos”.",
    options:["Primaria: habla directamente quien vive el proceso.","Secundaria: toda entrevista interpreta documentos.","Terciaria: la conversación resume un catálogo."],answer:0,
    why:"La entrevista obtiene información directamente de la dueña; la clasificación depende del origen y el recorrido.",
    steps:[["Aparecen cinco tarjetas","Cada tarjeta describe una fuente relacionada con la tienda."],["Se sigue el origen","Las fuentes se ubican en P, S o T por su recorrido."],["Un caso queda en discusión","Un informe puede ser secundario o terciario según cómo se elaboró."]],
    scene:{kind:"lanes",cards:[{text:"Entrevista con Marta",type:"primary"},{text:"Encuesta a 40 clientes",type:"primary"},{text:"Cuaderno de pedidos",type:"secondary"},{text:"Manual de caja",type:"secondary"},{text:"Enciclopedia de inventario",type:"tertiary"}],boundary:"Informe sobre ventas: revisa si registra datos o resume otros informes."}
  },
  {
    id:"req-fue-07",title:"Técnicas de recolección",term:"Entrevista, encuesta, observación, taller y revisión documental",
    objective:"Elegir una técnica según la pregunta, las personas y el tipo de evidencia que se necesita.",
    intuitive:"No usas la misma herramienta para escuchar una historia, contar preferencias y observar una tarea.",
    technical:"Una técnica de recolección es un procedimiento para obtener información. La entrevista profundiza en experiencias; la encuesta recoge respuestas comparables; la observación registra acciones; el taller facilita acuerdos; y la revisión documental analiza registros existentes.",
    commonError:"Aplicar una encuesta para descubrir en profundidad por qué ocurre un problema complejo.",
    question:"Quieres saber cuántos de 40 clientes prefieren recibir un aviso cuando el pedido esté listo. ¿Qué técnica conviene?",
    options:["Encuesta con una pregunta clara y opciones comparables.","Revisión de una enciclopedia general.","Observar a una sola persona sin registrar el dato."],answer:0,
    why:"Una encuesta ayuda a contar preferencias, y el resultado representa solo a la muestra consultada.",
    steps:[["Entrevista","Profundiza en las experiencias de doña Marta y sus razones."],["Encuesta","Compara preferencias entre un grupo de clientes."],["Observación","Registra lo que sucede mientras Marta atiende."],["Taller","Agrupa propuestas y ayuda a acordar prioridades."],["Revisión documental","Aporta antecedentes de cuadernos y manuales existentes."]],
    scene:{kind:"techniques",survey:[{label:"Aviso cuando esté listo",count:28},{label:"Ver estado del pedido",count:6},{label:"Pagar en línea",count:3},{label:"Repetir pedido",count:2},{label:"Otro",count:1}],total:40,techniques:["Entrevista","Encuesta","Observación","Taller","Revisión documental"]}
  },
  {
    id:"req-fue-08",title:"Elegir, combinar, verificar y registrar",term:"Triangulación y trazabilidad",
    objective:"Combinar fuentes, resolver discrepancias y registrar de dónde salió cada requisito.",
    intuitive:"Dos testigos que coinciden dan más confianza; si discrepan, conviene preguntar y dejar registro de cómo se resolvió.",
    technical:"La triangulación contrasta información de varias fuentes o técnicas. La trazabilidad conecta cada requisito con su evidencia, fuente, fecha y estado de verificación para poder revisarlo después.",
    commonError:"Elegir una versión cuando las fuentes discrepan sin consultar, justificar ni registrar la decisión.",
    question:"La entrevista y un recibo discrepan sobre la hora de cierre. ¿Qué haces antes de fijar el requisito?",
    options:["Consultar otra vez a la dueña, contrastar la evidencia y registrar la decisión y sus fuentes.","Escoger una hora al azar para continuar.","Borrar las dos fuentes que no coinciden."],answer:0,
    why:"Se verifica la discrepancia y se conserva la trazabilidad de la decisión.",
    steps:[["Tres fuentes aportan evidencia","Entrevista, observación y cuaderno describen los pedidos."],["La discrepancia se marca","La entrevista y un recibo muestran horarios distintos."],["Se verifica con Marta","La dueña confirma el horario vigente y explica el cambio."],["Se conserva la trazabilidad","Cada requisito queda conectado a su evidencia y fecha de validación."]],
    scene:{kind:"traceability",requirements:[{id:"R-01",text:"Registrar pedidos entrantes",type:"primary",source:"Entrevista con Marta"},{id:"R-02",text:"Permitir varios pedidos en curso",type:"primary",source:"Observación del mostrador"},{id:"R-03",text:"Mostrar productos frecuentes",type:"secondary",source:"Cuaderno de pedidos"}],discrepancy:{a:"Entrevista: cierre a las 8 p. m.",b:"Recibo antiguo: cierre a las 7 p. m.",resolution:"Marta confirma 8 p. m.; se registra la fecha de validación."}}
  }
];

const byId=new Map();
export const sourceLessons=lessonData.map((item,index)=>{
  const id=item.id;
  const lesson={
    id,topic:"fuentes-informacion",order:index+1,title:item.title,duration:"5 min",
    objective:item.objective,whenToUse:item.objective,
    miniProgram:{title:"Recorrido de la información",code:"imp 1",sample:[]},
    commonError:item.commonError,tryIt:{prompt:"Antes de responder, identifica el origen y el recorrido de la información."},
    summary:item.why,intuitive:item.intuitive,technical:item.technical,
    visual:{kind:"requirements-sources",caption:"Tienda de doña Marta · origen, evidencia y requisitos",steps:item.steps,sourceScene:item.scene},
    example:{title:item.title,code:item.steps.map(([title])=>title).join(" → "),explanation:item.why,steps:item.steps.map(([,description])=>description)},
    manipulation:{prompt:"Recorre la escena y observa qué aporta y qué limita cada fuente.",input:"",steps:item.steps.map(([,description])=>description)},
    check:{question:item.question,options:item.options,answer:item.answer,why:item.why},term:item.term
  };
  byId.set(id,lesson);return lesson;
});

export const sourceLessonsByTopic=Object.freeze(sourceLessons.map(lesson=>lesson.id));
export const sourceLessonById=id=>byId.get(id)??null;
export const sourceLessonGlossary=Object.freeze([
  ["Requisito","Condición o capacidad verificable que el sistema debe cumplir para responder a una necesidad."],
  ["Fuente de información","Persona, hecho, registro o material del que se obtiene información útil."],
  ["Fuente primaria","Información original obtenida directamente de quien vive el proceso o del hecho observado."],
  ["Fuente secundaria","Información recopilada, registrada o analizada previamente por otras personas."],
  ["Fuente terciaria","Material que reúne, indexa u orienta sobre fuentes primarias y secundarias."],
  ["Entrevista","Conversación guiada para conocer experiencias, necesidades y razones con detalle."],
  ["Encuesta","Conjunto de preguntas comparables para recoger respuestas de varias personas."],
  ["Observación","Registro sistemático de acciones y situaciones mientras ocurren."],
  ["Taller","Actividad colaborativa para proponer, agrupar y acordar ideas o requisitos."],
  ["Senapsisbilidad","Relación entre un requisito y la evidencia, fuente y decisión que lo justifican."],
  ["Triangulación","Contraste de información obtenida de varias fuentes o técnicas para revisar coincidencias y diferencias."]
]);

