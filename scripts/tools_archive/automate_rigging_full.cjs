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
    await sleep(6000);
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
  const whiteRigId = '01a0eb5b-f302-75eb-be48-6a5032f65d16';
  const blackPreviewId = '01a0eb5e-04f0-7647-a85e-b839b381dcc7';

  console.log('=== Step 1: Wait for White Knight Rigging & Black Knight 3D Preview ===');
  
  // Track Black Knight Text-to-3D preview
  const blackPreviewPromise = poll(`https://api.meshy.ai/openapi/v2/text-to-3d/${blackPreviewId}`, 'Black Knight 3D Preview');
  
  // Track White Knight Rigging
  const whiteRigPromise = poll(`https://api.meshy.ai/openapi/v1/rigging/${whiteRigId}`, 'White Knight Rigging');

  const [blackPreview, whiteRig] = await Promise.all([blackPreviewPromise, whiteRigPromise]);

  console.log('=== Step 2: Handle White Knight Completed Rig ===');
  if (whiteRig.result) {
    const wRes = whiteRig.result;
    const wDir = path.join(__dirname, 'public', 'assets', 'models', 'meshy', 'white');
    if (wRes.basic_animations?.running_glb_url) {
      await download(wRes.basic_animations.running_glb_url, path.join(wDir, 'knight_run.glb'));
    }
    if (wRes.basic_animations?.walking_glb_url) {
      await download(wRes.basic_animations.walking_glb_url, path.join(wDir, 'knight_walk.glb'));
    }
    if (wRes.rigged_character_glb_url) {
      await download(wRes.rigged_character_glb_url, path.join(wDir, 'knight_rigged.glb'));
    }
  }

  console.log('=== Step 3: Trigger Refine (Texturing) for Black Knight ===');
  const refinePayload = {
    mode: 'refine',
    preview_task_id: blackPreview.id,
    enable_pbr: true,
    texture_richness: 'high'
  };
  const refineRes = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
    method: 'POST',
    headers,
    body: JSON.stringify(refinePayload)
  });
  if (!refineRes.ok) {
    throw new Error(`Refine start failed: ${await refineRes.text()}`);
  }
  const refineData = await refineRes.json();
  const blackRefineId = refineData.result;
  console.log(`Black Knight Refine Task ID: ${blackRefineId}`);

  const blackRefine = await poll(`https://api.meshy.ai/openapi/v2/text-to-3d/${blackRefineId}`, 'Black Knight 3D Refine');

  console.log('=== Step 4: Auto-Rig Black Knight (Quadruped) ===');
  const rigPayload = {
    input_task_id: blackRefine.id,
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
  const blackRigId = rigData.result;
  console.log(`Black Knight Rig Task ID: ${blackRigId}`);

  const blackRig = await poll(`https://api.meshy.ai/openapi/v1/rigging/${blackRigId}`, 'Black Knight Rigging');

  console.log('=== Step 5: Download Black Knight Rig & Animations ===');
  if (blackRig.result) {
    const bRes = blackRig.result;
    const bDir = path.join(__dirname, 'public', 'assets', 'models', 'meshy', 'black');
    if (bRes.basic_animations?.running_glb_url) {
      await download(bRes.basic_animations.running_glb_url, path.join(bDir, 'knight_run.glb'));
    }
    if (bRes.basic_animations?.walking_glb_url) {
      await download(bRes.basic_animations.walking_glb_url, path.join(bDir, 'knight_walk.glb'));
    }
    if (bRes.rigged_character_glb_url) {
      await download(bRes.rigged_character_glb_url, path.join(bDir, 'knight_rigged.glb'));
    }
  }

  console.log('=== ALL KNIGHTS RIGGED AND READY! ===');
}

run().catch(err => {
  console.error('Pipeline Error:', err);
  process.exit(1);
});
