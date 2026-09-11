
const $ = (id)=>document.getElementById(id);

function cleanSpaces(s){
  return s.replace(/\s+/g," ").trim();
}

function stripEndPunctuation(s){
  return s.replace(/[.;,:!?]+$/g,"").trim();
}

function normalize(s){
  return stripEndPunctuation(cleanSpaces(s))
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase();
}

function capitalizeFirst(s){
  if(!s) return s;
  return s.charAt(0).toUpperCase()+s.slice(1);
}

function getFirstWord(s){
  const m=cleanSpaces(s).match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/);
  return m ? m[1] : "";
}

function looksInfinitive(word){
  const w=word.toLowerCase();
  return /(ar|er|ir)$/.test(w) && w.length>3;
}

function removeFirstWord(s){
  const clean=cleanSpaces(s);
  return clean.replace(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+\s+/,"").trim();
}

function tokenize(s){
  return normalize(s).split(/\s+/).filter(Boolean);
}

function diffWords(expected, actual){
  const e=tokenize(expected), a=tokenize(actual);
  const missing=e.filter((w,i)=>!a.includes(w));
  const extra=a.filter((w,i)=>!e.includes(w));
  return {
    missing:[...new Set(missing)],
    extra:[...new Set(extra)]
  };
}

function similarity(a,b){
  const A=new Set(tokenize(a)), B=new Set(tokenize(b));
  const union=new Set([...A,...B]);
  if(union.size===0) return 0;
  let inter=0; A.forEach(x=>{if(B.has(x)) inter++});
  return inter/union.size;
}

function review(){
  const objective=$("objective").value.trim();
  const title=$("title").value.trim();

  if(!objective || !title){
    alert("Escribe tanto el objetivo general como el título propuesto.");
    return;
  }

  const verb=getFirstWord(objective);
  const rest=removeFirstWord(objective);
  const expected=capitalizeFirst(stripEndPunctuation(rest))+".";
  const objNorm=normalize(objective);
  const titleNorm=normalize(title);
  const expectedNorm=normalize(rest);

  const strengths=[];
  const corrections=[];
  const diffs=[];

  let overall="bad";
  let statusText="🔴 NO COINCIDE";
  let summary="El título no corresponde al objetivo general según la regla establecida.";

  if(!verb){
    corrections.push("No se pudo identificar el primer verbo del objetivo general.");
  } else if(!looksInfinitive(verb)){
    corrections.push(`El objetivo general empieza con “${verb}”, que no parece estar formulado como verbo en infinitivo. Revisa su formulación antes de evaluar el título.`);
  } else {
    strengths.push(`El objetivo general inicia con el verbo en infinitivo “${verb}”.`);
  }

  // Título no debería iniciar con el mismo verbo.
  const titleFirst=getFirstWord(title);
  if(titleFirst && normalize(titleFirst)===normalize(verb)){
    corrections.push(`El título conserva el verbo “${verb}”. Debe eliminarse únicamente ese verbo inicial.`);
  } else if(verb){
    strengths.push("El título no conserva el verbo inicial del objetivo general.");
  }

  // Comparación exacta después del verbo.
  if(expectedNorm===titleNorm && looksInfinitive(verb)){
    overall="ok";
    statusText="🟢 COINCIDE";
    summary="El título coincide correctamente con el objetivo general: se ha eliminado únicamente el verbo inicial en infinitivo y se mantiene el resto del contenido.";
    strengths.push("Después de retirar el verbo inicial, el contenido del título coincide con el objetivo general.");
  } else {
    const sim=similarity(rest,title);
    if(sim>=0.86 && looksInfinitive(verb)){
      overall="warn";
      statusText="🟡 COINCIDE PARCIALMENTE";
      summary="El título es muy parecido al contenido del objetivo general, pero existen diferencias que deben corregirse para cumplir exactamente la regla metodológica.";
    }

    const d=diffWords(rest,title);
    if(d.missing.length){
      corrections.push("En el título faltan palabras o elementos que sí aparecen en el objetivo general.");
      diffs.push({label:"Faltan en el título",value:d.missing.join(", ")});
    }
    if(d.extra.length){
      corrections.push("El título contiene palabras o elementos que no aparecen en el objetivo general después de retirar el verbo.");
      diffs.push({label:"Sobran en el título",value:d.extra.join(", ")});
    }

    // Diferencia de orden aunque tenga mismas palabras.
    if(d.missing.length===0 && d.extra.length===0 && expectedNorm!==titleNorm){
      corrections.push("Las palabras principales coinciden, pero no están en el mismo orden. El título debe conservar la misma formulación del objetivo general, excepto por el verbo inicial.");
      diffs.push({label:"Orden/Formulación",value:"La secuencia de palabras no coincide exactamente."});
    }
  }

  // Longitud / información extra.
  const expectedTokens=tokenize(rest).length;
  const titleTokens=tokenize(title).length;
  if(titleTokens===expectedTokens && expectedNorm!==titleNorm){
    diffs.push({label:"Número de palabras",value:`Ambos contienen ${titleTokens} palabras normalizadas, pero existen cambios de contenido u orden.`});
  } else if(titleTokens!==expectedTokens){
    diffs.push({label:"Extensión",value:`Esperadas: ${expectedTokens} palabras; título escrito: ${titleTokens} palabras.`});
  }

  if(overall==="ok"){
    corrections.push("No se identifican correcciones de correspondencia entre título y objetivo general.");
  } else {
    corrections.push("Para corregirlo, toma tu objetivo general y elimina solamente el primer verbo en infinitivo. No agregues, quites ni sustituyas el resto del contenido.");
  }

  $("statusBadge").className=`result-badge ${overall}`;
  $("statusBadge").textContent=statusText;
  $("summary").textContent=summary;
  $("detectedVerb").textContent=verb || "No detectado";
  $("expectedTitle").textContent=expected;
  $("studentTitle").textContent=title;

  $("strengths").innerHTML=strengths.length
    ? strengths.map(x=>`<li>${x}</li>`).join("")
    : "<li>No se identificaron fortalezas suficientes todavía.</li>";

  $("corrections").innerHTML=corrections.map(x=>`<li>${x}</li>`).join("");

  if(diffs.length){
    $("differences").innerHTML=diffs.map(d=>`
      <div class="diff-row">
        <div class="diff-label">${d.label}</div>
        <div>${d.value}</div>
      </div>`).join("");
    $("differencesBox").classList.remove("hidden");
  }else{
    $("differencesBox").classList.add("hidden");
  }

  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth"});
}

$("reviewBtn").addEventListener("click",review);
$("clearBtn").addEventListener("click",()=>{
  $("objective").value="";
  $("title").value="";
  $("results").classList.add("hidden");
});
