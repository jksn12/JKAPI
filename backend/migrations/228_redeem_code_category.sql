-- Add a lightweight admin-managed category for redeem code organization.
ALTER TABLE redeem_codes
    ADD COLUMN IF NOT EXISTS category VARCHAR(64) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_redeem_codes_category
    ON redeem_codes (category);

COMMENT ON COLUMN redeem_codes.category IS '管理员用于整理卡密的分类，如云猫充值、手工补偿、活动发放';
