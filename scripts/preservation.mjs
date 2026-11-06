#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv } from './lib/csv.mjs';
import { table } from './lib/format.mjs';
import { page, table as htmlTable, writeOut } from './lib/render.mjs';

export const READS = {
 'collections': 'select code,title,owner from collections order by code',
 'accessions': 'select code,title,collection,owner,files,underprotected,readiness from v_accession_queue order by code',
 'attention': 'select * from v_attention order by code,finding',
 'fixity-due': "select code,name,location,outcome,checked_at from v_copy_health where current_pass is not true order by code,name,location",
 'copy-gaps': 'select code,name,copies,verified_locations,failures from v_file_health where verified_locations<2 order by code,name',
 'format-watch': "select code,name,extension,format_risk,format_action,format_review from v_file_health where format_risk<>'low' or format_review<current_date order by code,name",
 'rights-review': "select code,title,access,personal_data,purpose,review_on,rights_evidence from assets where review_on<current_date or rights_evidence='' or (personal_data and (purpose='' or access='public' or review_on is null)) order by code",
 'action-queue': "select x.code,a.code as asset,x.title,x.owner,x.due_on,x.status from actions x join assets a on a.id=x.asset_id where x.status='open' order by x.due_on,x.code",
 'storage': 'select * from v_storage order by location',
 'compliance': 'select code,rule,finding from v_compliance order by code,rule,finding',
 'owner-load': "select owner,count(*)::int as findings from v_attention group by owner order by findings desc,owner",
 'duplicate-content': "select sha256,count(*)::int as files,string_agg(a.code||':'||f.name,', ' order by a.code,f.name) as occurrences from files f join assets a on a.id=f.asset_id group by sha256 having count(*)>1 order by sha256",
 'activity': 'select sequence,action,actor,detail,created_at from events order by sequence desc limit 40',
};
export const COMMANDS = [...Object.keys(READS),'help','asset','files','weekly-review','collection-add','add','set','ingest','replicate','fixity','format-set','action-add','action-close','access-review','log','import','export','draft-accession','draft-transfer'];
const TABLES = ['collections','assets','files','copies','checks','formats','actions','access_reviews','events'];
const nonblank = (v,key) => { if(typeof v!=='string'||!v.trim()) throw Error(`--${key} is required`); return v.trim(); };
const date = (v,key) => { const s=nonblank(v,key); if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s) throw Error(`--${key} must be a real YYYY-MM-DD date`); return s; };
const choice = (v,key,allowed) => { if(!allowed.includes(v)) throw Error(`--${key} must be ${allowed.join('|')}`); return v; };
export function parseArgs(args) {
 const opts={}, positional=[];
 for(let i=0;i<args.length;i++) {
  const a=args[i]; if(!a.startsWith('--')) {positional.push(a);continue;}
  const eq=a.indexOf('='); const key=a.slice(2,eq<0?undefined:eq);
  let value=eq>=0?a.slice(eq+1):['json','dry-run','update','help'].includes(key)?true:args[++i];
  if(['json','dry-run','update','help'].includes(key)&&typeof value==='string'){if(!['true','false'].includes(value))throw Error(`--${key} must be true or false`);value=value==='true';}
  if(key in opts) throw Error(`Duplicate --${key}`); opts[key]=value;
 }
 return {command:positional[0]||'help', positional:positional.slice(1),opts};
}
export async function digest(file) {
 const st=await fsp.stat(file); if(!st.isFile()) throw Error('Content must be a regular file');
 const h=createHash('sha256');let bytes=0;
 for await(const chunk of fs.createReadStream(file)) {h.update(chunk);bytes+=chunk.length;}
 return {sha256:h.digest('hex'),bytes};
}
async function resolve(db,tableName,ref,column='title') {
 nonblank(ref,'ref');
 const rows=await db.query(`select * from ${tableName} where id::text=$1 or ${column} ilike $1${['assets','collections','actions'].includes(tableName)?' or code ilike $1':''} order by id`,[ref]);
 if(rows.length===1)return rows[0];
 const candidates=rows.length?rows:await db.query(`select * from ${tableName} where id::text ilike $1 or ${column} ilike $2 order by id`,[ref+'%', '%'+ref+'%']);
 if(candidates.length!==1)throw Error(candidates.length?`Ambiguous reference: ${candidates.map(x=>`${x.id} ${x.code||''} ${x[column]}`).join('; ')}`:`No ${tableName} match for ${ref}`);
 return candidates[0];
}
export async function run(db,command,opts={},positional=[]) {
 if(!COMMANDS.includes(command))throw Error(`Unknown command: ${command}`);
 const allowed=new Set(['json','help','actor','ref','code','title','owner','collection','description','donor','purpose','rights','review-on','field','value','file','file-id','location','to','extension','risk','action','evidence','due','decision','next-review','note','dry-run','update','out','map']);
 for(const key of Object.keys(opts))if(!allowed.has(key))throw Error(`Unknown option: --${key}`);
 if(command==='help')return COMMANDS.map(command=>({command}));
 if(READS[command])return db.query(READS[command]);
 if(command==='weekly-review')return {accessions:await run(db,'accessions'),attention:await run(db,'attention'),storage:await run(db,'storage')};
 if(command==='asset') {
  const a=await resolve(db,'assets',opts.ref);return {asset:a,files:await db.query('select * from v_file_health where asset_id=$1 order by name',[a.id]),actions:await db.query('select * from actions where asset_id=$1 order by due_on',[a.id]),history:await db.query('select * from events where asset_id=$1 order by sequence',[a.id])};
 }
 if(command==='files') {
  if(!opts.ref)return db.query('select id,code,name,bytes,verified_locations,format_risk from v_file_health order by code,name');
  const a=await resolve(db,'assets',opts.ref); return db.query('select * from v_file_health where asset_id=$1 order by name',[a.id]);
 }
 if(command.startsWith('draft-')) {
  const a=await resolve(db,'assets',opts.ref);const parts=await run(db,'asset',{ref:a.id});
  const target=writeOut('drafts',`${command}-${a.id}-${randomUUID()}`,page({title:command==='draft-accession'?'DRAFT accession receipt':'DRAFT transfer checklist',subtitle:a.title,sections:[
   {title:'Review before use',note:'Private draft. This is not a transfer of files, an access approval or a certification.',html:htmlTable([{code:a.code,title:a.title,donor:a.donor,rights_evidence:a.rights_evidence,access:a.access}])},
   {title:'Content and copies',html:htmlTable(parts.files,['name','bytes','copies','verified_locations','failures','format_risk'])},
   {title:'Outstanding actions',html:htmlTable(parts.actions,['code','title','owner','due_on','status','evidence'])}
  ]})); return {file:target,status:'draft'};
 }
 if(command==='export') {
  const out=path.resolve(opts.out||path.join(process.env.OUTPUT_DIR||REPO_ROOT,'exports',randomUUID()));
  await fsp.mkdir(out,{recursive:true,mode:0o700});const file=path.join(out,'preservation.json');
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {const snapshot={version:1,exported_at:new Date().toISOString(),content_included:false,tables:{}};for(const t of TABLES)snapshot.tables[t]=await db.query(`select * from ${t} order by id`);
   await fsp.writeFile(file,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx',mode:0o600});return {file,assets:snapshot.tables.assets.length,content_included:false};
  } finally {await db.exec('ROLLBACK');}
 }
 const actor=nonblank(opts.actor,'actor');
 const written=[];
 const event=async(asset,action,detail)=>db.query('insert into events(asset_id,action,actor,detail) values($1,$2,$3,$4)',[asset,action,actor,JSON.stringify(detail)]);
 await db.exec('BEGIN');
 try {
  // Serialize mutations, including copy writes, for consistent receipts and check history.
  await db.exec('LOCK TABLE assets IN SHARE ROW EXCLUSIVE MODE');
  let result;
  if(command==='collection-add') {
   const [c]=await db.query('insert into collections(code,title,owner) values($1,$2,$3) returning *',[nonblank(opts.code,'code'),nonblank(opts.title,'title'),nonblank(opts.owner,'owner')]);
   await event(null,command,c);result=c;
  } else if(command==='add') {
   const c=await resolve(db,'collections',opts.collection);
   const [a]=await db.query('insert into assets(collection_id,code,title,description,owner,donor,purpose,rights_evidence,review_on) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',[c.id,nonblank(opts.code,'code'),nonblank(opts.title,'title'),opts.description||'',nonblank(opts.owner,'owner'),opts.donor||'',opts.purpose||'',opts.rights||'',opts['review-on']?date(opts['review-on'],'review-on'):null]);
   await event(a.id,command,a); result=a;
  } else if(command==='set') {
   const a=await resolve(db,'assets',opts.ref);
   const fields={title:'title',description:'description',owner:'owner',donor:'donor',purpose:'purpose',rights:'rights_evidence','review-on':'review_on','personal-data':'personal_data'};
   const field=fields[opts.field];if(!field)throw Error('Allowed fields: '+Object.keys(fields).join(', '));
   let value=nonblank(opts.value,'value');if(field==='review_on')value=date(value,'value');if(field==='personal_data')value=choice(value,'value',['true','false'])==='true';
   const [changed]=await db.query(`update assets set ${field}=$1 where id=$2 returning *`,[value,a.id]);
   await event(a.id,command,{field,before:a[field],after:changed[field]});result=changed;
  } else if(command==='ingest') {
   const a=await resolve(db,'assets',opts.ref);const source=path.resolve(nonblank(opts.file,'file'));const location=nonblank(opts.location,'location');
   const name=path.basename(source);const root=path.resolve(process.env.VAULT_DIR||path.join(REPO_ROOT,'.data','objects'));
   const id=randomUUID(),dir=path.join(root,id),destination=path.join(dir,name);
   await fsp.mkdir(dir,{recursive:true,mode:0o700});
   await fsp.copyFile(source,destination,fs.constants.COPYFILE_EXCL);written.push(destination);await fsp.chmod(destination,0o600);
   const hash=await digest(destination);const original=await digest(source);if(hash.sha256!==original.sha256)throw Error('Source changed during ingest; no record saved');
   await db.query('insert into files(id,asset_id,name,extension,sha256,bytes) values($1,$2,$3,$4,$5,$6)',[id,a.id,name,path.extname(name).toLowerCase(),hash.sha256,hash.bytes]);
   const [copy]=await db.query('insert into copies(file_id,location,path) values($1,$2,$3) returning id',[id,location,destination]);
   await db.query("insert into checks(copy_id,outcome,actual_sha256,actor) values($1,'pass',$2,$3)",[copy.id,hash.sha256,actor]);
   await event(a.id,command,{file_id:id,name,...hash,location});result={id,asset:a.code,name,...hash};
  } else if(command==='replicate') {
   const f=await resolve(db,'files',opts['file-id'],'name');const location=nonblank(opts.location,'location');
   const candidates=await db.query('select * from copies where file_id=$1 order by created_at,id',[f.id]);let source;
   for(const c of candidates) {try {if((await digest(c.path)).sha256===f.sha256){source=c.path;break;}}catch {}}
   if(!source)throw Error('No intact source copy found; replication refused');
   const dir=path.resolve(nonblank(opts.to,'to'));await fsp.mkdir(dir,{recursive:true,mode:0o700});
   const destination=path.join(dir,`${randomUUID()}-${f.name}`);await fsp.copyFile(source,destination,fs.constants.COPYFILE_EXCL);written.push(destination);await fsp.chmod(destination,0o600);
   const hash=await digest(destination);if(hash.sha256!==f.sha256)throw Error('Copied bytes differ from baseline');
   const [copy]=await db.query('insert into copies(file_id,location,path) values($1,$2,$3) returning *',[f.id,location,destination]);
   await db.query("insert into checks(copy_id,outcome,actual_sha256,actor) values($1,'pass',$2,$3)",[copy.id,hash.sha256,actor]);
   await event(f.asset_id,command,{file_id:f.id,location,path:destination});result=copy;
  } else if(command==='fixity') {
   const a=opts.ref?await resolve(db,'assets',opts.ref):null;
   const copies=await db.query('select * from v_copy_health'+(a?' where asset_id=$1':'')+' order by code,name,location',a?[a.id]:[]);
   result=[];
   for(const c of copies) {
    let actual=null,outcome,detail='';
    try {const h=await digest(c.path);actual=h.sha256;outcome=actual===c.sha256&&h.bytes===Number(c.bytes)?'pass':'mismatch';}
    catch(e) {outcome=e.code==='ENOENT'?'missing':'error';detail=String(e.message);}
    await db.query('insert into checks(copy_id,outcome,actual_sha256,detail,actor) values($1,$2,$3,$4,$5)',[c.id,outcome,actual,detail,actor]);
    await event(c.asset_id,command,{file_id:c.file_id,location:c.location,outcome});result.push({code:c.code,file:c.name,location:c.location,outcome});
   }
  } else if(command==='format-set') {
   const [f]=await db.query('insert into formats(extension,risk,action,review_on,evidence) values($1,$2,$3,$4,$5) on conflict(extension) do update set risk=excluded.risk,action=excluded.action,review_on=excluded.review_on,evidence=excluded.evidence returning *',[nonblank(opts.extension,'extension').toLowerCase(),choice(opts.risk,'risk',['low','watch','obsolete']),nonblank(opts.action,'action'),date(opts['review-on'],'review-on'),nonblank(opts.evidence,'evidence')]);
   await event(null,command,f);result=f;
  } else if(command==='action-add') {
   const a=await resolve(db,'assets',opts.ref);const [x]=await db.query('insert into actions(code,asset_id,title,owner,due_on) values($1,$2,$3,$4,$5) returning *',[nonblank(opts.code,'code'),a.id,nonblank(opts.title,'title'),nonblank(opts.owner,'owner'),date(opts.due,'due')]);await event(a.id,command,x);result=x;
  } else if(command==='action-close') {
   const x=await resolve(db,'actions',opts.ref);if(x.status==='closed')throw Error('Action already closed');
   const [done]=await db.query("update actions set status='closed',evidence=$1 where id=$2 returning *",[nonblank(opts.evidence,'evidence'),x.id]);await event(x.asset_id,command,done);result=done;
  } else if(command==='access-review') {
   const a=await resolve(db,'assets',opts.ref);const decision=choice(opts.decision,'decision',['restricted','internal','public']);
   const next=date(opts['next-review'],'next-review');if(next<=new Date().toISOString().slice(0,10))throw Error('Next review must be in the future');
   const evidence=nonblank(opts.evidence,'evidence');
   const [review]=await db.query('insert into access_reviews(asset_id,decision,evidence,actor,next_review) values($1,$2,$3,$4,$5) returning *',[a.id,decision,evidence,actor,next]);
   await db.query('update assets set access=$1,review_on=$2 where id=$3',[decision,next,a.id]);await event(a.id,command,{before:a.access,...review});result=review;
  } else if(command==='log') {
   const a=await resolve(db,'assets',opts.ref);await event(a.id,'note',{note:nonblank(opts.note,'note')});result={asset:a.code,logged:true};
  } else if(command==='import') {
   if(positional[0]!=='preservica')throw Error('Use import preservica');
   const c=await resolve(db,'collections',opts.collection);
   const rows=parseCsv(await fsp.readFile(nonblank(opts.file,'file'),'utf8'));if(!rows.length)throw Error('Empty import');
   const mapping=opts.map?JSON.parse(await fsp.readFile(opts.map,'utf8')):{};
   const keys={ref:'xip.reference',title:'xip.title',description:'xip.description',type:'xip.document_type',parent:'xip.parent_ref',security:'xip.security_descriptor',...mapping};
   for(const key of Object.keys(mapping))if(!['ref','title','description','type','parent','security'].includes(key))throw Error('Unknown mapping field: '+key);
   const seen=new Set();let inserted=0,unchanged=0,updated=0,folders=0;
   for(const row of rows) {
    for(const key of ['ref','title','type'])if(!(keys[key] in row))throw Error('Missing export column: '+keys[key]);
    const ref=nonblank(row[keys.ref],'export reference'),title=nonblank(row[keys.title],'export title');
    if(seen.has(ref))throw Error('Duplicate export reference: '+ref);seen.add(ref);
    const kind=row[keys.type].trim();if(!['IO','SO'].includes(kind))throw Error('Unsupported export entity type: '+kind);
    if(kind==='SO'){folders++;continue;}
    const description=row[keys.description]||'',parent=row[keys.parent]||'',security=row[keys.security]||'';
    const source=JSON.stringify(row);
    const [old]=await db.query('select * from assets where source_ref=$1',[ref]);
    if(old) {
     const same=Object.keys(row).length===Object.keys(old.source_data).length&&Object.entries(row).every(([k,v])=>old.source_data[k]===v);
     if(same){unchanged++;continue;}if(!opts.update)throw Error('Changed source row requires --update: '+ref);
     await db.query('update assets set title=$1,description=$2,parent_ref=$3,source_security=$4,source_data=$5 where id=$6',[title,description,parent,security,source,old.id]);
     if(old.source_security!==security)await db.query("update assets set access='restricted',review_on=current_date where id=$1",[old.id]);
     await event(old.id,'import-update',{before:old.source_data,after:row});updated++;
    } else {
     const [a]=await db.query('insert into assets(collection_id,code,title,description,source_ref,parent_ref,source_security,source_data) values($1,$2,$3,$4,$5,$6,$7,$8) returning id',[c.id,'PV-'+ref,title,description,ref,parent,security,source]);
     await event(a.id,'import-create',{ref});inserted++;
    }
   }
   result={inserted,updated,unchanged,folder_rows:folders,rows:rows.length,dry_run:Boolean(opts['dry-run']),content_imported:false};
   await event(null,'import-batch',{...result,source_rows:rows,source_file:path.basename(opts.file)});
  } else throw Error('Command not implemented: '+command);
  await db.exec(opts['dry-run']?'ROLLBACK':'COMMIT');
  if(opts['dry-run'])for(const f of written)await fsp.unlink(f);
  return result;
 } catch(e) {
  await db.exec('ROLLBACK');for(const f of written)await fsp.unlink(f).catch(()=>{});throw e;
 }
}
export function render(result) {
 if(Array.isArray(result)) {
  const rows=result.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='object'&&v!==null?JSON.stringify(v):v])));
  return table(rows,rows.length?Object.keys(rows[0]).map(key=>({key,label:key,width:70})):[]);
 }
 if(result&&typeof result==='object')return Object.entries(result).map(([key,value])=>Array.isArray(value)?`${key}\n${render(value)}`:`${key}: ${typeof value==='object'?JSON.stringify(value):value}`).join('\n');
 return String(result);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 let db;
 try {const {command,opts,positional}=parseArgs(process.argv.slice(2));db=await getDb();const result=await run(db,opts.help?'help':command,opts,positional);console.log(opts.json?JSON.stringify(result,null,2):render(result));}
 catch(e){console.error(e.message);process.exitCode=1;}finally {await db?.close();}
}
