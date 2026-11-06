#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { run } from './preservation.mjs';
export async function seed(db) {
 if(db.mode==='postgres'&&process.env.ALLOW_DEMO_DATABASE!=='1')throw Error('Seeding PostgreSQL requires ALLOW_DEMO_DATABASE=1 on an empty disposable database');
 await db.exec('BEGIN');
 try {await db.exec(readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
 const existing=await db.query("select id from files where asset_id='20000000-0000-4000-8000-000000000001'");
 if(!existing.length) {
  const f=await run(db,'ingest',{ref:'KH-001',file:path.join(REPO_ROOT,'fixtures/minutes.txt'),location:'demo-primary',actor:'Demo seed'});
  await run(db,'replicate',{'file-id':f.id,to:path.join(process.env.VAULT_DIR||path.join(REPO_ROOT,'.data/objects'),'demo-secondary'),location:'demo-secondary',actor:'Demo seed'});
 }
 const old=await db.query("select id from files where asset_id='20000000-0000-4000-8000-000000000002'");
 if(!old.length) {
  const f=await run(db,'ingest',{ref:'KH-002',file:path.join(REPO_ROOT,'fixtures/consent.wri'),location:'demo-primary',actor:'Demo seed'});
  const c=await run(db,'replicate',{'file-id':f.id,to:path.join(process.env.VAULT_DIR||path.join(REPO_ROOT,'.data/objects'),'demo-secondary'),location:'demo-secondary',actor:'Demo seed'});
  // Deliberate damage in a generated DEMO copy; no original fixture is modified.
  writeFileSync(c.path,'Deliberately changed demo copy.\n');
  await run(db,'fixity',{ref:'KH-002',actor:'Demo seed'});
  await db.query("update checks set checked_at=now()-interval '40 days' where copy_id in(select id from copies where file_id=$1 and location='demo-primary')",[f.id]);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 const db=await getDb();try {await seed(db);console.log(`seed: fictional demo ready (${db.mode}); includes one damaged demo copy`);}finally {await db.close();}
}
