import bpy
import mathutils

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'public/assets/models/meshy/black/knight_clean.glb')

for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        print('=== MESH INFO ===')
        print('Name:', obj.name)
        print('Dimensions:', obj.dimensions)
        bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
        min_x = min(v.x for v in bbox)
        max_x = max(v.x for v in bbox)
        min_y = min(v.y for v in bbox)
        max_y = max(v.y for v in bbox)
        min_z = min(v.z for v in bbox)
        max_z = max(v.z for v in bbox)
        print(f'X: {min_x:.3f} to {max_x:.3f} (width: {max_x - min_x:.3f})')
        print(f'Y: {min_y:.3f} to {max_y:.3f} (depth: {max_y - min_y:.3f})')
        print(f'Z: {min_z:.3f} to {max_z:.3f} (height: {max_z - min_z:.3f})')
