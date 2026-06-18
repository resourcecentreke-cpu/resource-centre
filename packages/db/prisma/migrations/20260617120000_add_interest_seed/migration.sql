-- Add baseline popularity weight used (with live product views) for "Top 10 by interest".
ALTER TABLE "Product" ADD COLUMN "interestSeed" INTEGER NOT NULL DEFAULT 0;

-- Index to support ordering products by baseline interest.
CREATE INDEX "Product_interestSeed_idx" ON "Product"("interestSeed");
