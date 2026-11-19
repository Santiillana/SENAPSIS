const escape = value => String(value??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const wrapped = (text,max=16) => {
  const words=String(text??"").split(/\s+/);
  const lines=[];
  let line="";
  for (const word of words) {
    if ((line+" "+word).trim().length>max && line) { lines.push(line); line=word; }
    else line=(line+" "+word).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0,3);
};
function shape(node){
  const x=node.x-node.width/2,y=node.y,w=node.width,h=node.height;
  if (node.type==="terminal") return '<rect x="'+(x+25)+'" y="'+y+'" width="'+(w-50)+'" height="'+h+'" rx="'+(h/2)+'"/>';
  if (node.type==="input") return '<polygon points="'+(x+16)+','+y+' '+(x+w)+','+y+' '+(x+w-16)+','+(y+h)+' '+x+','+(y+h)+'"/>';
  if (node.type==="output") return '<path d="M '+x+' '+y+' H '+(x+w)+' V '+(y+h-10)+' Q '+(x+w*.75)+' '+(y+h-20)+' '+(x+w*.5)+' '+(y+h-10)+' T '+x+' '+(y+h-10)+' Z"/>';
  if (node.type==="if"||node.type==="while"||node.type==="doWhile") return '<polygon points="'+node.x+','+y+' '+(x+w)+','+(y+h/2)+' '+node.x+','+(y+h)+' '+x+','+(y+h/2)+'"/>';
  if (node.type==="for") return '<polygon points="'+(x+24)+','+y+' '+(x+w-24)+','+y+' '+(x+w)+','+(y+h/2)+' '+(x+w-24)+','+(y+h)+' '+(x+24)+','+(y+h)+' '+x+','+(y+h/2)+'"/>';
  if (node.type==="merge") return '<circle cx="'+node.x+'" cy="'+(y+h/2)+'" r="9"/>';
  if (node.type==="body") return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="12" stroke-dasharray="5 4"/>';
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5"/>';
}
export function edgePath(edge,diagram){
  const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
  if (!from||!to) return "";
  const fx=from.x, fy=from.y+from.height/2, tx=to.x, ty=to.y+to.height/2;
  const leftX=node=>node.type==="merge"?node.x-9:node.x-node.width/2;
  const rightX=node=>node.type==="merge"?node.x+9:node.x+node.width/2;
  const bottomY=node=>node.type==="merge"?node.y+node.height/2+9:node.y+node.height;
  const topY=node=>node.type==="merge"?node.y+node.height/2-9:node.y;
  if (edge.kind==="false"&&to.type!=="merge") {
    const y=from.y+from.height/2;
    return "M "+(from.x+from.width/2)+" "+y+" L "+tx+" "+y+" L "+tx+" "+to.y;
  }
  if (edge.kind==="back") {
    // El retorno usa un carril exterior a todas las figuras que encuentra en su tramo vertical.
    const startX=leftX(from);
    const endX=leftX(to);
    const startY=from.y+from.height/2;
    const endY=to.y+to.height/2;
    const top=Math.min(startY,endY),bottom=Math.max(startY,endY);
    const occupied=diagram.nodes.filter(node=>node.y+node.height>top&&node.y<bottom);
    const outerLane=(diagram.maxRouteLane??0)-(edge.routeLane??0);
    const bendX=Math.min(startX,endX,...occupied.map(node=>node.x-node.width/2))-32-outerLane*24;
    return "M "+startX+" "+startY+" L "+bendX+" "+startY+" L "+bendX+" "+endY+" L "+endX+" "+endY;
  }
  if(edge.kind==="merge"||(edge.kind==="false"&&to.type==="merge")){
    const side=edge.kind==="false"?1:from.x<=to.x?-1:1;
    const startX=side<0?leftX(from):rightX(from),startY=from.y+from.height/2;
    const targetY=to.y+to.height/2-9,top=Math.min(startY,targetY),bottom=Math.max(startY,targetY);
    const occupied=diagram.nodes.filter(node=>node.y+node.height>top&&node.y<bottom);
    const outerLane=(diagram.maxRouteLane??0)-(edge.routeLane??0);
    const laneX=side<0?Math.min(startX,...occupied.map(node=>node.x-node.width/2))-32-outerLane*24:Math.max(startX,...occupied.map(node=>node.x+node.width/2))+32+outerLane*24;
    const laneY=targetY-12;
    return "M "+startX+" "+startY+" L "+laneX+" "+startY+" L "+laneX+" "+laneY+" L "+to.x+" "+laneY+" L "+to.x+" "+targetY;
  }
  if (Math.abs(fx-tx)<4) {
    return "M "+fx+" "+bottomY(from)+" L "+tx+" "+topY(to);
  }
  const mid=(fy+ty)/2;
  return "M "+fx+" "+bottomY(from)+" L "+fx+" "+mid+" L "+tx+" "+mid+" L "+tx+" "+topY(to);
}
export function edgeLabelBox(edge,from){
  if(!edge.label)return null;
  const text=edge.label==="V"?"Sí ✓":edge.label==="F"?"No ✗":edge.label;
  const width=edge.label==="V"||edge.label==="F"?52:Math.max(42,[...text].length*8+18),height=24;
  const x=edge.kind==="false"?from.x+from.width/2+8:from.x-width-10;
  const y=edge.kind==="false"?from.y+from.height/2-height/2:from.y+from.height+1;
  return {x,y,width,height,text};
}
function edgeLabel(edge,from){
  const box=edgeLabelBox(edge,from);if(!box)return "";
  return '<g class="diagram-edge-label-wrap" aria-label="'+escape(box.text)+'"><rect x="'+box.x+'" y="'+box.y+'" width="'+box.width+'" height="'+box.height+'" rx="12"/><text class="diagram-edge-label" x="'+(box.x+box.width/2)+'" y="'+(box.y+17)+'">'+escape(box.text)+'</text></g>';
}
export function renderDiagram(container,diagram,options={}){
  if (!container||!diagram) return;
  const active=options.activeNodeId==null?null:String(options.activeNodeId);
  const visited=new Set((options.visitedNodeIds??[]).map(String));
  const edgeMarkup=diagram.edges.map(edge=>{
    const d=edgePath(edge,diagram);
    if (!d) return "";
    const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
    const activeEdge=active&&(from.sourceId===Number(active)||to.sourceId===Number(active));
    const branchClass=edge.label==="V"?" branch-true":edge.label==="F"?" branch-false":"";
    const cls="diagram-edge "+(edge.kind==="back"?"is-back":"")+branchClass+(activeEdge?" is-near-active":"");
    const label=edgeLabel(edge,from);
    return '<g data-edge-id="'+escape(edge.id)+'" class="'+cls+'"><path d="'+d+'" marker-end="url(#flow-arrow)"/>'+label+'</g>';
  }).join("");
  const nodeMarkup=diagram.nodes.map(node=>{
    const isActive=active===String(node.sourceId);
    const isVisited=node.sourceId!==null&&visited.has(String(node.sourceId));
    const lines=node.labelLines??wrapped(node.label,node.type==="if"||node.type==="while"||node.type==="doWhile"?14:16);
    const y=node.y+node.height/2-(lines.length-1)*10;
    const text=node.type==="merge"?"":node.type==="for"&&node.labelParts?.length===3&&lines.length===1
      ?'<text class="for-label" x="'+(node.x+8)+'" y="'+(y+5)+'">'+node.labelParts.map((part,index)=>'<tspan class="for-part for-part-'+index+'">'+(index?'; ':'')+escape(part)+'</tspan>').join("")+'</text>'
      :lines.map((line,i)=>'<text x="'+node.x+'" y="'+(y+i*20+5)+'">'+escape(line)+'</text>').join("");
    return '<g id="flow-node-'+escape(node.id)+'" class="diagram-node node-'+escape(node.type)+(isActive?" is-active":"")+(isVisited?" is-visited":"")+'">'+shape(node)+text+'</g>';
  }).join("");
  const svg='<svg class="flow-svg" id="flow-svg" role="img" aria-label="Diagrama de flujo generado desde el pseudocódigo" viewBox="0 0 '+diagram.width+' '+diagram.height+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>'+
    '<polyline id="flow-trail" class="flow-trail" points=""/><polyline id="flow-active-trail" class="flow-active-trail" points=""/><g class="flow-edges">'+edgeMarkup+'</g><g class="flow-nodes">'+nodeMarkup+'</g>'+
    '<circle id="flow-token-ring" class="flow-token-ring" cx="520" cy="20" r="10" visibility="hidden" aria-hidden="true"/>'+
    '<circle class="flow-token" cx="520" cy="20" r="9" visibility="hidden" aria-hidden="true"/>'+
    '</svg>';
  container.innerHTML=svg;
}
export function highlightDiagram(container,diagram,options={}) {
  if (!container||!diagram) return;
  const active=options.activeNodeId==null?null:String(options.activeNodeId);
  const activeKey=options.activeNodeKey==null?null:String(options.activeNodeKey);
  const visited=new Set((options.visitedNodeIds??[]).map(String));
  const routeNodeId=options.routeNodeId==null?null:String(options.routeNodeId);
  const route=options.route??null;
  const previous=options.previousNodeId==null?null:String(options.previousNodeId);
  const activePart=Number.isInteger(options.activePart)?options.activePart:-1;
  const edgeElements=[...container.querySelectorAll(".diagram-edge")];
  const walkedEdges=new Set((options.walkEdgeIds??[]).map(String));
  edgeElements.forEach(element=>element.classList.toggle("is-token-route",walkedEdges.has(String(element.dataset.edgeId))));
  container.querySelectorAll(".diagram-node").forEach(element=>{
    const id=element.id.replace("flow-node-","");
    const model=diagram.byId.get(id);
    const isActive=activeKey!==null?id===activeKey:Boolean(model&&active!==null&&model.sourceId!==null&&active===String(model.sourceId));
    element.classList.toggle("is-active",isActive);
    element.classList.toggle("is-visited",Boolean(model&&model.sourceId!==null&&visited.has(String(model.sourceId))));
    element.querySelectorAll(".for-part").forEach((part,index)=>part.classList.toggle("is-active-part",isActive&&index===activePart));
  });
  edgeElements.forEach(element=>{
    const edge=diagram.edges.find(candidate=>candidate.id===element.dataset.edgeId);
    const from=edge?diagram.byId.get(edge.from):null;
    const to=edge?diagram.byId.get(edge.to):null;
    const isChosen=Boolean(edge&&routeNodeId&&route&&from?.sourceId===Number(routeNodeId)&&edge.label===route);
    const isSequential=Boolean(edge&&previous&&active&&from?.sourceId===Number(previous)&&to?.sourceId===Number(active));
    element.classList.toggle("is-route-active",isChosen);
    element.classList.toggle("is-active-path",!isChosen&&isSequential);
  });
  const token=container.querySelector(".flow-token");
  if(token){
    let point=null;
    if(previous&&active){
      const travelled=diagram.edges.find(edge=>{
        const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
        return String(from?.sourceId)===previous&&String(to?.sourceId)===active;
      });
      if(travelled){
        const edgeElement=edgeElements.find(element=>element.dataset.edgeId===travelled.id);
        const path=edgeElement?.querySelector("path");
        try{
          const length=path?.getTotalLength?.();
          if(path&&length>0)point=path.getPointAtLength(length*.58);
        }catch{/* El navegador puede no exponer la métrica SVG en algunos contextos. */}
        if(point)token.dataset.edgeId=travelled.id;
      }
    }
    const activeNode=diagram.nodes.find(node=>String(node.sourceId)===active);
    if(!point&&activeNode){
      point={x:activeNode.x,y:Math.max(10,activeNode.y-12)};
      delete token.dataset.edgeId;
    }
    if(point){
      token.setAttribute("cx",String(point.x));
      token.setAttribute("cy",String(point.y));
      token.setAttribute("visibility","visible");
      token.dataset.nodeId=active;
    }
  }
}
