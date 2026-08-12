const months=[['01','JAN','Janeiro'],['02','FEV','Fevereiro'],['03','MAR','Março'],['04','ABR','Abril'],['05','MAI','Maio'],['06','JUN','Junho'],['07','JUL','Julho'],['08','AGO','Agosto'],['09','SET','Setembro'],['10','OUT','Outubro'],['11','NOV','Novembro'],['12','DEZ','Dezembro']];

const profiles={
  '312':{
    label:'APAC Magnético 3.12c',
    short:'3.12c',
    current:false,
    note:'Perfil legado. A crítica 010082 foi reproduzida no ambiente 3.12c quando a data de encerramento pertence a competência diferente da competência apresentada.'
  },
  '400':{
    label:'APAC Magnético 4.00',
    short:'4.00',
    current:true,
    note:'Perfil atual. Aplica a mesma pré-validação preventiva de encerramento x competência e preserva todas as datas assistenciais.'
  }
};

const $=id=>document.getElementById(id);
const monthSel=$('month');
const profileSel=$('apacTarget');
const fileInput=$('file');
const drop=$('drop');
const statusEl=$('status');
const statusCard=$('statusCard');
const genBtn=$('generate');
const valBtn=$('validate');
const auditBtn=$('auditBtn');
const applyRecommendedBtn=$('applyRecommended');

months.forEach(m=>monthSel.add(new Option(`${m[2]} (${m[1]})`,m[0])));
months.forEach(m=>{
  const b=document.createElement('button');
  b.type='button';
  b.className='month-chip';
  b.dataset.month=m[0];
  b.textContent=m[1];
  b.onclick=()=>{monthSel.value=m[0];refreshTargetPreview()};
  $('monthGrid').appendChild(b);
});

let state={file:null,bytes:null,parsed:null,output:null,audit:null};

drop.onclick=()=>fileInput.click();
drop.ondragover=e=>{e.preventDefault();drop.classList.add('drag')};
drop.ondragleave=()=>drop.classList.remove('drag');
drop.ondrop=e=>{e.preventDefault();drop.classList.remove('drag');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0])};
fileInput.onchange=()=>fileInput.files[0]&&loadFile(fileInput.files[0]);
monthSel.onchange=refreshTargetPreview;
$('year').oninput=refreshTargetPreview;
profileSel.onchange=()=>{refreshProfile();refreshTargetPreview();renderAuditBase()};
applyRecommendedBtn.onclick=()=>{
  if(!state.parsed)return;
  const d=analyzeCompetency(state.parsed);
  if(!d.recommended)return;
  $('year').value=d.recommended.slice(0,4);
  monthSel.value=d.recommended.slice(4);
  refreshTargetPreview();
};

const asc=(b,s,e)=>String.fromCharCode(...b.slice(s,e));

function setStatus(text,kind='',title){
  statusEl.textContent=text;
  statusCard.className='status-card '+kind;
  const label=kind==='ok'?'Validado':kind==='bad'?'Bloqueado':kind==='warn'?'Atenção':'Aguardando';
  $('statusPill').textContent=label;
  $('topStatusPill').textContent=label;
  $('statusTitle').textContent=title||(kind==='ok'?'Estrutura reconhecida':kind==='bad'?'Operação bloqueada':kind==='warn'?'Revisão necessária':'Pronto para iniciar');
}

function updateSteps(stage){
  [1,2,3].forEach(n=>{
    const el=$('step'+n);
    el.classList.remove('active','done');
    if(n<stage)el.classList.add('done');
    else if(n===stage)el.classList.add('active');
  });
}

function parseLines(bytes){
  let lines=[],start=0;
  for(let i=0;i<bytes.length-1;i++){
    if(bytes[i]===13&&bytes[i+1]===10){
      lines.push({start,end:i,len:i-start,crlf:true});
      start=i+2;
      i++;
    }
  }
  if(start<bytes.length)lines.push({start,end:bytes.length,len:bytes.length-start,crlf:false});
  return lines;
}

function validateBytes(bytes){
  const lines=parseLines(bytes);
  if(!lines.length)throw Error('Arquivo vazio.');
  if(!lines.every(x=>x.crlf))throw Error('O arquivo não termina todas as linhas com CRLF. Conversão bloqueada.');

  const allowed={'01':139,'14':537,'06':37,'13':90};
  const header=lines[0];
  const htype=asc(bytes,header.start,header.start+2);
  if(htype!=='01')throw Error('Cabeçalho 01 não encontrado na primeira linha.');

  const src=asc(bytes,header.start+7,header.start+13);
  if(!/^\d{6}$/.test(src)||+src.slice(4)<1||+src.slice(4)>12)throw Error('Competência do cabeçalho inválida.');

  let counts={'01':0,'14':0,'06':0,'13':0};
  let fields=[];
  let apacs=[];

  for(let i=0;i<lines.length;i++){
    const L=lines[i];
    const type=asc(bytes,L.start,L.start+2);
    if(!(type in allowed))throw Error(`Registro ${type||'(vazio)'} na linha ${i+1} ainda não é homologado nesta versão.`);
    if(L.len!==allowed[type])throw Error(`Linha ${i+1} (${type}) tem ${L.len} bytes; esperado ${allowed[type]}. Conversão bloqueada.`);
    counts[type]++;

    const p=(type==='01')?L.start+7:L.start+2;
    const c=asc(bytes,p,p+6);
    if(c!==src)throw Error(`Competência divergente na linha ${i+1}: ${c}; cabeçalho: ${src}.`);
    fields.push({line:i+1,type,start:p,end:p+6});

    if(type==='14'){
      apacs.push({
        line:i+1,
        num:asc(bytes,L.start+8,L.start+21),
        motivo:asc(bytes,L.start+226,L.start+228),
        encerramento:asc(bytes,L.start+228,L.start+236),
        inicioVal:asc(bytes,L.start+38,L.start+46),
        fimVal:asc(bytes,L.start+46,L.start+54)
      });
    }
  }

  const declared=+asc(bytes,header.start+13,header.start+19);
  if(declared!==counts['14'])throw Error(`Cabeçalho declara ${declared} APAC(s), mas foram encontrados ${counts['14']} registros 14.`);

  const control=asc(bytes,header.start+19,header.start+23);
  const version=asc(bytes,Math.max(header.start,header.end-17),header.end).trim();
  return {lines,src,counts,fields,declared,control,version,apacs};
}

async function sha256(bytes){
  try{
    const dig=await crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }catch{
    return 'indisponível neste navegador';
  }
}

function monthMeta(m){return months.find(x=>x[0]===m)||['--','---','—']}
function selectedProfile(){return profiles[profileSel.value]||profiles['400']}
function fmtComp(c){return /^\d{6}$/.test(c)?`${c.slice(4,6)}/${c.slice(0,4)}`:'—'}
function validDate8(s){return /^\d{8}$/.test(s)&&s!=='00000000'}
function fmtDate(s){return validDate8(s)?`${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`:'—'}

function analyzeCompetency(p){
  const closings=(p.apacs||[]).filter(a=>validDate8(a.encerramento));
  const counts={};
  closings.forEach(a=>{
    const comp=a.encerramento.slice(0,6);
    counts[comp]=(counts[comp]||0)+1;
  });
  const comps=Object.keys(counts).sort();
  const dates=closings.map(a=>a.encerramento).sort();

  if(!closings.length){
    return {
      mode:'unknown',
      level:'warn',
      recommended:null,
      closings,
      counts,
      minDate:null,
      maxDate:null,
      message:'Nenhuma data de encerramento válida foi encontrada nos registros 14. A competência não pode ser recomendada automaticamente.'
    };
  }

  if(comps.length>1){
    return {
      mode:'mixed',
      level:'bad',
      recommended:null,
      closings,
      counts,
      minDate:dates[0],
      maxDate:dates[dates.length-1],
      message:`Arquivo misto: foram encontradas APACs encerradas em ${comps.map(c=>`${fmtComp(c)} (${counts[c]})`).join(', ')}. A conversão automática para uma única competência foi bloqueada.`
    };
  }

  const recommended=comps[0];
  const consistent=p.src===recommended;
  return {
    mode:consistent?'consistent':'recommended',
    level:consistent?'ok':'warn',
    recommended,
    closings,
    counts,
    minDate:dates[0],
    maxDate:dates[dates.length-1],
    message:consistent
      ?`Competência ${fmtComp(p.src)} compatível com todas as ${closings.length} data(s) de encerramento analisadas.`
      :`A competência gravada é ${fmtComp(p.src)}, porém todas as ${closings.length} APAC(s) analisadas possuem encerramento em ${fmtComp(recommended)}. Recomenda-se ${fmtComp(recommended)}.`
  };
}

function compatibilityCheck(p,dst,profileId=profileSel.value){
  const pr=profiles[profileId]||profiles['400'];
  const diag=analyzeCompetency(p);
  const result={profile:pr,diag,level:'ok',issues:[],message:''};

  if(diag.mode==='mixed'){
    result.level='bad';
    result.message=diag.message;
    result.issues=diag.closings;
    return result;
  }

  if(diag.recommended&&dst!==diag.recommended){
    result.level='bad';
    result.issues=diag.closings.filter(a=>a.encerramento.slice(0,6)!==dst);
    const prefix=profileId==='312'?'Risco comprovado de crítica 010082 no perfil 3.12c':'Pré-validação preventiva do perfil 4.00';
    result.message=`${prefix}: ${result.issues.length} APAC(s) possuem encerramento em ${fmtComp(diag.recommended)}, incompatível com o destino ${fmtComp(dst)}. Geração bloqueada.`;
    return result;
  }

  if(diag.mode==='unknown'){
    result.level='warn';
    result.message=`${pr.label}: ${diag.message}`;
    return result;
  }

  if(profileId==='400'&&!/04\.00/.test(p.version||'')){
    result.level='warn';
    result.message=`Competência compatível com os encerramentos, mas o perfil 4.00 foi selecionado e o cabeçalho informa "${p.version||'versão não identificada'}". Revise a versão antes da importação.`;
    return result;
  }

  result.level='ok';
  result.message=profileId==='312'
    ?`Perfil 3.12c: destino ${fmtComp(dst)} compatível com todas as datas de encerramento. Pré-validação 010082 aprovada.`
    :`Perfil 4.00: destino ${fmtComp(dst)} compatível com todas as datas de encerramento e estrutura homologada.`;
  return result;
}

function refreshProfile(){
  const pr=selectedProfile();
  $('checkProfile').textContent=pr.short;
  const note=$('profileNote');
  note.textContent=pr.note;
  note.className='profile-note '+(pr.current?'ok':'warn');
}

function refreshDiagnostic(){
  if(!state.parsed){
    $('diagState').textContent='Aguardando';
    $('diagSource').textContent='—';
    $('recommendedComp').textContent='—';
    $('closingRange').textContent='—';
    $('diagSummary').textContent='Selecione um arquivo para analisar a consistência entre competência e data de encerramento.';
    $('checkRecommended').textContent='—';
    applyRecommendedBtn.classList.add('hidden');
    $('competencyDiagnostic').className='diagnostic-box';
    return null;
  }

  const d=analyzeCompetency(state.parsed);
  $('diagSource').textContent=fmtComp(state.parsed.src);
  $('recommendedComp').textContent=d.recommended?fmtComp(d.recommended):d.mode==='mixed'?'Múltiplas':'Indeterminada';
  $('checkRecommended').textContent=d.recommended?fmtComp(d.recommended):d.mode==='mixed'?'Mista':'—';
  $('closingRange').textContent=d.minDate&&d.maxDate
    ?(d.minDate===d.maxDate?fmtDate(d.minDate):`${fmtDate(d.minDate)} → ${fmtDate(d.maxDate)}`)
    :'Não identificados';
  $('diagSummary').textContent=d.message;
  $('diagState').textContent=d.level==='ok'?'Consistente':d.level==='bad'?'Arquivo misto':'Ajuste recomendado';
  $('competencyDiagnostic').className='diagnostic-box '+d.level;

  if(d.recommended&&d.recommended!==state.parsed.src){
    applyRecommendedBtn.classList.remove('hidden');
    applyRecommendedBtn.textContent=`Aplicar ${fmtComp(d.recommended)}`;
  }else{
    applyRecommendedBtn.classList.add('hidden');
  }
  return d;
}

function refreshCompatibility(){
  if(!state.parsed){
    $('checkCompat').textContent='Aguardando';
    $('compatList').textContent='Aguardando arquivo para validar compatibilidade.';
    return null;
  }

  let dst;
  try{dst=targetComp()}catch{dst=state.parsed.src}
  const c=compatibilityCheck(state.parsed,dst);
  $('checkCompat').textContent=c.level==='ok'?'Compatível':c.level==='bad'?'Bloqueado':'Revisar';

  let details='';
  if(c.issues.length){
    details='\n'+c.issues.slice(0,12).map(x=>`APAC ${x.num}: encerramento ${fmtDate(x.encerramento)}`).join('\n');
    if(c.issues.length>12)details+=`\n… mais ${c.issues.length-12} APAC(s)`;
  }
  $('compatList').textContent=c.message+details;
  return c;
}

function refreshTargetPreview(){
  const m=monthSel.value||'--';
  const y=String($('year').value||'----');
  const meta=monthMeta(m);
  $('targetCompPreview').textContent=`${m}/${y}`;
  $('targetNamePreview').textContent=`APOCI.${meta[1]}`;
  document.querySelectorAll('.month-chip').forEach(x=>x.classList.toggle('active',x.dataset.month===m));

  if(state.parsed){
    updateSteps(2);
    refreshDiagnostic();
    const c=refreshCompatibility();
    let dst='';
    try{dst=targetComp()}catch{}
    genBtn.disabled=!c||c.level==='bad'||dst===state.parsed.src;
  }
}

async function loadFile(file){
  try{
    state={file,bytes:new Uint8Array(await file.arrayBuffer()),parsed:null,output:null,audit:null};
    const p=validateBytes(state.bytes);
    state.parsed=p;
    $('filename').textContent=file.name;

    const y=p.src.slice(0,4),m=p.src.slice(4);
    const d=analyzeCompetency(p);
    $('sourceComp').textContent=`${m}/${y}`;
    $('sourceInfo').textContent=`${p.lines.length} linhas · ${p.version}`;

    const initialTarget=d.recommended||p.src;
    monthSel.value=initialTarget.slice(4);
    $('year').value=initialTarget.slice(0,4);

    $('metricComp').textContent=`${m}/${y}`;
    $('metricRecommended').textContent=d.recommended?fmtComp(d.recommended):d.mode==='mixed'?'Mista':'—';
    $('metricApacs').textContent=p.counts['14'];
    $('metricProc').textContent=p.counts['13'];
    $('checkStructure').textContent='Válida';
    $('checkControl').textContent=p.control;
    $('checkOutside').textContent='Protegidos';
    $('resultFile').classList.add('hidden');
    valBtn.disabled=false;
    auditBtn.disabled=true;

    refreshTargetPreview();
    renderAuditBase();
    updateSteps(2);

    if(d.mode==='mixed'){
      setStatus(d.message,'bad','Arquivo com competências distintas');
    }else if(d.recommended&&d.recommended!==p.src){
      setStatus(`Competência interna: ${fmtComp(p.src)}\nCompetência recomendada pelos encerramentos: ${fmtComp(d.recommended)}\n${p.counts['14']} APAC(s) analisadas. O destino recomendado foi selecionado automaticamente.`,'warn','Ajuste de competência recomendado');
    }else{
      setStatus(`Competência interna: ${fmtComp(p.src)}\n${p.counts['14']} APAC(s) · ${p.counts['13']} procedimento(s) · ${p.counts['06']} registro(s) 06\n${d.message}`,'ok','Arquivo consistente');
    }
  }catch(e){
    state.parsed=null;
    genBtn.disabled=true;
    valBtn.disabled=true;
    auditBtn.disabled=true;
    $('checkStructure').textContent='Bloqueada';
    $('resultFile').classList.add('hidden');
    refreshDiagnostic();
    updateSteps(1);
    setStatus(e.message,'bad');
  }
}

function targetComp(){
  const y=String($('year').value);
  const m=monthSel.value;
  if(!/^\d{4}$/.test(y))throw Error('Ano de destino inválido.');
  if(!/^\d{2}$/.test(m))throw Error('Mês de destino inválido.');
  return y+m;
}

function renderAuditBase(){
  if(!state.parsed)return;
  const p=state.parsed;
  const tbody=$('auditBody');
  const pr=selectedProfile();
  const d=analyzeCompetency(p);
  const c=refreshCompatibility();
  const rows=[
    ['Versão da aplicação','2.4.0 — Validador OCI/PMAE'],
    ['Perfil de destino',pr.label],
    ['Estrutura','APAC — registros 01/14/06/13'],
    ['Competência gravada',fmtComp(p.src)],
    ['Competência recomendada',d.recommended?fmtComp(d.recommended):d.mode==='mixed'?'Múltiplas':'Não determinada'],
    ['Diagnóstico',d.message],
    ['APACs',p.counts['14']],
    ['Procedimentos 13',p.counts['13']],
    ['Registros 06',p.counts['06']],
    ['Campo de controle (preservado)',p.control],
    ['Versão informada no arquivo',p.version],
    ['Compatibilidade',c?c.message:'Aguardando'],
    ['Datas assistenciais','Protegidas — não alteradas']
  ];
  tbody.innerHTML=rows.map(r=>`<tr><th>${r[0]}</th><td><code>${r[1]}</code></td></tr>`).join('');
}

valBtn.onclick=()=>{
  try{
    const p=validateBytes(state.bytes);
    const dst=targetComp();
    const d=analyzeCompetency(p);
    const c=compatibilityCheck(p,dst);
    updateSteps(3);
    refreshDiagnostic();
    refreshCompatibility();
    renderAuditBase();

    const kind=c.level==='bad'?'bad':c.level==='warn'?'warn':'ok';
    const title=c.level==='bad'?'Validação bloqueada':c.level==='warn'?'Validação concluída com atenção':'Validação concluída';
    setStatus(`Nenhuma alteração foi realizada.\n${p.lines.length} linhas reconhecidas; ${p.counts['14']} APAC(s).\n${d.message}\n${c.message}`,kind,title);
  }catch(e){
    setStatus(e.message,'bad','Validação falhou');
  }
};

genBtn.onclick=async()=>{
  try{
    const p=validateBytes(state.bytes);
    const dst=targetComp();
    if(dst===p.src)throw Error('A competência de destino é igual à competência de origem. Nenhuma conversão é necessária.');

    const d=analyzeCompetency(p);
    const comp=compatibilityCheck(p,dst);
    const pr=selectedProfile();

    if(d.mode==='mixed')throw Error(d.message);
    if(comp.level==='bad')throw Error(comp.message);

    const out=new Uint8Array(state.bytes);
    const ds=[...dst].map(c=>c.charCodeAt(0));
    const allowedMask=new Uint8Array(out.length);

    for(const f of p.fields){
      for(let j=0;j<6;j++){
        out[f.start+j]=ds[j];
        allowedMask[f.start+j]=1;
      }
    }

    let changed=0,outside=0;
    for(let i=0;i<out.length;i++){
      if(out[i]!==state.bytes[i]){
        changed++;
        if(!allowedMask[i])outside++;
      }
    }

    if(outside!==0)throw Error(`Falha de segurança: ${outside} byte(s) foram alterados fora dos campos autorizados.`);
    if(out.length!==state.bytes.length)throw Error('Falha de segurança: tamanho do arquivo mudou.');

    const p2=validateBytes(out);
    if(p2.src!==dst)throw Error('Competência final não validou.');

    const d2=analyzeCompetency(p2);
    if(d2.recommended&&d2.recommended!==dst)throw Error(`Validação final bloqueada: os encerramentos indicam ${fmtComp(d2.recommended)}, mas o arquivo resultou em ${fmtComp(dst)}.`);
    if(d2.mode==='mixed')throw Error('Validação final bloqueada: o arquivo contém encerramentos de competências distintas.');

    const normalizedA=new Uint8Array(state.bytes);
    const normalizedB=new Uint8Array(out);
    for(const f of p.fields){
      for(let j=0;j<6;j++){
        normalizedA[f.start+j]=48;
        normalizedB[f.start+j]=48;
      }
    }
    for(let i=0;i<out.length;i++){
      if(normalizedA[i]!==normalizedB[i])throw Error('Falha de preservação dos dados não relacionados à competência.');
    }

    const shaA=await sha256(state.bytes);
    const shaB=await sha256(out);
    const shaNA=await sha256(normalizedA);
    const shaNB=await sha256(normalizedB);
    const ext=monthMeta(dst.slice(4))[1];
    const outName=`APOCI.${ext}`;

    state.output={bytes:out,name:outName};
    state.audit={
      src:p.src,
      dst,
      recommended:d.recommended,
      diagnosis:d.message,
      changed,
      outside,
      size:out.length,
      fields:p.fields.length,
      counts:p.counts,
      control:p.control,
      version:p.version,
      profile:pr.label,
      compat:comp.message,
      compatIssues:comp.issues||[],
      shaA,shaB,shaNA,shaNB,
      name:outName,
      source:state.file.name,
      datesChanged:0
    };

    const blob=new Blob([out],{type:'application/octet-stream'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=outName;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);

    auditBtn.disabled=false;
    renderAuditFinal();
    $('resultFile').classList.remove('hidden');
    $('resultName').textContent=outName;
    $('resultMeta').textContent=`${fmtComp(p.src)} → ${fmtComp(dst)} · ${p.fields.length} campos de competência · 0 datas alteradas`;
    $('checkOutside').textContent='0 alterados';
    updateSteps(3);

    setStatus(`Arquivo gerado com sucesso.\nCompetência: ${fmtComp(p.src)} → ${fmtComp(dst)}.\n${p.fields.length} campos estruturais de competência tratados.\nDatas assistenciais alteradas: 0.\nBytes fora das posições autorizadas alterados: 0.`,'ok','Conversão concluída');
  }catch(e){
    setStatus(e.message,'bad','Geração bloqueada');
  }
};

function renderAuditFinal(){
  const a=state.audit;
  const tbody=$('auditBody');
  const rows=[
    ['Versão da aplicação','2.4.0 — Validador OCI/PMAE'],
    ['Arquivo origem',a.source],
    ['Arquivo saída',a.name],
    ['APAC Magnético alvo',a.profile],
    ['Diagnóstico da competência',a.diagnosis],
    ['Compatibilidade do perfil',a.compat],
    ['Competência origem',fmtComp(a.src)],
    ['Competência recomendada',a.recommended?fmtComp(a.recommended):'Não determinada'],
    ['Competência destino',fmtComp(a.dst)],
    ['Campos de competência alterados',a.fields],
    ['Datas assistenciais alteradas',a.datesChanged],
    ['Bytes efetivamente diferentes',a.changed],
    ['Bytes alterados fora dos campos',a.outside],
    ['Tamanho preservado',a.size+' bytes'],
    ['APACs',a.counts['14']],
    ['Procedimentos 13',a.counts['13']],
    ['Registros 06',a.counts['06']],
    ['Controle preservado',a.control],
    ['Versão no cabeçalho',a.version],
    ['SHA-256 origem',a.shaA],
    ['SHA-256 saída',a.shaB],
    ['SHA-256 normalizado origem',a.shaNA],
    ['SHA-256 normalizado saída',a.shaNB]
  ];
  tbody.innerHTML=rows.map(r=>`<tr><th>${r[0]}</th><td><code>${r[1]}</code></td></tr>`).join('');
}

auditBtn.onclick=()=>{
  if(!state.audit)return;
  const a=state.audit;
  const txt=`GENTILL COMPETENCIA APAC — AUDITORIA v2.4.0\r\nValidador OCI/PMAE\r\nby Gentill Mob Ops · www.gentillops.com.br\r\n\r\nArquivo origem: ${a.source}\r\nArquivo saida: ${a.name}\r\nAPAC Magnetico alvo: ${a.profile}\r\nDiagnostico: ${a.diagnosis}\r\nCompatibilidade: ${a.compat}\r\nCompetencia origem: ${a.src}\r\nCompetencia recomendada: ${a.recommended||'nao determinada'}\r\nCompetencia destino: ${a.dst}\r\nCampos de competencia alterados: ${a.fields}\r\nDatas assistenciais alteradas: ${a.datesChanged}\r\nBytes efetivamente diferentes: ${a.changed}\r\nBytes fora dos campos autorizados: ${a.outside}\r\nTamanho: ${a.size} bytes\r\nAPACs: ${a.counts['14']}\r\nProcedimentos 13: ${a.counts['13']}\r\nRegistros 06: ${a.counts['06']}\r\nCampo de controle preservado: ${a.control}\r\nVersao do arquivo: ${a.version}\r\nSHA256 origem: ${a.shaA}\r\nSHA256 saida: ${a.shaB}\r\nSHA256 normalizado origem: ${a.shaNA}\r\nSHA256 normalizado saida: ${a.shaNB}\r\n\r\nREGRAS DE SEGURANCA\r\n- Somente campos estruturais de competencia foram modificados.\r\n- Datas de inicio, validade, ocorrencia/encerramento, autorizacao e solicitacao nao foram alteradas.\r\n- Dados assistenciais e identificadores nao foram reescritos.\r\n- Destino incompatível com os encerramentos e bloqueado para prevenir critica 010082.\r\n`;
  const b=new Blob([txt],{type:'text/plain;charset=utf-8'});
  const x=document.createElement('a');
  x.href=URL.createObjectURL(b);
  x.download='AUDITORIA_'+a.name+'.txt';
  x.click();
  setTimeout(()=>URL.revokeObjectURL(x.href),1500);
};

refreshProfile();
refreshDiagnostic();
refreshTargetPreview();
