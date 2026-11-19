import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { authenticateAccess } from "../worker/access.js";

const encode=value=>btoa(JSON.stringify(value)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
const encodeBytes=value=>btoa(String.fromCharCode(...new Uint8Array(value))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");

test("Cloudflare Access valida firma RS256 antes de habilitar la sesión",async()=>{
  const keys=await webcrypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
  const publicJwk=await webcrypto.subtle.exportKey("jwk",keys.publicKey);Object.assign(publicJwk,{kid:"test-key",alg:"RS256"});
  const env={ACCESS_TEAM_DOMAIN:"school.cloudflareaccess.com",ACCESS_AUD:"aud-test",ACCESS_ALLOWED_EMAILS:"moderator@example.edu"};
  const claims={aud:"aud-test",iss:"https://school.cloudflareaccess.com",exp:Math.floor(Date.now()/1000)+60,email:"moderator@example.edu"};
  const header=encode({alg:"RS256",kid:"test-key",typ:"JWT"}),body=encode(claims),data=`${header}.${body}`;
  const signature=encodeBytes(await webcrypto.subtle.sign("RSASSA-PKCS1-v1_5",keys.privateKey,new TextEncoder().encode(data)));
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({public_certs:[publicJwk]}),{headers:{"content-type":"application/json"}});
  try{
    const valid=await authenticateAccess(new Request("https://api.example",{headers:{"Cf-Access-Jwt-Assertion":`${data}.${signature}`}}),env);
    assert.deepEqual(valid,{valid:true,email:"moderator@example.edu"});
    const forged=await authenticateAccess(new Request("https://api.example",{headers:{"Cf-Access-Jwt-Assertion":`${data}.${signature.slice(0,-3)}xxx`}}),env);
    assert.equal(forged.reason,"invalid-signature");
  }finally{globalThis.fetch=originalFetch;}
});
