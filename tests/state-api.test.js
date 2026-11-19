import test from "node:test";
import assert from "node:assert/strict";
import { readPublishedState, readVersion } from "../worker/state.js";
import { FICHA } from "../src/content/ficha.js";
import { isPublishedFicha } from "../src/ficha/repository.js";

function envWith(row){return {DB:{prepare(sql){return {first:async()=>{assert.match(sql,/published_state/);return row;}};}}};}

test("version endpoint returns a cheap version and ETag",async()=>{
  const response=await readVersion(new Request("https://api.example/api/v1/version"),envWith({version:7,published_at:"2026-11-19T10:00:00Z"}));
  assert.equal(response.status,200);assert.equal(response.headers.get("etag"),'"7"');
  assert.deepEqual(await response.json(),{version:7,updatedAt:"2026-11-19T10:00:00Z"});
});
test("version endpoint answers 304 for the current ETag",async()=>{
  const request=new Request("https://api.example/api/v1/version",{headers:{"If-None-Match":'"3"'}});
  const response=await readVersion(request,envWith({version:3,published_at:"2026-11-19T10:00:00Z"}));
  assert.equal(response.status,304);
});
test("state endpoint returns the published snapshot and handles an empty database",async()=>{
  const current=await readPublishedState(new Request("https://api.example/api/v1/state"),envWith({version:4,published_at:"now",payload:JSON.stringify(FICHA)}));
  const snapshot=await current.json();assert.equal(snapshot.version,4);assert.deepEqual(snapshot.payload,FICHA);
  const empty=await readPublishedState(new Request("https://api.example/api/v1/state"),envWith(null));
  assert.deepEqual(await empty.json(),{version:0,updatedAt:null,payload:null});
});
test("repositorio acepta la ficha real y rechaza formas incompletas",()=>{
  assert.equal(isPublishedFicha(FICHA),true);
  assert.equal(isPublishedFicha({meta:{},competencias:[]}),false);
});
