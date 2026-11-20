const sourceTypes=new Set(["P","S","T"]);

export const classificationTemplate=Object.freeze({
  construirPasos(_exercise,scenario){
    if(!scenario||!Array.isArray(scenario.sources))return [];
    const requirementById=new Map((scenario.requirements??[]).map(item=>[item.id,item]));
    return scenario.sources.map((source,index)=>{
      if(!sourceTypes.has(source.type))throw new TypeError(`Tipo de fuente no admitido: ${source.type}`);
      const seenSources=new Set(scenario.sources.slice(0,index+1).map(item=>item.id));
      const requirements=(scenario.requirements??[]).filter(item=>seenSources.has(item.sourceId));
      const areas=(scenario.areas??[]).map(area=>({id:area.id,title:area.title,covered:requirements.some(item=>area.requirementIds.includes(item.id)),requirementIds:area.requirementIds}));
      const emitted=(source.requirementIds??[]).map(id=>requirementById.get(id)).filter(Boolean).map(item=>({id:item.id,text:item.text}));
      const upstream=source.type==="P"?[]:scenario.sources.slice(0,index).filter(item=>item.hops<source.hops).slice(-1).map(item=>item.id);
      return {
        id:`clasificacion:${scenario.id}:${source.id}`,foco:source.id,globo:String(source.contribution??""),
        escena:{tipo:"clasificacion",datos:{scenarioId:scenario.id,source,sourceIndex:index,sourceCount:scenario.sources.length,upstream,emitted}},
        estado:{requirements:requirements.map(item=>item.id),areas,coveredAreas:areas.filter(item=>item.covered).length},
        salida:emitted.map(item=>`${item.id}: ${item.text}`),frase:`Fuente ${source.type}: ${source.title}. ${source.contribution}`
      };
    });
  }
});
