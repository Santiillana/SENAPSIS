import { authenticateAccess } from "./access.js";
import { invalidatePublishedCache } from "./state.js";
import { parseFichaPayload } from "./validation.js";

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const timestamp=()=>new Date().toISOString();

async function limited(env,email){
  const now=Math.floor(Date.now()/1000),cutoff=now-60;
  const row=await env.DB.prepare(`INSERT INTO api_rate_limits(email,window_start,request_count) VALUES(?,?,1)
    ON CONFLICT(email) DO UPDATE SET
      request_count=CASE WHEN window_start<=? THEN 1 ELSE request_count+1 END,
      window_start=CASE WHEN window_start<=? THEN ? ELSE window_start END
    RETURNING request_count`).bind(email,now,cutoff,cutoff,now).first();
  return Number(row?.request_count??31)<=30;
}
async function gate(request,env){
  const identity=await authenticateAccess(request,env);
  if(!identity.valid)return {response:json({error:"access_denied"},identity.status)};
  try{if(!await limited(env,identity.email))return {response:json({error:"rate_limit"},429)};}
  catch{return {response:json({error:"storage_unavailable"},503)};}
  return {identity};
}
async function currentVersion(env){
  const current=await env.DB.prepare("SELECT version FROM published_state WHERE singleton='current'").first();
  return Number(current?.version??0);
}
async function readDraft(env){return env.DB.prepare("SELECT base_version,payload,updated_at,updated_by FROM draft_state WHERE singleton='current'").first();}
function changedSections(before,after){
  const previous=before?JSON.parse(before):{};
  return Object.keys(after).filter(field=>JSON.stringify(previous[field]??null)!==JSON.stringify(after[field]));
}

export async function getDraft(request,env){
  const {identity,response}=await gate(request,env);if(response)return response;
  try{
    const [draft,version]=await Promise.all([readDraft(env),currentVersion(env)]);
    return json({baseVersion:draft?.base_version??version,updatedAt:draft?.updated_at??null,updatedBy:draft?.updated_by??null,payload:draft?JSON.parse(draft.payload):null});
  }catch{return json({error:"storage_unavailable"},503);}
}

export async function getHistory(request,env){
  const {response}=await gate(request,env);if(response)return response;
  try{
    const [publications,audit]=await Promise.all([
      env.DB.prepare("SELECT version,published_at,published_by,undone_at,undone_by FROM publication_history ORDER BY version DESC LIMIT 20").all(),
      env.DB.prepare("SELECT action,version,created_at,actor,summary FROM audit_log ORDER BY id DESC LIMIT 20").all()
    ]);
    return json({publications:publications.results??[],audit:(audit.results??[]).map(item=>({...item,summary:JSON.parse(item.summary||"{}")}))});
  }catch{return json({error:"storage_unavailable"},503);}
}

export async function saveDraft(request,env){
  const {identity,response}=await gate(request,env);if(response)return response;
  if(!request.headers.get("content-type")?.toLowerCase().includes("application/json"))return json({error:"content_type"},415);
  const contentLength=Number(request.headers.get("content-length")??0);if(contentLength>512_000)return json({error:"body_too_large"},413);
  const parsed=parseFichaPayload(await request.text());if(parsed.errors.length)return json({error:"invalid_payload",details:parsed.errors},422);
  const bodyVersion=Number(request.headers.get("if-match")?.replaceAll('"',"")??"");
  if(!Number.isInteger(bodyVersion)||bodyVersion<0)return json({error:"if_match_required"},428);
  const now=timestamp();
  try{
    const version=await currentVersion(env);if(version!==bodyVersion)return json({error:"version_conflict",version},409);
    const [draft,published]=await Promise.all([readDraft(env),env.DB.prepare("SELECT payload FROM published_state WHERE singleton='current'").first()]);
    const sections=changedSections(draft?.payload??published?.payload,parsed.payload);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO draft_state(singleton,base_version,payload,updated_at,updated_by) VALUES('current',?,?,?,?)
        ON CONFLICT(singleton) DO UPDATE SET base_version=excluded.base_version,payload=excluded.payload,updated_at=excluded.updated_at,updated_by=excluded.updated_by`)
        .bind(bodyVersion,JSON.stringify(parsed.payload),now,identity.email),
      env.DB.prepare("INSERT INTO audit_log(actor,action,version,created_at,summary) VALUES(?, ?, ?, ?, ?)").bind(identity.email,request.headers.get("x-traza-action")==="backup_imported"?"backup_imported":"draft_saved",bodyVersion,now,JSON.stringify({sections,bytes:new TextEncoder().encode(JSON.stringify(parsed.payload)).byteLength}))
    ]);
    return json({saved:true,baseVersion:bodyVersion,updatedAt:now});
  }catch{return json({error:"storage_unavailable"},503);}
}

export async function publishDraft(request,env){
  const {identity,response}=await gate(request,env);if(response)return response;
  try{
    const [draft,version]=await Promise.all([readDraft(env),currentVersion(env)]);
    if(!draft)return json({error:"draft_not_found"},404);
    if(Number(draft.base_version)!==version)return json({error:"version_conflict",version},409);
    const next=version+1,now=timestamp(),payload=draft.payload;
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO published_state(singleton,version,payload,published_at,updated_at) VALUES('current',?,?,?,?)
        ON CONFLICT(singleton) DO UPDATE SET version=excluded.version,payload=excluded.payload,published_at=excluded.published_at,updated_at=excluded.updated_at`).bind(next,payload,now,now),
      env.DB.prepare("INSERT INTO publication_history(version,payload,published_at,published_by) VALUES(?,?,?,?)").bind(next,payload,now,identity.email),
      env.DB.prepare("DELETE FROM draft_state WHERE singleton='current'"),
      env.DB.prepare("INSERT INTO audit_log(actor,action,version,created_at,summary) VALUES(?, 'published', ?, ?, '{}')").bind(identity.email,next,now)
    ]);
    await invalidatePublishedCache(request);
    return json({published:true,version:next,updatedAt:now});
  }catch{return json({error:"storage_unavailable"},503);}
}

export async function undoPublication(request,env){
  const {identity,response}=await gate(request,env);if(response)return response;
  try{
    const current=await env.DB.prepare("SELECT version FROM published_state WHERE singleton='current'").first();
    const version=Number(current?.version??0);if(version<2)return json({error:"no_previous_publication"},409);
    const previous=await env.DB.prepare("SELECT payload FROM publication_history WHERE version=?").bind(version-1).first();
    if(!previous)return json({error:"history_unavailable"},409);
    const next=version+1,now=timestamp();
    await env.DB.batch([
      env.DB.prepare("UPDATE published_state SET version=?,payload=?,published_at=?,updated_at=? WHERE singleton='current'").bind(next,previous.payload,now,now),
      env.DB.prepare("UPDATE publication_history SET undone_at=?,undone_by=? WHERE version=?").bind(now,identity.email,version),
      env.DB.prepare("INSERT INTO publication_history(version,payload,published_at,published_by) VALUES(?,?,?,?)").bind(next,previous.payload,now,identity.email),
      env.DB.prepare("INSERT INTO audit_log(actor,action,version,created_at,summary) VALUES(?, 'publication_undone', ?, ?, ?)").bind(identity.email,next,now,JSON.stringify({restoredVersion:version-1}))
    ]);
    await invalidatePublishedCache(request);
    return json({undone:true,version:next,restoredVersion:version-1,updatedAt:now});
  }catch{return json({error:"storage_unavailable"},503);}
}
