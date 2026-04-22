
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ACCOUNT STATUS ============
CREATE TYPE public.account_state AS ENUM ('active', 'locked', 'blacklisted');
CREATE TYPE public.kyc_state AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');

CREATE TABLE public.account_status (
  user_id uuid PRIMARY KEY,
  status account_state NOT NULL DEFAULT 'active',
  kyc_status kyc_state NOT NULL DEFAULT 'not_submitted',
  failed_kyc_attempts int NOT NULL DEFAULT 0,
  blacklist_reason text,
  locked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own status" ON public.account_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all status" ON public.account_status FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update status" ON public.account_status FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own status" ON public.account_status FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_account_status_updated BEFORE UPDATE ON public.account_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ KYC ============
CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  doc_type text NOT NULL,
  id_doc_path text NOT NULL,
  proof_of_funds_path text NOT NULL,
  status kyc_state NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own kyc" ON public.kyc_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own kyc" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all kyc" ON public.kyc_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update kyc" ON public.kyc_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============ WITHDRAWALS ============
CREATE TYPE public.withdrawal_state AS ENUM ('pending', 'approved', 'rejected', 'completed');

CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vault_id text,
  amount numeric NOT NULL CHECK (amount > 0),
  destination text NOT NULL,
  status withdrawal_state NOT NULL DEFAULT 'pending',
  admin_notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completes_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  processed_at timestamptz
);
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all withdrawals" ON public.withdrawal_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update withdrawals" ON public.withdrawal_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============ DEPOSITS ============
CREATE TYPE public.deposit_state AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.payment_method AS ENUM ('crypto', 'card');

CREATE TABLE public.deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method payment_method NOT NULL,
  currency text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  wallet_address text,
  tx_hash text,
  proof_path text,
  status deposit_state NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own deposits" ON public.deposit_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own deposits" ON public.deposit_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all deposits" ON public.deposit_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update deposits" ON public.deposit_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============ GIFT CARDS ============
CREATE TYPE public.gift_card_state AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.gift_card_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand text NOT NULL,
  card_value numeric NOT NULL CHECK (card_value > 0),
  card_code text NOT NULL,
  proof_path text,
  payout_pct numeric NOT NULL DEFAULT 70 CHECK (payout_pct > 0 AND payout_pct <= 100),
  payout_amount numeric NOT NULL,
  status gift_card_state NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
ALTER TABLE public.gift_card_exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own gift cards" ON public.gift_card_exchanges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own gift cards" ON public.gift_card_exchanges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all gift cards" ON public.gift_card_exchanges FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update gift cards" ON public.gift_card_exchanges FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============ PAYMENT WALLETS (admin-managed) ============
CREATE TABLE public.payment_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL,
  network text NOT NULL,
  address text NOT NULL,
  memo text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed view active wallets" ON public.payment_wallets FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins manage wallets" ON public.payment_wallets FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed placeholder wallets
INSERT INTO public.payment_wallets (currency, network, address, memo) VALUES
('BTC', 'Bitcoin', 'PLACEHOLDER_BTC_ADDRESS', NULL),
('ETH', 'Ethereum (ERC-20)', 'PLACEHOLDER_ETH_ADDRESS', NULL),
('USDT', 'TRC-20 (Tron)', 'PLACEHOLDER_USDT_TRC20_ADDRESS', NULL),
('USDT', 'ERC-20 (Ethereum)', 'PLACEHOLDER_USDT_ERC20_ADDRESS', NULL),
('SOL', 'Solana', 'PLACEHOLDER_SOL_ADDRESS', NULL);

-- ============ 2FA ============
CREATE TABLE public.user_2fa (
  user_id uuid PRIMARY KEY,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  backup_codes text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own 2fa" ON public.user_2fa FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_2fa_updated BEFORE UPDATE ON public.user_2fa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUPPORT CHAT ============
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own messages" ON public.support_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all messages" ON public.support_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGER: auto-create account_status on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.portfolios (user_id, balance) VALUES (NEW.id, 10000);
  INSERT INTO public.transactions (user_id, type, amount) VALUES (NEW.id, 'deposit', 10000);
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  INSERT INTO public.account_status (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- Backfill account_status + user role for existing users
INSERT INTO public.account_status (user_id)
SELECT id FROM auth.users WHERE id NOT IN (SELECT user_id FROM public.account_status);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users WHERE id NOT IN (SELECT user_id FROM public.user_roles);

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-docs', 'kyc-docs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('gift-card-proofs', 'gift-card-proofs', false) ON CONFLICT DO NOTHING;

-- Storage policies: users can read/write their own folder; admins can read all
CREATE POLICY "Users upload own kyc" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own kyc" ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all kyc" ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users upload own proofs" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own proofs" ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all proofs" ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users upload own giftcards" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gift-card-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own giftcards" ON storage.objects FOR SELECT
USING (bucket_id = 'gift-card-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all giftcards" ON storage.objects FOR SELECT
USING (bucket_id = 'gift-card-proofs' AND public.has_role(auth.uid(), 'admin'));
