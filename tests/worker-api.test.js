import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";

const env={ALLOWED_ORIGIN:"https://senapsis.example.edu"};

test("CORS responde solo al origen configurado y permite preflight acotado",async()=>{
  const allowed=await worker.fetch(new Request("https://api.example/api/v1/health",{method:"OPTIONS",headers:{Origin:env.ALLOWED_ORIGIN,"Access-Control-Request-Method":"GET"}}),env);
  assert.equal(allowed.status,204);assert.equal(allowed.headers.get("access-control-allow-origin"),env.ALLOWED_ORIGIN);
  assert.match(allowed.headers.get("access-control-allow-headers"),/If-Match/);
  const rejected=await worker.fetch(new Request("https://api.example/api/v1/health",{headers:{Origin:"https://attacker.example"}}),env);
  assert.equal(rejected.status,403);assert.deepEqual(await rejected.json(),{error:"origin_not_allowed"});
});

test("el Worker expone salud y no revela rutas desconocidas",async()=>{
  const health=await worker.fetch(new Request("https://api.example/api/v1/health"),env);
  assert.deepEqual(await health.json(),{ok:true});
  const missing=await worker.fetch(new Request("https://api.example/api/v1/not-a-route"),env);
  assert.equal(missing.status,404);
});
