import { spawn } from "node:child_process";

const TIMEOUT = 60000; // 20 seconds

async function segvRepeater() {
  console.log("🔄 SEGFAULT REPEATER - Running ultra-aggressive.ts repeatedly");
  console.log("Timeout: 20 seconds per attempt");
  console.log("Maximum attempts: 10");
  console.log("========================================");
  
  let attempt = 1;
  let segfaults = 0;
  let timeouts = 0;
  let otherErrors = 0;
  const MAX_ATTEMPTS = 10;
  
  while (attempt <= MAX_ATTEMPTS) {
    console.log(`\n🎯 Attempt ${attempt}`);
    console.log(`📊 Stats: ${segfaults} segfaults, ${timeouts} timeouts, ${otherErrors} other errors`);
    
    const result = await runWithTimeout();
    
    if (result.type === 'segfault') {
      segfaults++;
      console.log(`\n${"=".repeat(80)}`);
      console.log(`🎉🎉🎉 SEGFAULT ACHIEVED! Attempt #${attempt} 🎉🎉🎉`);
      console.log(`${"=".repeat(80)}`);
      
      if (result.stdout) {
        console.log("\n📝 STDOUT:");
        console.log("-".repeat(40));
        console.log(result.stdout);
        console.log("-".repeat(40));
      }
      
      if (result.stderr) {
        console.log("\n🔴 STDERR (Crash details):");
        console.log("-".repeat(40));
        console.log(result.stderr);
        console.log("-".repeat(40));
      }
      
      console.log(`\n${"=".repeat(80)}\n`);
      console.log("🏁 Segfault detected - stopping repeater.");
      break; // Exit the loop immediately after segfault
    } else if (result.type === 'timeout') {
      timeouts++;
      console.log(`⏰ Timeout (Total: ${timeouts})`);
    } else {
      otherErrors++;
      console.log(`❌ Other error: ${result.error} (Total: ${otherErrors})`);
    }
    
    attempt++;
    
    // Brief pause between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final summary only if no segfault was found
  if (segfaults === 0) {
    console.log("\n" + "=".repeat(80));
    console.log("📊 FINAL SUMMARY after " + (attempt - 1) + " attempts:");
    console.log(`✅ Segfaults: ${segfaults}`);
    console.log(`⏰ Timeouts: ${timeouts}`);
    console.log(`❌ Other errors: ${otherErrors}`);
    console.log("=".repeat(80));
    console.log("\n🏁 No segfaults found. Repeater completed.");
  }
}

function runWithTimeout(): Promise<{type: 'segfault' | 'timeout' | 'error', error?: string, stdout?: string, stderr?: string}> {
  return new Promise((resolve) => {
    const child = spawn('bun', ['run', 'ultra-aggressive.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    let hasResolved = false;
    
    // Timeout with configurable duration
    const timeoutId = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        child.kill('SIGKILL');
        resolve({ type: 'timeout', stdout, stderr });
      }
    }, TIMEOUT);
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('exit', (code, signal) => {
      clearTimeout(timeoutId);
      
      if (hasResolved) return;
      hasResolved = true;
      
      // Check for segfault indicators
      const output = stdout + stderr;
      
      if (signal === 'SIGSEGV' || 
          signal === 'SIGILL' ||
          output.includes('Segmentation fault') ||
          output.includes('panic(main thread)') ||
          output.includes('oh no: Bun has crashed')) {
        resolve({ type: 'segfault', stdout, stderr });
      } else {
        resolve({ type: 'error', error: `Exit code: ${code}, Signal: ${signal}` });
      }
    });
    
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      
      if (hasResolved) return;
      hasResolved = true;
      
      resolve({ type: 'error', error: error.message });
    });
  });
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping segfault repeater...');
  process.exit(0);
});

segvRepeater().catch(console.error);
