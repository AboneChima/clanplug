const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: { rejectUnauthorized: false }
});

async function refund() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Start transaction
    await client.query('BEGIN');

    // Find escrows to refund
    const escrowsResult = await client.query(`
      SELECT 
        e.id, e.amount, e.fee, e.currency, e."buyerId", e."postId",
        u.username, u.email
      FROM escrows e
      JOIN users u ON e."buyerId" = u.id
      WHERE u.email = 'abonejoseph@gmail.com'
        AND e.status IN ('FUNDED', 'PENDING')
    `);

    const escrows = escrowsResult.rows;
    console.log(`\n📦 Found ${escrows.length} escrow(s) to refund:`);
    
    if (escrows.length === 0) {
      console.log('No escrows to refund!');
      await client.query('ROLLBACK');
      await client.end();
      return;
    }

    let totalRefunded = 0;

    for (const escrow of escrows) {
      const refundAmount = parseFloat(escrow.amount) + parseFloat(escrow.fee);
      totalRefunded += refundAmount;
      
      console.log(`\n  - ${escrow.id}`);
      console.log(`    Amount: ${escrow.amount} ${escrow.currency}`);
      console.log(`    Fee: ${escrow.fee} ${escrow.currency}`);
      console.log(`    Total: ${refundAmount} ${escrow.currency}`);

      // Refund to wallet
      await client.query(`
        UPDATE wallets
        SET balance = balance + $1,
            "updatedAt" = NOW()
        WHERE "userId" = $2
          AND currency = $3
      `, [refundAmount, escrow.buyerId, escrow.currency]);

      // Mark escrow as refunded
      await client.query(`
        UPDATE escrows
        SET status = 'REFUNDED',
            "updatedAt" = NOW()
        WHERE id = $1
      `, [escrow.id]);

      // Mark post as active again
      if (escrow.postId) {
        await client.query(`
          UPDATE posts
          SET status = 'ACTIVE',
              "soldToId" = NULL,
              "soldAt" = NULL,
              "updatedAt" = NOW()
          WHERE id = $1
        `, [escrow.postId]);
      }
    }

    // Create notification
    await client.query(`
      INSERT INTO notifications (id, "userId", type, title, message, "createdAt")
      SELECT 
        gen_random_uuid(),
        u.id,
        'SYSTEM',
        '💰 Test Purchases Refunded',
        'Your test purchases have been refunded. Total: ' || $1 || ' ' || $2 || '. Check your wallet.',
        NOW()
      FROM users u
      WHERE u.email = 'abonejoseph@gmail.com'
    `, [totalRefunded, escrows[0].currency]);

    // Commit transaction
    await client.query('COMMIT');

    console.log(`\n✅ SUCCESS!`);
    console.log(`   Refunded: ${escrows.length} purchase(s)`);
    console.log(`   Total: ${totalRefunded} ${escrows[0].currency}`);

    // Check wallet balance
    const walletResult = await client.query(`
      SELECT w.balance, w.currency, u.username
      FROM wallets w
      JOIN users u ON w."userId" = u.id
      WHERE u.email = 'abonejoseph@gmail.com'
    `);

    console.log(`\n💰 Your wallet balance:`);
    walletResult.rows.forEach(wallet => {
      console.log(`   ${wallet.balance} ${wallet.currency}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

refund();
