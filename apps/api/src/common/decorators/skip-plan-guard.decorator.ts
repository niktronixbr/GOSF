import { SetMetadata } from "@nestjs/common";

export const SKIP_PLAN_GUARD_KEY = "skipPlanGuard";
export const SkipPlanGuard = () => SetMetadata(SKIP_PLAN_GUARD_KEY, true);
