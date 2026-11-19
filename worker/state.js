const TTL=60;
const cache=()=>globalThis.caches?.default??null;

async function cached(request){
  try{return await cache()?.match(request)??null;}catch{return null;}
}
async function remember(request,response){
  try{await cache()?.put(request,response.clone());}catch{}
  return response;
}
function json(payload,status=200,headers={}){
  return new Response(JSON.stringify(payload),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":`public, max-age=${TTL}, stale-while-revalidate=300`,...headers}});
}
function notModified(request,etag){return request.headers.get("If-None-Match")===etag;}
function notModifiedResponse(request,response){
  const etag=response.headers.get("etag");
  return etag&&notModified(request,etag)?new Response(null,{status:304,headers:{etag,"cache-control":response.headers.get("cache-control")??`public, max-age=${TTL}`}}):response;
}

export async function readVersion(request,env){
  const key=new Request(new URL("/api/v1/version",request.url));
  const hit=await cached(key);if(hit)return notModifiedResponse(request,hit);
  let row;
  try{row=await env.DB.prepare("SELECT version, published_at FROM published_state WHERE singleton = 'current'").first();}
  catch{return json({error:"storage_unavailable"},503,{"cache-control":"no-store"});}
  const payload={version:Number(row?.version??0),updatedAt:row?.published_at??null};
  const etag=`"${payload.version}"`;
  if(notModified(request,etag))return new Response(null,{status:304,headers:{etag,"cache-control":`public, max-age=${TTL}, stale-while-revalidate=300`}});
  return remember(key,json(payload,200,{etag}));
}

export async function readPublishedState(request,env){
  const key=new Request(new URL("/api/v1/state",request.url));
  const hit=await cached(key);if(hit)return notModifiedResponse(request,hit);
  let row;
  try{row=await env.DB.prepare("SELECT version, payload, published_at FROM published_state WHERE singleton = 'current'").first();}
  catch{return json({error:"storage_unavailable"},503,{"cache-control":"no-store"});}
  if(!row)return remember(key,json({version:0,updatedAt:null,payload:null}));
  let payload;
  try{payload=JSON.parse(row.payload);}catch{return json({error:"invalid_stored_state"},500,{"cache-control":"no-store"});}
  const etag=`"${Number(row.version)}"`;
  if(notModified(request,etag))return new Response(null,{status:304,headers:{etag,"cache-control":`public, max-age=${TTL}, stale-while-revalidate=300`}});
  return remember(key,json({version:Number(row.version),updatedAt:row.published_at,payload},200,{etag}));
}

export async function invalidatePublishedCache(request){
  try{const store=cache();if(!store)return;const base=new URL(request.url);await Promise.all(["/api/v1/version","/api/v1/state"].map(path=>store.delete(new URL(path,base))));}catch{}
}
