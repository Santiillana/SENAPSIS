import { authenticateAccess } from "./access.js";

const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{
  status,
  headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}
});

function corsHeaders(request,env){
  const origin=request.headers.get("Origin");
  if(!origin||origin!==env.ALLOWED_ORIGIN)return null;
  return {"access-control-allow-origin":origin,"access-control-allow-methods":"GET, POST, PUT, DELETE, OPTIONS","access-control-allow-headers":"Content-Type, Cf-Access-Jwt-Assertion","vary":"Origin"};
}

export default {
  async fetch(request,env){
    const url=new URL(request.url),cors=corsHeaders(request,env);
    if(request.headers.has("Origin")&&!cors)return json({error:"origin_not_allowed"},403);
    const headers=cors??{};
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
    if(url.pathname==="/api/v1/health"&&request.method==="GET")return json({ok:true},200,headers);
    if(url.pathname==="/api/v1/admin/session"&&request.method==="GET"){
      const identity=await authenticateAccess(request,env);
      if(!identity.valid)return json({error:"access_denied"},identity.status,headers);
      return json({authenticated:true,email:identity.email},200,headers);
    }
    return json({error:"not_found"},404,headers);
  }
};
