
const $ = (id)=>document.getElementById(id);

function cleanSpaces(s){
  return s.replace(/\s+/g," ").trim();
}

function stripEndPunctuation(s){
  return s.replace(/[.;,:!?]+$/g,"").trim();
}

function stripLeadingArticles(s){
  return cleanSpaces(s).replace(/^(un|una|unos|unas|el|la|los|las)\s+/i,"").trim();
}

function normalize(s){
  return stripEndPunctuation(cleanSpaces(s))
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase();
}

function normalizeForCoreComparison(s){
  return normalize(stripLeadingArticles(s));
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

function removeVerbAndOptionalArticle(objective){
  let rest = removeFirstWord(objective);
  rest = stripLeadingArticles(rest);
  return rest;
}

function tokenize(s){
  return normalizeForCoreComparison(s).split(/\s+/).filter(Boolean);
}

function diffWords(expected, actual){
  const e=tokenize(expected), a=tokenize(actual);
  const missing=e.filter(w=>!a.includes(w));
  const extra=a.filter(w=>!e.includes(w));
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

function sentenceCasePreservingAcronyms(s){
  const clean = stripEndPunctuation(cleanSpaces(s));
  if(!clean) return "";
  return capitalizeFirst(clean) + ".";
}

function review(){
  const objective=$("objective").value.trim();
  const title=$("title").value.trim();

  if(!objective || !title){
    alert("Escribe tanto el objetivo general como el título propuesto.");
    return;
  }

  const verb=getFirstWord(objective);
  const restAfterVerb=removeFirstWord(objective);
  const coreFromObjective=removeVerbAndOptionalArticle(objective);

  // Expected/suggested title: remove infinitive + optional initial article.
  const expectedTitle=sentenceCasePreservingAcronyms(coreFromObjective);

  // Suggested objective: preserve student's verb + make the rest agree with the title.
  // We use the student's current title as the content, but restore the article if the original objective had one.
  const articleMatch = restAfterVerb.match(/^(un|una|unos|unas)\s+/i);
  const originalArticle = articleMatch ? articleMatch[1].toLowerCase() : "";
  const normalizedTitleContent = stripEndPunctuation(cleanSpaces(title));
  const titleCore = stripLeadingArticles(normalizedTitleContent);
  let suggestedObjectiveContent = titleCore;
  if(originalArticle){
    suggestedObjectiveContent = originalArticle + " " + titleCore.charAt(0).toLowerCase() + titleCore.slice(1);
  } else {
    suggestedObjectiveContent = titleCore.charAt(0).toLowerCase() + titleCore.slice(1);
  }
  const suggestedObjective = looksInfinitive(verb)
    ? capitalizeFirst(verb) + " " + suggestedObjectiveContent + "."
    : cleanSpaces(objective);

  const objectiveCoreNorm=normalizeForCoreComparison(coreFromObjective);
  const titleCoreNorm=normalizeForCoreComparison(title);

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

  const titleFirst=getFirstWord(title);
  if(titleFirst && normalize(titleFirst)===normalize(verb)){
    corrections.push(`El título conserva el verbo “${verb}”. Debe eliminarse ese verbo inicial.`);
  } else if(verb){
    strengths.push("El título no conserva el verbo inicial del objetivo general.");
  }

  // Exact semantic/core correspondence: ignores initial article, capitalization, accents, punctuation and line breaks.
  if(objectiveCoreNorm===titleCoreNorm && looksInfinitive(verb)){
    overall="ok";
    statusText="🟢 COINCIDE CORRECTAMENTE";
    summary="El título y el objetivo general tienen correspondencia correcta. El objetivo conserva el verbo en infinitivo y el título expresa el mismo contenido sin ese verbo; también se acepta la omisión del artículo inicial “un/una/unos/unas”.";
    strengths.push("El contenido esencial del título coincide con el contenido del objetivo general.");
    strengths.push("Las diferencias de mayúsculas, salto de línea, punto final o artículo inicial no afectan la concordancia.");
  } else {
    const sim=similarity(coreFromObjective,title);
    if(sim>=0.86 && looksInfinitive(verb)){
      overall="warn";
      statusText="🟡 COINCIDE PARCIALMENTE";
      summary="El título es muy parecido al contenido del objetivo general, pero existen diferencias de palabras u orden que deben revisarse.";
    }

    const d=diffWords(coreFromObjective,title);
    if(d.missing.length){
      corrections.push("En el título faltan palabras o elementos que sí aparecen en el objetivo general.");
      diffs.push({label:"Faltan en el título",value:d.missing.join(", ")});
    }
    if(d.extra.length){
      corrections.push("El título contiene palabras o elementos que no aparecen en el objetivo general después de retirar el verbo y el artículo inicial.");
      diffs.push({label:"Sobran en el título",value:d.extra.join(", ")});
    }

    if(d.missing.length===0 && d.extra.length===0 && objectiveCoreNorm!==titleCoreNorm){
      corrections.push("Las palabras principales coinciden, pero no están en el mismo orden. Revisa si cambiaste la formulación esencial.");
      diffs.push({label:"Orden/Formulación",value:"La secuencia de palabras no coincide exactamente."});
    }
  }

  const expectedTokens=tokenize(coreFromObjective).length;
  const titleTokens=tokenize(title).length;
  if(overall!=="ok"){
    if(titleTokens===expectedTokens && objectiveCoreNorm!==titleCoreNorm){
      diffs.push({label:"Número de palabras",value:`Ambos contienen ${titleTokens} palabras principales, pero existen cambios de contenido u orden.`});
    } else if(titleTokens!==expectedTokens){
      diffs.push({label:"Extensión",value:`Esperadas: ${expectedTokens} palabras principales; título escrito: ${titleTokens} palabras principales.`});
    }
  }

  if(overall==="ok"){
    corrections.push("No se identifican correcciones de correspondencia entre título y objetivo general.");
  } else {
    corrections.push("Para corregirlo, toma el contenido de tu objetivo general, elimina el verbo inicial en infinitivo y, si corresponde, el artículo inicial “un/una/unos/unas”. Mantén intactos los demás elementos esenciales.");
  }

  $("statusBadge").className=`result-badge ${overall}`;
  $("statusBadge").textContent=statusText;
  $("summary").textContent=summary;
  $("detectedVerb").textContent=verb || "No detectado";
  $("expectedTitle").textContent=expectedTitle;
  $("studentTitle").textContent=title;

  // New suggestions based on what student wrote.
  $("suggestedObjective").textContent=suggestedObjective;
  $("suggestedTitle").textContent=expectedTitle;

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
