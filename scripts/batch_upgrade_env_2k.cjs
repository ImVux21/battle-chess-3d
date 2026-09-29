const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BLENDER_EXE = 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
const WORKER_SCRIPT = path.join(__dirname, 'optimize_worker_2k.py');
const TASKS_JSON = 'C:\\Users\\vuodo\\.gemini\\antigravity\\brain\\e407c3b5-183b-46e5-b17b-48b8ebdf7079\\scratch\\all_meshy_tasks.json';

const data = JSON.parse(fs.readFileSync(TASKS_JSON, 'utf8'));
const tasksByName = new Map();
(data['/v1/image-to-3d'] || []).forEach(t => {
  if (t.name) tasksByName.set(t.name, t);
});

const targets = [
  { name: 'Floating Chess Arena', dest: 'public/assets/models/meshy/env/board/floating_chess_arena.glb', poly: 45000 },
  { name: 'White Faction Grand Citadel', dest: 'public/assets/models/meshy/env/bases/white_grand_citadel.glb', poly: 55000 },
  { name: 'White Canyon Cliff', dest: 'public/assets/models/meshy/env/cliffs/white_canyon_cliff.glb', poly: 45000 },
  { name: 'Black Canyon Cliff', dest: 'public/assets/models/meshy/env/cliffs/black_canyon_cliff.glb', poly: 45000 },
  { name: 'White Faction Terrain Props', dest: 'public/assets/models/meshy/env/props/white_terrain_props.glb', poly: 45000 },
  { name: 'Black Faction Terrain Props', dest: 'public/assets/models/meshy/env/props/black_terrain_props.glb', poly: 45000 }
];

async function download(url, dest) {
  console.log(`Downloading: ${url.slice(0, 80)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`Saved temp: ${dest} (${(buf.length / (1024*1024)).toFixed(1)} MB)`);
}

async function run() {
  console.log(`=== UPGRADING ${targets.length} EXTERIOR ENVIRONMENT MODELS TO 2K SHARP ===`);
  
  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const task = tasksByName.get(item.name);
    if (!task || !task.model_urls?.glb) {
      console.error(`Task not found: ${item.name}`);
      continue;
    }

    const tempFile = path.join(__dirname, `temp_env_${i}.glb`);
    const fullDest = path.join(__dirname, '..', item.dest);
    
    console.log(`\n[${i+1}/${targets.length}] Processing ${item.name}...`);
    await download(task.model_urls.glb, tempFile);

    const cmd = `"${BLENDER_EXE}" --background --python "${WORKER_SCRIPT}" -- "${tempFile}" "${fullDest}" 2048 ${item.poly}`;
    console.log(`Running Blender 2K optimizer...`);
    try {
      execSync(cmd, { stdio: 'inherit' });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
    const finalMb = (fs.statSync(fullDest).size / (1024 * 1024)).toFixed(1);
    console.log(`✓ Completed ${item.name} -> ${finalMb} MB (2K sharp)`);
  }

  console.log('\n=== ALL ENVIRONMENT MODELS UPGRADED TO 2K SUCCESSFULLY! ===');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
