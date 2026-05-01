-- Add adapted recipe steps for Sprint 2 equipment adaptation.
ALTER TABLE "Recipe" ADD COLUMN "adaptedSteps" TEXT;

CREATE INDEX "Recipe_sourceUrl_idx" ON "Recipe"("sourceUrl");
