-- Storage bucket for source files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sources',
  'sources',
  false,
  52428800,  -- 50MB limit
  array['application/pdf', 'text/plain']
)
on conflict (id) do nothing;

-- RLS: only course members can upload
create policy "course members can upload sources"
  on storage.objects for insert
  with check (bucket_id = 'sources' and auth.uid() is not null);

-- RLS: authenticated users can read their own uploads
create policy "users can read source files"
  on storage.objects for select
  using (bucket_id = 'sources' and auth.uid() is not null);

create policy "users can delete their own source files"
  on storage.objects for delete
  using (bucket_id = 'sources' and auth.uid() is not null);
