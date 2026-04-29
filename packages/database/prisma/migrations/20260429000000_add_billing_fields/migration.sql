-- AlterTable
ALTER TABLE "institutions" ADD COLUMN     "billingInterval" TEXT,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "planName" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "institutions_stripeCustomerId_key" ON "institutions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_stripeSubscriptionId_key" ON "institutions"("stripeSubscriptionId");
