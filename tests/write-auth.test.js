import test from "node:test";
import assert from "node:assert/strict";
import { getDraft, publishDraft, saveDraft, undoPublication } from "../worker/write.js";

const env={ACCESS_TEAM_DOMAIN:"school.cloudflareaccess.com",ACCESS_AUD:"application-audience",ACCESS_ALLOWED_EMAILS:"moderator@example.edu",DB:{prepare(){throw new Error("Una petición sin autenticación no debe consultar D1.");}}};

test("lectura de borrador y operaciones de escritura exigen sesión Access",async()=>{
  const calls=[
    getDraft(new Request("https://api.example/api/v1/admin/draft"),env),
    saveDraft(new Request("https://api.example/api/v1/admin/draft",{method:"PUT",headers:{"content-type":"application/json","if-match":"0"},body:"{}"}),env),
    publishDraft(new Request("https://api.example/api/v1/admin/publish",{method:"POST"}),env),
    undoPublication(new Request("https://api.example/api/v1/admin/undo",{method:"POST"}),env)
  ];
  for(const response of await Promise.all(calls)){
    assert.equal(response.status,401);
    assert.deepEqual(await response.json(),{error:"access_denied"});
  }
});
