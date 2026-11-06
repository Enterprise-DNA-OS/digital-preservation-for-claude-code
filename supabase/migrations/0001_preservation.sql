create table collections (
 id uuid primary key default gen_random_uuid(), code text unique not null check(code ~ '^[A-Za-z0-9_-]+$'),
 title text not null check(length(trim(title))>0), owner text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table assets (
 id uuid primary key default gen_random_uuid(), collection_id uuid not null references collections(id),
 code text unique not null check(length(trim(code))>0), title text not null check(length(trim(title))>0),
 description text not null default '', owner text not null default '', donor text not null default '',
 source_ref text unique, parent_ref text not null default '', source_security text not null default '', source_data jsonb not null default '{}',
 access text not null default 'restricted' check(access in ('restricted','internal','public')),
 personal_data boolean not null default false, purpose text not null default '', review_on date,
 rights_evidence text not null default '', accession_on date not null default current_date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table files (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id),
 name text not null check(length(trim(name))>0), extension text not null,
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'), bytes bigint not null check(bytes>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(asset_id,name)
);
create table copies (
 id uuid primary key default gen_random_uuid(), file_id uuid not null references files(id),
 location text not null check(length(trim(location))>0), path text not null unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(file_id,location)
);
create table checks (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity unique,
 copy_id uuid not null references copies(id), outcome text not null check(outcome in ('pass','mismatch','missing','error')),
 actual_sha256 text, detail text not null default '', actor text not null check(length(trim(actor))>0),
 checked_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table formats (
 id uuid primary key default gen_random_uuid(), extension text not null unique check(extension ~ '^\.[a-z0-9]+$'),
 risk text not null check(risk in ('low','watch','obsolete')), action text not null, review_on date not null,
 evidence text not null check(length(trim(evidence))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique, asset_id uuid not null references assets(id),
 title text not null check(length(trim(title))>0), owner text not null check(length(trim(owner))>0), due_on date not null,
 status text not null default 'open' check(status in ('open','closed')), evidence text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(status<>'closed' or length(trim(evidence))>0)
);
create table access_reviews (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id),
 decision text not null check(decision in ('restricted','internal','public')), evidence text not null check(length(trim(evidence))>0),
 actor text not null check(length(trim(actor))>0), next_review date not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table events (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity unique,
 asset_id uuid references assets(id), action text not null, actor text not null check(length(trim(actor))>0),
 detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index files_asset on files(asset_id); create index copies_file on copies(file_id);
create index checks_copy on checks(copy_id,sequence desc); create index events_asset on events(asset_id,sequence desc);
create index actions_asset on actions(asset_id); create index reviews_asset on access_reviews(asset_id);
create function touch_updated() returns trigger language plpgsql as $$begin new.updated_at=clock_timestamp();return new;end$$;
do $$declare t text;begin foreach t in array array['collections','assets','files','copies','checks','formats','actions','access_reviews','events'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t); execute format('revoke all on %I from public',t);
end loop;end$$;
create view v_latest_checks with(security_invoker=true) as select distinct on(copy_id) * from checks order by copy_id,sequence desc;
create view v_copy_health with(security_invoker=true) as
 select c.id,c.file_id,a.id as asset_id,a.code,a.title,f.name,c.location,c.path,f.sha256,f.bytes,
 coalesce(k.outcome,'unchecked') as outcome,k.checked_at,
 (k.outcome='pass' and k.checked_at>=now()-interval '30 days') as current_pass
 from copies c join files f on f.id=c.file_id join assets a on a.id=f.asset_id left join v_latest_checks k on k.copy_id=c.id;
create view v_file_health with(security_invoker=true) as
 select f.id,f.asset_id,a.code,f.name,f.extension,f.bytes,count(c.id)::int as copies,
 count(c.id) filter(where c.current_pass)::int as verified_locations,
 count(c.id) filter(where c.outcome in ('mismatch','missing','error'))::int as failures,
 coalesce(p.risk,'unassessed') as format_risk,p.action as format_action,p.review_on as format_review
 from files f join assets a on a.id=f.asset_id left join v_copy_health c on c.file_id=f.id left join formats p on p.extension=f.extension
 group by f.id,a.code,p.risk,p.action,p.review_on;
create view v_accession_queue with(security_invoker=true) as
 select a.id,a.code,a.title,c.title as collection,a.owner,a.access,a.accession_on,
 count(f.id)::int as files,coalesce(sum(f.bytes),0)::bigint as bytes,
 count(f.id) filter(where f.verified_locations<2)::int as underprotected,
 count(f.id) filter(where f.failures>0)::int as damaged,
 case when count(f.id)=0 then 'content_missing' when count(f.id) filter(where f.verified_locations<2)>0 then 'copies_need_work' else 'checked' end as readiness
 from assets a join collections c on c.id=a.collection_id left join v_file_health f on f.asset_id=a.id group by a.id,c.title;
create view v_compliance with(security_invoker=true) as
 select id as asset_id,code,'PRIVACY-5'::text as rule,'Personal record marked public: review authority'::text as finding from assets where personal_data and access='public'
 union all select id,code,'PRIVACY-9','Personal record has no retention purpose or review date' from assets where personal_data and (trim(purpose)='' or review_on is null)
 union all select id,code,'REVIEW-POLICY','Access or retention review overdue' from assets where review_on<current_date
 union all select id,code,'RIGHTS-POLICY','No rights or custody evidence recorded' from assets where trim(rights_evidence)=''
 union all select asset_id,code,'NDSA-COPIES','File lacks two recently verified location labels: '||name from v_file_health where verified_locations<2
 union all select asset_id,code,'NDSA-FIXITY','File has a failed copy check: '||name from v_file_health where failures>0
 union all select asset_id,code,'FORMAT-POLICY','Format needs assessment: '||name from v_file_health where format_risk in ('unassessed','watch','obsolete') or format_review<current_date;
create view v_attention with(security_invoker=true) as
 select a.code,a.title,a.owner,'Missing content'::text as finding from assets a where not exists(select 1 from files f where f.asset_id=a.id)
 union all select a.code,a.title,a.owner,v.finding from v_compliance v join assets a on a.id=v.asset_id
 union all select a.code,a.title,x.owner,'Overdue action: '||x.title from actions x join assets a on a.id=x.asset_id where x.status='open' and x.due_on<current_date;
create view v_storage with(security_invoker=true) as
 select location,count(*)::int as copies,sum(bytes)::bigint as bytes,count(*) filter(where current_pass)::int as current_passes,
 count(*) filter(where outcome in ('missing','mismatch','error'))::int as failures from v_copy_health group by location;
