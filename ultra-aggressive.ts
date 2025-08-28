import { PGlite } from "@electric-sql/pglite";

async function ultraAggressiveSegfault() {
  console.log("💀 ULTRA AGGRESSIVE SEGFAULT ATTACK v1.2.21");
  console.log("Target: Force WASM boundary violations and memory corruption");
  console.log("========================================================");
  
  // Attack 1: Rapid-fire PGLite creation with immediate destruction
  await rapidFireAttack();
  
  // Attack 2: Memory bomb cascade
  await memoryBombCascade();
  
  // Attack 3: Concurrent corruption pattern
  await concurrentCorruption();
  
  // Attack 4: Stack + Heap exhaustion combo
  await stackHeapCombo();
}

async function rapidFireAttack() {
  console.log("\n🚀 Attack 1: Rapid-Fire PGLite Creation (1000 instances)");
  
  for (let wave = 0; wave < 10; wave++) {
    console.log(`   Wave ${wave + 1}/10: Creating 100 instances...`);
    
    const promises = [];
    for (let i = 0; i < 100; i++) {
      const promise = (async () => {
        try {
          const db = new PGlite();
          
          // Immediate heavy load
          const killer = new Uint8Array(50 * 1024 * 1024); // 50MB
          killer.fill((wave * 100 + i) % 256);
          
          await db.query(`CREATE TABLE rapid_${wave}_${i} (data BYTEA)`);
          await db.query(`INSERT INTO rapid_${wave}_${i} (data) VALUES ($1)`, [killer]);
          
          // Immediate close without waiting
          await db.close();
          
        } catch (error) {
          if (error.message.includes('Out of bounds')) {
            console.log(`🎯 BOUNDARY VIOLATION! Wave ${wave}, DB ${i}`);
          }
        }
      })();
      
      promises.push(promise);
    }
    
    await Promise.allSettled(promises);
    
    // No delay between waves - maximum pressure
  }
}

async function memoryBombCascade() {
  console.log("\n💣 Attack 2: Memory Bomb Cascade (Progressive Explosion)");
  
  const databases = [];
  
  try {
    // Create cascade of increasingly large memory bombs
    for (let bombLevel = 0; bombLevel < 20; bombLevel++) {
      const db = new PGlite();
      databases.push(db);
      
      // Exponential bomb size: 10MB, 20MB, 40MB, 80MB, 160MB...
      const bombSize = 10 * 1024 * 1024 * Math.pow(2, bombLevel / 4);
      console.log(`   💣 Bomb ${bombLevel + 1}: ${Math.round(bombSize / 1024 / 1024)}MB`);
      
      const bomb = new Uint8Array(bombSize);
      // Fill with corruption pattern
      for (let i = 0; i < bombSize; i++) {
        bomb[i] = (i * 0xDEADBEEF + bombLevel * 0xCAFEBABE) % 256;
      }
      
      try {
        await db.query(`CREATE TABLE bomb_${bombLevel} (explosion BYTEA)`);
        await db.query(`INSERT INTO bomb_${bombLevel} (explosion) VALUES ($1)`, [bomb]);
        
        // Trigger immediate memory operations
        await db.query(`SELECT LENGTH(explosion) FROM bomb_${bombLevel}`);
        await db.query(`SELECT explosion || explosion FROM bomb_${bombLevel}`);
        
      } catch (error) {
        console.log(`   💥 Bomb ${bombLevel + 1} detonated: ${error.message.substring(0, 50)}...`);
        if (error.message.includes('Out of bounds')) {
          console.log(`🎯 BOUNDARY EXPLOSION DETECTED!`);
        }
        break;
      }
    }
    
  } finally {
    // Mass destruction
    for (const db of databases) {
      try { await db.close(); } catch (e) {}
    }
  }
}

async function concurrentCorruption() {
  console.log("\n🔀 Attack 3: Concurrent Corruption (200 Corruptors)");
  
  const corruptors = [];
  
  for (let corruptorId = 0; corruptorId < 200; corruptorId++) {
    const corruptor = (async () => {
      try {
        const db = new PGlite();
        
        // Corruption pattern table
        await db.query(`CREATE TABLE corrupt_${corruptorId} (
          poison BYTEA,
          overflow TEXT,
          underflow BYTEA
        )`);
        
        // Multiple corruption patterns simultaneously
        const patterns = [
          // Buffer overflow pattern
          new Uint8Array(1024 * 1024 * 30).fill(0x41), // 30MB of 'A'
          // Underflow pattern  
          new Uint8Array(1024 * 1024 * 25).fill(0x00), // 25MB of null
          // Pointer corruption pattern
          new Uint8Array(1024 * 1024 * 20).fill(0xFF), // 20MB of 0xFF
        ];
        
        const overflowText = "OVERFLOW_CORRUPTION_".repeat(1000000); // ~20MB text
        
        for (let round = 0; round < 5; round++) {
          await db.query(
            `INSERT INTO corrupt_${corruptorId} (poison, overflow, underflow) VALUES ($1, $2, $3)`,
            [patterns[round % 3], overflowText, patterns[(round + 1) % 3]]
          );
          
          // Immediate corruption operations
          await db.query(`
            SELECT 
              poison || underflow as combined_corruption,
              LENGTH(overflow) as text_corruption,
              poison || overflow::bytea || underflow as triple_corruption
            FROM corrupt_${corruptorId}
          `);
        }
        
        await db.close();
        
      } catch (error) {
        if (error.message.includes('Out of bounds') || error.message.includes('Segmentation')) {
          console.log(`🎯 CORRUPTION SUCCESS! Corruptor ${corruptorId}: ${error.message}`);
        }
      }
    });
    
    corruptors.push(corruptor());
  }
  
  console.log("   ⚡ Unleashing 200 corruptors simultaneously...");
  await Promise.allSettled(corruptors);
}

async function stackHeapCombo() {
  console.log("\n🌪️ Attack 4: Stack + Heap Exhaustion Combo");
  
  const combo = (async () => {
    const db = new PGlite();
    
    try {
      // Create deep recursive structure (stack pressure)
      await db.query(`CREATE TABLE stack_heap (
        id SERIAL PRIMARY KEY,
        level INTEGER,
        heap_bomb BYTEA,
        stack_data TEXT
      )`);
      
      // Build massive recursive structure with heap bombs
      let currentSize = 5 * 1024 * 1024; // Start with 5MB
      
      for (let depth = 0; depth < 1000; depth++) {
        const heapBomb = new Uint8Array(currentSize);
        heapBomb.fill(depth % 256);
        
        const stackData = "RECURSIVE_STACK_DATA_".repeat(depth * 100);
        
        await db.query(
          `INSERT INTO stack_heap (level, heap_bomb, stack_data) VALUES ($1, $2, $3)`,
          [depth, heapBomb, stackData]
        );
        
        // Trigger recursive query with heap operations
        if (depth % 100 === 0) {
          try {
            await db.query(`
              WITH RECURSIVE stack_explosion AS (
                SELECT 
                  id, level, heap_bomb, stack_data,
                  heap_bomb || heap_bomb as doubled_heap,
                  0 as recursion_level
                FROM stack_heap 
                WHERE level = 0
                
                UNION ALL
                
                SELECT 
                  sh.id, sh.level, sh.heap_bomb, sh.stack_data,
                  sh.heap_bomb || se.doubled_heap as mega_heap,
                  se.recursion_level + 1
                FROM stack_heap sh
                JOIN stack_explosion se ON sh.level = se.level + 1
                WHERE se.recursion_level < 50 AND sh.level <= $1
              )
              SELECT 
                COUNT(*),
                SUM(LENGTH(mega_heap)) as total_heap_size,
                MAX(recursion_level) as max_recursion
              FROM stack_explosion
            `, [depth]);
          } catch (recursionError) {
            console.log(`   🌪️ Recursion explosion at depth ${depth}: ${recursionError.message.substring(0, 50)}...`);
          }
        }
        
        currentSize = Math.floor(currentSize * 1.1); // Grow heap bombs
        
        if (depth % 100 === 0) {
          console.log(`   📈 Stack depth: ${depth}, Heap bomb size: ${Math.round(currentSize / 1024 / 1024)}MB`);
        }
      }
      
    } catch (error) {
      console.log(`🎯 STACK-HEAP COMBO EXPLOSION: ${error.message}`);
    } finally {
      try { await db.close(); } catch (e) {}
    }
  });
  
  await combo;
}

ultraAggressiveSegfault().catch((error) => {
  console.log("\n💀💀💀 ULTRA AGGRESSIVE ATTACK RESULT 💀💀💀");
  console.log("Error:", error.message);
  if (error.message.includes('Segmentation fault') || 
      error.message.includes('segv') ||
      error.message.includes('Out of bounds')) {
    console.log("🎯🎯🎯 SEGFAULT ACHIEVED! 🎯🎯🎯");
  }
});
