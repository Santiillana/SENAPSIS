import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { executePseudocode, createTimeline } from "../src/core/interpreter.js";

test("un ciclo de doscientas vueltas conserva la salida y una traza acotada",()=>{
  const source="S=0|para i=1;i<=200;i++|S=S+i|fin|imp S";
  const result=executePseudocode(source,[]);
  assert.equal(result.ok,true);
  assert.deepEqual(result.outputs,[20100]);
  assert.ok(result.events.length<2500);
  assert.equal(result.events.at(-1).type,"program-end");
  assert.deepEqual(result.events.at(-1).variables,{S:20100,i:201});
});

test("los ciclos anidados conservan contexto de vuelta exterior e interior",()=>{
  const source="C=0|para f=1;f<=5;f++|para c=1;c<=5;c++|C=C+1|fin|fin|imp C";
  const result=executePseudocode(source,[]);
  assert.equal(result.ok,true);
  assert.deepEqual(result.outputs,[25]);
  const inner=result.events.find(event=>event.type==="loop-enter"&&event.loopStack.length===2);
  assert.ok(inner);
  assert.deepEqual(inner.loopStack.map(loop=>loop.iteration),[1,1]);
});

test("la línea de tiempo puede saltar de cientos de eventos y volver sin alterar snapshots",()=>{
  const result=executePseudocode("S=0|para i=1;i<=80;i++|S=S+i|fin|imp S",[]);
  const timeline=createTimeline(result);
  const first=timeline.first();
  const last=timeline.last();
  assert.equal(first.type,"program-start");
  assert.equal(last.type,"program-end");
  assert.deepEqual(last.outputs,[3240]);
  timeline.seek(40);
  const middle=timeline.current;
  timeline.previous();
  timeline.next();
  assert.deepEqual(timeline.current,middle);
  assert.deepEqual(timeline.last().outputs,[3240]);
});

test("el motor no ejecuta código JavaScript arbitrario",async()=>{
  const files=["expression.js","parser.js","interpreter.js"];
  const sources=await Promise.all(files.map(name=>readFile(new URL("../src/core/"+name,import.meta.url),"utf8")));
  const source=sources.join("\n");
  assert.doesNotMatch(source,/\beval\s*\(/);
  assert.doesNotMatch(source,/new\s+Function\s*\(/);
});
