-- Course audio and transcripts move out of the public static site into a private bucket.
-- Private bucket, no storage.objects policies for anon/authenticated: only the service role
-- (used by /api/course-media/sign after an active-course check) can read these objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-media',
  'course-media',
  false,
  52428800,
  array['audio/mpeg', 'application/json']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
