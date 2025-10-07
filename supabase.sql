-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.deleted_products (
  id uuid NOT NULL,
  name text NOT NULL,
  description text,
  purchase_price numeric,
  currency text,
  quantity integer,
  status text,
  image_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  added_by uuid,
  estimated_selling_price numeric,
  last_modified_by uuid,
  selling_price numeric,
  deleted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deleted_products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exchange_rates (
  id integer NOT NULL DEFAULT nextval('exchange_rates_id_seq'::regclass),
  base_currency text NOT NULL,
  rates jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exchange_rates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  previous_status text,
  new_status text,
  quantity integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  field_changed text,
  old_value jsonb,
  new_value jsonb,
  CONSTRAINT movements_pkey PRIMARY KEY (id),
  CONSTRAINT movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  purchase_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'MGA'::text,
  quantity integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'stock'::text,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  added_by uuid,
  estimated_selling_price numeric,
  last_modified_by uuid,
  selling_price numeric,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.profiles(id),
  CONSTRAINT products_last_modified_by_fkey FOREIGN KEY (last_modified_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  default_currency text NOT NULL DEFAULT 'MGA'::text,
  exchange_rates jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id),
  CONSTRAINT settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);