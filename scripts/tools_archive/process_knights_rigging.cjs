const fs = require('fs');
const path = require('path');

const apiKey = 'msy_0JO6JEWcaDKiKhv3nvMDtVNPwuxTcLVH72Yr';
const headers = {
  'Authorization': 'Bearer ' + apiKey,
  'Content-Type': 'application/json'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollTask(endpoint, taskId, name) {
  console.log(`[${name}] Waiting for task ${taskId} on ${endpoint}...`);
  while (true) {
    const res = await fetch(`https://api.meshy.ai/openapi/v1/${endpoint}/${taskId}`, { headers });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`[${name}] Fetch error: ${res.status} ${err}`);
    }
    const task = await res.json();
    console.log(`[${name}] Status: ${task.status} (${task.progress}%)`);
    if (task.status === 'SUCCEEDED') {
      return task;
    }
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`[${name}] Task failed: ${JSON.stringify(task.task_error)}`);
    }
    await sleep(5000);
  }
}

async function downloadFile(url, destPath) {
  console.log(`Downloading ${url} -> ${destPath}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved: ${destPath} (${buffer.length} bytes)`);
}

async function run() {
  const whiteRemeshId = '01a0eb4d-9de9-7480-95d1-3515c3d2c463';
  const blackRemeshId = '01a0eb4d-b58e-75fd-96df-e10c244cfa9d';

  console.log('--- Step 1: Wait for Remesh tasks to complete ---');
  const [whiteRemesh, blackRemesh] = await Promise.all([
    pollTask('remesh', whiteRemeshId, 'White Knight Remesh'),
    pollTask('remesh', blackRemeshId, 'Black Knight Remesh')
  ]);

  console.log('--- Step 2: Trigger Rigging Tasks (Quadruped) ---');
  const rigTasks = [];

  for (const item of [
    { color: 'white', name: 'White Knight', remeshTask: whiteRemesh },
    { color: 'black', name: 'Black Knight', remeshTask: blackRemesh }
  ]) {
    const payload = {
      input_task_id: item.remeshTask.id,
      name: `${item.name} Rigging`,
      animation_type: 'quadruped',
      height_meters: 1.5
    };
    const res = await fetch('https://api.meshy.ai/openapi/v1/rigging', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Rigging start failed for ${item.name}: ${err}`);
    }
    const data = await res.json();
    console.log(`[${item.name}] Rigging task initiated: ${data.result}`);
    rigTasks.push({ color: item.color, name: item.name, rigId: data.result });
  }

  console.log('--- Step 3: Wait for Rigging tasks to complete ---');
  const rigResults = await Promise.all(
    rigTasks.map(t => pollTask('rigging', t.rigId, t.name))
  );

  console.log('--- Step 4: Process Results and Download ---');
  for (let i = 0; i < rigTasks.length; i++) {
    const info = rigTasks[i];
    const task = rigResults[i];
    console.log(`\n=== ${info.name} Rigged Result ===`);
    console.log(JSON.stringify(task.result, null, 2));

    const result = task.result;
    // Download rigged model or running animation model
    const outDir = path.join(__dirname, 'public', 'assets', 'models', 'meshy', info.color);
    
    // If running animation GLB exists in basic_animations, that's what we want for movement!
    if (result.basic_animations?.running_glb_url) {
      await downloadFile(result.basic_animations.running_glb_url, path.join(outDir, 'knight_run.glb'));
    }
    if (result.basic_animations?.walking_glb_url) {
      await downloadFile(result.basic_animations.walking_glb_url, path.join(outDir, 'knight_walk.glb'));
    }
    if (result.rigged_character_glb_url) {
      await downloadFile(result.rigged_character_glb_url, path.join(outDir, 'knight_rigged.glb'));
    }
  }

  console.log('\nAll rigging and animation tasks completed successfully!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
