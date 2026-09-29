const fs = require('fs');
const path = require('path');

const apiKey = 'msy_0JO6JEWcaDKiKhv3nvMDtVNPwuxTcLVH72Yr';
const headers = {
  'Authorization': 'Bearer ' + apiKey,
  'Content-Type': 'application/json'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function poll(url, name) {
  console.log(`[${name}] Polling ${url}...`);
  while (true) {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`[${name}] Failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    console.log(`[${name}] Status: ${data.status} (${data.progress ?? 0}%)`);
    if (data.status === 'SUCCEEDED') return data;
    if (data.status === 'FAILED' || data.status === 'EXPIRED') {
      throw new Error(`[${name}] Failed: ${JSON.stringify(data.task_error)}`);
    }
    await sleep(4000);
  }
}

async function download(url, dest) {
  console.log(`Downloading: ${dest}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`Saved ${dest} (${buf.length} bytes)`);
}

async function run() {
  const remeshId = '01a0eb68-5a75-74ae-8327-d5cb1d3d97b3';
  console.log('--- Waiting for Black Knight remesh ---');
  const remeshData = await poll(`https://api.meshy.ai/openapi/v1/remesh/${remeshId}`, 'Black Knight Remesh');

  console.log('--- Triggering Quadruped Rigging for Black Knight ---');
  const rigPayload = {
    input_task_id: remeshData.id,
    name: 'Black Knight Rigging',
    animation_type: 'quadruped',
    height_meters: 1.5
  };
  const rigRes = await fetch('https://api.meshy.ai/openapi/v1/rigging', {
    method: 'POST',
    headers,
    body: JSON.stringify(rigPayload)
  });
  if (!rigRes.ok) {
    throw new Error(`Rigging start failed: ${await rigRes.text()}`);
  }
  const rigData = await rigRes.json();
  console.log('Black Knight Rig Task ID:', rigData.result);

  const rigResult = await poll(`https://api.meshy.ai/openapi/v1/rigging/${rigData.result}`, 'Black Knight Rigging');

  console.log('--- Downloading Black Knight Rigged Assets ---');
  const dir = path.join(__dirname, 'public', 'assets', 'models', 'meshy', 'black');
  const res = rigResult.result;
  if (res.basic_animations?.running_glb_url) {
    await download(res.basic_animations.running_glb_url, path.join(dir, 'knight_run.glb'));
    await download(res.basic_animations.running_glb_url, path.join(dir, 'knight.glb'));
  }
  if (res.basic_animations?.walking_glb_url) {
    await download(res.basic_animations.walking_glb_url, path.join(dir, 'knight_walk.glb'));
  }
  if (res.rigged_character_glb_url) {
    await download(res.rigged_character_glb_url, path.join(dir, 'knight_rigged.glb'));
  }

  console.log('--- BLACK KNIGHT FULLY RIGGED AND DOWNLOADED! ---');
}

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
