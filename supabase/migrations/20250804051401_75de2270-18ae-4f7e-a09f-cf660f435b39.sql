-- Grant admin role to the current user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('2b5d505d-b58f-4460-b5d8-ce2cd3146809', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;