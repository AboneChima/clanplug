/*
  Warnings:

  - You are about to drop the `crypto_payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "crypto_payments" DROP CONSTRAINT "crypto_payments_userId_fkey";

-- DropTable
DROP TABLE "crypto_payments";
