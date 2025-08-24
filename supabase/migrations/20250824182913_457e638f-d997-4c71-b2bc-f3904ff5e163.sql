-- Grant admin role to user with full name 'Sovan Bhakta'
INSERT INTO public.user_roles (user_id, role)
SELECT '2b5d505d-b58f-4460-b5d8-ce2cd3146809'::uuid, 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '2b5d505d-b58f-4460-b5d8-ce2cd3146809'::uuid AND role = 'admin'::app_role
);
