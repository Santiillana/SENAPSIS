# Contrato del simulador por tema

El simulador actual de Diagramas de flujo usa el intérprete existente. Su
controlador genérico de pasos está en `src/ui/simulator-shell.js`; la plantilla
de flujo adapta la traza al contrato. El render SVG, la cámara y los controles
siguen integrados en `src/ui/simulator.js` y se migrarán gradualmente. Cada
tema aporta un productor de pasos, una zona principal y escenas. La interfaz
presenta los eventos; no vuelve a calcular resultados.

## Forma de un paso

```js
{
  id,                    // string único y estable dentro de la ejecución
  foco,                  // id del elemento del lienzo o null
  globo,                 // microtexto junto al foco
  escena: { tipo, datos },
  estado: { variables, cambios },
  salida: [],             // salida acumulada hasta este paso
  frase,                  // texto breve para el reproductor
  lineaCodigo,            // línea activa o null
  pregunta                // opcional, derivada del estado real
}
```

El adaptador `src/ui/flow-step-contract.js` agrega estos campos sin descartar ni
recalcular el evento original del intérprete. `validateSteps` comprueba ids
únicos y la estructura mínima. `createSimulatorShell` recibe una plantilla,
construye y valida sus pasos, y proporciona navegación determinista. Conserva
los campos originales para que el renderizador de flujo siga siendo compatible
durante la extracción gradual.

## Adaptación de un tema nuevo

1. Implementa un productor determinista desde el estado o los eventos de su
   motor; cada paso debe conservar referencia a su origen.
2. Implementa la zona principal que dibuja el estado del paso solicitado y sus
   escenas con los componentes compartidos.
3. Conecta el productor y la zona al reproductor común. No dupliques cámara,
   transporte, ventana contextual, Predice ni Concentración.
4. Proporciona texto alternativo, estados estáticos y opciones de teclado para
   cada interacción.
5. Prueba que avanzar, retroceder y buscar un paso producen el mismo estado;
   que las preguntas coinciden con eventos reales; que el movimiento reducido
   mantiene la información; y que ninguna ventana tapa el foco.

Diagramas de flujo usa el intérprete existente. Matemáticas debe usar los
cálculos exactos de `src/math/`. Establecer requisitos usa secuencias declaradas
en datos y validadas por pruebas. La interfaz nunca sustituye esos motores.
