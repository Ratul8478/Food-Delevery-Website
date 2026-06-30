-- ============================================================================
-- STEP 1 — EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2 — CREATE ALL 18 TABLES (in FK-safe order)
-- ============================================================================

-- TABLE 13: discount_tiers
CREATE TABLE IF NOT EXISTS discount_tiers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name         TEXT NOT NULL UNIQUE,
  tier_slug         TEXT NOT NULL UNIQUE, -- 'bronze','silver','gold','platinum','diamond'
  min_referrals     INTEGER NOT NULL,
  max_referrals     INTEGER, -- NULL = unlimited (top tier)
  discount_percent  INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  color_hex         TEXT NOT NULL, -- badge color
  icon_emoji        TEXT NOT NULL,
  description       TEXT,
  perks             TEXT[] DEFAULT '{}',
  display_order     INTEGER NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE
);

-- TABLE 4: menu_categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  name_hindi     TEXT, -- e.g. "मुख्य व्यंजन"
  description    TEXT,
  image_url      TEXT,
  icon_emoji     TEXT DEFAULT '🍽️',
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 5: menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id         UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
  name                TEXT NOT NULL,
  name_hindi          TEXT, -- e.g. "दाल मखनी"
  description         TEXT,
  price               DECIMAL(10,2) NOT NULL CHECK (price > 0),
  discount_price      DECIMAL(10,2) CHECK (discount_price > 0 AND discount_price < price),
  image_url           TEXT,
  is_veg              BOOLEAN NOT NULL DEFAULT FALSE,
  is_jain             BOOLEAN NOT NULL DEFAULT FALSE, -- no root vegetables
  spice_level         SMALLINT NOT NULL DEFAULT 2 CHECK (spice_level BETWEEN 1 AND 5),
  is_available        BOOLEAN NOT NULL DEFAULT TRUE,
  is_bestseller       BOOLEAN NOT NULL DEFAULT FALSE,
  is_new              BOOLEAN NOT NULL DEFAULT FALSE,
  ingredients         TEXT[] DEFAULT '{}',
  allergens           TEXT[] DEFAULT '{}', -- 'gluten','dairy','nuts','egg','soy'
  prep_time_minutes   INTEGER NOT NULL DEFAULT 20,
  calories            INTEGER,
  rating_avg          DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  rating_count        INTEGER NOT NULL DEFAULT 0,
  tags                TEXT[] DEFAULT '{}', -- 'recommended','seasonal','chef_special'
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 1: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name          TEXT NOT NULL,
  email              TEXT UNIQUE NOT NULL,
  phone              TEXT UNIQUE NOT NULL CHECK (phone ~ '^[6-9]\d{9}$'), -- Indian mobile
  email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url         TEXT,
  role               TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  referral_code      TEXT UNIQUE NOT NULL, -- 8-char alphanum, auto-generated trigger
  referred_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total_points       INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  total_referrals    INTEGER NOT NULL DEFAULT 0,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 2: email_otps
CREATE TABLE IF NOT EXISTS email_otps (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        TEXT NOT NULL,
  otp_hash     TEXT NOT NULL, -- crypt(otp_code, gen_salt('bf'))
  purpose      TEXT NOT NULL CHECK (purpose IN ('registration','login','password_reset')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  is_used      BOOLEAN NOT NULL DEFAULT FALSE,
  attempts     INTEGER NOT NULL DEFAULT 0 CHECK (attempts <= 5),
  ip_address   INET,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 3: phone_otps
CREATE TABLE IF NOT EXISTS phone_otps (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone        TEXT NOT NULL CHECK (phone ~ '^[6-9]\d{9}$'),
  otp_hash     TEXT NOT NULL, -- hashed 6-digit OTP
  purpose      TEXT NOT NULL CHECK (purpose IN ('registration','login')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  is_used      BOOLEAN NOT NULL DEFAULT FALSE,
  attempts     INTEGER NOT NULL DEFAULT 0 CHECK (attempts <= 3),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 6: user_addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Home' CHECK (label IN ('Home','Work','Other')),
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  street        TEXT NOT NULL,
  area          TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  pincode       TEXT NOT NULL CHECK (pincode ~ '^\d{6}$'),
  landmark      TEXT,
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 7: carts
CREATE TABLE IF NOT EXISTS carts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  coupon_code TEXT, -- active discount code applied
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 8: cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id        UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  menu_item_id   UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 20),
  special_note   TEXT CHECK (length(special_note) <= 200),
  unit_price     DECIMAL(10,2) NOT NULL, -- snapshot price at time of add
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, menu_item_id)
);

-- TABLE 9: orders
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        TEXT UNIQUE NOT NULL, -- auto: 'ORD-2026-000001'
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  address_id          UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
  address_snapshot    JSONB NOT NULL, -- copy of address at order time
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending','confirmed','preparing',
                        'out_for_delivery','delivered','cancelled')),
  subtotal            DECIMAL(10,2) NOT NULL CHECK (subtotal > 0),
  discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percent    INTEGER NOT NULL DEFAULT 0,
  discount_source     TEXT, -- 'referral_tier','coupon','promo'
  tax_amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_charge     DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount        DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  payment_method      TEXT NOT NULL CHECK (payment_method IN ('online','cod')),
  payment_status      TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
                        'pending','paid','failed','refunded','cod_pending')),
  estimated_minutes   INTEGER DEFAULT 30,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancelled_reason    TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 10: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name       TEXT NOT NULL, -- snapshot: name at order time
  item_name_hindi TEXT,
  item_image_url  TEXT,
  is_veg          BOOLEAN NOT NULL DEFAULT FALSE,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      DECIMAL(10,2) NOT NULL,
  total_price     DECIMAL(10,2) NOT NULL,
  special_note    TEXT
);

-- TABLE 11: payments
CREATE TABLE IF NOT EXISTS payments (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                 UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT UNIQUE,
  user_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id        TEXT UNIQUE,
  amount_paise             BIGINT NOT NULL, -- Stripe uses smallest unit (paise for INR)
  amount_inr               DECIMAL(10,2) NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'INR',
  status                   TEXT NOT NULL CHECK (status IN (
                             'created','processing','succeeded','failed','refunded')),
  payment_method_type      TEXT, -- 'card','upi','netbanking','wallet'
  stripe_metadata          JSONB DEFAULT '{}',
  failure_reason           TEXT,
  refunded_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 12: customer_settings
CREATE TABLE IF NOT EXISTS customer_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  cod_enabled     BOOLEAN NOT NULL DEFAULT FALSE, -- DEFAULT OFF, only admin can toggle ON
  cod_enabled_by  UUID REFERENCES profiles(id), -- admin's profile ID
  cod_enabled_at  TIMESTAMPTZ,
  max_cod_amount  DECIMAL(10,2) DEFAULT 500.00, -- admin can set max order for COD
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 14: user_discount_tiers
CREATE TABLE IF NOT EXISTS user_discount_tiers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  tier_id         UUID NOT NULL REFERENCES discount_tiers(id),
  total_referrals INTEGER NOT NULL DEFAULT 0,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 15: referrals
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                    'pending','registered','first_order_placed','rewarded')),
  points_awarded  INTEGER NOT NULL DEFAULT 0,
  first_order_id  UUID REFERENCES orders(id) ON DELETE SET NULL,
  rewarded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referrer_id, referee_id)
);

-- TABLE 16: points_transactions
CREATE TABLE IF NOT EXISTS points_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'earned_referral','earned_order','earned_bonus',
                    'redeemed','expired')),
  points          INTEGER NOT NULL, -- positive=credit, negative=debit
  balance_after   INTEGER NOT NULL,
  source          TEXT NOT NULL,
  reference_id    UUID, -- order_id or referral_id
  description     TEXT,
  expires_at      TIMESTAMPTZ, -- points expire after 1 year
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 17: reviews
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         TEXT CHECK (length(title) <= 100),
  body          TEXT CHECK (length(body) <= 1000),
  images        TEXT[] DEFAULT '{}',
  is_visible    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, order_id, menu_item_id)
);

-- TABLE 18: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
                'order_placed','order_status','payment_success',
                'referral_joined','referral_rewarded','tier_unlocked',
                'otp','promo','system')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  action_url  TEXT, -- deep link
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 3 — INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON notifications(user_id, is_read) 
  WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id, is_available);

-- ============================================================================
-- STEP 4 — DATABASE FUNCTIONS + TRIGGERS
-- ============================================================================

-- FUNCTION 1: generate_referral_code()
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT;
  found_count INT;
BEGIN
  LOOP
    code := 'SPICE' || 
            substr(chars, floor(random() * 36)::int + 1, 1) ||
            substr(chars, floor(random() * 36)::int + 1, 1) ||
            substr(chars, floor(random() * 36)::int + 1, 1);
    
    SELECT COUNT(*) INTO found_count FROM profiles WHERE referral_code = code;
    IF found_count = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- BEFORE INSERT TRIGGER FUNCTION FOR profiles REFERRAL CODE
CREATE OR REPLACE FUNCTION trg_profiles_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_profiles_before_insert();

-- FUNCTION 2: generate_order_number()
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  seq_val BIGINT;
  year_val TEXT;
BEGIN
  seq_val := nextval('order_number_seq');
  year_val := to_char(now(), 'YYYY');
  RETURN 'ORD-' || year_val || '-' || lpad(seq_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- BEFORE INSERT TRIGGER FUNCTION FOR orders ORDER NUMBER
CREATE OR REPLACE FUNCTION trg_orders_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_orders_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_orders_before_insert();

-- FUNCTION 3: set_updated_at()
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply set_updated_at trigger to relevant tables
CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_customer_settings_updated_at BEFORE UPDATE ON customer_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_user_discount_tiers_updated_at BEFORE UPDATE ON user_discount_tiers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- FUNCTION 6: check_and_update_tier(user_uuid UUID)
CREATE OR REPLACE FUNCTION check_and_update_tier(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  user_referrals INTEGER;
  matching_tier_id UUID;
  matching_tier_name TEXT;
  matching_discount_pct INTEGER;
  current_tier_id UUID;
BEGIN
  -- 1. Get user's total_referrals count
  SELECT total_referrals INTO user_referrals FROM profiles WHERE id = user_uuid;
  
  -- 2. Find matching tier
  SELECT id, tier_name, discount_percent 
  INTO matching_tier_id, matching_tier_name, matching_discount_pct
  FROM discount_tiers
  WHERE is_active = TRUE 
    AND user_referrals >= min_referrals 
    AND (max_referrals IS NULL OR user_referrals <= max_referrals)
  ORDER BY display_order DESC 
  LIMIT 1;

  IF matching_tier_id IS NOT NULL THEN
    -- Get current tier
    SELECT tier_id INTO current_tier_id 
    FROM user_discount_tiers 
    WHERE user_id = user_uuid;

    -- 3. If tier changed or no tier assigned
    IF current_tier_id IS NULL THEN
      INSERT INTO user_discount_tiers (user_id, tier_id, total_referrals)
      VALUES (user_uuid, matching_tier_id, user_referrals);
      
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        user_uuid,
        'tier_unlocked',
        '🏆 Tier Unlocked: ' || matching_tier_name,
        '🏆 You unlocked ' || matching_tier_name || '! Enjoy ' || matching_discount_pct || '% off all orders',
        jsonb_build_object('tier_id', matching_tier_id, 'discount_percent', matching_discount_pct)
      );
    ELSIF current_tier_id != matching_tier_id THEN
      UPDATE user_discount_tiers
      SET tier_id = matching_tier_id,
          total_referrals = user_referrals,
          updated_at = NOW()
      WHERE user_id = user_uuid;

      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        user_uuid,
        'tier_unlocked',
        '🏆 Tier Upgraded: ' || matching_tier_name,
        '🏆 You unlocked ' || matching_tier_name || '! Enjoy ' || matching_discount_pct || '% off all orders',
        jsonb_build_object('tier_id', matching_tier_id, 'discount_percent', matching_discount_pct)
      );
    ELSE
      -- Just update total_referrals count if they are the same tier
      UPDATE user_discount_tiers
      SET total_referrals = user_referrals,
          updated_at = NOW()
      WHERE user_id = user_uuid;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 4: on_new_profile_created()
CREATE OR REPLACE FUNCTION on_new_profile_created()
RETURNS TRIGGER AS $$
DECLARE
  bronze_tier_id UUID;
  referrer_ref_code TEXT;
BEGIN
  -- 1. Create customer_settings row (cod_enabled=false)
  INSERT INTO customer_settings (user_id, cod_enabled)
  VALUES (NEW.id, FALSE);

  -- 2. Create carts row for user
  INSERT INTO carts (user_id)
  VALUES (NEW.id);

  -- 3. Create user_discount_tiers row (tier_id = Bronze tier)
  SELECT id INTO bronze_tier_id FROM discount_tiers WHERE tier_slug = 'bronze' LIMIT 1;
  IF bronze_tier_id IS NOT NULL THEN
    INSERT INTO user_discount_tiers (user_id, tier_id, total_referrals)
    VALUES (NEW.id, bronze_tier_id, 0);
  END IF;

  -- 4. If referred_by is set: creates referrals record with status='registered'
  IF NEW.referred_by IS NOT NULL THEN
    SELECT referral_code INTO referrer_ref_code FROM profiles WHERE id = NEW.referred_by;
    IF referrer_ref_code IS NOT NULL THEN
      INSERT INTO referrals (referrer_id, referee_id, referral_code, status)
      VALUES (NEW.referred_by, NEW.id, referrer_ref_code, 'registered');
      
      -- Notify referrer that someone registered via their code
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        NEW.referred_by,
        'referral_joined',
        '👥 New Referral Registered!',
        NEW.full_name || ' signed up using your referral code.',
        jsonb_build_object('referee_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_after_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_new_profile_created();

-- FUNCTION 5: on_order_delivered()
CREATE OR REPLACE FUNCTION on_order_delivered()
RETURNS TRIGGER AS $$
DECLARE
  ref_rec RECORD;
  ref_points_balance INTEGER;
BEGIN
  -- Check if order status is changed to delivered
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Find if this user was referred by someone and is completing their first order
    SELECT * INTO ref_rec 
    FROM referrals 
    WHERE referee_id = NEW.user_id AND status = 'registered'
    LIMIT 1;

    IF ref_rec.id IS NOT NULL THEN
      -- 1. Update referral status to first_order_placed
      UPDATE referrals 
      SET status = 'first_order_placed',
          points_awarded = 100,
          first_order_id = NEW.id,
          rewarded_at = NOW()
      WHERE id = ref_rec.id;

      -- 2. Award 100 points to referrer, update total_points and total_referrals
      UPDATE profiles 
      SET total_points = total_points + 100,
          total_referrals = total_referrals + 1
      WHERE id = ref_rec.referrer_id
      RETURNING total_points INTO ref_points_balance;

      -- 3. Insert points_transaction record
      INSERT INTO points_transactions (user_id, type, points, balance_after, source, reference_id, description, expires_at)
      VALUES (
        ref_rec.referrer_id, 
        'earned_referral', 
        100, 
        ref_points_balance, 
        'referral', 
        ref_rec.id, 
        'Points earned for referring a friend who placed their first order', 
        NOW() + INTERVAL '1 year'
      );

      -- 4. Call check_and_update_tier(referrer_id)
      PERFORM check_and_update_tier(ref_rec.referrer_id);

      -- 5. Create notification for referrer
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        ref_rec.referrer_id,
        'referral_rewarded',
        '🎉 Your friend ordered! +100 points earned',
        'Your friend completed their first order! 100 points have been added to your account.',
        jsonb_build_object('referral_id', ref_rec.id, 'points', 100)
      );

    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_orders_after_update
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION on_order_delivered();

-- FUNCTION 7: calculate_order_discount(user_uuid UUID)
CREATE OR REPLACE FUNCTION calculate_order_discount(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  discount_pct INTEGER := 0;
  is_active_tier BOOLEAN;
BEGIN
  SELECT dt.discount_percent, dt.is_active 
  INTO discount_pct, is_active_tier
  FROM user_discount_tiers udt
  JOIN discount_tiers dt ON udt.tier_id = dt.id
  WHERE udt.user_id = user_uuid;
  
  IF is_active_tier = TRUE THEN
    RETURN COALESCE(discount_pct, 0);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 8: update_menu_item_rating()
CREATE OR REPLACE FUNCTION update_menu_item_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_menu_item_id UUID;
  new_avg DECIMAL(3,2);
  new_count INTEGER;
BEGIN
  -- Get the menu item id (works for INSERT/UPDATE/DELETE)
  IF TG_OP = 'DELETE' THEN
    target_menu_item_id := OLD.menu_item_id;
  ELSE
    target_menu_item_id := NEW.menu_item_id;
  END IF;

  -- Recalculate average and count from visible reviews
  SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2), COUNT(*)
  INTO new_avg, new_count
  FROM reviews
  WHERE menu_item_id = target_menu_item_id AND is_visible = TRUE;

  -- Update menu_items table
  UPDATE menu_items
  SET rating_avg = new_avg,
      rating_count = new_count,
      updated_at = NOW()
  WHERE id = target_menu_item_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_reviews_after_write
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_item_rating();

-- ADDITIONAL BUSINESS RULE ENFORCEMENT TRIGGERS:
-- 1. Check if user is verified before ordering
-- 2. Check if COD payment method is allowed for user
CREATE OR REPLACE FUNCTION trg_orders_before_insert_check_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_email_verified BOOLEAN;
  v_phone_verified BOOLEAN;
  v_cod_enabled BOOLEAN;
  v_max_cod_amount DECIMAL(10,2);
BEGIN
  -- Fetch user verification status
  SELECT email_verified, phone_verified 
  INTO v_email_verified, v_phone_verified
  FROM profiles
  WHERE id = NEW.user_id;
  
  IF v_email_verified = FALSE OR v_phone_verified = FALSE OR v_email_verified IS NULL OR v_phone_verified IS NULL THEN
    RAISE EXCEPTION 'Every user must have BOTH email verified AND phone verified before ordering.';
  END IF;

  -- Verify COD rules
  IF NEW.payment_method = 'cod' THEN
    SELECT cod_enabled, max_cod_amount 
    INTO v_cod_enabled, v_max_cod_amount
    FROM customer_settings
    WHERE user_id = NEW.user_id;

    IF v_cod_enabled = FALSE OR v_cod_enabled IS NULL THEN
      RAISE EXCEPTION 'Cash on Delivery (COD) is disabled for this user. Only admins can enable COD.';
    END IF;

    IF NEW.total_amount > COALESCE(v_max_cod_amount, 500.00) THEN
      RAISE EXCEPTION 'Order amount matches or exceeds the COD threshold allowed (Max limit: INR %).', COALESCE(v_max_cod_amount, 500.00);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_orders_check_rules
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_orders_before_insert_check_rules();

-- TRIGGER TO PREVENT USER FROM EDITING THEIR OWN ROLE AND UPDATING TIMESTAMPS
CREATE OR REPLACE FUNCTION trg_profiles_before_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent non-admins from changing role
  -- In Supabase we check the claims inside auth.jwt()
  IF OLD.role != NEW.role AND (COALESCE(auth.jwt()->>'role', 'customer') != 'admin') THEN
    NEW.role := OLD.role;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_update_security
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_profiles_before_update();


-- ============================================================================
-- STEP 5 — ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_discount_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the caller is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- policies for: profiles
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR is_admin());
CREATE POLICY profiles_insert ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR is_admin()) WITH CHECK (auth.uid() = id OR is_admin());

-- policies for: email_otps (Trigger-only / Backend-only. No client policy added = denied to users)
-- policies for: phone_otps (Trigger-only / Backend-only. No client policy added = denied to users)

-- policies for: menu_categories
CREATE POLICY menu_categories_select ON menu_categories FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY menu_categories_all_admin ON menu_categories FOR ALL TO authenticated USING (is_admin());

-- policies for: menu_items
CREATE POLICY menu_items_select ON menu_items FOR SELECT TO authenticated USING (is_available = TRUE);
CREATE POLICY menu_items_all_admin ON menu_items FOR ALL TO authenticated USING (is_admin());

-- policies for: user_addresses
CREATE POLICY user_addresses_select ON user_addresses FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY user_addresses_insert ON user_addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_addresses_update ON user_addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY user_addresses_delete ON user_addresses FOR DELETE TO authenticated USING (auth.uid() = user_id OR is_admin());

-- policies for: carts
CREATE POLICY carts_all ON carts FOR ALL TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

-- policies for: cart_items
CREATE POLICY cart_items_all ON cart_items FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_id AND (carts.user_id = auth.uid() OR is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_id AND (carts.user_id = auth.uid() OR is_admin())));

-- policies for: orders
CREATE POLICY orders_select ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY orders_insert ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY orders_update ON orders FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- policies for: order_items
CREATE POLICY order_items_select ON order_items FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND (orders.user_id = auth.uid() OR is_admin())));
CREATE POLICY order_items_insert ON order_items FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));
CREATE POLICY order_items_update ON order_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- policies for: payments
CREATE POLICY payments_select ON payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());

-- policies for: customer_settings
CREATE POLICY customer_settings_select ON customer_settings FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY customer_settings_update ON customer_settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- policies for: discount_tiers
CREATE POLICY discount_tiers_select ON discount_tiers FOR SELECT TO authenticated USING (TRUE);

-- policies for: user_discount_tiers
CREATE POLICY user_discount_tiers_select ON user_discount_tiers FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());

-- policies for: referrals
CREATE POLICY referrals_select ON referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referee_id OR is_admin());

-- policies for: points_transactions
CREATE POLICY points_transactions_select ON points_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());

-- policies for: reviews
CREATE POLICY reviews_select ON reviews FOR SELECT USING (is_visible = TRUE OR is_admin());
CREATE POLICY reviews_insert ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY reviews_update ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

-- policies for: notifications
CREATE POLICY notifications_select ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY notifications_update ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());


-- ============================================================================
-- STEP 6 — ENABLE REALTIME
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  END IF;
END $$;


-- ============================================================================
-- STEP 7 — SEED DATA
-- ============================================================================

-- INSERT 5 discount tiers:
INSERT INTO discount_tiers (tier_name, tier_slug, min_referrals, max_referrals, discount_percent, color_hex, icon_emoji, description, perks, display_order) VALUES
('Bronze',   'bronze',   0,  4,  20, '#CD7F32', '🥉', 'Entry tier for new references', ARRAY['20% discount on all orders', 'Bronze Referral badge'], 0),
('Silver',   'silver',   5,  9,  30, '#C0C0C0', '🥈', 'Silver reward tier', ARRAY['30% discount on all orders', 'Priority processing', 'Silver Referral badge'], 1),
('Gold',     'gold',     10, 19, 40, '#FFD700', '🥇', 'Gold vip tier', ARRAY['40% discount on all orders', 'Free delivery on all orders', 'Gold Referral badge'], 2),
('Platinum', 'platinum', 20, 49, 50, '#8B8589', '💎', 'Premium platinum tier', ARRAY['50% discount on all orders', 'No minimum delivery threshold', 'Platinum Referral badge'], 3),
('Diamond',  'diamond',  50, NULL,60, '#B9F2FF', '👑', 'Elite diamond tier', ARRAY['60% discount on all orders', 'Personal account manager', 'Free extra customization', 'Diamond Referral badge'], 4)
ON CONFLICT (tier_slug) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_referrals = EXCLUDED.min_referrals,
  max_referrals = EXCLUDED.max_referrals,
  discount_percent = EXCLUDED.discount_percent,
  color_hex = EXCLUDED.color_hex,
  icon_emoji = EXCLUDED.icon_emoji,
  description = EXCLUDED.description,
  perks = EXCLUDED.perks,
  display_order = EXCLUDED.display_order;

-- INSERT 6 menu categories (Indian restaurant):
INSERT INTO menu_categories (name, name_hindi, icon_emoji, display_order) VALUES
('Starters', 'स्टार्टर', '🥗', 1),
('Breads', 'रोटी', '🫓', 2),
('Main Course', 'मुख्य व्यंजन', '🍛', 3),
('Rice & Biryani', 'चावल', '🍚', 4),
('Desserts', 'मिठाई', '🍮', 5),
('Beverages', 'पेय', '🥤', 6);

-- INSERT 20 realistic Indian menu items across categories:

-- 1. Starters Category Items
INSERT INTO menu_items (category_id, name, name_hindi, description, price, discount_price, is_veg, spice_level, is_bestseller, ingredients, allergens, prep_time_minutes, calories, tags) VALUES
((SELECT id FROM menu_categories WHERE name = 'Starters' LIMIT 1), 
 'Paneer Tikka', 'पनीर टिक्का', 'Cottage cheese cubes marinated in yogurt and spices, grilled in a clay oven.', 289.00, NULL, TRUE, 3, TRUE, 
 ARRAY['paneer', 'yogurt', 'mustard oil', 'capsicum', 'onion', 'tikka spices'], ARRAY['dairy'], 15, 320, ARRAY['recommended', 'classic', 'tandoori']),

((SELECT id FROM menu_categories WHERE name = 'Starters' LIMIT 1), 
 'Chicken Seekh Kebab', 'मटन सीख कबाब', 'Skewered minced chicken blended with aromatic herbs and grilled to perfection.', 349.00, 299.00, FALSE, 4, TRUE, 
 ARRAY['minced chicken', 'ginger', 'garlic', 'green chili', 'coriander', 'skewered spices'], ARRAY[]::text[], 20, 280, ARRAY['chef_special', 'popular']),

((SELECT id FROM menu_categories WHERE name = 'Starters' LIMIT 1), 
 'Hara Bhara Kabab', 'हरा भरा कबाब', 'Crispy pan-fried patties made with spinach, green peas, and fresh cottage cheese.', 219.00, NULL, TRUE, 2, FALSE, 
 ARRAY['spinach', 'peas', 'paneer', 'potato', 'corn flour', 'spices'], ARRAY['dairy'], 15, 210, ARRAY['vegetarian', 'healthy']),

((SELECT id FROM menu_categories WHERE name = 'Starters' LIMIT 1), 
 'Samosa Duo', 'समोसा', 'Crispy pastry pyramids filled with seasoned mashed potatoes and green peas.', 149.00, 119.00, TRUE, 2, TRUE, 
 ARRAY['refined flour', 'potato', 'green peas', 'coriander seeds', 'cumin', 'garam masala'], ARRAY['gluten'], 10, 290, ARRAY['street_food', 'bestseller']);

-- 2. Breads Category Items
INSERT INTO menu_items (category_id, name, name_hindi, description, price, discount_price, is_veg, spice_level, is_bestseller, ingredients, allergens, prep_time_minutes, calories, tags) VALUES
((SELECT id FROM menu_categories WHERE name = 'Breads' LIMIT 1), 
 'Butter Naan', 'बटर नान', 'Soft and fluffy leavened flatbread brushed with premium melted butter.', 89.00, NULL, TRUE, 1, TRUE, 
 ARRAY['refined flour', 'milk', 'yeast', 'butter', 'sugar', 'salt'], ARRAY['gluten', 'dairy'], 8, 260, ARRAY['classic', 'essential']),

((SELECT id FROM menu_categories WHERE name = 'Breads' LIMIT 1), 
 'Tandoori Roti', 'तन्दूरी रोटी', 'Traditional whole wheat flatbread baked on the hot clay walls of the tandoor.', 49.00, NULL, TRUE, 1, FALSE, 
 ARRAY['whole wheat flour', 'water', 'salt'], ARRAY['gluten'], 5, 110, ARRAY['healthy', 'vegan_friendly']),

((SELECT id FROM menu_categories WHERE name = 'Breads' LIMIT 1), 
 'Garlic Naan', 'लहसुन नान', 'Leavened clay oven flatbread infused with chopped garlic and fresh coriander.', 109.00, 89.00, TRUE, 1, TRUE, 
 ARRAY['refined flour', 'chopped garlic', 'coriander', 'butter', 'yeast'], ARRAY['gluten', 'dairy'], 8, 280, ARRAY['favorite', 'aromatic']);

-- 3. Main Course Category Items
INSERT INTO menu_items (category_id, name, name_hindi, description, price, discount_price, is_veg, spice_level, is_bestseller, ingredients, allergens, prep_time_minutes, calories, tags) VALUES
((SELECT id FROM menu_categories WHERE name = 'Main Course' LIMIT 1), 
 'Paneer Butter Masala', 'पनीर बटर मसाला', 'Soft paneer cubes cooked in a rich, creamy tomato gravy with butter and cream.', 389.00, NULL, TRUE, 2, TRUE, 
 ARRAY['paneer', 'butter', 'tomato puree', 'cashew paste', 'fresh cream', 'kasuri methi'], ARRAY['dairy', 'nuts'], 20, 450, ARRAY['recommended', 'classic']),

((SELECT id FROM menu_categories WHERE name = 'Main Course' LIMIT 1), 
 'Dal Makhani', 'दाल मखनी', 'Slow-cooked black lentils and kidney beans simmered overnight with cream, butter, and tomatoes.', 329.00, NULL, TRUE, 2, TRUE, 
 ARRAY['black lentils', 'red kidney beans', 'butter', 'fresh cream', 'tomato gravy', 'garlic'], ARRAY['dairy'], 25, 380, ARRAY['signature', 'slow_cooked']),

((SELECT id FROM menu_categories WHERE name = 'Main Course' LIMIT 1), 
 'Chicken Tikka Masala', 'चिकन टिक्का मसाला', 'Tandoori grilled chicken chunks cooked in a spicy, creamy tomato-onion gravy.', 459.00, 399.00, FALSE, 3, TRUE, 
 ARRAY['grilled chicken', 'yogurt', 'heavy cream', 'tomato paste', 'onion', 'tikka gravy masala'], ARRAY['dairy'], 20, 520, ARRAY['global_favorite']),

((SELECT id FROM menu_categories WHERE name = 'Main Course' LIMIT 1), 
 'Mutton Rogan Josh', 'मटन रोगन जोश', 'Tender lamb chunks cooked in a rich Kashmiri gravy colored with red chiles and saffron.', 549.00, NULL, FALSE, 4, TRUE, 
 ARRAY['mutton chunks', 'shallots', 'yogurt', 'kashmiri red chili', 'ginger powder', 'fennel'], ARRAY['dairy'], 30, 610, ARRAY['chef_special', 'royal']),

((SELECT id FROM menu_categories WHERE name = 'Main Course' LIMIT 1), 
 'Chana Masala', 'चना मसाला', 'Tangy chickpea curry cooked with onions, tomatoes, green chilies, and rustically ground spices.', 249.00, NULL, TRUE, 3, FALSE, 
 ARRAY['chickpeas', 'onion', 'tomato', 'tea leaves brew', 'amchur powder', 'coriander'], ARRAY[]::text[], 18, 290, ARRAY['vegan', 'healthy', 'gluten_free']);

-- 4. Rice & Biryani Category Items
INSERT INTO menu_items (category_id, name, name_hindi, description, price, discount_price, is_veg, spice_level, is_bestseller, ingredients, allergens, prep_time_minutes, calories, tags) VALUES
((SELECT id FROM menu_categories WHERE name = 'Rice & Biryani' LIMIT 1), 
 'Veg Dum Biryani', 'वेज दम बिरयानी', 'Fragrant basmati rice layered with mixed vegetables, herbs, and saffron, slow-cooked in sealed handi.', 349.00, 299.00, TRUE, 3, FALSE, 
 ARRAY['basmati rice', 'french beans', 'carrot', 'cauliflower', 'saffron', 'mint', 'rose water'], ARRAY['dairy'], 25, 480, ARRAY['fragrant', 'dum_cooking']),

((SELECT id FROM menu_categories WHERE name = 'Rice & Biryani' LIMIT 1), 
 'Chicken Dum Biryani', 'चिकन दम बिरयानी', 'Succulent chicken pieces marinated in yogurt and spices, layered with long grain basmati rice.', 429.00, NULL, FALSE, 4, TRUE, 
 ARRAY['basmati rice', 'chicken', 'yogurt marinade', 'fried onions', 'saffron', 'clarified butter', 'spices'], ARRAY['dairy'], 30, 680, ARRAY['bestseller', 'legendary']),

((SELECT id FROM menu_categories WHERE name = 'Rice & Biryani' LIMIT 1), 
 'Jeera Rice', 'जीरा राइस', 'Fluffy steamed basmati rice tempered with cumin seeds and pure ghee.', 179.00, NULL, TRUE, 1, FALSE, 
 ARRAY['basmati rice', 'cumin seeds', 'ghee', 'coriander leaf'], ARRAY['dairy'], 10, 220, ARRAY['sides', 'simple']);

-- 5. Desserts Category Items
INSERT INTO menu_items (category_id, name, name_hindi, description, price, discount_price, is_veg, spice_level, is_bestseller, ingredients, allergens, prep_time_minutes, calories, tags) VALUES
((SELECT id FROM menu_categories WHERE name = 'Desserts' LIMIT 1), 
 'Gulab Jamun (2 Pcs)', 'गुलाब जामुन', 'Golden fried milk dumplings soaked in a warm rose-scented cardamom sugar syrup.', 129.00, NULL, TRUE, 1, TRUE, 
 ARRAY['khoya', 'refined flour', 'sugar syrup', 'cardamom', 'rose water', 'pistachio shavings'], ARRAY['dairy', 'gluten', 'nuts'], 8, 310, ARRAY['classic', 'bestseller']),

((SELECT id FROM menu_categories WHERE name = 'Desserts' LIMIT 1), 
 'Rasmalai (2 Pcs)', 'रसमलाई', 'Flattened cottage cheese patties soaked in sweet, saffron-flavored thickened milk.', 159.00, 139.00, TRUE, 1, TRUE, 
 ARRAY['paneer', 'condensed milk', 'saffron', 'cardamom', 'pistachios', 'almonds'], ARRAY['dairy', 'nuts'], 10, 270, ARRAY['sweet', 'creamy']),

((SELECT id FROM menu_categories WHERE name = 'Desserts' LIMIT 1), 
 'Gajar Ka Halwa', 'गाजर का हलवा', 'Rich dessert made by slow-cooking grated red carrots with milk, ghee, sugar, and dried fruits.', 189.00, NULL, TRUE, 1, FALSE, 
 ARRAY['grated red carrots', 'whole milk', 'sugar', 'ghee', 'cashews', 'raisins'], ARRAY['dairy', 'nuts'], 15, 340, ARRAY['seasonal', 'traditional']);

-- 6. Beverages Category Items
INSERT INTO menu_items (category_id, name, name_hindi, description, price, discount_price, is_veg, spice_level, is_bestseller, ingredients, allergens, prep_time_minutes, calories, tags) VALUES
((SELECT id FROM menu_categories WHERE name = 'Beverages' LIMIT 1), 
 'Masala Chai', 'मसाला चाय', 'Brewed black tea infused with milk and a blend of aromatic spices like ginger and cardamom.', 79.00, NULL, TRUE, 1, FALSE, 
 ARRAY['tea leaves', 'milk', 'water', 'ginger', 'cardamom', 'cloves', 'cinnamon'], ARRAY['dairy'], 10, 90, ARRAY['essential', 'all_day']),

((SELECT id FROM menu_categories WHERE name = 'Beverages' LIMIT 1), 
 'Mango Lassi', 'मैंगो लस्सी', 'Creamy, yogurt-based drink blended with fresh mango pulp and sweet syrup.', 119.00, 99.00, TRUE, 1, TRUE, 
 ARRAY['yogurt', 'mango pulp', 'milk', 'sugar syrup', 'cardamom powder'], ARRAY['dairy'], 5, 230, ARRAY['refreshing', 'summer_favorite']);
