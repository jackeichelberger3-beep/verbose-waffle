/* ============================================================
   LOGIC ARCHITECT — standalone app
   Every gate, the full Terminal OS, all templates,
   signal-path highlighting, and a circuit library.
   ============================================================ */

/* ---------- helpers ---------- */
function binOut(v, bits){ const o=[]; for(let b=0;b<bits;b++) o.push((v>>b)&1); return o; }
function binIn(i, bits){ let v=0; for(let b=0;b<bits;b++) v|=(i[b]?1:0)<<b; return v; }
function edge(s, k, val){ const prev=s[k]??0; return { rising: val&&!prev, falling: !val&&prev, prev: val }; }
let _id=1; const uid=(p)=>`${p}_${Date.now().toString(36)}_${_id++}`;

/* ---------- GATE DEFINITIONS (every gate) ---------- */
const GATE_DEFS = {
  AND:{type:'AND',label:'AND',category:'Logic',inputs:2,outputs:1,w:74,h:50,color:'#4b5563',evaluate:(i,s)=>({outputs:[(i[0]&&i[1])?1:0]})},
  NAND:{type:'NAND',label:'NAND',category:'Logic',inputs:2,outputs:1,w:74,h:50,color:'#4b5563',evaluate:(i,s)=>({outputs:[(i[0]&&i[1])?0:1]})},
  NOR:{type:'NOR',label:'NOR',category:'Logic',inputs:2,outputs:1,w:74,h:50,color:'#4b5563',evaluate:(i,s)=>({outputs:[(i[0]||i[1])?0:1]})},
  NOT:{type:'NOT',label:'NOT',category:'Logic',inputs:1,outputs:1,w:74,h:40,color:'#4b5563',evaluate:(i,s)=>({outputs:[i[0]?0:1]})},
  OR:{type:'OR',label:'OR',category:'Logic',inputs:2,outputs:1,w:74,h:50,color:'#4b5563',evaluate:(i,s)=>({outputs:[(i[0]||i[1])?1:0]})},
  XNOR:{type:'XNOR',label:'XNOR',category:'Logic',inputs:2,outputs:1,w:74,h:50,color:'#4b5563',evaluate:(i,s)=>({outputs:[(i[0]===i[1])?1:0]})},
  XOR:{type:'XOR',label:'XOR',category:'Logic',inputs:2,outputs:1,w:74,h:50,color:'#4b5563',evaluate:(i,s)=>({outputs:[(i[0]!==i[1])?1:0]})},
  SPLITTER:{type:'SPLITTER',label:'SPLIT',category:'Logic',inputs:1,outputs:2,w:74,h:50,color:'#4b5563',evaluate:(i,s)=>({outputs:[i[0]?1:0,i[0]?1:0]})},
  CONTRADICTION:{type:'CONTRADICTION',label:'CONTRA',category:'Logic',inputs:2,outputs:1,w:84,h:50,color:'#52525b',evaluate:(i,s)=>{const a=i[0]&&i[1],o=!i[0]||!i[1];return{outputs:[(a&&o)?1:0]}}},
  FULL_ADDER:{type:'FULL_ADDER',label:'FADD',category:'Logic',inputs:3,outputs:2,w:84,h:60,color:'#4b5563',evaluate:(i,s)=>{const sum=i[0]^i[1]^i[2],c=(i[0]&&i[1])||(i[0]&&i[2])||(i[1]&&i[2])?1:0;return{outputs:[sum?1:0,c]}}},
  AND8:{type:'AND8',label:'8 AND',category:'8-Bit',inputs:8,outputs:1,w:90,h:96,color:'#52525b',evaluate:(i,s)=>({outputs:[i.every(v=>v)?1:0]})},
  NAND8:{type:'NAND8',label:'8 NAND',category:'8-Bit',inputs:8,outputs:1,w:90,h:96,color:'#52525b',evaluate:(i,s)=>({outputs:[i.every(v=>v)?0:1]})},
  NOR8:{type:'NOR8',label:'8 NOR',category:'8-Bit',inputs:8,outputs:1,w:90,h:96,color:'#52525b',evaluate:(i,s)=>({outputs:[i.some(v=>v)?0:1]})},
  OR8:{type:'OR8',label:'8 OR',category:'8-Bit',inputs:8,outputs:1,w:90,h:96,color:'#52525b',evaluate:(i,s)=>({outputs:[i.some(v=>v)?1:0]})},
  SPLIT8:{type:'SPLIT8',label:'8 SPLIT',category:'8-Bit',inputs:1,outputs:8,w:90,h:96,color:'#52525b',evaluate:(i,s)=>{const o=[];for(let b=0;b<8;b++)o.push(i[0]?1:0);return{outputs:o}}},
  XOR8:{type:'XOR8',label:'8 XOR',category:'8-Bit',inputs:8,outputs:1,w:90,h:96,color:'#52525b',evaluate:(i,s)=>({outputs:[i.filter(v=>v).length%2?1:0]})},
  LOADED:{type:'LOADED',label:'LOADED',category:'Memory',inputs:0,outputs:1,w:74,h:40,color:'#3f3f46',evaluate:(i,s)=>({outputs:[1]})},
  SR_LATCH:{type:'SR_LATCH',label:'SR',category:'Memory',inputs:2,outputs:1,w:64,h:50,color:'#3f3f46',evaluate:(i,s)=>{let q=s.q||0;if(i[0])q=1;if(i[1])q=0;return{outputs:[q],state:{...s,q}}}},
  GATED_SR:{type:'GATED_SR',label:'G-SR',category:'Memory',inputs:3,outputs:1,w:74,h:60,color:'#3f3f46',evaluate:(i,s)=>{let q=s.q||0;if(i[2]){if(i[0])q=1;if(i[1])q=0;}return{outputs:[q],state:{...s,q}}}},
  D_LATCH:{type:'D_LATCH',label:'D',category:'Memory',inputs:2,outputs:1,w:64,h:50,color:'#3f3f46',evaluate:(i,s)=>{let q=s.q||0;if(i[1])q=i[0]?1:0;return{outputs:[q],state:{...s,q}}}},
  TOGGLE:{type:'TOGGLE',label:'TOG',category:'Memory',inputs:1,outputs:1,w:64,h:50,color:'#3f3f46',evaluate:(i,s)=>{let q=s.q||0;const e=edge(s,'t',i[0]);if(e.rising)q=q?0:1;return{outputs:[q],state:{...s,q,t:i[0]}}}},
  LOGIC_MEM:{type:'LOGIC_MEM',label:'LMEM',category:'Memory',inputs:3,outputs:1,w:74,h:60,color:'#3f3f46',evaluate:(i,s)=>{let q=s.q||0;if(i[0]){if(i[2])q=0;else if(i[1])q=1;}else q=0;return{outputs:[q],state:{...s,q}}}},
  GENERATOR:{type:'GENERATOR',label:'GEN',category:'Power',inputs:0,outputs:1,w:74,h:50,color:'#7c2d12',evaluate:(i,s)=>({outputs:[1]})},
  POWER_STATION:{type:'POWER_STATION',label:'PWR STN',category:'Power',inputs:0,outputs:2,w:84,h:60,color:'#7c2d12',evaluate:(i,s)=>({outputs:[1,1]})},
  BUTTON:{type:'BUTTON',label:'BTN',category:'Power',inputs:1,outputs:1,w:64,h:50,color:'#7c2d12',render:'button',evaluate:(i,s)=>{const on=s.on??0;return{outputs:[(i[0]&&on)?1:0],state:{...s,on}}}},
  LED:{type:'LED',label:'LED',category:'Display',inputs:1,outputs:0,w:60,h:60,color:'#27272a',render:'led',evaluate:(i,s)=>({outputs:[],state:{...s,on:i[0]?1:0}})},
  TEXT_PANEL:{type:'TEXT_PANEL',label:'TEXT',category:'Display',inputs:1,outputs:0,w:120,h:56,color:'#27272a',render:'text',evaluate:(i,s)=>({outputs:[],state:{...s,on:i[0]?1:0}})},
  SEG7:{type:'SEG7',label:'7-SEG',category:'Display',inputs:7,outputs:0,w:70,h:96,color:'#27272a',render:'seg7',evaluate:(i,s)=>({outputs:[],state:{...s,segs:i.slice(0,7)}})},
  HEX_DISP:{type:'HEX_DISP',label:'HEX',category:'Display',inputs:4,outputs:0,w:64,h:90,color:'#27272a',render:'hex',evaluate:(i,s)=>({outputs:[],state:{...s,val:binIn(i,4)}})},
  TERMINAL:{type:'TERMINAL',label:'TERM',category:'Display',inputs:1,outputs:0,w:260,h:170,color:'#18181b',render:'terminal',evaluate:(i,s)=>({outputs:[],state:{...s,power:i[0]?1:0}})},
  COUNTER:{type:'COUNTER',label:'COUNT',category:'Counter',inputs:3,outputs:6,w:84,h:70,color:'#3730a3',evaluate:(i,s)=>{let c=s.c||0;const pe=edge(s,'p',i[0]),me=edge(s,'m',i[1]),re=edge(s,'r',i[2]);if(pe.rising)c=(c+1)%16;if(me.rising)c=(c+15)%16;if(re.rising)c=0;return{outputs:binOut(c,6),state:{...s,c,p:i[0],m:i[1],r:i[2]}}}},
  NUM_COUNTER:{type:'NUM_COUNTER',label:'N-COUNT',category:'Counter',inputs:3,outputs:6,w:84,h:70,color:'#3730a3',evaluate:(i,s)=>{let c=s.c||0;const pe=edge(s,'p',i[0]),me=edge(s,'m',i[1]),re=edge(s,'r',i[2]);if(pe.rising)c=(c+1)%10;if(me.rising)c=(c+9)%10;if(re.rising)c=0;return{outputs:binOut(c,6),state:{...s,c,p:i[0],m:i[1],r:i[2]}}}},
  SHIFT4:{type:'SHIFT4',label:'SH4',category:'Counter',inputs:4,outputs:4,w:74,h:60,color:'#3730a3',evaluate:(i,s)=>({outputs:[i[3]?1:0,i[0]?1:0,i[1]?1:0,i[2]?1:0]})},
  SHIFT8:{type:'SHIFT8',label:'SH8',category:'Counter',inputs:4,outputs:8,w:90,h:70,color:'#3730a3',evaluate:(i,s)=>({outputs:[i[3]?1:0,i[0]?1:0,i[1]?1:0,i[2]?1:0,0,0,0,0]})},
  COMPLEX_COUNTER:{type:'COMPLEX_COUNTER',label:'CCOUNT',category:'Counter',inputs:8,outputs:6,w:96,h:96,color:'#3730a3',evaluate:(i,s)=>{let c=s.c??binIn(i.slice(0,4),4);const pe=edge(s,'p',i[4]),me=edge(s,'m',i[5]),re=edge(s,'r',i[6]);if(re.rising)c=binIn(i.slice(0,4),4);if(pe.rising)c=(c+1)%64;if(me.rising)c=(c+63)%64;return{outputs:binOut(c,6),state:{...s,c,p:i[4],m:i[5],r:i[6]}}}},
  COUNTER_RECV:{type:'COUNTER_RECV',label:'RECV',category:'Counter',inputs:5,outputs:1,w:84,h:70,color:'#3730a3',render:'recv',evaluate:(i,s)=>{const t=s.target??5;const v=binIn(i.slice(0,4),4);return{outputs:[(v===t)?1:0],state:{...s,target:t}}}},
  CPU4:{type:'CPU4',label:'4B CPU',category:'Compute',inputs:2,outputs:2,w:90,h:70,color:'#155e75',evaluate:(i,s)=>{const run=i[0]?1:0;const clk=(s.clk||0)?0:1;return{outputs:[run,clk],state:{...s,clk,run}}}},
  CPU8:{type:'CPU8',label:'8B CPU',category:'Compute',inputs:2,outputs:2,w:90,h:70,color:'#155e75',evaluate:(i,s)=>{const run=i[0]?1:0;const clk=(s.clk||0)?0:1;return{outputs:[run,clk],state:{...s,clk,run}}}},
  CPU16:{type:'CPU16',label:'16B CPU',category:'Compute',inputs:2,outputs:2,w:100,h:80,color:'#155e75',evaluate:(i,s)=>{const run=i[0]?1:0;const clk=(s.clk||0)?0:1;return{outputs:[run,clk],state:{...s,clk,run}}}},
  CPU32:{type:'CPU32',label:'32B CPU',category:'Compute',inputs:2,outputs:2,w:110,h:80,color:'#0e7490',evaluate:(i,s)=>{const run=(i[0]&&i[1])?1:0;const clk=(s.clk||0)?0:1;return{outputs:[run,clk],state:{...s,clk,run}}}},
  CPU64:{type:'CPU64',label:'64B CPU',category:'Compute',inputs:2,outputs:2,w:120,h:90,color:'#0e7490',evaluate:(i,s)=>{let h=(s.heat||0);const run=(i[0]&&i[1])?1:0;if(run&&!i[1])h=Math.min(100,h+5);else h=Math.max(0,h-3);const ok=run&&(i[1]||h<100);const clk=(s.clk||0)?0:1;return{outputs:[ok?1:0,clk],state:{...s,clk,run,heat:h}}}},
  CPU128:{type:'CPU128',label:'128B CPU',category:'Compute',inputs:2,outputs:2,w:140,h:100,color:'#0c4a6e',evaluate:(i,s)=>{let h=(s.heat||0);const run=(i[0]&&i[1])?1:0;if(run&&!i[1])h=Math.min(100,h+8);else h=Math.max(0,h-2);const ok=run&&(i[1]||h<100);const clk=(s.clk||0)?0:1;return{outputs:[ok?1:0,clk],state:{...s,clk,run,heat:h}}}},
  MOTHERBOARD:{type:'MOTHERBOARD',label:'MOBO',category:'Compute',inputs:3,outputs:1,w:120,h:90,color:'#334155',evaluate:(i,s)=>{const on=(i[0]&&i[1]&&i[2])?1:0;return{outputs:[on],state:{...s,on}}}},
  GPU:{type:'GPU',label:'GPU',category:'Compute',inputs:1,outputs:1,w:110,h:80,color:'#581c87',evaluate:(i,s)=>({outputs:[i[0]?1:0],state:{...s,on:i[0]?1:0}})},
  FAN:{type:'FAN',label:'FAN',category:'Compute',inputs:1,outputs:1,w:64,h:64,color:'#334155',render:'fan',evaluate:(i,s)=>({outputs:[i[0]?1:0],state:{...s,on:i[0]?1:0,spin:(s.spin||0)+(i[0]?0.3:0)}})},
  EEPROM8:{type:'EEPROM8',label:'EE8',category:'Storage',inputs:4,outputs:1,w:96,h:80,color:'#3f3f46',render:'eeprom',evaluate:(i,s)=>{const mem=s.mem||{};const addr=s.addr||0;let out=mem[addr]||0;if(i[2]){mem[addr]=i[0]?1:0;out=i[0]?1:0;}return{outputs:[out?1:0],state:{...s,mem,addr}}}},
  EEPROM16:{type:'EEPROM16',label:'EE16',category:'Storage',inputs:4,outputs:1,w:104,h:90,color:'#3f3f46',render:'eeprom',evaluate:(i,s)=>{const mem=s.mem||{};const addr=s.addr||0;let out=mem[addr]||0;if(i[2]){mem[addr]=i[0]?1:0;out=i[0]?1:0;}return{outputs:[out?1:0],state:{...s,mem,addr}}}},
  WIFI:{type:'WIFI',label:'WIFI',category:'Special',inputs:4,outputs:4,w:90,h:96,color:'#1e3a8a',render:'wifi',evaluate:(i,s)=>{const buf=s.buf||[];const now=Date.now();buf.push({v:i.slice(),t:now});const d=buf.find(b=>now-b.t>=3000);let out=[0,0,0,0];if(d)out=d.v;const nb=buf.filter(b=>now-b.t<3000);return{outputs:out,state:{...s,buf:nb}}}},
  TRANSMITTER:{type:'TRANSMITTER',label:'TX',category:'Special',inputs:3,outputs:2,w:84,h:70,color:'#1e3a8a',evaluate:(i,s)=>{const clk=(s.clk||0)?0:1;const data=i[2]?i[0]:0;return{outputs:[clk,data?1:0],state:{...s,clk}}}},
  KEYBOARD:{type:'KEYBOARD',label:'KBD',category:'Special',inputs:0,outputs:8,w:84,h:70,color:'#374151',render:'keyboard',evaluate:(i,s)=>{const code=(s.code||0);return{outputs:binOut(code,8),state:{...s}}}},
  PISTON:{type:'PISTON',label:'PISTON',category:'Special',inputs:1,outputs:0,w:64,h:64,color:'#52525b',render:'piston',evaluate:(i,s)=>({outputs:[],state:{...s,on:i[0]?1:0}})}
};
const CATEGORIES = ['Logic','8-Bit','Memory','Power','Display','Counter','Compute','Storage','Special','Custom'];
const getDef = (t) => GATE_DEFS[t] || GATE_DEFS.AND;
function portPos(def, kind, index){ const count = kind==='in'?def.inputs:def.outputs; if(count===0) return null; const sp = def.h/(count+1); const y = sp*(index+1); const x = kind==='in'?0:def.w; return {x,y}; }

/* ---------- simulator ---------- */
function simulate(gates, wires, prev){
  const maxIter=50; let outputs={}; const states={};
  gates.forEach(g=>{ const def=GATE_DEFS[g.type]; outputs[g.id]=def?new Array(def.outputs).fill(0):[]; states[g.id]={...(prev[g.id]||{})}; });
  for(let iter=0; iter<maxIter; iter++){
    const no={}; let changed=false;
    for(const g of gates){ const def=GATE_DEFS[g.type]; if(!def){no[g.id]=[];continue;} const inputs=new Array(def.inputs).fill(0);
      for(const w of wires){ if(w.to.gate===g.id){ const src=outputs[w.from.gate]; if(src) inputs[w.to.port]=src[w.from.port]||0; } }
      let r; try{ r=def.evaluate(inputs, states[g.id]); }catch{ r={outputs:outputs[g.id]}; }
      const out=r.outputs||new Array(def.outputs).fill(0); no[g.id]=out;
      if(r.state!==undefined) states[g.id]=r.state;
      for(let p=0;p<out.length;p++){ if((out[p]||0)!==(outputs[g.id]?.[p]||0)) changed=true; }
    }
    outputs=no; if(!changed&&iter>0) break;
  }
  return {outputs, states};
}
function wireActive(outputs, w){ const s=outputs[w.from.gate]; return s?!!(s[w.from.port]):false; }

/* ---------- signal path tracing ---------- */
function tracePath(startWire, wires){
  const wireSet=new Set([startWire.id]); const gateSet=new Set([startWire.from.gate, startWire.to.gate]);
  const dQ=[startWire.to.gate], uQ=[startWire.from.gate]; const sd=new Set(), su=new Set();
  while(dQ.length){ const g=dQ.shift(); if(sd.has(g))continue; sd.add(g); gateSet.add(g); for(const w of wires){ if(w.from.gate===g){ wireSet.add(w.id); gateSet.add(w.to.gate); dQ.push(w.to.gate); } } }
  while(uQ.length){ const g=uQ.shift(); if(su.has(g))continue; su.add(g); gateSet.add(g); for(const w of wires){ if(w.to.gate===g){ wireSet.add(w.id); gateSet.add(w.from.gate); uQ.push(w.from.gate); } } }
  return {wires:wireSet, gates:gateSet};
}

/* ---------- templates ---------- */
let idc=1; const nid=(p)=>`${p}_${idc++}`;
function gt(type,x,y,extra={}){ return {id:extra.id||nid(type.toLowerCase()),type,x,y,state:extra.state||{}}; }
function wt(fg,fp,tg,tp){ return {id:nid('w'),from:{gate:fg,port:fp},to:{gate:tg,port:tp}}; }
const TEMPLATES = [
  {name:'Simple AND Test',desc:'Generator → AND gate → LED',build(){const a=nid('g'),b=nid('and'),l=nid('led');return{gates:[gt('GENERATOR',100,100,{id:a}),gt('AND',240,100,{id:b}),gt('LED',400,100,{id:l})],wires:[wt(a,0,b,0),wt(a,0,b,1),wt(b,0,l,0)]}}},
  {name:'SR Latch Memory',desc:'Set/Reset latch holding state',build(){const b1=nid('b'),b2=nid('b'),sr=nid('sr'),l=nid('l');return{gates:[gt('BUTTON',80,80,{id:b1}),gt('BUTTON',80,160,{id:b2}),gt('SR_LATCH',240,110,{id:sr}),gt('LED',400,110,{id:l})],wires:[wt(b1,0,sr,0),wt(b2,0,sr,1),wt(sr,0,l,0)]}}},
  {name:'Toggle Flip-Flop',desc:'Button toggles output on each press',build(){const b=nid('b'),t=nid('t'),l=nid('l');return{gates:[gt('BUTTON',80,100,{id:b}),gt('TOGGLE',240,100,{id:t}),gt('LED',400,100,{id:l})],wires:[wt(b,0,t,0),wt(t,0,l,0)]}}},
  {name:'Binary Counter',desc:'Counter driven by generator, hex display',build(){const a=nid('g'),c=nid('c'),h=nid('h');return{gates:[gt('GENERATOR',80,100,{id:a}),gt('COUNTER',240,100,{id:c}),gt('HEX_DISP',420,100,{id:h})],wires:[wt(a,0,c,0),wt(c,0,h,0),wt(c,1,h,1),wt(c,2,h,2),wt(c,3,h,3)]}}},
  {name:'8-Bit System',desc:'Generator → 8-bit OR → LED indicator',build(){const a=nid('g'),sp=nid('sp'),o=nid('o'),l=nid('l');return{gates:[gt('GENERATOR',80,100,{id:a}),gt('SPLIT8',220,80,{id:sp}),gt('OR8',380,90,{id:o}),gt('LED',540,110,{id:l})],wires:[wt(a,0,sp,0),wt(sp,0,o,0),wt(o,0,l,0)]}}},
  {name:'16-Bit System',desc:'CPU with power, fan, and memory',build(){const p=nid('p'),f=nid('f'),c=nid('c'),l=nid('l');return{gates:[gt('POWER_STATION',80,80,{id:p}),gt('FAN',80,180,{id:f}),gt('CPU16',260,100,{id:c}),gt('LED',440,110,{id:l})],wires:[wt(p,0,c,0),wt(f,0,c,1),wt(c,0,l,0)]}}},
  {name:'Terminal OS',desc:'Powered terminal with command interface',build(){const a=nid('g'),t=nid('t');return{gates:[gt('GENERATOR',80,120,{id:a}),gt('TERMINAL',220,80,{id:t})],wires:[wt(a,0,t,0)]}}},
  {name:'Keyboard + Display',desc:'Keyboard types into powered text panel',build(){const a=nid('g'),k=nid('k'),t=nid('t');return{gates:[gt('GENERATOR',60,100,{id:a}),gt('KEYBOARD',220,90,{id:k}),gt('TEXT_PANEL',380,100,{id:t})],wires:[wt(a,0,t,0)]}}},
  {name:'XOR Parity Check',desc:'Two buttons → XOR → LED',build(){const b1=nid('b'),b2=nid('b'),x=nid('x'),l=nid('l');return{gates:[gt('BUTTON',80,80,{id:b1}),gt('BUTTON',80,160,{id:b2}),gt('XOR',240,110,{id:x}),gt('LED',400,110,{id:l})],wires:[wt(b1,0,x,0),wt(b2,0,x,1),wt(x,0,l,0)]}}},
  {name:'EEPROM Store',desc:'Write data to EEPROM address',build(){const a=nid('g'),e=nid('e'),l=nid('l');return{gates:[gt('GENERATOR',60,100,{id:a}),gt('EEPROM8',220,90,{id:e}),gt('LED',400,100,{id:l})],wires:[wt(a,0,e,0),wt(a,0,e,2),wt(e,0,l,0)]}}},
  {name:'WIFI Relay',desc:'Wireless signal across the board',build(){const a=nid('g'),wi=nid('w'),l=nid('l');return{gates:[gt('GENERATOR',60,100,{id:a}),gt('WIFI',220,80,{id:wi}),gt('LED',400,110,{id:l})],wires:[wt(a,0,wi,0),wt(wi,0,l,0)]}}},
  {name:'Full Adder',desc:'3-input adder with sum + carry',build(){const b1=nid('b'),b2=nid('b'),b3=nid('b'),f2=nid('f'),l1=nid('l'),l2=nid('l');return{gates:[gt('BUTTON',60,60,{id:b1}),gt('BUTTON',60,130,{id:b2}),gt('BUTTON',60,200,{id:b3}),gt('FULL_ADDER',230,110,{id:f2}),gt('LED',420,90,{id:l1}),gt('LED',420,170,{id:l2})],wires:[wt(b1,0,f2,0),wt(b2,0,f2,1),wt(b3,0,f2,2),wt(f2,0,l1,0),wt(f2,1,l2,0)]}}},
  {name:'32-Bit Computer',desc:'Motherboard + CPU + memory + fan',build(){const p=nid('p'),m=nid('m'),c=nid('c'),me=nid('m'),f=nid('f'),l=nid('l');return{gates:[gt('POWER_STATION',60,80,{id:p}),gt('MOTHERBOARD',220,90,{id:m}),gt('CPU32',420,90,{id:c}),gt('LOGIC_MEM',420,200,{id:me}),gt('FAN',60,200,{id:f}),gt('LED',620,100,{id:l})],wires:[wt(p,0,m,0),wt(m,0,c,0),wt(f,0,c,1),wt(m,0,me,0),wt(c,0,l,0)]}}},
  {name:'128-Bit Full Computer',desc:'Top-tier CPU with cooling and display',build(){const p=nid('p'),m=nid('m'),c=nid('c'),f1=nid('f'),f2=nid('f'),t=nid('t');return{gates:[gt('POWER_STATION',60,80,{id:p}),gt('MOTHERBOARD',220,90,{id:m}),gt('CPU128',430,80,{id:c}),gt('FAN',60,200,{id:f1}),gt('FAN',160,200,{id:f2}),gt('TERMINAL',620,70,{id:t})],wires:[wt(p,0,m,0),wt(m,0,c,0),wt(f1,0,c,1),wt(f2,0,c,1),wt(c,0,t,0)]}}},
  {name:'7-Segment Display',desc:'Light individual segments',build(){const a=nid('g'),sp=nid('sp'),s=nid('s');return{gates:[gt('GENERATOR',60,100,{id:a}),gt('SPLITTER',200,100,{id:sp}),gt('SEG7',360,80,{id:s})],wires:[wt(a,0,sp,0),wt(sp,0,s,0),wt(sp,1,s,3)]}}},
  {name:'GPU Render Station',desc:'GPU with power and output',build(){const p=nid('p'),gp=nid('g'),l=nid('l');return{gates:[gt('POWER_STATION',80,100,{id:p}),gt('GPU',260,90,{id:gp}),gt('LED',440,100,{id:l})],wires:[wt(p,0,gp,0),wt(gp,0,l,0)]}}},
  {name:'Complex Counter',desc:'Configurable start counter',build(){const a=nid('g'),c=nid('c'),h=nid('h');return{gates:[gt('GENERATOR',60,100,{id:a}),gt('COMPLEX_COUNTER',220,80,{id:c}),gt('HEX_DISP',440,90,{id:h})],wires:[wt(a,0,c,4),wt(c,0,h,0),wt(c,1,h,1),wt(c,2,h,2),wt(c,3,h,3)]}}},
  {name:'Number Counter 0-9',desc:'Decimal counter display',build(){const a=nid('g'),c=nid('c'),h=nid('h');return{gates:[gt('GENERATOR',60,100,{id:a}),gt('NUM_COUNTER',220,90,{id:c}),gt('HEX_DISP',420,100,{id:h})],wires:[wt(a,0,c,0),wt(c,0,h,0),wt(c,1,h,1),wt(c,2,h,2),wt(c,3,h,3)]}}},
  {name:'D Latch Register',desc:'Store data on enable',build(){const b=nid('b'),d=nid('d'),dl=nid('d'),l=nid('l');return{gates:[gt('BUTTON',60,80,{id:b}),gt('GENERATOR',60,160,{id:d}),gt('D_LATCH',240,100,{id:dl}),gt('LED',420,100,{id:l})],wires:[wt(b,0,dl,1),wt(d,0,dl,0),wt(dl,0,l,0)]}}},
  {name:'NAND SR Latch',desc:'Build latch from NAND gates',build(){const b1=nid('b'),b2=nid('b'),n1=nid('n'),n2=nid('n'),l=nid('l');return{gates:[gt('BUTTON',60,80,{id:b1}),gt('BUTTON',60,180,{id:b2}),gt('NAND',240,80,{id:n1}),gt('NAND',240,180,{id:n2}),gt('LED',420,120,{id:l})],wires:[wt(b1,0,n1,0),wt(b2,0,n2,1),wt(n1,0,n2,0),wt(n2,0,n1,1),wt(n1,0,l,0)]}}}
];

/* ---------- Terminal OS (full command set) ---------- */
const BOOT = ['LogicOS v2.0  [128-bit ready]','(c) 2026 Logic Labs Systems','','Memory check ........ OK','CPU probe ........... OK','Loading kernel ...... OK','Type HELP for command list.'];
function makeTerm(){ return { lines:[...BOOT], input:'', hist:[], hi:-1 }; }
let CMDS = null;
function termCommands(){ return {
  help:(t)=>t.out('Available commands:',...Object.keys(CMDS).map(c=>`  ${c.padEnd(14)} ${CMDS[c].d}`),'',`Total: ${Object.keys(CMDS).length} commands`),
  clear:(t)=>{t.lines=[];}, cls:(t)=>{t.lines=[];},
  echo:(t,a)=>t.out(a.join(' ')), print:(t,a)=>t.out(a.join(' ')), say:(t,a)=>t.out(a.join(' ')),
  date:(t)=>t.out(new Date().toLocaleDateString()), time:(t)=>t.out(new Date().toLocaleTimeString()), now:(t)=>t.out(new Date().toString()),
  whoami:(t)=>t.out('admin@logicos'), host:(t)=>t.out('logic-lab-001'),
  ver:(t)=>t.out('LogicOS v2.0.4 (build 20260804)'), version:(t)=>t.out('LogicOS v2.0.4 (build 20260804)'),
  os:(t)=>t.out('LogicOS — 128-bit microkernel'), boot:(t)=>{t.lines=[...BOOT];},
  reboot:(t)=>{t.lines=[]; t.out('Rebooting...'); setTimeout(()=>{t.lines=[...BOOT]; renderTerminalLines(t._gid);},400);},
  shutdown:(t)=>t.out('System halted. Disconnect power to restart.'), halt:(t)=>t.out('System halted.'),
  dir:(t)=>t.out('gates.lgc   wires.bin   state.sav   config.sys'), ls:(t)=>t.out('gates.lgc   wires.bin   state.sav   config.sys'),
  cat:(t,a)=>t.out(a[0]?`[${a[0]}] file contents not available in demo mode`:'usage: cat <file>'),
  type:(t,a)=>t.out(a[0]?`[${a[0]}] file contents not available`:'usage: type <file>'),
  cd:(t,a)=>t.out(a[0]?`/${a[0]}/`:'/'), pwd:(t)=>t.out('/logic/system'),
  mkdir:(t,a)=>t.out(a[0]?`created /${a[0]}/`:'usage: mkdir <name>'),
  rm:(t,a)=>t.out(a[0]?`deleted ${a[0]}`:'usage: rm <file>'), del:(t,a)=>t.out(a[0]?`deleted ${a[0]}`:'usage: del <file>'),
  copy:(t,a)=>t.out(a[0]?`copied to ${a[0]}`:'usage: copy <dest>'), move:(t,a)=>t.out(a[0]?`moved to ${a[0]}`:'usage: move <dest>'),
  ren:(t,a)=>t.out(a[0]?`renamed to ${a[0]}`:'usage: ren <name>'), edit:(t)=>t.out('Editor not available in terminal mode.'),
  format:(t)=>t.out('Formatting C: ...','Disk formatted. All data lost.'),
  scan:(t)=>t.out('Scanning logic grid...','0 errors found. System healthy.'),
  chkdsk:(t)=>t.out('Checking disk integrity...','OK'), defrag:(t)=>t.out('Defragmenting memory...','Done.'),
  mem:(t)=>t.out(`Memory: ${(S.gates.length||0)*4} bytes used / 65536 free`),
  tasklist:(t)=>t.out('PID  NAME        STATUS','1    kernel      running','2    sim-engine  running','3    display     idle'),
  ps:(t)=>t.out('PID  NAME','1    kernel','2    sim-engine'), kill:(t,a)=>t.out(a[0]?`process ${a[0]} terminated`:'usage: kill <pid>'),
  ping:(t,a)=>t.out(`Pinging ${a[0]||'localhost'}...`,`reply: 1ms`,`reply: 1ms`),
  ip:(t)=>t.out('IP: 10.0.0.42','Mask: 255.255.255.0'), ipconfig:(t)=>t.out('IP: 10.0.0.42','Gateway: 10.0.0.1'),
  netstat:(t)=>t.out('Proto  Local          Foreign','TCP    10.0.0.42:80    0.0.0.0:*'),
  wifi:(t)=>t.out('WiFi: connected','SSID: LogicNet','Signal: -42 dBm'),
  calc:(t,a)=>{try{const r=Function('return '+a.join(''))();t.out(`= ${r}`);}catch{t.out('error');}},
  add:(t,a)=>t.out(`= ${a.reduce((s,n)=>s+(+n||0),0)}`),
  sub:(t,a)=>t.out(`= ${a.slice(1).reduce((s,n)=>s-(+n||0),+a[0]||0)}`),
  mul:(t,a)=>t.out(`= ${a.reduce((s,n)=>s*(+n||1),1)}`),
  hex:(t,a)=>t.out((+a[0]||0).toString(16).toUpperCase()), bin:(t,a)=>t.out((+a[0]||0).toString(2)),
  dec:(t,a)=>t.out(parseInt(a[0]||'0',a[1]||16).toString()), ascii:(t,a)=>t.out((a[0]||'').charCodeAt(0)),
  char:(t,a)=>t.out(String.fromCharCode(+a[0]||0)), rand:(t)=>t.out(Math.floor(Math.random()*100)),
  dice:(t)=>t.out(`🎲 ${Math.floor(Math.random()*6)+1}`), coin:(t)=>t.out(Math.random()<0.5?'HEADS':'TAILS'),
  gates:(t)=>t.out(`Gates on canvas: ${S.gates.length}`), count:(t)=>t.out(`Active components: ${S.gates.length}`),
  list:(t)=>t.out('AND OR XOR NOT NAND NOR XNOR SPLITTER','CPU4 CPU8 CPU16 CPU32 CPU64 CPU128','EEPROM8 EEPROM16 GPU MOTHERBOARD'),
  info:(t)=>t.out('Logic Lab Terminal — interactive command shell'),
  about:(t)=>t.out('LogicOS: a simulated operating system for the Logic Lab.','Built with 128-bit ready architecture.'),
  credits:(t)=>t.out('Design: Logic Labs','Inspired by: Upload Labs'),
  color:(t,a)=>t.out(a[0]?`Color set to ${a[0]}`:'usage: color <name>'), theme:(t,a)=>t.out(a[0]?`Theme: ${a[0]}`:'themes: dark, light, matrix'),
  matrix:(t)=>{t.out('Entering matrix mode...'); setTimeout(()=>t.out('Wake up, Neo.'),1000);},
  exit:(t)=>t.out('Cannot exit — terminal is powered.'), quit:(t)=>t.out('Cannot quit — terminal is powered.'),
  logout:(t)=>t.out('No session to log out from.'), yes:(t)=>t.out('y'), no:(t)=>t.out('n'),
  true:(t)=>t.out('1'), false:(t)=>t.out('0'), null:(t)=>t.out('null'), void:(t)=>t.out('void'),
  test:(t)=>t.out('Test signal: OK'),
  diag:(t)=>t.out('Running diagnostics...','CPU: OK','MEM: OK','GPU: OK','FAN: OK','All systems nominal.'),
  status:(t)=>t.out('STATUS: ONLINE','Uptime: 00:42:17','Load: 12%'),
  sys:(t)=>t.out('System: LogicOS v2.0','Arch: 128-bit','Cores: 8'),
  spec:(t)=>t.out('CPU: 128-bit @ 4.2GHz','RAM: 64GB','GPU: LogicVision RTX'),
  bench:(t)=>t.out('Benchmarking...','Score: 42891','Rank: S'),
  clock:(t)=>t.out(`System clock: ${(Date.now()%100000)/1000}s`),
  timer:(t,a)=>t.out(`Timer set for ${a[0]||5}s`), alarm:(t,a)=>t.out(`Alarm set for ${a[0]||'12:00'}`),
  calendar:(t)=>t.out(new Date().toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'})),
  today:(t)=>t.out(new Date().toDateString()),
  history:(t)=>t.out(...t.hist.slice(-10)), repeat:(t,a)=>t.out(Array.from({length:+(a[1]||3)},()=>a[0]||'').join(' ')),
  reverse:(t,a)=>t.out((a.join(' ')).split('').reverse().join('')), upper:(t,a)=>t.out(a.join(' ').toUpperCase()),
  lower:(t,a)=>t.out(a.join(' ').toLowerCase()), len:(t,a)=>t.out((a.join(' ')).length), count_chars:(t,a)=>t.out((a.join(' ')).length),
  sort:(t,a)=>t.out(a.sort().join(' ')), uniq:(t,a)=>t.out([...new Set(a)].join(' ')),
  head:(t,a)=>t.out((a.join(' ')).slice(0,20)), tail:(t,a)=>t.out((a.join(' ')).slice(-20)),
  grep:(t,a)=>t.out(a[0]?`searching for "${a[0]}"...`:'usage: grep <pattern>'), find:(t,a)=>t.out(a[0]?`found 0 matches for "${a[0]}"`:'usage: find <pattern>'),
  man:(t,a)=>t.out(a[0]?`Manual: ${a[0]} - command exists`:'usage: man <cmd>'), history_clear:(t)=>{t.hist=[];t.out('history cleared');},
  joke:(t)=>t.out(['Why did the NAND go to therapy? It felt inverted.','01001110 01101111.','A logic gate walks into a bar... AND OR NOR.'][Math.floor(Math.random()*3)]),
  fortune:(t)=>t.out(['"Logic is the beginning of wisdom." — Spock','"To err is human; to debug, divine."','"There are 10 types of people..."'][Math.floor(Math.random()*3)]),
  banner:(t)=>t.out('██╗      ██████╗  ██████╗','██║     ██╔═══██╗██╔════╝','██║     ██║   ██║██║     ','██║     ██║   ██║██║     ','███████╗╚██████╔╝╚██████╗','╚══════╝ ╚═════╝  ╚═════╝'),
  ascii_art:(t)=>t.out('  ___',' / _ \\','| | | |','| |_| |',' \\___/','LOGIC'),
  cowsay:(t,a)=>t.out(` ${'_'+(a.join(' ')||'moo')}_`,'        \\   ^__^','         \\  (oo)\\_______','            (__)\\       )\\/\\','                ||----w |','                ||     ||'),
  figlet:(t,a)=>t.out(`.---..---..---..---.\n| ${a[0]||'L'} || ${a[1]||'O'} || ${a[2]||'G'} || ${a[3]||'I'} |`),
  starwars:(t)=>t.out('A long time ago in a circuit far away...'),
  easter:(t)=>t.out('🐰 You found an egg!'), secret:(t)=>t.out('🤫 nothing to see here'),
  admin:(t)=>t.out('Admin mode: ENABLED'), superuser:(t)=>t.out('root privileges granted.'),
  sudo:(t,a)=>t.out(a[0]?`running ${a[0]} as root... done`:'usage: sudo <cmd>'), su:(t)=>t.out('switched to root'),
  passwd:(t)=>t.out('password: ********','Password changed.'),
  encrypt:(t,a)=>{try{t.out(btoa(a.join(' ')));}catch{t.out(a.join(' '));}}, decrypt:(t)=>t.out('decryption requires key.'),
  base64:(t,a)=>{try{t.out(btoa(a.join(' ')));}catch{t.out('error');}},
  hash:(t,a)=>t.out('sha256: '+(a.join(' ')).split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0).toString(16)),
  uuid:(t)=>t.out(crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx'), uuidgen:(t)=>t.out(crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx'),
  md5:(t)=>t.out('d41d8cd98f00b204e9800998ecf8427e'), sha:(t)=>t.out('da39a3ee5e6b4b0d3255bfef95601890'),
  git:(t,a)=>t.out(a[0]?`git ${a[0]}: ok`:'usage: git <command>'), npm:(t,a)=>t.out(a[0]?`npm ${a[0]}: done`:'usage: npm <cmd>'),
  build:(t)=>t.out('Building circuit...','✓ Compiled successfully'), compile:(t)=>t.out('Compiling...','0 errors, 0 warnings'),
  run:(t)=>t.out('Executing program...','Program exited with code 0'), deploy:(t)=>t.out('Deploying to motherboard...','Deployed.'),
  simulate:(t)=>t.out('Simulation active.'), trace:(t)=>t.out('Tracing signals...','All paths valid.'),
  log:(t,a)=>t.out(`[LOG] ${a.join(' ')}`), warn:(t,a)=>t.out(`[WARN] ${a.join(' ')}`), error:(t,a)=>t.out(`[ERROR] ${a.join(' ')}`),
  debug:(t)=>t.out('Debug mode toggled.'), step:(t)=>t.out('Stepped 1 tick.'), reset:(t)=>t.out('Circuit reset.'),
  power:(t)=>t.out('Power: ON','Voltage: 5V','Current: 1.2A'), voltage:(t)=>t.out('5.0 V'), current:(t)=>t.out('1.2 A'),
  temp:(t)=>t.out('CPU temp: 42°C'), fan:(t)=>t.out('Fan speed: 2400 RPM'), speed:(t)=>t.out('Clock: 4.2 GHz'),
  freq:(t)=>t.out('Frequency: 50 Hz'), hz:(t)=>t.out('50 Hz'), mhz:(t)=>t.out('4200 MHz'), ghz:(t)=>t.out('4.2 GHz'),
  byte:(t)=>t.out('8 bits'), bit:(t)=>t.out('1'), nibble:(t)=>t.out('4 bits'), word:(t)=>t.out('128 bits'),
  overflow:(t)=>t.out('No overflow detected.'), zero:(t)=>t.out('Zero flag: 0'), carry:(t)=>t.out('Carry flag: 0'),
  parity:(t)=>t.out('Parity: even'), flags:(t)=>t.out('Z=0 C=0 P=1 O=0'), register:(t)=>t.out('R0=00 R1=01 R2=02 R3=03'),
  ax:(t)=>t.out('AX: 0x0000'), bx:(t)=>t.out('BX: 0x0000'), cx:(t)=>t.out('CX: 0x0000'), dx:(t)=>t.out('DX: 0x0000'),
  sp:(t)=>t.out('SP: 0xFFFE'), pc:(t)=>t.out('PC: 0x0000'), stack:(t)=>t.out('[empty]'), heap:(t)=>t.out('[empty]'),
  asm:(t,a)=>t.out(a[0]?`assembled: ${a[0]}`:'usage: asm <instruction>'), mov:(t)=>t.out('register updated.'),
  jmp:(t)=>t.out('jumped.'), cmp:(t)=>t.out('compared.'), nop:()=>{}, halt2:(t)=>t.out('halted.'),
  path:(t)=>t.out('Trace a wire in the editor to highlight its signal path.'),
  highlight:(t)=>t.out('Click any wire to highlight the full signal path (cyan). Shift-click to delete.'),
  library:(t)=>t.out('Open the Library (toolbar) to save and reuse custom circuits.')
};
}

/* ---------- app state ---------- */
const S = {
  gates: [], wires: [], notes: [], customGates: [],
  outputs: {}, states: {},
  running: true, selectedType: null, selectedGateId: null, multiSelect: new Set(),
  pan: {x:40,y:20}, zoom: 1, pending: null,
  highlight: {wires:new Set(), gates:new Set()},
  activeCat: 'Logic', activeKeyboard: null, terms: {},
  showPalette: true, showList: false
};
const gateEls = {}, noteEls = {};

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
function toast(m){ const t=$('toast'); t.textContent=m; t.style.display='block'; clearTimeout(t._t); t._t=setTimeout(()=>t.style.display='none',1800); }
function toCanvas(cx, cy){ const r=$('canvas').getBoundingClientRect(); return {x:(cx-r.left-S.pan.x)/S.zoom, y:(cy-r.top-S.pan.y)/S.zoom}; }

/* ---------- placement ---------- */
function placeCircuit(circ, pos, msg){
  const src=circ.gates||[]; if(!src.length) return;
  const idMap={}; const ox=src[0].x, oy=src[0].y;
  const ng=src.map(g=>{const n=uid(g.type.toLowerCase());idMap[g.id]=n;return{...g,id:n,x:Math.round(pos.x+g.x-ox),y:Math.round(pos.y+g.y-oy),state:{}};});
  const nw=(circ.wires||[]).map(w=>({id:uid('w'),from:{gate:idMap[w.from.gate],port:w.from.port},to:{gate:idMap[w.to.gate],port:w.to.port}}));
  S.gates=[...S.gates,...ng]; S.wires=[...S.wires,...nw]; structuralRender(); if(msg) toast(msg);
}
function placeGate(typeKey, pos){
  if(typeKey.startsWith('CUSTOM:')){ const c=S.customGates.find(x=>x.id===typeKey.slice(7)); if(c) placeCircuit(c,pos,`Placed custom: ${c.name}`); return; }
  if(typeKey.startsWith('LIB:')){ const c=loadLibrary().find(x=>x.id===typeKey.slice(4)); if(c) placeCircuit(c,pos,`Placed: ${c.name}`); return; }
  const def=getDef(typeKey);
  const init = def.render==='led'?{color:'#22c55e'}:def.render==='text'?{text:'HELLO'}:def.render==='recv'?{target:5}:{};
  S.gates=[...S.gates,{id:uid(typeKey.toLowerCase()),type:typeKey,x:Math.round(pos.x),y:Math.round(pos.y),state:init}];
  structuralRender();
}

/* ---------- simulation tick ---------- */
function tick(){
  if(!S.gates.length){ S.outputs={}; S.states={}; updateGateVisuals(); renderWires(); renderHud(); return; }
  const prev={}; S.gates.forEach(g=>{prev[g.id]={...(g.state||{}),...(S.states[g.id]||{})};});
  const {outputs,states}=simulate(S.gates,S.wires,prev);
  S.gates.forEach(g=>{if(g.type==='TERMINAL') states[g.id]={...states[g.id],ctx:{gates:S.gates.length}};});
  S.outputs=outputs; S.states=states;
  updateGateVisuals(); renderWires(); renderHud();
}
let simTimer=null;
function setRunning(r){ S.running=r; if(r){ simTimer=setInterval(tick,80); } else { clearInterval(simTimer); simTimer=null; } renderToolbar(); }
function stepOnce(){ tick(); }

/* ---------- gate inner visual ---------- */
function gateInner(g, def, sig){
  const s=sig||[];
  switch(def.render){
    case 'led':{ const on=g.state?.on; const c=g.state?.color||'#22c55e'; return `<div style="width:28px;height:28px;border-radius:50%;background:${on?c:'#18181b'};box-shadow:${on?`0 0 18px ${c}`:'none'};border:2px solid #52525b"></div>`; }
    case 'fan':{ const on=g.state?.on; const sp=g.state?.spin||0; return `<svg width="48" height="48" viewBox="0 0 48 48" style="transform:rotate(${sp}deg)"><circle cx="24" cy="24" r="6" fill="#71717a"/>${[0,90,180,270].map(a=>`<ellipse cx="24" cy="14" rx="5" ry="11" fill="${on?'#a1a1aa':'#52525b'}" transform="rotate(${a} 24 24)"/>`).join('')}</svg>`; }
    case 'seg7':{ const sg=g.state?.segs||[0,0,0,0,0,0,0]; const C='#22c55e',O='#27272a'; return `<svg width="44" height="60" viewBox="0 0 44 60"><polygon points="10,4 34,4 31,7 13,7" fill="${sg[0]?C:O}"/><polygon points="37,7 37,28 34,25 34,10" fill="${sg[1]?C:O}"/><polygon points="37,32 37,53 34,50 34,35" fill="${sg[2]?C:O}"/><polygon points="10,56 34,56 31,53 13,53" fill="${sg[3]?C:O}"/><polygon points="7,32 7,53 10,50 10,35" fill="${sg[4]?C:O}"/><polygon points="7,7 7,28 10,25 10,10" fill="${sg[5]?C:O}"/><polygon points="10,30 34,30 31,27 13,27 10,33" fill="${sg[6]?C:O}"/></svg>`; }
    case 'hex':{ const v=g.state?.val||0; const m=['0','1','2','3','4','5','6','7','8','9','A','b','C','d','E','F']; return `<span style="font-family:monospace;font-size:30px;color:#22c55e;text-shadow:0 0 10px #22c55e">${m[v]}</span>`; }
    case 'text':{ const on=g.state?.on; const tx=g.state?.text||'TEXT PANEL'; return `<span style="font-size:11px;color:${on?'#a3e635':'#52525b'};text-shadow:${on?'0 0 6px #a3e635':'none'}">${on?tx:'— off —'}</span>`; }
    case 'keyboard': return `<button onclick="event.stopPropagation();activateKbd('${g.id}')" class="btn" style="font-size:10px">TYPE</button>`;
    case 'piston':{ const on=g.state?.on; return `<div style="width:${on?40:24}px;height:16px;background:#71717a;border:1px solid #27272a;transition:width 0.15s"></div>`; }
    case 'button':{ const on=g.state?.on; return `<div onclick="event.stopPropagation();toggleGate('${g.id}')" style="width:24px;height:24px;border-radius:6px;background:${on?'#22c55e':'#3f3f46'};box-shadow:${on?'0 0 10px #22c55e':'inset 0 0 4px #000'};cursor:pointer"></div>`; }
    case 'recv':{ const tg=g.state?.target??5; return `<div style="text-align:center"><div style="font-family:monospace;color:#d4d4d8">${tg}</div><div style="font-size:8px;color:#71717a">target</div></div>`; }
    case 'eeprom':{ const a=g.state?.addr??0; const m=g.state?.mem||{}; return `<div style="text-align:center;font-size:8px;color:#a1a1aa"><div>ADDR:${a}</div><div>VAL:${m[a]?1:0}</div></div>`; }
    case 'wifi':{ return `<div style="text-align:center;font-size:8px;color:#a1a1aa"><div>WIFI</div><div style="color:#71717a">3s delay</div><div style="display:flex;gap:2px;justify-content:center">${[0,1,2,3].map(i=>`<span style="width:6px;height:6px;border-radius:3px;background:${s[i]?'#3b82f6':'#27272a'}"></span>`).join('')}</div></div>`; }
    default: return '';
  }
}

/* ---------- gate element factory ---------- */
function buildGateEl(g){
  const def=getDef(g.type);
  const el=document.createElement('div');
  el.className='gate';
  el.style.width=def.w+'px'; el.style.height=def.h+'px';
  el.dataset.id=g.id;
  const cfg=(def.render==='eeprom'||def.render==='recv'||def.render==='text'||def.render==='led');
  el.innerHTML=`<div class="accent" style="background:${def.color}"></div><div class="inner"></div>${def.render!=='terminal'?`<div class="label">${def.label}</div>`:''}<button class="del">×</button>${cfg?`<button class="cfg">⚙</button>`:''}`;
  for(let i=0;i<def.inputs;i++){ const p=portPos(def,'in',i); const pe=document.createElement('div'); pe.className='port in'; pe.style.left=(p.x-6)+'px'; pe.style.top=(p.y-6)+'px'; pe.addEventListener('mousedown',(e)=>portDown(e,g.id,'in',i)); el.appendChild(pe); }
  for(let i=0;i<def.outputs;i++){ const p=portPos(def,'out',i); const pe=document.createElement('div'); pe.className='port out'; pe.dataset.port=i; pe.style.left=(p.x-6)+'px'; pe.style.top=(p.y-6)+'px'; pe.addEventListener('mousedown',(e)=>portDown(e,g.id,'out',i)); el.appendChild(pe); }
  el.addEventListener('mousedown',(e)=>{ if(e.target.classList.contains('port')||e.target.classList.contains('del')||e.target.classList.contains('cfg')) return; gateDown(e,g.id); });
  el.querySelector('.del').addEventListener('click',(e)=>{ e.stopPropagation(); delGate(g.id); });
  if(cfg) el.querySelector('.cfg').addEventListener('click',(e)=>{ e.stopPropagation(); configure(g.id); });
  return el;
}

/* ---------- structural render (add/remove/move) ---------- */
function syncGates(){
  const layer=$('gateLayer');
  layer.style.transform=`translate(${S.pan.x}px,${S.pan.y}px) scale(${S.zoom})`;
  const seen=new Set();
  S.gates.forEach(g=>{
    seen.add(g.id);
    if(!gateEls[g.id]){ gateEls[g.id]=buildGateEl(g); layer.appendChild(gateEls[g.id]); }
    gateEls[g.id].style.left=g.x+'px'; gateEls[g.id].style.top=g.y+'px';
  });
  Object.keys(gateEls).forEach(id=>{ if(!seen.has(id)){ gateEls[id].remove(); delete gateEls[id]; delete S.terms[id]; } });
  syncNotes();
}
function syncNotes(){
  const layer=$('gateLayer');
  const seen=new Set();
  S.notes.forEach(n=>{
    seen.add(n.id);
    if(!noteEls[n.id]){
      const el=document.createElement('div'); el.className='note';
      el.innerHTML=`<button class="nx">×</button><textarea></textarea>`;
      el.querySelector('.nx').addEventListener('click',(e)=>{ e.stopPropagation(); delNote(n.id); });
      const ta=el.querySelector('textarea'); ta.value=n.text||'';
      ta.addEventListener('input',(e)=>{ n.text=e.target.value; });
      ta.addEventListener('mousedown',(e)=>e.stopPropagation());
      el.addEventListener('mousedown',(e)=>{ if(e.target.tagName==='TEXTAREA')return; noteDown(e,n.id); });
      layer.appendChild(el); noteEls[n.id]=el;
    }
    noteEls[n.id].style.left=n.x+'px'; noteEls[n.id].style.top=n.y+'px';
  });
  Object.keys(noteEls).forEach(id=>{ if(!seen.has(id)){ noteEls[id].remove(); delete noteEls[id]; } });
}

/* ---------- per-tick visual update ---------- */
function updateGateVisuals(){
  S.gates.forEach(g=>{
    const el=gateEls[g.id]; if(!el) return;
    const def=getDef(g.type);
    const st={...(g.state||{}),...(S.states[g.id]||{})};
    const sig=S.outputs[g.id];
    el.querySelectorAll('.port.out').forEach((pe,i)=>{ pe.classList.toggle('active', !!(sig&&sig[i])); });
    if(def.render!=='terminal'){
      el.querySelector('.inner').innerHTML=gateInner({...g,state:st},def,sig);
    } else {
      updateTerminal(g, st);
    }
    el.classList.toggle('selected', S.selectedGateId===g.id);
    el.classList.toggle('highlighted', S.highlight.gates.has(g.id));
  });
}

/* ---------- terminal ---------- */
function updateTerminal(g, st){
  const el=gateEls[g.id]; if(!el) return;
  const inner=el.querySelector('.inner');
  const powered=!!st.power;
  if(powered){
    if(!S.terms[g.id]) S.terms[g.id]=makeTerm();
    S.terms[g.id]._gid=g.id;
    if(inner.dataset.powered!=='1'){
      inner.innerHTML=`<div class="term"><div class="out"></div><div class="in"><span>&gt;</span><input></div></div>`;
      inner.dataset.powered='1';
      attachTerminal(g.id, inner);
    }
    renderTerminalLines(g.id);
  } else {
    if(inner.dataset.powered==='1'){ inner.innerHTML='<div class="no-power">— NO POWER —</div>'; delete inner.dataset.powered; delete S.terms[g.id]; }
  }
}
function attachTerminal(gid, inner){
  const t=S.terms[gid];
  const inp=inner.querySelector('input');
  inp.value=t.input;
  inp.onkeydown=(e)=>{
    e.stopPropagation();
    if(e.key==='Enter'){ const cmd=t.input.trim(); if(!cmd)return; t.lines.push('> '+cmd); t.hist.push(cmd); t.input=''; const [name,...args]=cmd.split(/\s+/); const fn=CMDS[name.toLowerCase()]; if(fn){try{fn(t,args);}catch{t.out('runtime error');}}else t.out(`'${name}' is not recognized. Type HELP.`); renderTerminalLines(gid); inp.value=''; t.hi=-1; }
    else if(e.key==='ArrowUp'){ e.preventDefault(); const ni=t.hi<0?t.hist.length-1:Math.max(0,t.hi-1); if(t.hist[ni]!==undefined){t.input=t.hist[ni];t.hi=ni;inp.value=t.input;} }
    else if(e.key==='ArrowDown'){ e.preventDefault(); const ni=t.hi+1; if(ni>=t.hist.length){t.input='';t.hi=-1;}else{t.input=t.hist[ni];t.hi=ni;} inp.value=t.input; }
  };
  inp.oninput=(e)=>{ t.input=e.target.value; };
  inner.onclick=(e)=>e.stopPropagation();
}
function renderTerminalLines(gid){
  const el=gateEls[gid]; if(!el) return;
  const out=el.querySelector('.term .out'); if(!out) return;
  const t=S.terms[gid]; if(!t) return;
  out.innerHTML=t.lines.map(l=>`<div>${l}</div>`).join('');
  out.scrollTop=out.scrollHeight;
}

/* ---------- wires ---------- */
function renderWires(){
  const svg=$('wireSvg');
  svg.innerHTML=`<g style="transform:translate(${S.pan.x}px,${S.pan.y}px) scale(${S.zoom});transform-origin:0 0">`+
    S.wires.map(w=>{
      const g=S.gates.find(x=>x.id===w.from.gate), g2=S.gates.find(x=>x.id===w.to.gate);
      if(!g||!g2) return '';
      const d=getDef(g.type), d2=getDef(g2.type);
      const pf=portPos(d,'out',w.from.port)||portPos(d,'in',w.from.port);
      const pt=portPos(d2,'in',w.to.port)||portPos(d2,'out',w.to.port);
      if(!pf||!pt) return '';
      const from={x:g.x+pf.x,y:g.y+pf.y}, to={x:g2.x+pt.x,y:g2.y+pt.y};
      const active=S.outputs[w.from.gate]?.[w.from.port];
      const hl=S.highlight.wires.has(w.id);
      const color=hl?'#22d3ee':active?'#22c55e':'#52525b';
      const width=hl?4:active?3:2;
      const dx=Math.abs(to.x-from.x)*0.5+20;
      const pth=`M ${from.x} ${from.y} C ${from.x+dx} ${from.y}, ${to.x-dx} ${to.y}, ${to.x} ${to.y}`;
      return `<path d="${pth}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" style="filter:${hl?'drop-shadow(0 0 6px #22d3ee)':active?'drop-shadow(0 0 4px #22c55e)':'none'};pointer-events:stroke;cursor:pointer" onclick="wireClick(event,'${w.id}')"/>`;
    }).join('')+
    (S.pending&&S.pending.fromPos?(()=>{const f=S.pending.fromPos,t=S.pending.toPos||f;const dx=Math.abs(t.x-f.x)*0.5+20;const p=`M ${f.x} ${f.y} C ${f.x+dx} ${f.y}, ${t.x-dx} ${t.y}, ${t.x} ${t.y}`;return `<path d="${p}" stroke="#a1a1aa" stroke-width="2" fill="none" stroke-linecap="round"/>`;})():'')+
    `</g>`;
}

/* ---------- HUD ---------- */
function renderHud(){
  const h=$('hud');
  h.innerHTML=`<span>zoom ${(S.zoom*100|0)}%</span>`+
    (S.selectedType?`<span style="color:#4ade80">placing: ${S.selectedType}</span>`:'')+
    (S.pending?`<span style="color:#60a5fa">click an INPUT port to connect</span>`:'')+
    (S.highlight.wires.size?`<span style="color:#22d3ee">path highlighted — shift-click wire to delete · Esc to clear</span>`:'')+
    (S.activeKeyboard?`<span style="color:#fbbf24">⌨ typing — Esc to stop</span>`:'')+
    `<button onclick="toggleList()">☰ list</button>`+
    `<button onclick="togglePalette()">⊞ parts</button>`+
    (S.highlight.wires.size?`<button onclick="clearHighlight()">clear path</button>`:'');
}

/* ---------- gate list overlay ---------- */
function toggleList(){ S.showList=!S.showList; renderGateList(); }
function renderGateList(){
  const el=$('gateList');
  if(!S.showList){ el.style.display='none'; return; }
  el.style.display='block';
  el.innerHTML=`<div class="gl-head"><span>Gates (${S.gates.length})</span><button class="btn" onclick="toggleList()" style="padding:1px 6px">✕</button></div>`+
    S.gates.map(g=>{ const d=getDef(g.type); return `<div class="gl-item" onclick="focusGate('${g.id}')"><div class="swatch" style="background:${d.color}"></div>${d.label} <span style="color:#71717a">${g.x},${g.y}</span></div>`; }).join('');
}
function focusGate(id){ const g=S.gates.find(x=>x.id===id); if(!g)return; S.pan={x:-g.x*S.zoom+300,y:-g.y*S.zoom+200}; S.selectedGateId=id; structuralRender(); renderGateList(); }

/* ---------- minimap ---------- */
function renderMinimap(){
  const c=$('minimap'); const ctx=c.getContext('2d');
  ctx.clearRect(0,0,140,100);
  if(!S.gates.length) return;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  S.gates.forEach(g=>{minX=Math.min(minX,g.x);minY=Math.min(minY,g.y);maxX=Math.max(maxX,g.x+80);maxY=Math.max(maxY,g.y+80);});
  const w=maxX-minX||1, h=maxY-minY||1; const sc=Math.min(130/w,90/h); const ox=(140-w*sc)/2, oy=(100-h*sc)/2;
  ctx.fillStyle='#3f3f46'; S.gates.forEach(g=>{ctx.fillRect(ox+(g.x-minX)*sc,oy+(g.y-minY)*sc,Math.max(2,sc*4),Math.max(2,sc*4));});
  const r=$('canvasWrap').getBoundingClientRect();
  ctx.strokeStyle='#22d3ee'; ctx.lineWidth=1;
  const vx=ox+(-S.pan.x/S.zoom-minX)*sc, vy=oy+(-S.pan.y/S.zoom-minY)*sc;
  ctx.strokeRect(vx,vy,(r.width/S.zoom)*sc,(r.height/S.zoom)*sc);
}

/* ---------- interactions ---------- */
let drag=null;
function canvasDown(e){
  if(e.target.id==='canvas'){ S.highlight={wires:new Set(),gates:new Set()}; renderWires(); updateGateVisuals(); renderHud(); }
  if(e.button===1||(e.button===0&&e.altKey)||(S.selectedType===null&&e.target.id==='canvas')){ drag={mode:'pan',sx:e.clientX,sy:e.clientY,px:S.pan.x,py:S.pan.y}; return; }
  if(S.selectedType && e.target.id==='canvas'){ placeGate(S.selectedType, toCanvas(e.clientX,e.clientY)); }
}
function mousemove(e){
  const d=drag; if(!d) return;
  if(d.mode==='pan'){ S.pan={x:d.px+(e.clientX-d.sx),y:d.py+(e.clientY-d.sy)}; syncGates(); renderWires(); renderMinimap(); }
  else if(d.mode==='gate'){ const c=toCanvas(e.clientX,e.clientY); S.gates=S.gates.map(g=>g.id===d.id?{...g,x:Math.round(c.x-d.ox),y:Math.round(c.y-d.oy)}:g); syncGates(); renderWires(); }
  else if(d.mode==='note'){ const c=toCanvas(e.clientX,e.clientY); S.notes=S.notes.map(n=>n.id===d.id?{...n,x:Math.round(c.x-d.ox),y:Math.round(c.y-d.oy)}:n); syncGates(); }
  if(S.pending){ const c=toCanvas(e.clientX,e.clientY); S.pending.toPos=c; renderWires(); }
}
function mouseup(){ drag=null; }
function gateDown(e,id){
  if(e.shiftKey){ if(S.multiSelect.has(id))S.multiSelect.delete(id); else S.multiSelect.add(id); S.multiSelect=new Set(S.multiSelect); updateGateVisuals(); return; }
  S.selectedGateId=id; S.multiSelect=new Set();
  const g=S.gates.find(x=>x.id===id); const c=toCanvas(e.clientX,e.clientY);
  drag={mode:'gate',id,ox:c.x-g.x,oy:c.y-g.y};
  updateGateVisuals(); renderHud();
}
function portDown(e,id,kind,port){
  const gate=S.gates.find(x=>x.id===id); const def=getDef(gate.type);
  const p=portPos(def,kind,port); const pos={x:gate.x+p.x,y:gate.y+p.y};
  if(kind==='out'){ S.pending={from:{gate:id,port},fromPos:pos,toPos:pos}; renderWires(); renderHud(); }
  else if(S.pending){ S.wires=S.wires.filter(w=>!(w.to.gate===id&&w.to.port===port)); S.wires.push({id:uid('w'),from:S.pending.from,to:{gate:id,port}}); S.pending=null; renderWires(); renderHud(); }
}
function wireClick(e,id){
  e.stopPropagation();
  const w=S.wires.find(x=>x.id===id);
  if(e.shiftKey){ S.wires=S.wires.filter(x=>x.id!==id); S.highlight={wires:new Set(),gates:new Set()}; renderWires(); updateGateVisuals(); renderHud(); return; }
  if(S.highlight.wires.has(id)){ S.highlight={wires:new Set(),gates:new Set()}; } else { S.highlight=tracePath(w,S.wires); }
  renderWires(); updateGateVisuals(); renderHud();
}
function delGate(id){ S.gates=S.gates.filter(g=>g.id!==id); S.wires=S.wires.filter(w=>w.from.gate!==id&&w.to.gate!==id); S.selectedGateId=null; delete S.terms[id]; structuralRender(); }
function configure(id){
  const g=S.gates.find(x=>x.id===id); const def=getDef(g.type);
  if(def.render==='led'){ const c=prompt('LED color (name or hex):',g.state?.color||'green'); if(c){g.state={...g.state,color:c};} }
  else if(def.render==='text'){ const t=prompt('Display text:',g.state?.text||'TEXT'); if(t!==null){g.state={...g.state,text:t};} }
  else if(def.render==='recv'){ const n=parseInt(prompt('Target number (0-15):',String(g.state?.target??5)),10); if(!isNaN(n))g.state={...g.state,target:n}; }
  else if(def.render==='eeprom'){ const a=parseInt(prompt('Address (0-15):',String(g.state?.addr??0)),10); if(!isNaN(a))g.state={...g.state,addr:a}; }
  updateGateVisuals();
}
function activateKbd(id){ S.activeKeyboard=id; toast('Keyboard active — type to send codes (Esc to stop)'); renderHud(); }
function toggleGate(id){ const g=S.gates.find(x=>x.id===id); g.state={...g.state,on:g.state?.on?0:1}; updateGateVisuals(); }
function noteDown(e,id){ const n=S.notes.find(x=>x.id===id); const c=toCanvas(e.clientX,e.clientY); drag={mode:'note',id,ox:c.x-n.x,oy:c.y-n.y}; }
function delNote(id){ S.notes=S.notes.filter(n=>n.id!==id); syncGates(); }
function clearHighlight(){ S.highlight={wires:new Set(),gates:new Set()}; renderWires(); updateGateVisuals(); renderHud(); }

/* ---------- keyboard ---------- */
window.addEventListener('keydown',(e)=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if(e.key==='Escape'){ S.pending=null; S.activeKeyboard=null; S.selectedType=null; S.highlight={wires:new Set(),gates:new Set()}; renderWires(); updateGateVisuals(); renderHud(); renderPalette(); return; }
  if(S.activeKeyboard){ const g=S.gates.find(x=>x.id===S.activeKeyboard); if(g){ const code=e.key.length===1?e.key.charCodeAt(0):0; if(code){ g.state={...(S.states[g.id]||{}),code}; } } }
});
window.addEventListener('mousemove',mousemove); window.addEventListener('mouseup',mouseup);

/* ---------- canvas events ---------- */
function attachCanvas(){
  const c=$('canvas');
  c.onmousedown=canvasDown;
  c.onwheel=(e)=>{ e.preventDefault(); zoomAt(e, e.deltaY<0?1.1:0.9); };
  c.ondragover=(e)=>e.preventDefault();
  c.ondrop=(e)=>{ e.preventDefault(); const data=e.dataTransfer.getData('text/plain'); if(data&&data.startsWith('LIB:')){ const rec=loadLibrary().find(x=>x.id===data.slice(4)); if(rec) placeCircuit(rec,toCanvas(e.clientX,e.clientY)); } };
}
function zoomAt(e,dz){ const r=$('canvasWrap').getBoundingClientRect(); const cx=e.clientX-r.left,cy=e.clientY-r.top; const nz=Math.max(0.3,Math.min(3,S.zoom*dz)); S.pan={x:cx-(cx-S.pan.x)*(nz/S.zoom),y:cy-(cy-S.pan.y)*(nz/S.zoom)}; S.zoom=nz; syncGates(); renderWires(); renderMinimap(); renderHud(); }

/* ---------- toolbar ---------- */
function renderToolbar(){
  const t=$('toolbar');
  const ac=S.wires.filter(w=>wireActive(S.outputs,w)).length + Object.values(S.outputs).reduce((s,o)=>s+(o||[]).filter(Boolean).length,0);
  const btn=(label,fn,extra='')=>`<button class="btn ${extra}" onclick="${fn}">${label}</button>`;
  t.innerHTML =
    btn(S.running?'⏸ Pause':'▶ Run',`setRunning(${!S.running})`,S.running?'active':'')+
    btn('⏭ Step','stepOnce()')+'<div class="sep"></div>'+
    btn('🗑 Clear','onClear()')+'<div class="sep"></div>'+
    btn('💾 Save','onSave()')+btn('📂 Load','onLoad()')+'<div class="sep"></div>'+
    btn('⬆ Export','onExport()')+btn('⬇ Import','onImport()')+'<div class="sep"></div>'+
    btn('📋 Templates','showTemplates()')+btn('⬚ Group','onGroup()')+btn('📚 Library','showLibrary()')+btn('📝 Note','onNote()')+'<div class="sep"></div>'+
    btn('🚀 Publish','publishStandalone()')+
    `<div class="stats"><span>gates: <b>${S.gates.length}</b></span><span>active: <b style="color:#4ade80">${ac}</b></span></div>`;
}

/* ---------- palette ---------- */
function renderPalette(){
  const p=$('palette'); const pt=$('paletteToggle');
  if(!S.showPalette){ p.style.display='none'; pt.style.display='block'; return; }
  p.style.display='block'; pt.style.display='none';
  let html='<div class="cat-tabs">'+CATEGORIES.map(c=>`<div class="cat-tab ${S.activeCat===c?'active':''}" onclick="setCat('${c}')">${c}</div>`).join('')+'</div>';
  const list=Object.values(GATE_DEFS).filter(d=>d.category===S.activeCat);
  html+=list.map(d=>`<div class="gate-item ${S.selectedType===d.type?'sel':''}" onclick="pick('${d.type}')"><div class="swatch" style="background:${d.color}"></div>${d.label}</div>`).join('');
  if(S.activeCat==='Custom' && S.customGates.length){
    html+=S.customGates.map(c=>`<div class="gate-item ${S.selectedType==='CUSTOM:'+c.id?'sel':''}" onclick="pick('CUSTOM:${c.id}')">🧩 ${c.name}</div>`).join('');
  }
  if(S.activeCat==='Custom'){ html+=`<div class="gate-item" onclick="showLibrary()" style="border-color:#0891b2">📚 Open Library</div>`; }
  p.innerHTML=html;
}
function togglePalette(){ S.showPalette=!S.showPalette; renderPalette(); }
function setCat(c){ S.activeCat=c; renderPalette(); }
function pick(t){ S.selectedType=t; toast(t.startsWith('CUSTOM:')?'Custom selected':t.startsWith('LIB:')?'Library circuit selected':'Click canvas to place '+t); renderPalette(); renderHud(); }

/* ---------- save / load / export / import ---------- */
function project(){ return {gates:S.gates,wires:S.wires,notes:S.notes,customGates:S.customGates,v:2}; }
function onSave(){ localStorage.setItem('logic_lab_save',JSON.stringify(project())); toast('Saved to browser'); }
function onLoad(){ const s=localStorage.getItem('logic_lab_save'); if(!s){toast('No save found');return;} const d=JSON.parse(s); S.gates=d.gates||[];S.wires=d.wires||[];S.notes=d.notes||[];S.customGates=d.customGates||[]; structuralRender(); toast('Loaded save'); }
function onExport(){ const blob=new Blob([JSON.stringify(project(),null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='logic-circuit.json'; a.click(); toast('Exported JSON'); }
function onImport(){ const i=document.createElement('input'); i.type='file'; i.accept='.json'; i.onchange=(e)=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{ const d=JSON.parse(r.result); S.gates=d.gates||[];S.wires=d.wires||[];S.notes=d.notes||[];S.customGates=d.customGates||[]; structuralRender(); toast('Imported circuit'); }; r.readAsText(f); }; i.click(); }
function onClear(){ if(confirm('Clear the whole canvas?')){ S.gates=[];S.wires=[];S.notes=[];S.selectedGateId=null; structuralRender(); } }
function onNote(){ S.notes=[...S.notes,{id:uid('note'),x:Math.round(-S.pan.x/S.zoom+40),y:Math.round(-S.pan.y/S.zoom+40),text:''}]; syncGates(); }
function onGroup(){
  if(S.multiSelect.size<2){ toast('Shift-click 2+ gates to group'); return; }
  const sel=S.gates.filter(g=>S.multiSelect.has(g.id));
  const minX=Math.min(...sel.map(g=>g.x)), minY=Math.min(...sel.map(g=>g.y));
  const relG=sel.map(g=>({id:g.id,type:g.type,x:g.x-minX,y:g.y-minY,state:{}}));
  const relW=S.wires.filter(w=>S.multiSelect.has(w.from.gate)&&S.multiSelect.has(w.to.gate));
  const name=prompt('Name this component:','Custom '+(S.customGates.length+1)); if(!name)return;
  S.customGates=[...S.customGates,{id:uid('custom'),name,gates:relG,wires:relW}]; S.multiSelect=new Set(); toast('Saved component: '+name); renderPalette(); updateGateVisuals();
}

/* ---------- templates ---------- */
function showTemplates(){ openModal('<h2>Circuit Templates</h2>', TEMPLATES.map(t=>`<div class="tpl" onclick="applyTemplate('${t.name.replace(/'/g,"\\'")}')"><div class="n">${t.name}</div><div class="d">${t.desc}</div></div>`).join('')); }
function applyTemplate(name){ const t=TEMPLATES.find(x=>x.name===name); if(!t)return; const b=t.build(); S.gates=b.gates; S.wires=b.wires; S.notes=[]; S.pan={x:40,y:20}; S.zoom=1; closeModal(); structuralRender(); toast('Loaded: '+name); }

/* ---------- circuit library (localStorage) ---------- */
function loadLibrary(){ try{ return JSON.parse(localStorage.getItem('logic_library')||'[]'); }catch{ return []; } }
function saveLibrary(lib){ localStorage.setItem('logic_library',JSON.stringify(lib)); }
function showLibrary(){
  const lib=loadLibrary();
  const grouped={}; lib.forEach(r=>{ (grouped[r.category||'General']=grouped[r.category||'General']||[]).push(r); });
  let body=`<div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn" onclick="libSaveSel()">💾 Save selection</button><button class="btn" onclick="libSaveCanvas()">💾 Save whole canvas</button></div>`;
  if(!lib.length) body+=`<div style="color:#71717a;font-size:12px">No saved circuits yet. Build something and save it!</div>`;
  Object.keys(grouped).sort().forEach(cat=>{ body+=`<div class="lib-cat">${cat} · ${grouped[cat].length}</div>`; grouped[cat].forEach(r=>{ body+=`<div class="lib-item" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','LIB:${r.id}');event.dataTransfer.effectAllowed='copy'"><div class="n" onclick="libInsert('${r.id}')">${r.name}</div><div class="m">${(r.gates||[]).length}g · ${(r.wires||[]).length}w</div><button class="btn" onclick="event.stopPropagation();libDelete('${r.id}')" style="padding:2px 6px">🗑</button></div>`; }); });
  openModal('<h2>Circuit Library</h2>', body);
}
function buildCircuit(selGates, allWires, name, category){
  const minX=Math.min(...selGates.map(g=>g.x)), minY=Math.min(...selGates.map(g=>g.y));
  const ids=new Set(selGates.map(g=>g.id));
  const relG=selGates.map(g=>({id:g.id,type:g.type,x:g.x-minX,y:g.y-minY}));
  const relW=allWires.filter(w=>ids.has(w.from.gate)&&ids.has(w.to.gate)).map(w=>({from:w.from,to:w.to}));
  return {id:uid('lib'),name,category:category||'General',gates:relG,wires:relW};
}
function libSaveSel(){
  if(S.multiSelect.size<1){ toast('Shift-click gates to select first'); return; }
  const name=prompt('Circuit name:','My Circuit'); if(!name)return; const cat=prompt('Category:','General')||'General';
  const sel=S.gates.filter(g=>S.multiSelect.has(g.id));
  const lib=loadLibrary(); lib.push(buildCircuit(sel,S.wires,name,cat)); saveLibrary(lib); toast('Saved to library'); showLibrary();
}
function libSaveCanvas(){
  if(S.gates.length<1){ toast('Canvas is empty'); return; }
  const name=prompt('Circuit name:','Full Circuit'); if(!name)return; const cat=prompt('Category:','General')||'General';
  const lib=loadLibrary(); lib.push(buildCircuit(S.gates,S.wires,name,cat)); saveLibrary(lib); toast('Saved to library'); showLibrary();
}
function libDelete(id){ if(!confirm('Delete this circuit?'))return; saveLibrary(loadLibrary().filter(r=>r.id!==id)); showLibrary(); }
function libInsert(id){ const r=loadLibrary().find(x=>x.id===id); if(r){ S.selectedType='LIB:'+id; closeModal(); toast('Click canvas to place: '+r.name); renderHud(); } }

/* ---------- modal ---------- */
function openModal(head, body){ $('modalRoot').innerHTML=`<div class="modal-bg" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><div class="head">${head}<button class="btn" onclick="closeModal()">✕</button></div><div class="body">${body}</div></div></div>`; }
function closeModal(){ $('modalRoot').innerHTML=''; }

/* ---------- publish ---------- */
function publishStandalone(){ toast('Use 🚀 Publish to GitHub in the hosted app to deploy this site.'); onExport(); }

/* ---------- render orchestration ---------- */
function structuralRender(){ syncGates(); updateGateVisuals(); renderWires(); renderMinimap(); renderHud(); renderToolbar(); renderGateList(); }
function renderAll(){ renderToolbar(); renderPalette(); structuralRender(); }

/* ---------- init ---------- */
function init(){
  CMDS=termCommands();
  attachCanvas();
  renderToolbar(); renderPalette(); renderHud();
  const t=TEMPLATES.find(x=>x.name==='Simple AND Test'); if(t){ const b=t.build(); S.gates=b.gates; S.wires=b.wires; }
  structuralRender();
  setRunning(true);
}
init();
