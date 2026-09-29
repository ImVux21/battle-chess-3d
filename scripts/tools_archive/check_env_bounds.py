import os
import json
import struct

def get_glb_bounds(glb_path):
    if not os.path.exists(glb_path):
        return None
    with open(glb_path, 'rb') as f:
        f.read(12)
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        json_data = json.loads(f.read(chunk_len).decode('utf-8'))
        
        positions_min = [float('inf')]*3
        positions_max = [float('-inf')]*3
        for mesh in json_data.get('meshes', []):
            for prim in mesh.get('primitives', []):
                pos_acc_idx = prim.get('attributes', {}).get('POSITION')
                if pos_acc_idx is not None:
                    acc = json_data.get('accessors', [])[pos_acc_idx]
                    p_min = acc.get('min')
                    p_max = acc.get('max')
                    if p_min and p_max:
                        for i in range(3):
                            positions_min[i] = min(positions_min[i], p_min[i])
                            positions_max[i] = max(positions_max[i], p_max[i])
        size = [positions_max[i] - positions_min[i] for i in range(3)] if positions_min[0] != float('inf') else [0,0,0]
        return {
            'min': [round(x, 3) for x in positions_min],
            'max': [round(x, 3) for x in positions_max],
            'size': [round(x, 3) for x in size]
        }

base = r"c:\Users\vuodo\software\battle-chess-3d\public\assets\models\meshy\env"
for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith('.glb'):
            p = os.path.join(root, f)
            b = get_glb_bounds(p)
            rel = os.path.relpath(p, base)
            print(f"{rel:35} | size (X,Y,Z): {b['size']} | min: {b['min']} | max: {b['max']}")
