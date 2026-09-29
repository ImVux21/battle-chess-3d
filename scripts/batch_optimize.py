import os
import sys
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
WORKER_SCRIPT = r"c:\Users\vuodo\software\battle-chess-3d\scripts\optimize_worker.py"
MODELS_DIR = r"c:\Users\vuodo\software\battle-chess-3d\public\assets\models\meshy"

# Find all GLBs > 35 MB
targets = []
for root, dirs, files in os.walk(MODELS_DIR):
    for f in files:
        if f.endswith('.glb') and not f.endswith('.tmp.glb'):
            full_path = os.path.join(root, f)
            size_mb = os.path.getsize(full_path) / (1024 * 1024)
            if size_mb > 35.0:
                targets.append((full_path, size_mb))

# Sort smallest to largest so we see fast progress and tackle heavy ones
targets.sort(key=lambda x: x[1])

total_orig_mb = sum(sz for _, sz in targets)
print(f"=== FOUND {len(targets)} MODELS TO OPTIMIZE (>35 MB) ===", flush=True)
print(f"Total initial size: {total_orig_mb:.1f} MB\n", flush=True)

def process_model(item):
    filepath, orig_mb = item
    fname = os.path.basename(filepath)
    temp_out = filepath + ".tmp.glb"
    
    cmd = [
        BLENDER_EXE,
        "--background",
        "--python", WORKER_SCRIPT,
        "--",
        filepath,
        temp_out
    ]
    
    start_t = time.time()
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        if os.path.exists(temp_out) and os.path.getsize(temp_out) > 1000:
            new_mb = os.path.getsize(temp_out) / (1024 * 1024)
            os.replace(temp_out, filepath)
            elapsed = time.time() - start_t
            pct = 100 * (1 - new_mb / orig_mb)
            return True, fname, orig_mb, new_mb, elapsed, pct
        else:
            return False, fname, orig_mb, 0, 0, 0
    except subprocess.CalledProcessError as e:
        if os.path.exists(temp_out):
            try: os.remove(temp_out)
            except: pass
        err_msg = (e.stderr or e.stdout or "")[:300]
        return False, fname, orig_mb, 0, 0, err_msg

completed = 0
total_saved_mb = 0

# 2 parallel workers is the sweet spot: fast and won't exhaust RAM
with ThreadPoolExecutor(max_workers=2) as executor:
    futures = {executor.submit(process_model, item): item for item in targets}
    for future in as_completed(futures):
        success, fname, orig_mb, new_mb, elapsed, extra = future.result()
        completed += 1
        if success:
            saved = orig_mb - new_mb
            total_saved_mb += saved
            print(f"[{completed}/{len(targets)}] SUCCESS: {fname:32} | {orig_mb:5.1f}MB -> {new_mb:4.1f}MB (-{extra:.1f}%) in {elapsed:.1f}s", flush=True)
        else:
            print(f"[{completed}/{len(targets)}] FAILED:  {fname:32} | {extra}", flush=True)

print("\n" + "="*60, flush=True)
print(f"ALL MODELS OPTIMIZED!", flush=True)
print(f"Original: {total_orig_mb:.1f} MB -> Saved: {total_saved_mb:.1f} MB -> Remaining: {total_orig_mb - total_saved_mb:.1f} MB", flush=True)
print("="*60, flush=True)
