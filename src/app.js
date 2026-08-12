const months=[['01','JAN','Janeiro'],['02','FEV','Fevereiro'],['03','MAR','Março'],['04','ABR','Abril'],['05','MAI','Maio'],['06','JUN','Junho'],['07','JUL','Julho'],['08','AGO','Agosto'],['09','SET','Setembro'],['10','OUT','Outubro'],['11','NOV','Novembro'],['12','DEZ','Dezembro']];
const profiles={
  '312':{
    label:'APAC Magnético 3.12c',
    short:'3.12c',
    current:false,
    note:'Perfil legado baseado no ambiente 3.12c observado. Faz pré-validação da crítica 010082 quando a data de encerramento não pertence à competência de destino.'
  },
  '400':{
    label:'APAC Magnético 4.00',
    short:'4.00',
    current:true,
    note:'Perfil atual do APAC Magnético. Preserva o layout e valida a competência sem reescrever datas assistenciais.'
  }
};
const $=id=>document.getElementById(id);
const monthSel=$('month'),profileSel=$('apacTarget'),fileInput=$('file'),drop=$('drop'),statusEl=$('status'),statusCard=$('statusCard'),genBtn=$('generate'),valBtn=$('validate'),auditBtn=$('auditBtn');
months.forEach(m=>monthSel.add(new Option(`${m[2]} (${m[1]})`,m[0])));
months.forEach(m=>{const b=document.createElement('button');b.type='button';b.className='month-chip';b.dataset.month=m[0];b.textContent=m[1];b.onclick=()=>{monthSel.value=m[0];refreshTargetPreview()};$('monthGrid').appendChild(b)});
let state={file:null,bytes:null,parsed:null,output:null,audit:null};

drop.onclick=()=>fileInput.click();
drop.ondragover=e=>{e.preventDefault();drop.classList.add('drag')};
drop.ondragleave=()=>drop.classList.remove('drag');
drop.ondrop=e=>{e.preventDefault();drop.classList.remove('drag');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0])};
fileInput.onchange=()=>fileInput.files[0]&&loadFile(fileInput.files[0]);
monthSel.onchange=refreshTargetPreview;$('year').oninput=refreshTargetPreview;profileSel.onchange=()=>{refreshProfile();refreshCompatibility();renderAuditBase()};

const asc=(b,s,e)=>String.fromCharCode(...b.slice(s,e));
function setStatus(text,kind='',title){
  statusEl.textContent=text;statusCard.className='status-card '+kind;
  const label=kind==='ok'?'Validado':kind==='bad'?'Bloqueado':kind==='warn'?'Atenção':'Aguardando';
  $('statusPill').textContent=label;$('topStatusPill').textContent=label;
  $('statusTitle').textContent=title||(kind==='ok'?'Estrutura reconhecida':kind==='bad'?'Operação bloqueada':kind==='warn'?'Revisão necessária':'Pronto para iniciar');
}
function updateSteps(stage){
  [1,2,3].forEach(n=>{const el=$('step'+n);el.classList.remove('active','done');if(n<stage)el.classList.add('done');else if(n===stage)el.classList.add('active')})
}
function parseLines(bytes){let lines=[],start=0;for(let i=0;i<bytes.length-1;i++){if(bytes[i]===13&&bytes[i+1]===10){lines.push({start,end:i,len:i-start,crlf:true});start=i+2;i++;}}if(start<bytes.length)lines.push({start,end:bytes.length,len:bytes.length-start,crlf:false});return lines}
function validateBytes(bytes){
 const lines=parseLines(bytes);if(!lines.length)throw Error('Arquivo vazio.');if(!lines.every(x=>x.crlf))throw Error('O arquivo não termina todas as linhas com CRLF. Conversão bloqueada.');
 const allowed={'01':139,'14':537,'06':37,'13':90};const header=lines[0];const htype=asc(bytes,header.start,header.start+2);if(htype!=='01')throw Error('Cabeçalho 01 não encontrado na primeira linha.');
 const src=asc(bytes,header.start+7,header.start+13);if(!/^\d{6}$/.test(src)||+src.slice(4)<1||+src.slice(4)>12)throw Error('Competência do cabeçalho inválida.');
 let counts={'01':0,'14':0,'06':0,'13':0};let fields=[],apacs=[];
 for(let i=0;i<lines.length;i++){const L=lines[i],type=asc(bytes,L.start,L.start+2);if(!(type in allowed))throw Error(`Registro ${type||'(vazio)'} na linha ${i+1} ainda não é homologado nesta Fase 1.`);if(L.len!==allowed[type])throw Error(`Linha ${i+1} (${type}) tem ${L.len} bytes; esperado ${allowed[type]}. Conversão bloqueada.`);counts[type]++;
  const p=(type==='01')?L.start+7:L.start+2;const c=asc(bytes,p,p+6);if(c!==src)throw Error(`Competência divergente na linha ${i+1}: ${c}; cabeçalho: ${src}.`);fields.push({line:i+1,type,start:p,end:p+6});
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
 const declared=+asc(bytes,header.start+13,header.start+19);if(declared!==counts['14'])throw Error(`Cabeçalho declara ${declared} APAC(s), mas foram encontrados ${counts['14']} registros 14.`);
 const control=asc(bytes,header.start+19,header.start+23);const version=asc(bytes,Math.max(header.start,header.end-17),header.end).trim();
 return {lines,src,counts,fields,declared,control,version,apacs};
}
async function sha256(bytes){try{const dig=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch{return 'indisponível neste navegador'}}
function monthMeta(m){return months.find(x=>x[0]===m)||['--','---','—']}
function selectedProfile(){return profiles[profileSel.value]||profiles['400']}
function compatibilityCheck(p,dst,profileId=profileSel.value){
 const result={profile:profiles[profileId]||profiles['400'],level:'ok',issues:[],message:'Estrutura compatível com o perfil selecionado.'};
 if(profileId==='312'){
   const bad=(p.apacs||[]).filter(a=>/^\d{8}$/.test(a.encerramento)&&a.encerramento!=='00000000'&&a.encerramento.slice(0,6)!==dst);
   if(bad.length){
     result.level='warn';
     result.issues=bad;
     result.message=`Pré-validação 3.12c: ${bad.length} APAC(s) podem gerar a crítica 010082 porque a data de encerramento está fora da competência ${dst}.`;
   }else{
     result.message='Perfil 3.12c: nenhuma divergência conhecida de data de encerramento x competência foi detectada.';
   }
 }else{
   if(!/04\.00/.test(p.version||'')){
     result.level='warn';
     result.message=`Perfil 4.00 selecionado, mas o cabeçalho informa "${p.version||'versão não identificada'}". O arquivo será preservado; revise antes da importação.`;
   }else{
     result.message='Perfil 4.00: cabeçalho 04.00 reconhecido e estrutura homologada neste conversor.';
   }
 }
 return result;
}
function refreshProfile(){
 const pr=selectedProfile();$('checkProfile').textContent=pr.short;
 const note=$('profileNote');note.textContent=pr.note;note.className='profile-note '+(pr.current?'ok':'warn');
}
function refreshCompatibility(){
 if(!state.parsed){$('checkCompat').textContent='Aguardando';$('compatList').textContent='Aguardando arquivo para validar compatibilidade.';return null}
 let dst;try{dst=targetComp()}catch{dst=state.parsed.src}
 const c=compatibilityCheck(state.parsed,dst);
 $('checkCompat').textContent=c.level==='ok'?'Compatível':'Revisar';
 $('compatList').textContent=c.message+(c.issues.length?'\n'+c.issues.slice(0,8).map(x=>`APAC ${x.num}: encerramento ${x.encerramento.slice(6,8)}/${x.encerramento.slice(4,6)}/${x.encerramento.slice(0,4)}`).join('\n'):'');
 return c;
}
function refreshTargetPreview(){
 const m=monthSel.value||'--',y=String($('year').value||'----'),meta=monthMeta(m);$('targetCompPreview').textContent=`${m}/${y}`;$('targetNamePreview').textContent=`APOCI.${meta[1]}`;
 document.querySelectorAll('.month-chip').forEach(x=>x.classList.toggle('active',x.dataset.month===m));
 if(state.parsed){updateSteps(2);refreshCompatibility();}
}
async function loadFile(file){
 try{
  state={file,bytes:new Uint8Array(await file.arrayBuffer()),parsed:null,output:null,audit:null};const p=validateBytes(state.bytes);state.parsed=p;$('filename').textContent=file.name;
  const y=p.src.slice(0,4),m=p.src.slice(4);$('sourceComp').textContent=`${m}/${y}`;$('sourceInfo').textContent=`${p.lines.length} linhas · ${p.version}`;monthSel.value=m;$('year').value=y;
  $('metricComp').textContent=`${m}/${y}`;$('metricApacs').textContent=p.counts['14'];$('metricProc').textContent=p.counts['13'];$('metricSize').textContent=`${state.bytes.length.toLocaleString('pt-BR')} bytes`;
  $('checkStructure').textContent='Válida';$('checkControl').textContent=p.control;$('checkOutside').textContent='Protegidos';$('resultFile').classList.add('hidden');valBtn.disabled=false;genBtn.disabled=false;auditBtn.disabled=true;
  renderAuditBase();refreshTargetPreview();updateSteps(2);setStatus(`Competência interna: ${m}/${y}\n${p.counts['14']} APAC(s) · ${p.counts['13']} procedimento(s) · ${p.counts['06']} registro(s) 06`,'ok','Arquivo pronto para conversão');
 }catch(e){state.parsed=null;genBtn.disabled=true;valBtn.disabled=true;auditBtn.disabled=true;$('checkStructure').textContent='Bloqueada';$('resultFile').classList.add('hidden');updateSteps(1);setStatus(e.message,'bad')}
}
function targetComp(){const y=String($('year').value);const m=monthSel.value;if(!/^\d{4}$/.test(y))throw Error('Ano de destino inválido.');return y+m}
function renderAuditBase(){if(!state.parsed)return;const p=state.parsed,tbody=$('auditBody'),pr=selectedProfile(),c=refreshCompatibility();const rows=[['Perfil de destino',pr.label],['Estrutura','APAC Fase 1 — 01/14/06/13'],['Competência origem',p.src.slice(4)+'/'+p.src.slice(0,4)],['APACs',p.counts['14']],['Procedimentos 13',p.counts['13']],['Registros 06',p.counts['06']],['Campo de controle (preservado)',p.control],['Versão informada no arquivo',p.version],['Compatibilidade',c?c.message:'Aguardando']];tbody.innerHTML=rows.map(r=>`<tr><th>${r[0]}</th><td><code>${r[1]}</code></td></tr>`).join('')}
valBtn.onclick=()=>{try{const p=validateBytes(state.bytes),dst=targetComp(),c=compatibilityCheck(p,dst);updateSteps(3);refreshCompatibility();setStatus(`Nenhuma alteração foi realizada.\n${p.lines.length} linhas reconhecidas; ${p.counts['14']} APAC(s); competência ${p.src.slice(4)}/${p.src.slice(0,4)}.\n${c.message}`,c.level==='warn'?'warn':'ok',c.level==='warn'?'Validação concluída com atenção':'Validação concluída')}catch(e){setStatus(e.message,'bad','Validação falhou')}};
genBtn.onclick=async()=>{
 try{
  const p=validateBytes(state.bytes),dst=targetComp();if(dst===p.src)throw Error('A competência de destino é igual à competência de origem.');
  const comp=compatibilityCheck(p,dst),pr=selectedProfile();
  if(pr.short==='3.12c'&&comp.level==='warn'){
    const ok=confirm(`${comp.message}\n\nO conversor NÃO modificará a data de encerramento nem outros dados assistenciais.\nDeseja gerar o arquivo mesmo assim apenas para teste na versão 3.12c?`);
    if(!ok)throw Error('Geração cancelada após a pré-validação do perfil 3.12c.');
  }
  const out=new Uint8Array(state.bytes);const ds=[...dst].map(c=>c.charCodeAt(0));let allowedMask=new Uint8Array(out.length);
  for(const f of p.fields){for(let j=0;j<6;j++){out[f.start+j]=ds[j];allowedMask[f.start+j]=1}}
  let changed=0,outside=0;for(let i=0;i<out.length;i++){if(out[i]!==state.bytes[i]){changed++;if(!allowedMask[i])outside++}}
  if(outside!==0)throw Error(`Falha de segurança: ${outside} byte(s) foram alterados fora dos campos autorizados.`);if(out.length!==state.bytes.length)throw Error('Falha de segurança: tamanho do arquivo mudou.');const p2=validateBytes(out);if(p2.src!==dst)throw Error('Competência final não validou.');
  const normalizedA=new Uint8Array(state.bytes),normalizedB=new Uint8Array(out);for(const f of p.fields){for(let j=0;j<6;j++){normalizedA[f.start+j]=48;normalizedB[f.start+j]=48}}for(let i=0;i<out.length;i++)if(normalizedA[i]!==normalizedB[i])throw Error('Falha de preservação dos dados não relacionados à competência.');
  const shaA=await sha256(state.bytes),shaB=await sha256(out),shaNA=await sha256(normalizedA),shaNB=await sha256(normalizedB);const ext=monthMeta(dst.slice(4))[1];const outName=`APOCI.${ext}`;
  state.output={bytes:out,name:outName};state.audit={src:p.src,dst,changed,outside,size:out.length,fields:p.fields.length,counts:p.counts,control:p.control,version:p.version,profile:pr.label,compat:comp.message,compatIssues:comp.issues||[],shaA,shaB,shaNA,shaNB,name:outName,source:state.file.name};
  const blob=new Blob([out],{type:'application/octet-stream'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=outName;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  auditBtn.disabled=false;renderAuditFinal();$('resultFile').classList.remove('hidden');$('resultName').textContent=outName;$('resultMeta').textContent=`${p.src.slice(4)}/${p.src.slice(0,4)} → ${dst.slice(4)}/${dst.slice(0,4)} · ${p.fields.length} campos de competência tratados`;$('checkOutside').textContent='0 alterados';updateSteps(3);
  setStatus(`Arquivo gerado com sucesso.\n${p.fields.length} campos de competência alterados.\nNenhum byte fora das posições autorizadas foi modificado.`,'ok','Conversão concluída');
 }catch(e){setStatus(e.message,'bad','Geração bloqueada')}
};
function renderAuditFinal(){const a=state.audit,tbody=$('auditBody');const rows=[['Arquivo origem',a.source],['Arquivo saída',a.name],['APAC Magnético alvo',a.profile],['Compatibilidade do perfil',a.compat],['Competência origem',a.src],['Competência destino',a.dst],['Campos de competência alterados',a.fields],['Bytes efetivamente diferentes',a.changed],['Bytes alterados fora dos campos',a.outside],['Tamanho preservado',a.size+' bytes'],['APACs',a.counts['14']],['Procedimentos 13',a.counts['13']],['Registros 06',a.counts['06']],['Controle preservado',a.control],['Versão no cabeçalho',a.version],['SHA-256 origem',a.shaA],['SHA-256 saída',a.shaB],['SHA-256 normalizado origem',a.shaNA],['SHA-256 normalizado saída',a.shaNB]];tbody.innerHTML=rows.map(r=>`<tr><th>${r[0]}</th><td><code>${r[1]}</code></td></tr>`).join('')}
auditBtn.onclick=()=>{if(!state.audit)return;const a=state.audit;const txt=`GENTILL COMPETENCIA APAC — AUDITORIA FASE 1\r\nby Gentill Mob Ops · www.gentillops.com.br\r\n\r\nArquivo origem: ${a.source}\r\nArquivo saida: ${a.name}\r\nAPAC Magnetico alvo: ${a.profile}\r\nCompatibilidade: ${a.compat}\r\nCompetencia origem: ${a.src}\r\nCompetencia destino: ${a.dst}\r\nCampos de competencia alterados: ${a.fields}\r\nBytes efetivamente diferentes: ${a.changed}\r\nBytes fora dos campos autorizados: ${a.outside}\r\nTamanho: ${a.size} bytes\r\nAPACs: ${a.counts['14']}\r\nProcedimentos 13: ${a.counts['13']}\r\nRegistros 06: ${a.counts['06']}\r\nCampo de controle preservado: ${a.control}\r\nVersao: ${a.version}\r\nSHA256 origem: ${a.shaA}\r\nSHA256 saida: ${a.shaB}\r\nSHA256 normalizado origem: ${a.shaNA}\r\nSHA256 normalizado saida: ${a.shaNB}\r\n\r\nRegra: somente campos de competencia foram modificados. Demais bytes preservados.\r\nCampo de processamento da APAC e demais datas NAO foram alterados nesta Fase 1.\r\n`;const b=new Blob([txt],{type:'text/plain;charset=utf-8'}),x=document.createElement('a');x.href=URL.createObjectURL(b);x.download='AUDITORIA_'+a.name+'.txt';x.click();setTimeout(()=>URL.revokeObjectURL(x.href),1500)};
refreshProfile();refreshTargetPreview();
