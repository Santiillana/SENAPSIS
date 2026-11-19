import test from "node:test";
import assert from "node:assert/strict";
import { validateAccessClaims } from "../worker/access.js";

const config={audience:"aud-test",issuer:"https://school.cloudflareaccess.com",allowedEmails:new Set(["moderator@example.edu"]),now:1_800_000_000};
const claims={aud:"aud-test",iss:config.issuer,exp:1_800_000_100,nbf:1_799_999_900,email:"Moderator@Example.edu"};

test("Access acepta solo identidad, emisor, audiencia y vigencia configurados",()=>{
  assert.deepEqual(validateAccessClaims(claims,config),{valid:true,email:"moderator@example.edu"});
});
test("Access rechaza audiencia, emisor, caducidad y correo fuera de la lista",()=>{
  for(const changed of [{aud:"other"},{iss:"https://attacker.example"},{exp:config.now},{email:"learner@example.edu"}]){
    assert.equal(validateAccessClaims({...claims,...changed},config).valid,false);
  }
});
test("Access admite varias audiencias solo cuando incluye la aplicación esperada",()=>{
  assert.equal(validateAccessClaims({...claims,aud:["other","aud-test"]},config).valid,true);
  assert.equal(validateAccessClaims({...claims,aud:["other"]},config).reason,"invalid-audience");
});
