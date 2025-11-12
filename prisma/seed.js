"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'test@lordmoon.local';
    const username = 'testuser';
    const password = 'Passw0rd!';
    const referralCode = 'SEED1234';
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            username,
            firstName: 'Test',
            lastName: 'User',
            referralCode,
            passwordHash,
            status: 'PENDING_VERIFICATION'
        }
    });
    console.log('✅ Seeded user:', { email, username });
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map