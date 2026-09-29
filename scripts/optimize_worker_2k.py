import bpy
import os
import sys

# Arguments after '--'
argv = sys.argv
if "--" in argv:
    args = argv[argv.index("--") + 1:]
else:
    args = []

if len(args) < 2:
    print("Usage: blender --background --python optimize_worker_2k.py -- <input_glb> <output_glb> [target_tex] [target_poly]")
    sys.exit(1)

input_glb = args[0]
output_glb = args[1]
target_tex = int(args[2]) if len(args) > 2 else 2048
target_poly = int(args[3]) if len(args) > 3 else 45000

print(f"\n[Worker 2K] Optimizing: {os.path.basename(input_glb)} -> {os.path.basename(output_glb)} (tex: {target_tex}, poly: {target_poly})")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_glb)

# Decimate meshes cleanly
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        poly_count = len(obj.data.polygons)
        mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
        if poly_count > target_poly:
            mod.ratio = max(0.04, target_poly / poly_count)
        else:
            mod.ratio = 0.65

# Downscale textures > target_tex to target_tex (e.g. 2048x2048 for crisp 2K)
for img in bpy.data.images:
    if img.size[0] > target_tex or img.size[1] > target_tex:
        img.scale(target_tex, target_tex)

# Export optimized GLB with high quality JPEG (92%)
bpy.ops.export_scene.gltf(
    filepath=output_glb,
    export_format='GLB',
    export_apply=True,
    export_image_format='JPEG',
    export_jpeg_quality=92
)

orig_mb = os.path.getsize(input_glb) / (1024 * 1024)
new_mb = os.path.getsize(output_glb) / (1024 * 1024)
print(f"[Worker 2K Done] {os.path.basename(input_glb)}: {orig_mb:.1f} MB -> {new_mb:.1f} MB (2K sharp, saved {100*(1 - new_mb/orig_mb):.1f}%)\n")
