# Contrato de paso del simulador

La carcasa consume una lista determinista de pasos. Cada paso contiene `id`, `foco`, `globo`, `escena: { tipo, datos }`, `estado`, `salida`, `frase`, `lineaCodigo` y `pregunta`. Consulta [Contrato del simulador por tema](CONTRATO_SIMULADOR.md) para la forma detallada y las reglas de validación.

`validateSteps(steps)` comprueba la estructura mínima y que los identificadores sean únicos. El productor adapta la traza del motor sin volver a calcular resultados. `createSimulatorShell` valida al construir y ofrece navegación reproducible hacia delante, atrás y por índice.

Para agregar una plantilla, crea un productor puro desde los datos de entrada y los eventos del motor, conserva el evento de origen en cada paso y valida cobertura de avance, retroceso y búsqueda. Las preguntas deben derivarse del estado real.
