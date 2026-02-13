-- AlterTable
ALTER TABLE "users" ADD COLUMN     "access_pin_hash" VARCHAR(100),
ADD COLUMN     "action_pin_hash" VARCHAR(100),
ADD COLUMN     "force_access_pin_setup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "force_action_pin_setup" BOOLEAN NOT NULL DEFAULT true;
