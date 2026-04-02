ALTER TABLE "coupon_redemptions"
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "orders"
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "checkout_payments"
ALTER COLUMN "userId" DROP NOT NULL;
