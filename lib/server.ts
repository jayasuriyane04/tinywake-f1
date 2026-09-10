import { env } from 'cloudflare:workers';
import { defaultConfig,scenarios } from './contracts';
export function database(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export function runtime(){return env as unknown as {ASR_URL?:string;ASR_TOKEN?:string};}
export async function seed(){const db=database();if(await db.prepare('SELECT value FROM settings WHERE key = ?').bind('seed_v1').first())return;
 const now=Date.now(),batch=[];
 for(let i=0;i<4;i++)batch.push(db.prepare('INSERT OR IGNORE INTO devices (id,name,online,rssi,config,version,created_at) VALUES (?,?,?,?,?,?,?)').bind(`tinywake-00${i+1}`,['Living Room Node','Studio Node','Bedroom Node','Workshop Node'][i],i===3?0:1,[-46,-52,-61,null][i],JSON.stringify(defaultConfig),1,now));
 for(let i=0;i<128;i++){const s=scenarios[i%4],age=((127-i)/128)**.68*23.8*3600000;batch.push(db.prepare('INSERT OR IGNORE INTO sessions (id,device_id,text,source,latency,confidence,duration,bytes,created_at,scenario) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(`sample-${i}`,`tinywake-00${i%3+1}`,s.text,'simulated',s.latency+(i%7-3)*7,s.confidence,s.duration,Math.round(s.duration*32000),now-age,s.id));}
 batch.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind('seed_v1',String(now)));
 batch.push(db.prepare('INSERT OR IGNORE INTO events (id,type,device_id,detail,created_at) VALUES (?,?,?,?,?)').bind('seed-event','WORKSPACE_READY',null,'Simulator initialized with 4 devices and 128 labeled sample sessions.',now));await db.batch(batch);
}
export async function logEvent(type:string,deviceId:string|null,detail:string){try{await database().prepare('INSERT INTO events (id,type,device_id,detail,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),type,deviceId,detail,Date.now()).run();}catch{console.error('EVENT_LOG_WRITE_FAILED');}}
export async function readJson(request:Request){const reader=request.body?.getReader();if(!reader)throw new Error('Missing JSON body');const chunks:Uint8Array[]=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();throw new Error('Request body exceeds 16 KB')}chunks.push(value)}const buffer=new Uint8Array(size);let at=0;for(const chunk of chunks){buffer.set(chunk,at);at+=chunk.length}return JSON.parse(new TextDecoder().decode(buffer)) as Record<string,unknown>;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
export function apiError(message:string,status=400){return Response.json({error:message},{status});}
