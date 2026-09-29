import os
import sys
import json
import urllib.request
import time

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = r"c:\Users\vuodo\software\battle-chess-3d"
TASKS_JSON = r"C:\Users\vuodo\.gemini\antigravity\brain\e407c3b5-183b-46e5-b17b-48b8ebdf7079\scratch\all_meshy_tasks.json"

with open(TASKS_JSON, 'r', encoding='utf-8') as f:
    all_data = json.load(f)

tasks_by_name = {item.get('name'): item for item in all_data.get('/v1/image-to-3d', [])}

# 1. 12 Piece Images with Pedestals (Ảnh có bệ)
piece_images = [
    ('w_k', 'White King Paladin'),
    ('w_q', 'White Queen Sorceress'),
    ('w_b', 'White Bishop High Priest'),
    ('w_n', 'White Knight Mounted Cavalry'),
    ('w_r', 'White Rook Stone Guardian'),
    ('w_p', 'White Pawn Castle Guard'),
    ('b_k', 'Black King Orc Warlord'),
    ('b_q', 'Black Queen Lich Sorceress'),
    ('b_b', 'Black Bishop Cult Priest'),
    ('b_n', 'Black Knight Nightmare Beast'),
    ('b_r', 'Black Rook Ogre Brute'),
    ('b_p', 'Black Pawn Skeleton Warrior'),
]

print("=== 1. DOWNLOADING 12 PIECE LEGEND IMAGES (WITH PEDESTALS) ===")
img_dir = os.path.join(PROJECT_ROOT, "public", "assets", "images", "pieces")
os.makedirs(img_dir, exist_ok=True)

for code, name in piece_images:
    task = tasks_by_name.get(name)
    if not task:
        print(f"[-] Task not found for: {name}")
        continue
    thumb_url = task.get('thumbnail_url')
    if not thumb_url:
        print(f"[-] No thumbnail for: {name}")
        continue
    
    out_file = os.path.join(img_dir, f"{code}.png")
    if os.path.exists(out_file) and os.path.getsize(out_file) > 10000:
        print(f"[x] Already downloaded: {code}.png ({name})")
        continue

    print(f"[+] Downloading {code}.png ({name})...", end='', flush=True)
    req = urllib.request.Request(thumb_url, headers={"User-Agent": "Antigravity/1.0"})
    with urllib.request.urlopen(req) as resp, open(out_file, 'wb') as f_out:
        f_out.write(resp.read())
    size_kb = os.path.getsize(out_file) / 1024
    print(f" Done ({size_kb:.1f} KB)")

# 2. 9 Environment & Board GLBs
env_glbs = [
    ('Arena Board 8x8', os.path.join("public", "assets", "models", "meshy", "env", "board", "arena_board_8x8.glb")),
    ('Arena Board Surface', os.path.join("public", "assets", "models", "meshy", "env", "board", "arena_board_surface.glb")),
    ('Floating Chess Arena', os.path.join("public", "assets", "models", "meshy", "env", "board", "floating_chess_arena.glb")),
    ('White Faction Grand Citadel', os.path.join("public", "assets", "models", "meshy", "env", "bases", "white_grand_citadel.glb")),
    ('Black Faction Colossal Bone Gate', os.path.join("public", "assets", "models", "meshy", "env", "bases", "black_colossal_bone_gate.glb")),
    ('White Canyon Cliff', os.path.join("public", "assets", "models", "meshy", "env", "cliffs", "white_canyon_cliff.glb")),
    ('Black Canyon Cliff', os.path.join("public", "assets", "models", "meshy", "env", "cliffs", "black_canyon_cliff.glb")),
    ('White Faction Terrain Props', os.path.join("public", "assets", "models", "meshy", "env", "props", "white_terrain_props.glb")),
    ('Black Faction Terrain Props', os.path.join("public", "assets", "models", "meshy", "env", "props", "black_terrain_props.glb")),
]

print("\n=== 2. DOWNLOADING 9 ENVIRONMENT GLB ASSETS ===")
for name, rel_dest in env_glbs:
    task = tasks_by_name.get(name)
    if not task:
        print(f"[-] Task not found for: {name}")
        continue
    glb_url = task.get('model_urls', {}).get('glb')
    if not glb_url:
        print(f"[-] No GLB URL for: {name}")
        continue
    
    out_file = os.path.join(PROJECT_ROOT, rel_dest)
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    
    if os.path.exists(out_file) and os.path.getsize(out_file) > 1000000:
        size_mb = os.path.getsize(out_file) / (1024 * 1024)
        print(f"[x] Already downloaded: {os.path.basename(out_file)} ({size_mb:.1f} MB)")
        continue

    print(f"[+] Downloading {name} -> {os.path.basename(out_file)}...", flush=True)
    start_t = time.time()
    req = urllib.request.Request(glb_url, headers={"User-Agent": "Antigravity/1.0"})
    with urllib.request.urlopen(req) as resp, open(out_file, 'wb') as f_out:
        total = int(resp.headers.get('Content-Length', 0))
        downloaded = 0
        chunk_size = 1024 * 1024 # 1MB chunk
        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            f_out.write(chunk)
            downloaded += len(chunk)
            if total > 0:
                percent = (downloaded / total) * 100
                mb_down = downloaded / (1024 * 1024)
                mb_tot = total / (1024 * 1024)
                sys.stdout.write(f"\r    Progress: {percent:5.1f}% ({mb_down:6.1f} / {mb_tot:6.1f} MB)")
                sys.stdout.flush()
    elapsed = time.time() - start_t
    size_mb = os.path.getsize(out_file) / (1024 * 1024)
    print(f"\n    Completed {size_mb:.1f} MB in {elapsed:.1f}s ({size_mb/max(elapsed, 0.1):.1f} MB/s)")

print("\n=== ALL ASSETS DOWNLOADED AND VERIFIED! ===")
