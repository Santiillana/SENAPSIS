const base64UrlToBytes=value=>{
  const normalized=value.replace(/-/g,"+").replace(/_/g,"/");
  const binary=atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,"="));
  return Uint8Array.from(binary,char=>char.charCodeAt(0));
};
const base64ToBytes=value=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
const decodeJson=part=>JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
let cachedKeys=null,keysExpiresAt=0;

export function validateAccessClaims(claims,{audience,issuer,allowedEmails,now=Math.floor(Date.now()/1000)}){
  if(!claims||typeof claims!=="object")return {valid:false,reason:"invalid-claims"};
  const audiences=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(!audience||!audiences.includes(audience))return {valid:false,reason:"invalid-audience"};
  if(!issuer||claims.iss!==issuer)return {valid:false,reason:"invalid-issuer"};
  if(!Number.isFinite(claims.exp)||claims.exp<=now)return {valid:false,reason:"expired"};
  if(Number.isFinite(claims.nbf)&&claims.nbf>now)return {valid:false,reason:"not-yet-valid"};
  const email=String(claims.email??"").trim().toLowerCase();
  if(!email||!allowedEmails.has(email))return {valid:false,reason:"email-not-allowed"};
  return {valid:true,email};
}

async function publicKeys(teamDomain){
  if(cachedKeys&&Date.now()<keysExpiresAt)return cachedKeys;
  const endpoint=`https://${teamDomain}/cdn-cgi/access/certs`;
  const response=await fetch(endpoint,{headers:{accept:"application/json"}});
  if(!response.ok)throw new Error("No se pudieron consultar las claves públicas de Access.");
  const body=await response.json();
  cachedKeys=body.public_certs??[];keysExpiresAt=Date.now()+5*60*1000;return cachedKeys;
}

function certificateSubjectPublicKeyInfo(pem){
  const bytes=base64ToBytes(pem.replace(/-----[^-]+-----/g,"").replace(/\s/g,""));
  const lengthAt=index=>{
    const first=bytes[index++];if(first<128)return {length:first,next:index};
    const count=first&127;if(!count||count>4)return null;
    let length=0;for(let offset=0;offset<count;offset++)length=length*256+bytes[index++];
    return {length,next:index};
  };
  const element=index=>{
    if(index>=bytes.length)return null;
    const offset=index,tag=bytes[index++],length=lengthAt(index);if(!length)return null;
    const start=length.next,end=start+length.length;
    if(end>bytes.length)return null;
    return {offset,tag,start,end,next:end};
  };
  const certificate=element(0),tbs=certificate&&element(certificate.start);
  if(!certificate||certificate.tag!==0x30||!tbs||tbs.tag!==0x30)return null;
  let cursor=tbs.start,field=element(cursor);
  if(field?.tag===0xa0){cursor=field.next;field=element(cursor);}
  for(let index=0;index<5;index++){if(!field)return null;cursor=field.next;field=element(cursor);}
  if(!field||field.tag!==0x30)return null;
  return bytes.slice(field.offset,field.end);
}

export async function authenticateAccess(request,env){
  const teamDomain=String(env.ACCESS_TEAM_DOMAIN??"").replace(/^https?:\/\//,"").replace(/\/$/,"");
  if(!teamDomain||!env.ACCESS_AUD)return {valid:false,status:503,reason:"access-not-configured"};
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!token)return {valid:false,status:401,reason:"missing-token"};
  const [encodedHeader,encodedClaims,encodedSignature,...rest]=token.split(".");
  if(!encodedHeader||!encodedClaims||!encodedSignature||rest.length)return {valid:false,status:401,reason:"malformed-token"};
  let header,claims;
  try{header=decodeJson(encodedHeader);claims=decodeJson(encodedClaims);}catch{return {valid:false,status:401,reason:"malformed-token"};}
  if(header.alg!=="RS256"||typeof header.kid!=="string")return {valid:false,status:401,reason:"unsupported-signature"};
  const issuer=teamDomain?`https://${teamDomain}`:"";
  const emails=new Set(String(env.ACCESS_ALLOWED_EMAILS??"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean));
  const checked=validateAccessClaims(claims,{audience:env.ACCESS_AUD,issuer,allowedEmails:emails});
  if(!checked.valid)return {valid:false,status:403,reason:checked.reason};
  let key;
  try{
    const item=(await publicKeys(teamDomain)).find(candidate=>candidate.kid===header.kid);
    if(item?.kty)key=await crypto.subtle.importKey("jwk",item,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    else if(item?.cert){const spki=certificateSubjectPublicKeyInfo(item.cert);if(spki)key=await crypto.subtle.importKey("spki",spki,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);}
  }catch{return {valid:false,status:503,reason:"access-keys-unavailable"};}
  if(!key)return {valid:false,status:401,reason:"unknown-key"};
  const signed=new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`);
  let signature;
  try{signature=base64UrlToBytes(encodedSignature);}catch{return {valid:false,status:401,reason:"malformed-signature"};}
  const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,signature,signed).catch(()=>false);
  return valid?{valid:true,email:checked.email}:{valid:false,status:401,reason:"invalid-signature"};
}
