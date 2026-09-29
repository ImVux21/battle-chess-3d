import os
import json
import struct

def get_glb_bounds(glb_path):
    with open(glb_path, 'rb') as f:
        f.read(12)
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        json_data = json.loads(f.read(chunk_len).decode('utf-8'))
        
        # Look at accessors for POSITION
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

models = [
    (r"public\assets\models\meshy\merged\white_king_armed.glb", "W_King"),
    (r"public\assets\models\meshy\merged\white_queen_armed.glb", "W_Queen"),
    (r"public\assets\models\meshy\merged\white_bishop_armed.glb", "W_Bishop"),
    (r"public\assets\models\meshy\white\knight.glb", "W_Knight"),
    (r"public\assets\models\meshy\merged\white_rook_armed.glb", "W_Rook"),
    (r"public\assets\models\meshy\merged\white_pawn_armed.glb", "W_Pawn"),
    (r"public\assets\models\meshy\merged\black_king_armed.glb", "B_King"),
    (r"public\assets\models\meshy\black\queen.glb", "B_Queen"),
    (r"public\assets\models\meshy\merged\black_bishop_armed.glb", "B_Bishop"),
    (r"public\assets\models\meshy\black\knight.glb", "B_Knight"),
    (r"public\assets\models\meshy\merged\black_rook_armed.glb", "B_Rook"),
    (r"public\assets\models\meshy\merged\black_pawn_armed.glb", "B_Pawn"),
]

for p, name in models:
    if os.path.exists(p):
        b = get_glb_bounds(p)
        print(f"{name:10} | min: {b['min']} | max: {b['max']} | size (X,Y,Z): {b['size']}")
    else:
        print(f"{name:10} | MISSING FILE {p}")
