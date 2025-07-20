/*
  Warnings:

  - You are about to drop the `group_invites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "group_invites" DROP CONSTRAINT "group_invites_group_id_fkey";

-- DropTable
DROP TABLE "group_invites";

-- DropEnum
DROP TYPE "InviteStatus";
