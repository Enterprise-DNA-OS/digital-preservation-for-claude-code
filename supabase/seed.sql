insert into collections(id,code,title,owner) values ('10000000-0000-4000-8000-000000000001','DEMO','Kauri Heritage Trust demo','Mara') on conflict do nothing;
insert into assets(id,collection_id,code,title,description,owner,donor,access,personal_data,purpose,review_on,rights_evidence,accession_on) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','KH-001','Harbour committee minutes','Fictional public meeting record','Mara','Harbour committee','internal',false,'Community archive',current_date+60,'DEED-001',current_date-40),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','KH-002','Oral history consent','Fictional personal record awaiting purpose review','Rangi','Demo donor','public',true,'',current_date-7,'',current_date-35),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','KH-003','Community newsletter','Metadata arrived before its content','Mara','Demo donor','restricted',false,'Archive',current_date+20,'DEED-003',current_date-12)
on conflict do nothing;
insert into formats(extension,risk,action,review_on,evidence) values
 ('.txt','low','Retain original and check readability annually',current_date+180,'Demo policy, not format identification'),
 ('.wri','obsolete','Review a conversion route and retain the original',current_date-1,'Fictional local preservation policy') on conflict do nothing;
insert into actions(code,asset_id,title,owner,due_on) values
 ('ACT-001','20000000-0000-4000-8000-000000000002','Confirm donor restrictions','Rangi',current_date-5),
 ('ACT-002','20000000-0000-4000-8000-000000000003','Request original newsletter files','Mara',current_date+2) on conflict do nothing;
