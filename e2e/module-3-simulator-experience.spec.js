import { test, expect, goToSpace } from "./navigation.js";

test("el clic físico de Siguiente avanza y sincroniza el paso de entrada",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await expect(page.locator("body")).toHaveAttribute("data-simulator-step","0");
  await page.locator("#simulator-next").click();
  await expect(page.locator("body")).toHaveAttribute("data-simulator-step","1");
  await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","input");
  await expect(page.locator("#vf")).toContainText("Qué pasa");
  await expect(page.locator("#vf")).toContainText("Por qué");
  await expect(page.locator('#variables-content [data-variable-card="a"]')).toContainText("8");
  expect(errors).toEqual([]);
});

test("Leer anima el dato hasta Variables y pulsa el panel de destino",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-next").click();
  const flight=page.locator('#simulator-flight-layer .sim-flight-chip[data-destination="variables"]');
  await expect(flight).toBeAttached({timeout:5000});
  await expect(flight).toHaveAttribute("aria-hidden","true");
  await expect(flight).toHaveText("");
  await expect(page.locator("#PR.variables-panel.is-pulsing")).toBeVisible({timeout:5000});
  await expect(page.locator("#PR .sim-pulse-count")).toHaveCount(0);
});

test("Imprimir vuela hacia Pantalla y un avance manual cancela el vuelo pendiente",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await goToSpace(page, "simulator");
  const outputStep=page.locator("#trace-history li").filter({hasText:"SALIDA"}).first();
  const index=Number(await outputStep.getAttribute("data-history-step"));
  expect(index).toBeGreaterThan(0);
  await page.locator("#simulator-timeline").evaluate((input,value)=>{
    input.value=String(value-1);input.dispatchEvent(new Event("input",{bubbles:true}));
  },index);
  await page.locator("#simulator-next").click();
  await expect(page.locator('#simulator-flight-layer .sim-flight-chip[data-destination="output"]')).toBeAttached({timeout:5000});
  await page.locator("#simulator-next").click();
  await expect(page.locator("#simulator-flight-layer .sim-flight-chip")).toHaveCount(0);
  await expect(page.locator("#timeline-count")).toContainText("/");
});

test("el movimiento reducido conserva el resaltado e impide vuelos secundarios",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-next").click();
  await expect(page.locator("#PR.variables-panel.is-pulsing")).toBeVisible();
  await expect(page.locator("#simulator-flight-layer .sim-flight-chip")).toHaveCount(0);
});

test("En escena muestra una ilustración y una explicación concreta sin repetir paneles",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await goToSpace(page, "simulator");
  for(let i=0;i<3;i++)await page.locator("#simulator-next").click();
  await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","assignment");
  await expect(page.locator("#scene-content .scene-figure-host")).toBeVisible();
  await expect(page.locator("#scene-content .scene-event-body")).toContainText("13");
  await expect(page.locator("#scene-content .scene-operation-breakdown")).toContainText("8 + 5 = 13");
  await expect(page.locator("#scene-content .scene-symbol-explanation")).toContainText("Rectángulo · Proceso");
  await expect(page.locator("#scene-content .scene-event-technical")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Variables e Historial se reconstruyen exactamente al avanzar y retroceder",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-last").click();
  await expect(page.locator('#variables-content [data-variable-history="a"]')).toContainText("8");
  await expect(page.locator('#variables-content [data-variable-history="s"]')).toContainText("13");
  await page.locator('#variables-content [data-variable-history="a"]').click();
  await page.locator(".variable-history-details").evaluate(el=>{el.open=true;});
  await expect(page.locator("#variable-history")).toContainText("Historial · a");
  await expect(page.locator("#variable-history [data-variable-step]")).not.toHaveCount(0);
  await page.locator("#simulator-timeline").evaluate(input=>{input.value="1";input.dispatchEvent(new Event("input",{bubbles:true}));});
  await expect(page.locator("#variables-content")).toContainText("a");
  await expect(page.locator("#variables-content")).not.toContainText("13");
  await page.locator("#simulator-timeline").evaluate(input=>{input.value="0";input.dispatchEvent(new Event("input",{bubbles:true}));});
  await expect(page.locator("#variables-content")).toContainText("La memoria aún está vacía");
  await expect(page.locator("#variable-history")).toContainText("todavía no cambia");
});

test("la ficha contextual se reposiciona sin cubrir otras figuras ni conexiones",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-next").click();
  const card=page.locator("#vf");
  await expect.poll(()=>card.evaluate(el=>!!el.dataset.anchorNode)).toBe(true);
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/is-arriving/);
  const report=await page.evaluate(()=>{
    const card=document.querySelector("#vf"),stage=document.querySelector("#diagram-stage");
    const active=card.dataset.anchorNode,a=card.getBoundingClientRect(),s=stage.getBoundingClientRect();
    const overlaps=selector=>[...document.querySelectorAll(selector)].some(element=>{
      try{
        let r;
        if(element.matches(".diagram-edge")){
          const b=element.getBBox(),m=element.getScreenCTM(),svg=element.ownerSVGElement;
          const pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>{
            const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(m);
          });
          const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
          r={left:Math.min(...xs)-8,right:Math.max(...xs)+8,top:Math.min(...ys)-8,bottom:Math.max(...ys)+8};
        }else r=element.getBoundingClientRect();
        return a.left<r.right&&a.right>r.left&&a.top<r.bottom&&a.bottom>r.top;
      }catch{return false;}
    });
    return {
      inside:a.left>=s.left&&a.right<=s.right&&a.top>=s.top&&a.bottom<=s.bottom,
      activeOverlap:overlaps("#flow-svg #flow-node-"+CSS.escape(active)),
      otherNodeOverlap:overlaps("#flow-svg .diagram-node:not(#flow-node-"+CSS.escape(active)+")"),
      edgeOverlap:overlaps("#flow-svg .diagram-edge")
    };
  });
  expect(report.inside).toBe(true);
  expect(report.activeOverlap).toBe(false);
  expect(report.otherNodeOverlap).toBe(false);
  expect(report.edgeOverlap).toBe(false);
});

test("Para muestra la vuelta activa y el retorno del ciclo evita las figuras",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#sim-exercise-select").selectOption("10");
  await page.locator("#simulator-history-details").evaluate(el=>{el.open=true;});
  const iteration=page.locator('#trace-history [data-history-step]').filter({hasText:"Vuelta 1"}).first();
  await expect(iteration).toBeVisible();
  await iteration.click();
  await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","loop-condition");
  await expect(page.locator("#scene-content .scene-loop-round")).toContainText("Vuelta 1");
  await expect(page.locator("#scene-content .scene-loop-track .scene-loop-step.is-active")).toContainText("Comprobar");
  await page.locator("#simulator-next").click();
  await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","loop-enter");
  await expect(page.locator("#scene-content .scene-loop-track .scene-loop-step.is-active")).toContainText("Cuerpo");
  const geometry=await page.evaluate(()=>{
    const paths=[...document.querySelectorAll("#flow-diagram-container .diagram-edge.is-back path")];
    return paths.map(path=>{
      const values=(path.getAttribute("d").match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
      const [startX,startY,bendX,,bendX2,endY,endX,endY2]=values;
      const boxes=[...document.querySelectorAll("#flow-diagram-container .diagram-node")].map(node=>node.getBBox());
      const startMatches=boxes.some(box=>Math.abs(box.x-startX)<1&&Math.abs(box.y+box.height/2-startY)<1);
      const endMatches=boxes.some(box=>Math.abs(box.x-endX)<1&&Math.abs(box.y+box.height/2-endY2)<1);
      return {outside:bendX<Math.min(startX,endX)-30&&bendX2===bendX,startMatches,endMatches};
    });
  });
  expect(geometry.length).toBeGreaterThan(0);

  expect(geometry.every(edge=>edge.outside)).toBe(true);
  const phaseLayout=await page.locator("#scene-content .scene-loop-track .scene-loop-step").evaluateAll(nodes=>{
    const tops=nodes.map(node=>node.getBoundingClientRect().top);
    return {count:tops.length,singleRow:tops.length>0&&tops.every(top=>Math.abs(top-tops[0])<3)};
  });
  expect(phaseLayout.count).toBe(5);
  expect(phaseLayout.singleRow).toBe(true);
  await expect(page.locator("#flow-token-label")).toHaveCount(0);
});
