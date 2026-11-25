# Decisiones de implementación — mejoras Senapsis v2

## Base

- La referencia para modificar es main, commit d63acf146860209b2866460fbe34294b7c2d28ae.
- El registro corresponde a la iteración histórica de mejoras v2; la versión vigente está consolidada en `main`.
- La rama instruction-2/live-lab-phase no se integra: modifica ejercicios, pruebas protegidas y configuración CI, y su CI más reciente falla en navegador.
- El intérprete tiene límites explícitos: 2.500 eventos y 500 iteraciones. El adaptador visual consumirá sus eventos sin modificar src/core.
- Los ejercicios permanecen sin cambio. Las etiquetas «De clase» se derivan en archivo adicional.

## Decisiones D10 y discrepancias resueltas

1. Los cuatro ejercicios «De clase» candidatos son 22 (potencia), 23 (Fibonacci), 24 (mayor de diez) y 28 (promedio de cinco materias × seis notas). El ejercicio 39 tiene un enunciado relacionado pero incluye análisis adicional. La etiqueta de clase se decidirá sin modificar los ejercicios y se dejará explícita como hipótesis hasta corroborar el registro de clase.
2. Los tamaños inferiores a 13 px detectados se elevarán con una escala de componentes, cuidando no cambiar el comportamiento funcional.
3. La cabecera no se reconstruye: se eliminan rótulos de versión/arquitectura y se conservan navegación, tema y movimiento reducido.
4. Las escenas se adaptan desde eventos ya emitidos por el intérprete; no se añaden nuevos tipos de evento al motor.
5. Los ocho modos del Laboratorio reutilizan la traza existente. Un modo que no se pueda generar de forma segura para un ejercicio se marca no disponible con explicación, nunca con respuestas inventadas.
6. La prueba de CI para la rama nueva se obtendrá mediante el pull request contra main, porque quality.yml no incluye mejoras/** en su filtro de push. No se altera .github, que está protegido.
7. Las capturas solo se declaran generadas cuando provengan del artefacto de Playwright de GitHub Actions. No se fabrican capturas en documentación.
