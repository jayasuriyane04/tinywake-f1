import assert from 'node:assert/strict';
const base=process.env.TINYWake_TEST_URL||'http://localhost:3000';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Mutation tests are restricted to local environments.');
let passed=0;async function post(body){const r=await fetch(base+'/api/console',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
function check(value,message){assert.ok(value,message);passed++;console.log('PASS '+message)}
const initial=await (await fetch(base+'/api/console')).json();check(initial.devices.length>=4&&initial.sessionCount>=128,'persisted seed records load');
check((await post({action:'addDevice',name:'x'})).status===400,'invalid device name rejected');
const created=await post({action:'addDevice',name:'Integration Test Node'});check(created.status===201,'device creation persists');const id=created.data.id;
let current=await (await fetch(base+'/api/console')).json();let d=current.devices.find(d=>d.id===id);check(d?.online===1,'device is present on read-back');
check((await post({action:'saveConfig',deviceId:id,version:d.version,config:{...d.config,preRollMs:-1}})).status===400,'out-of-range config rejected');
check((await post({action:'saveConfig',deviceId:id,version:d.version,config:{...d.config,extra:'unexpected'}})).status===400,'unknown config fields rejected');
check((await post({action:'saveConfig',deviceId:id,version:d.version,config:{...d.config,wakeThreshold:.99}})).status===200,'valid config saved');
check((await post({action:'saveConfig',deviceId:id,version:d.version,config:d.config})).status===409,'stale config version rejected');
const key=crypto.randomUUID();check((await post({action:'simulate',deviceId:id,phrase:'Hey Loki',scenario:'lights',key})).status===422,'wake threshold governs scenarios');
await post({action:'saveConfig',deviceId:id,version:2,config:d.config});
check((await post({action:'simulate',deviceId:id,phrase:'Hey Lucky',scenario:'lights',key})).status===422,'wrong phrase rejected');
check((await post({action:'simulate',deviceId:id,phrase:'Loki',scenario:'lights',key})).status===422,'partial phrase rejected');
const good=await post({action:'simulate',deviceId:id,phrase:'Hey Loki',scenario:'lights',key});check(good.status===200&&good.data.source==='simulated','valid simulation is explicitly labeled');
check((await post({action:'simulate',deviceId:id,phrase:'Hey Loki',scenario:'lights',key})).data.id===good.data.id,'same request key reuses session');
check((await post({action:'simulate',deviceId:id,phrase:'Hey Loki',scenario:'timer',key})).status===409,'key cannot be reused for another scenario');
check((await post({action:'simulate',deviceId:id,phrase:'Hey Loki',scenario:'lights',key:crypto.randomUUID()})).status===429,'cooldown blocks rapid distinct activations');
await post({action:'setOnline',deviceId:id,online:false});check((await post({action:'simulate',deviceId:id,phrase:'Hey Loki',scenario:'lights',key:crypto.randomUUID()})).status===409,'offline device cannot start a new session');
check((await post({action:'simulate',deviceId:id,phrase:'Hey Loki',scenario:'lights',key})).status===200,'successful request remains idempotent after disconnect');
current=await (await fetch(base+'/api/console')).json();check(current.sessions.filter(s=>s.id===good.data.id).length===1,'only one session was stored');
const audio=await fetch(base+'/api/audio?deviceId='+id,{method:'POST',headers:{'Content-Type':'audio/wav'},body:new Uint8Array(44)});check(audio.status===503,'missing ASR does not invent transcript');
const cross=await fetch(base+'/api/console',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.example'},body:JSON.stringify({action:'addDevice',name:'Invalid cross origin'})});check(cross.status===403,'cross-origin mutation rejected');
check((await post({action:'addDevice',name:'large',padding:'x'.repeat(17000)})).status===413,'oversized declared request rejected');
console.log(JSON.stringify({passed,createdDevice:id,session:good.data.id}));
