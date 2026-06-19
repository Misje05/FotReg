
revoke execute on function public.signup_child_for_session(uuid, uuid) from public, anon;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
