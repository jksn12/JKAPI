-- Persist the administrator-facing redeem code category on existing databases.
-- Use a new migration number because 228 has already been recorded in some
-- deployed databases with different historical content.

ALTER TABLE redeem_codes
    ADD COLUMN IF NOT EXISTS category VARCHAR(255) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_redeem_codes_category
    ON redeem_codes (category);
