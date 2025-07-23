-- Remove firstName and lastName columns
ALTER TABLE "users" DROP COLUMN "first_name";
ALTER TABLE "users" DROP COLUMN "last_name";

-- Make username required and unique
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");

-- Update existing users to have a username if they don't have one
UPDATE "users" SET "username" = 'user_' || "id" WHERE "username" IS NULL; 