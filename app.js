/* ═══════════════════════════════════════════════════════════
   CODEX · el libro de todos · demo
   Sin dependencias. Abre index.html y funciona.
   Render incremental (sin parpadeo) · editor en línea en el libro.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ───────────────────────── Autores ─────────────────────────
  var AUTHORS = {
    you:    { id:'you',    name:'Tú',     color:'#b3873f', soft:'rgba(179,135,63,.16)', you:true },
    marina: { id:'marina', name:'Marina', color:'#3b6ea5', soft:'rgba(59,110,165,.13)' },
    hugo:   { id:'hugo',   name:'Hugo',   color:'#7d4a93', soft:'rgba(125,74,147,.13)' },
    leila:  { id:'leila',  name:'Leïla',  color:'#1f8a76', soft:'rgba(31,138,118,.13)' },
    theo:   { id:'theo',   name:'Theo',   color:'#b5532f', soft:'rgba(181,83,47,.13)' },
    ada:    { id:'ada',    name:'Ada',    color:'#9a2f5f', soft:'rgba(154,47,95,.12)' },
    bruno:  { id:'bruno',  name:'Bruno',  color:'#5c6b2f', soft:'rgba(92,107,47,.13)' },
    noa:    { id:'noa',    name:'Noa',    color:'#2f6f8a', soft:'rgba(47,111,138,.13)' }
  };
  var GHOST_IDS = ['marina','hugo','leila','theo','ada','bruno','noa'];

  function f(a, t){ return { a:a, t:t }; }

  var FUTURE_CHAPTERS = [
    { title:'El peso de la luz',            theme:'Amaneceres' },
    { title:'Cartas a un desconocido',      theme:'Encuentros' },
    { title:'El jardín de las preguntas',   theme:'La duda' },
    { title:'Inventario de cosas pequeñas', theme:'Lo cotidiano' },
    { title:'La última función',            theme:'Despedidas' },
    { title:'Mapas de un país inventado',   theme:'La memoria' }
  ];

  var GHOST_LINES = [
    'Y entonces, sin avisar, el invierno se metió entre las palabras.',
    'Nadie recuerda ya quién encendió la primera vela.',
    'El silencio también es una forma de escritura.',
    'Bajo el puente, el río ensayaba en voz baja su única frase.',
    'Aprendimos a nombrar justo aquello que temíamos perder.',
    'La tinta, como la memoria, tarde o temprano se aclara.',
    'Quedaba una sola página y en ella, milagrosamente, cabía todo.',
    'Había un reloj detenido en la hora exacta de las despedidas.',
    'Alguien dejó la ventana abierta para que entrara el futuro.',
    'No escribíamos para durar, sino para no estar tan solos.',
    'Cada palabra pagada pesaba un poco más que la anterior.',
    'La ciudad guardaba secretos en los charcos de la madrugada.'
  ];

  function seed() {
    return {
      v: 4, presence: 3, futureIdx: 0,
      chapters: [
        { id:'c1', title:'El primer aliento', theme:'Comienzos', goal:120, status:'sealed', frags:[
          f('marina','Al principio no había más que una página en blanco y el vértigo hermoso de no saber qué decir.'),
          f('hugo','Alguien, en algún lugar, decidió que el silencio ya había durado demasiado.'),
          f('you','Así que escribió la primera palabra temblando, como quien enciende una cerilla dentro de una catedral a oscuras.'),
          f('leila','La llama no iluminó gran cosa, pero bastó para que otros se acercaran a mirar.'),
          f('theo','Y al mirar, casi sin darse cuenta, también ellos empezaron a escribir.'),
          f('ada','Cada frase costaba algo, y por eso ninguna se decía en vano.'),
          f('bruno','Las palabras valían exactamente lo que vale el coraje de pronunciarlas en voz alta.'),
          f('marina','Así nació este libro: no de un autor, sino de una multitud que se atrevió.')
        ]},
        { id:'c2', title:'Lo que el mar guardó', theme:'Pérdida y memoria', goal:130, status:'sealed', frags:[
          f('noa','Mi abuela decía que el mar no se lleva a nadie: solo lo guarda para devolverlo después en forma de recuerdo.'),
          f('theo','En el pueblo, cada ola traía de vuelta el nombre de alguien que ya no estaba.'),
          f('you','Yo aprendí a leer en las cartas que nunca llegaron, en los sobres que la marea dejaba sobre la arena.'),
          f('ada','Había una caligrafía distinta para cada despedida.'),
          f('hugo','Y, sin embargo, todas decían lo mismo: vuelve, aunque sea tarde.'),
          f('leila','El faro seguía encendido por costumbre, no ya por esperanza.'),
          f('marina','Pero la costumbre, a veces, es la última forma que encuentra el amor.'),
          f('bruno','Cuando por fin volví, el mar me reconoció antes que mi propia casa.')
        ]},
        { id:'c3', title:'Mientras la ciudad duerme', theme:'La noche', goal:230, status:'open', frags:[
          f('hugo','A las tres de la madrugada la ciudad pertenece a otros: a los insomnes, a los panaderos, a los que aman a escondidas.'),
          f('marina','Las farolas escriben en ámbar un idioma que solo entienden los gatos.'),
          f('you','Camino sin rumbo, porque el rumbo es cosa del día.'),
          f('theo','En un banco, un hombre le cuenta a nadie la historia que no se atrevió a contarle a alguien.'),
          f('leila','Arriba, una mano apaga la luz; abajo, otra la enciende. La ciudad respira por turnos.')
        ]}
      ]
    };
  }

  // ───────────────────────── Estado ─────────────────────────
  var KEY = 'codex_demo_v4';
  var state = load();
  var pending = {};   // previews en vivo (no persistido)
  var sim = { timer:null };
  var userWriting = false;   // true mientras el usuario escribe (pausa a los fantasmas)

  function load(){
    try { var raw=localStorage.getItem(KEY); if(raw){ var p=JSON.parse(raw); if(p&&p.v===4) return p; } } catch(e){}
    return seed();
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

  // ───────────────────────── Utils ─────────────────────────
  function $(s,r){ return (r||document).querySelector(s); }
  function $all(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function setText(sel,val){ var el=$(sel); if(el) el.textContent=val; }
  function countWords(str){ str=(str||'').trim(); if(!str) return 0; return str.split(/\s+/).length; }
  function chWords(ch){ var n=0; for(var i=0;i<ch.frags.length;i++) n+=countWords(ch.frags[i].t); return n; }
  function totalWords(){ var n=0; for(var i=0;i<state.chapters.length;i++) n+=chWords(state.chapters[i]); return n; }
  function authorWords(id){ var n=0; for(var i=0;i<state.chapters.length;i++){ var fr=state.chapters[i].frags; for(var j=0;j<fr.length;j++) if(fr[j].a===id) n+=countWords(fr[j].t); } return n; }
  function authorFragCount(id){ var n=0; state.chapters.forEach(function(c){ c.frags.forEach(function(fr){ if(fr.a===id) n++; }); }); return n; }
  function authorChapters(id){ var n=0; state.chapters.forEach(function(c){ if(c.frags.some(function(fr){return fr.a===id;})) n++; }); return n; }
  function ownersList(){ var ids={},out=[]; state.chapters.forEach(function(c){ c.frags.forEach(function(fr){ ids[fr.a]=true; }); }); for(var id in ids) out.push({id:id, words:authorWords(id)}); out.sort(function(a,b){return b.words-a.words;}); return out; }
  function openChapter(){ for(var i=0;i<state.chapters.length;i++) if(state.chapters[i].status==='open') return state.chapters[i]; return null; }
  function fmt(n){ return Math.round(n).toLocaleString('es-ES'); }
  function esc(s){ return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function initials(name){ return name==='Tú'?'T':name.charAt(0).toUpperCase(); }
  function roman(n){ var m=[['X',10],['IX',9],['V',5],['IV',4],['I',1]],o=''; for(var i=0;i<m.length;i++){ while(n>=m[i][1]){ o+=m[i][0]; n-=m[i][1]; } } return o; }
  function chapterArticleEl(id){ return $('.chapter[data-ch="'+id+'"]'); }
  function chapterContribs(ch){ var seen={},out=[]; ch.frags.forEach(function(fr){ if(!seen[fr.a]){ seen[fr.a]=true; out.push(fr.a); } }); return out; }

  // ───────────────────────── Stats (incremental) ─────────────────────────
  function renderStatsShell(){
    $('#topstats').innerHTML =
      statCell('stWords','palabras') +
      statCell('stOwners','autores') +
      '<div class="stat you"><div class="stat-num" id="stYou">0%</div><div class="stat-lbl">tu parte</div></div>';
    $('#heroMeta').innerHTML =
      '<div class="hm"><div class="hm-num"><span id="hmWords">0</span></div><div class="hm-lbl">palabras &middot; €</div></div>'+
      '<div class="hm"><div class="hm-num"><span id="hmOwners">0</span></div><div class="hm-lbl">co-autores</div></div>'+
      '<div class="hm"><div class="hm-num"><span id="hmYou">0%</span></div><div class="hm-lbl">tu parte</div></div>';
    updateStats();
  }
  function statCell(id,lbl,euro){
    return '<div class="stat"><div class="stat-num">'+(euro?'<span class="euro">€</span>':'')+'<span id="'+id+'">0</span></div><div class="stat-lbl">'+lbl+'</div></div>';
  }
  function updateStats(){
    var tw=totalWords(), owners=ownersList().length, youW=authorWords('you'), youPct=tw?youW/tw*100:0;
    setText('#stWords',fmt(tw)); setText('#stOwners',fmt(owners)); setText('#stYou',youPct.toFixed(1)+'%');
    setText('#hmWords',fmt(tw)); setText('#hmOwners',fmt(owners)); setText('#hmYou',youPct.toFixed(1)+'%');
    setText('#presenceCount',state.presence);
  }

  // ───────────────── Prosa con atribución (fusiona frases) ─────────────────
  function renderProse(ch, isOpen){
    var html='', frags=ch.frags, i=0;
    while(i<frags.length){
      var a=frags[i].a, text=frags[i].t, j=i+1;
      while(j<frags.length && frags[j].a===a){ text+=' '+frags[j].t; j++; }
      var au=AUTHORS[a]||AUTHORS.you;
      html += fragSpan(a, au, text)+' ';
      i=j;
    }
    if(isOpen){
      html += '<span class="pending-wrap" id="pendingWrap"></span>';
      html += '<span class="composer-inline" id="composerInline" contenteditable="true" role="textbox" aria-label="Escribe en el libro" spellcheck="false" data-ph="Escribe aquí para continuar la historia..."></span>';
    }
    return html;
  }
  function fragSpan(a, au, text){
    return '<span class="frag'+(au.you?' you':'')+'" data-author="'+a+'" style="--ac:'+au.color+';--ac-soft:'+au.soft+'">'+esc(text)+'</span>';
  }

  // ───────────────────────── Capítulos (render completo) ─────────────────────────
  var filter='all';
  function renderChapters(){
    var html='';
    state.chapters.forEach(function(ch,idx){
      if(filter==='open' && ch.status!=='open') return;
      if(filter==='sealed' && ch.status!=='sealed') return;
      html += chapterHTML(ch,idx);
    });
    var host=$('#chapters');
    host.innerHTML=html;
    host.classList.toggle('attr-on', $('#attrToggle').checked);
    // capítulos expandidos por defecto (el abierto): cuerpo visible sin animación
    $all('.chapter.expanded > .ch-body', host).forEach(function(b){ b.style.maxHeight='none'; b.style.opacity='1'; });
    // binding del índice colapsable
    $all('.ch-head', host).forEach(function(h){ h.addEventListener('click', function(){ toggleChapter(h.parentNode); }); });
    renderPending();
    bindFragTips(host);
    bindInlineEditor();
  }

  // ───────────────────────── Índice colapsable (acordeón) ─────────────────────────
  function toggleChapter(art){
    if(!art) return;
    if(art.classList.contains('expanded')) collapseChapter(art);
    else expandChapter(art, true);
  }
  function expandChapter(art, closeOthers){
    if(!art || art.classList.contains('expanded')) return;
    if(closeOthers) $all('.chapter.expanded').forEach(function(o){ if(o!==art) collapseChapter(o); });
    var body=$('.ch-body', art);
    art.classList.add('expanded');
    body.style.opacity='1';
    body.style.maxHeight=body.scrollHeight+'px';
    var done=function(){ if(art.classList.contains('expanded')) body.style.maxHeight='none'; body.removeEventListener('transitionend',done); };
    body.addEventListener('transitionend',done);
  }
  function collapseChapter(art){
    if(!art || !art.classList.contains('expanded')) return;
    var body=$('.ch-body', art);
    body.style.maxHeight=body.scrollHeight+'px'; void body.offsetWidth;
    art.classList.remove('expanded');
    requestAnimationFrame(function(){ body.style.maxHeight='0px'; body.style.opacity='0'; });
  }

  function chapterHTML(ch,idx){
    var w=chWords(ch), pct=Math.min(100,Math.round(w/ch.goal*100));
    var state, folio, deck='', body, foot='';
    if(ch.status==='sealed'){
      state='<span class="ch-state sealed">Sellado</span>';
      folio='<span class="ch-folio">'+fmt(w)+'</span>';
      foot='<div class="sealed-note">Capítulo cerrado e inmortalizado · '+fmt(w)+' palabras</div>';
    } else if(ch.status==='open'){
      state='<span class="ch-state open">Abierto</span>';
      folio='<span class="ch-folio" data-folio="1">'+fmt(w)+'</span>';
      foot='<div class="ch-contributors">'+contribsHTML(ch)+'</div>';
    } else {
      state='<span class="ch-state locked">Cerrado</span>';
      folio='<span class="ch-folio">&middot;</span>';
    }
    var prog = ch.status!=='locked' ?
      '<div class="ch-progress"><div class="ch-bar"><div class="ch-bar-fill" style="width:'+pct+'%"></div></div>'+
      '<div class="ch-prog-meta">'+progMeta(w,ch.goal,pct)+'</div></div>' : '';
    if(ch.status==='locked'){
      body='<p class="locked-note">Se revelará cuando se selle el capítulo anterior. Su temática es una sorpresa.</p>';
    } else {
      deck='<p class="ch-deck">Tema · '+esc(ch.theme)+'</p>';
      body='<div class="prose'+(idx===0?' first':'')+'">'+renderProse(ch, ch.status==='open')+'</div>';
    }
    var chev='<svg class="ch-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    var expanded = ch.status==='open';
    return '<article class="chapter '+ch.status+(expanded?' expanded':'')+'" data-ch="'+ch.id+'">'+
      '<button class="ch-head" type="button">'+
        '<span class="ch-num">'+roman(idx+1)+'</span>'+
        '<span class="ch-title">'+esc(ch.title)+'</span>'+
        '<span class="ch-dots" aria-hidden="true"></span>'+
        folio + state + chev +
      '</button>'+
      '<div class="ch-body"><div class="ch-body-inner">'+deck+prog+body+foot+'</div></div>'+
    '</article>';
  }
  function progMeta(w,goal,pct){ return '<span><b>'+fmt(w)+'</b> / '+fmt(goal)+' palabras</span><span>'+pct+'%</span>'; }
  function contribsHTML(ch){
    var contribs=chapterContribs(ch);
    return avatars(contribs)+'<span class="cc-label">'+contribs.length+' autores aquí</span>'+
      '<span class="cc-cta"><button class="btn-ghost gold" data-write="1">Escribir aquí</button></span>';
  }
  function avatars(ids){
    var html='<div class="ch-avatars">';
    ids.slice(0,6).forEach(function(id){ var a=AUTHORS[id]||AUTHORS.you; html+='<span class="av" style="background:'+a.color+'" title="'+esc(a.name)+'">'+initials(a.name)+'</span>'; });
    return html+'</div>';
  }

  // ───────────────────────── Añadir frase (incremental, sin parpadeo) ─────────────────────────
  function appendCommitted(ch, frag, opts){
    opts=opts||{};
    var art=chapterArticleEl(ch.id);
    if(art){
      var prose=$('.prose', art);
      if(prose){
        var wrap=$('#pendingWrap', prose);
        var au=AUTHORS[frag.a]||AUTHORS.you;
        var frags=$all('.frag', prose);
        var last=frags.length?frags[frags.length-1]:null;
        var targetSpan;
        if(last && last.getAttribute('data-author')===frag.a){
          last.textContent = last.textContent.replace(/\s+$/,'') + ' ' + frag.t;
          targetSpan=last;
        } else {
          var tmp=document.createElement('div');
          tmp.innerHTML=fragSpan(frag.a, au, frag.t);
          targetSpan=tmp.firstChild;
          if(wrap){ prose.insertBefore(targetSpan, wrap); prose.insertBefore(document.createTextNode(' '), wrap); }
          else { prose.appendChild(targetSpan); prose.appendChild(document.createTextNode(' ')); }
          bindOneFragTip(targetSpan);
        }
        if(opts.fresh && targetSpan){ targetSpan.classList.remove('fresh'); void targetSpan.offsetWidth; targetSpan.classList.add('fresh'); }
        if(opts.scroll && targetSpan){ targetSpan.scrollIntoView({behavior:'smooth', block:'center'}); }
        updateChapterChrome(ch);
      }
    }
    updateStats();
  }
  function updateChapterChrome(ch){
    var art=chapterArticleEl(ch.id); if(!art) return;
    var w=chWords(ch), pct=Math.min(100,Math.round(w/ch.goal*100));
    var fill=$('.ch-bar-fill', art); if(fill) fill.style.width=pct+'%';
    var meta=$('.ch-prog-meta', art); if(meta) meta.innerHTML=progMeta(w,ch.goal,pct);
    var folio=$('.ch-folio[data-folio="1"]', art); if(folio) folio.textContent=fmt(w);
    var cc=$('.ch-contributors', art); if(cc) cc.innerHTML=contribsHTML(ch);
  }

  // ───────────────────────── Previews en vivo (incremental) ─────────────────────────
  function renderPending(){
    var wrap=$('#pendingWrap'); if(!wrap) return;
    var keys=Object.keys(pending);
    // quita previews obsoletas
    $all('[data-k]', wrap).forEach(function(node){ if(keys.indexOf(node.getAttribute('data-k'))<0) node.remove(); });
    keys.forEach(function(k){
      var p=pending[k]; var au=AUTHORS[p.a]||AUTHORS.you;
      var grp=$('[data-k="'+k+'"]', wrap);
      if(!p.text){ if(grp) grp.remove(); return; }
      if(!grp){
        grp=document.createElement('span'); grp.setAttribute('data-k',k);
        var nameTag = au.you?'':'<span class="pending-name" style="--ac:'+au.color+'">'+esc(au.name)+'</span>';
        grp.innerHTML = nameTag+'<span class="pending'+(au.you?' you':'')+'" style="--ac:'+au.color+'"><span class="ptext"></span><span class="live-caret" style="--ac:'+au.color+'"></span></span> ';
        wrap.appendChild(grp);
      }
      var t=$('.ptext', grp); if(t.textContent!==p.text) t.textContent=p.text;
    });
  }

  // ───────────────────────── Tooltip atribución ─────────────────────────
  var tip=$('#tip');
  function bindFragTips(root){ $all('.frag', root).forEach(bindOneFragTip); }
  function bindOneFragTip(el){
    if(el.__tip) return; el.__tip=true;
    el.addEventListener('mouseenter', showTip);
    el.addEventListener('mousemove', moveTip);
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('click', function(e){ showTip.call(el,e); setTimeout(hideTip,1700); });
  }
  function showTip(e){
    var id=this.getAttribute('data-author'); var a=AUTHORS[id]||AUTHORS.you; var w=countWords(this.textContent);
    tip.innerHTML='<div class="tip-name">'+esc(a.name)+(a.you?' (tú)':'')+'</div><div class="tip-meta">'+w+' palabra'+(w===1?'':'s')+' en esta frase</div>';
    tip.classList.add('show'); moveTip.call(this,e);
  }
  function moveTip(e){
    var r=tip.getBoundingClientRect();
    var left=Math.max(10, Math.min(window.innerWidth-r.width-10, (e.clientX||0)-r.width/2));
    var top=(e.clientY||0)-r.height-14; if(top<8) top=(e.clientY||0)+18;
    tip.style.left=left+'px'; tip.style.top=top+'px';
  }
  function hideTip(){ tip.classList.remove('show'); }

  // ───────────────────────── Navegación ─────────────────────────
  function setView(id){
    $all('.view').forEach(function(v){ v.classList.toggle('is-active', v.id===id); });
    $all('.dock-btn').forEach(function(b){ b.classList.toggle('is-active', b.getAttribute('data-view')===id); });
    if(id==='view-own') renderOwn();
    window.scrollTo({ top:0, behavior:'smooth' });
  }
  $all('.dock-btn[data-view]').forEach(function(b){ b.addEventListener('click', function(){ setView(b.getAttribute('data-view')); }); });
  $('#brandHome').addEventListener('click', function(){ setView('view-book'); });

  $('#chapterFilter').addEventListener('click', function(e){
    var b=e.target.closest('button'); if(!b) return;
    filter=b.getAttribute('data-filter');
    $all('#chapterFilter button').forEach(function(x){ x.classList.toggle('is-active', x===b); });
    renderChapters();
  });
  $('#attrToggle').addEventListener('change', function(){ $('#chapters').classList.toggle('attr-on', this.checked); });

  // ───────────────────────── Editor en línea ─────────────────────────
  function bindInlineEditor(){
    var ed=$('#composerInline'); if(!ed || ed.__bound) return; ed.__bound=true;
    ed.addEventListener('input', onInlineInput);
    ed.addEventListener('focus', refreshWriteBar);
    ed.addEventListener('blur', function(){ setTimeout(refreshWriteBar, 120); });
    ed.addEventListener('keydown', function(e){
      if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); if(countWords(ed.textContent)>0) startCheckout(); }
    });
  }
  function onInlineInput(){
    var ed=$('#composerInline'); if(!ed) return;
    var txt=ed.textContent||'';
    if(txt.replace(/\s/g,'')==='' && ed.innerHTML!==''){ ed.innerHTML=''; }   // mantener :empty para el placeholder
    refreshWriteBar();
  }
  function refreshWriteBar(){
    var ed=$('#composerInline');
    var txt=ed?(ed.textContent||''):'';
    var w=countWords(txt);
    setText('#wbWords',w); setText('#wbCost',w);
    $('#wbSign').disabled = w===0;
    var focused = ed && document.activeElement===ed;
    var show = w>0 || focused;
    var bar=$('#writeBar');
    bar.classList.toggle('show', !!show);
    bar.setAttribute('aria-hidden', show?'false':'true');
    // mientras escribes, los demás usuarios no escriben a la vez
    userWriting = !!show;
    if(userWriting){
      var changed=false;
      Object.keys(pending).forEach(function(k){ if(k.indexOf('ghost_')===0){ delete pending[k]; changed=true; } });
      if(changed) renderPending();
    }
  }
  function focusInlineEditor(){
    setView('view-book');
    if(filter==='sealed'){ filter='all'; $all('#chapterFilter button').forEach(function(x){ x.classList.toggle('is-active', x.getAttribute('data-filter')==='all'); }); renderChapters(); }
    setTimeout(function(){
      var ed=$('#composerInline'); if(!ed) return;
      var art=ed.parentNode ? ed.closest('.chapter') : null;
      if(art) expandChapter(art, true);
      setTimeout(function(){
        ed.scrollIntoView({behavior:'smooth', block:'center'});
        placeCaretEnd(ed); ed.focus();
        refreshWriteBar();
      }, 60);
    }, 80);
  }
  function placeCaretEnd(el){
    try{ var r=document.createRange(); r.selectNodeContents(el); r.collapse(false); var s=window.getSelection(); s.removeAllRanges(); s.addRange(r); }catch(e){}
  }
  $('#btnWrite').addEventListener('click', focusInlineEditor);
  $('#wbSign').addEventListener('click', function(){ if(countWords(($('#composerInline')||{}).textContent)>0) startCheckout(); });
  $('#chapters').addEventListener('click', function(e){ if(e.target.closest('[data-write]')) focusInlineEditor(); });

  // ───────────────────────── Checkout ─────────────────────────
  var checkoutScrim=$('#checkoutScrim'); var pendingCommit=null;
  function startCheckout(){
    var ed=$('#composerInline'); var txt=ed?(ed.textContent||'').trim():''; var w=countWords(txt);
    if(!w) return;
    pendingCommit={ text:txt, words:w };
    $('#receipt').innerHTML=
      '<div class="receipt-row"><span>Palabras</span><span class="r-val">'+w+'</span></div>'+
      '<div class="receipt-row"><span>Precio por palabra</span><span class="r-val">1&nbsp;€</span></div>'+
      '<div class="receipt-row total"><span>Total a firmar</span><span class="r-val">'+w+'&nbsp;€</span></div>'+
      '<p class="receipt-quote">«'+esc(truncate(txt,90))+'»</p>';
    $('#paySum').innerHTML=w+'&nbsp;€';
    $('#sealStage').classList.remove('go'); $('#checkoutInner').style.display='';
    var pay=$('#btnPay'); pay.classList.remove('paying'); $('#payLabel').innerHTML='Pagar <strong>'+w+'&nbsp;€</strong> y firmar';
    checkoutScrim.classList.add('show'); checkoutScrim.setAttribute('aria-hidden','false');
  }
  function closeCheckout(){ checkoutScrim.classList.remove('show'); checkoutScrim.setAttribute('aria-hidden','true'); }
  function truncate(s,n){ return s.length>n?s.slice(0,n-1)+'…':s; }
  $('#payCancel').addEventListener('click', closeCheckout);
  $('#btnPay').addEventListener('click', function(){
    if(!pendingCommit) return;
    var pay=$('#btnPay'); pay.classList.add('paying'); $('#payLabel').textContent='Firmando…';
    coinBurst(pay); setTimeout(confirmCommit, 620);
  });
  function confirmCommit(){
    var ch=openChapter(); if(!ch||!pendingCommit){ closeCheckout(); return; }
    var w=pendingCommit.words, text=pendingCommit.text;
    ch.frags.push({ a:'you', t:text }); save();
    var ed=$('#composerInline'); if(ed) ed.innerHTML='';
    refreshWriteBar();
    var willSeal = chWords(ch)>=ch.goal;
    if(willSeal){ sealChapter(ch); }
    else { appendCommitted(ch,{a:'you',t:text},{fresh:true,scroll:true}); closeCheckout(); }
    var twNow=totalWords(), youPctNow = twNow?authorWords('you')/twNow*100:0;
    toast('Has firmado '+w+' palabra'+(w>1?'s':'')+' · tu parte ahora: '+youPctNow.toFixed(1)+'%','gold');
    pendingCommit=null;
  }

  // ───────────────────────── Sellado ─────────────────────────
  function checkSeal(ch){ if(ch.status==='open' && chWords(ch)>=ch.goal) sealChapter(ch); }
  function sealChapter(ch){
    if(ch.status!=='open') return;
    ch.status='sealed';
    var nf=FUTURE_CHAPTERS[state.futureIdx % FUTURE_CHAPTERS.length]; state.futureIdx++;
    state.chapters.push({ id:'c'+(state.chapters.length+1), title:nf.title, theme:nf.theme,
      goal:200+state.futureIdx*30, status:'open', frags:[ f(rand(GHOST_IDS), rand(GHOST_LINES)) ] });
    save();
    if(checkoutScrim.classList.contains('show')){
      $('#checkoutInner').style.display='none'; $('#sealStage').classList.add('go');
      setTimeout(function(){ closeCheckout(); renderChapters(); updateStats(); toast('Capítulo «'+ch.title+'» sellado para siempre','seal'); }, 1150);
    } else {
      renderChapters(); updateStats(); toast('Capítulo «'+ch.title+'» sellado para siempre','seal');
    }
  }

  // ───────────────────────── Simulación de escritores ─────────────────────────
  function startSim(){
    scheduleGhost(2600+Math.random()*2600);
    setInterval(function(){ var d=Math.random()<.5?-1:1; state.presence=Math.max(2,Math.min(7,state.presence+d)); setText('#presenceCount',state.presence); }, 4200);
  }
  function scheduleGhost(ms){ sim.timer=setTimeout(function(){ ghostWrite(); scheduleGhost(4600+Math.random()*5200); }, ms); }
  function ghostWrite(){
    if(userWriting) return;            // no simular mientras el usuario escribe
    var ch=openChapter(); if(!ch) return;
    var id=rand(GHOST_IDS); var key='ghost_'+id;
    if(pending[key]) return;
    var words=rand(GHOST_LINES).split(' ');
    var maxExtra=Math.max(1, words.length-3);
    var n=Math.min(words.length, 4+Math.floor(Math.random()*maxExtra));
    var phrase=words.slice(0,n).join(' ');
    if(!/[.,;!?…]$/.test(phrase)) phrase+='.';
    pending[key]={ a:id, text:'' };
    typeGhost(key, id, phrase, ch);
  }
  function typeGhost(key, id, phrase, ch){
    var i=0;
    (function step(){
      if(!pending[key]) return;
      if(openChapter()!==ch){ delete pending[key]; renderPending(); return; }
      i += 1+Math.floor(Math.random()*2);
      pending[key].text=phrase.slice(0,i);
      renderPending();
      if(i<phrase.length){ setTimeout(step, 40+Math.random()*70); }
      else {
        setTimeout(function(){
          if(!pending[key]) return;
          delete pending[key]; renderPending();
          ch.frags.push({a:id,t:phrase}); save();
          appendCommitted(ch,{a:id,t:phrase},{fresh:true,scroll:false});
          checkSeal(ch);
        }, 520);
      }
    })();
  }

  // ───────────────────────── Propiedad + Reparto (fusionado) ─────────────────────────
  var salePrice=25000;
  function renderOwn(){
    var tw=totalWords(), youW=authorWords('you'), pct=tw?youW/tw*100:0, owners=ownersList();
    var host=$('#ownBody');
    host.innerHTML=
      '<div class="own-hero">'+
        '<div class="oh-lbl">Tu participación en el Codex</div>'+
        '<div class="oh-share">'+pct.toFixed(2)+'<span class="pct">%</span></div>'+
        '<div class="oh-sub">'+fmt(youW)+' de '+fmt(tw)+' palabras del libro son tuyas</div>'+
        '<div class="own-grid">'+
          og(fmt(youW),'tus palabras')+
          og(fmt(authorFragCount('you')),'frases firmadas')+
          og(fmt(authorChapters('you')),'capítulos')+
          og('#'+rankOf('you',owners),'en el ranking')+
        '</div>'+
      '</div>'+

      '<div class="payout-card">'+
        '<h4>Si el Codex se vende, cobras tu parte</h4>'+
        '<p class="pc-sub">Mueve el precio de venta y reparte entre los '+owners.length+' co-autores</p>'+
        '<div class="slider-val"><span class="euro">€</span><span id="ownSaleVal">'+fmt(salePrice)+'</span></div>'+
        '<input type="range" id="ownSlider" min="500" max="500000" step="500" value="'+salePrice+'">'+
        '<div class="payout-result"><div class="pr-lbl">Tu parte</div>'+
          '<div class="pr-num"><span style="font-size:.6em">€</span><span id="ownPayout">'+fmt(salePrice*pct/100)+'</span></div></div>'+
        '<button class="btn-sell" id="btnSell">Simular venta y repartir</button>'+
      '</div>'+

      '<div class="board"><h3>Co-propietarios · reparto</h3>'+ownerRows(owners,tw,salePrice)+'</div>';

    var slider=$('#ownSlider'); setRangeFill(slider);
    slider.addEventListener('input', function(){ salePrice=+slider.value; setRangeFill(slider); updateOwnPayouts(owners,tw); });
    $('#btnSell').addEventListener('click', function(){ simulateSplit(owners,tw); });
  }
  function og(num,lbl){ return '<div class="og"><div class="og-num">'+num+'</div><div class="og-lbl">'+lbl+'</div></div>'; }
  function rankOf(id,owners){ for(var i=0;i<owners.length;i++) if(owners[i].id===id) return i+1; return owners.length; }
  function ownerRows(owners,tw,price){
    var max=owners.length?owners[0].words:1, html='';
    owners.forEach(function(o,i){
      var a=AUTHORS[o.id]||AUTHORS.you, pct=tw?o.words/tw*100:0, barw=max?o.words/max*100:0, amt=price*(tw?o.words/tw:0);
      html+='<div class="owner-row">'+
        '<span class="owner-rank">'+(i+1)+'</span>'+
        '<span class="owner-av" style="background:'+a.color+'">'+initials(a.name)+'</span>'+
        '<div class="owner-main"><div class="owner-name">'+esc(a.name)+(a.you?'<span class="you-tag">tú</span>':'')+'</div>'+
          '<div class="owner-bar"><div class="owner-bar-fill" style="width:'+barw+'%;background:'+a.color+'"></div></div></div>'+
        '<div class="owner-stats"><div class="owner-pct">'+pct.toFixed(1)+'%</div>'+
          '<div class="owner-payout" data-id="'+o.id+'"><span class="euro">€</span>'+fmt(amt)+'</div></div>'+
      '</div>';
    });
    return html;
  }
  function updateOwnPayouts(owners,tw){
    setText('#ownSaleVal',fmt(salePrice));
    var youW=authorWords('you'); setText('#ownPayout', fmt(salePrice*(tw?youW/tw:0)));
    owners.forEach(function(o){
      var el=$('.owner-payout[data-id="'+o.id+'"]'); if(el) el.innerHTML='<span class="euro">€</span>'+fmt(salePrice*(tw?o.words/tw:0));
    });
  }
  function simulateSplit(owners,tw){
    var btn=$('#btnSell'); coinBurst(btn);
    owners.forEach(function(o){
      var el=$('.owner-payout[data-id="'+o.id+'"]'); if(!el) return;
      countUpEuro(el, salePrice*(tw?o.words/tw:0));
    });
    var youW=authorWords('you');
    setTimeout(function(){ toast('Tu parte: '+fmt(salePrice*(tw?youW/tw:0))+'&nbsp;€ por '+fmt(youW)+' palabras','gold'); }, 300);
  }
  function countUpEuro(el, target){
    var dur=900, t0=null;
    function frame(ts){ if(!t0)t0=ts; var p=Math.min(1,(ts-t0)/dur); var e=1-Math.pow(1-p,3);
      el.innerHTML='<span class="euro">€</span>'+fmt(target*e); if(p<1) requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
  }
  function setRangeFill(el){ if(!el) return; var p=(el.value-el.min)/(el.max-el.min)*100; el.style.setProperty('--p',p+'%'); }

  // ───────────────────────── Coins & toasts ─────────────────────────
  function coinBurst(originEl){
    if(!originEl) return;
    var r=originEl.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    for(var i=0;i<10;i++){
      var c=document.createElement('div'); c.className='coin';
      c.style.left=cx+'px'; c.style.top=cy+'px'; document.body.appendChild(c);
      var dist=80+Math.random()*120, dx=(Math.random()<.5?-1:1)*Math.random()*dist, dy=-Math.abs(dist)-20-Math.random()*60, rot=(Math.random()*2-1)*180;
      (function(c){ c.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) rotate('+rot+'deg)',opacity:0}],{duration:720+Math.random()*320,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=function(){ c.remove(); }; })(c);
    }
  }
  function toast(msg,kind){
    var t=document.createElement('div'); t.className='toast'+(kind?' '+kind:'');
    t.innerHTML='<span>'+msg+'</span>';
    $('#toasts').appendChild(t);
    setTimeout(function(){ t.classList.add('out'); setTimeout(function(){ t.remove(); },360); }, 3200);
  }

  // ───────────────────────── Reset ─────────────────────────
  $('#resetDemo').addEventListener('click', function(){
    if(!confirm('¿Reiniciar el demo y borrar tus contribuciones guardadas?')) return;
    localStorage.removeItem(KEY); state=seed(); pending={}; filter='all';
    $all('#chapterFilter button').forEach(function(x){ x.classList.toggle('is-active', x.getAttribute('data-filter')==='all'); });
    renderStatsShell(); renderChapters(); setView('view-book'); toast('Demo reiniciado');
  });

  // ───────────────────────── Arranque ─────────────────────────
  renderStatsShell();
  renderChapters();
  startSim();

})();
