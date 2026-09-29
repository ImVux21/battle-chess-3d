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
    print("Usage: blender --background --python optimize_worker.py -- <input_glb> <output_glb>")
    sys.exit(1)

input_glb = args[0]
output_glb = args[1]

print(f"\n[Worker] Optimizing: {os.path.basename(input_glb)} -> {os.path.basename(output_glb)}")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_glb)

# Decimate meshes
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        poly_count = len(obj.data.polygons)
        mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
        if poly_count > 40000:
            mod.ratio = max(0.04, 35000 / poly_count)
        else:
            mod.ratio = 0.5

# Downscale textures > 1024 to 1024
for img in bpy.data.images:
    if img.size[0] > 1024 or img.size[1] > 1024:
        img.scale(1024, 1024)

# Export optimized GLB
bpy.ops.export_scene.gltf(
    filepath=output_glb,
    export_format='GLB',
    export_apply=True,
    export_image_format='JPEG',
    export_jpeg_quality=85
)

orig_mb = os.path.getsize(input_glb) / (1024 * 1024)
new_mb = os.path.getsize(output_glb) / (1024 * 1024)
print(f"[Worker Done] {os.path.basename(input_glb)}: {orig_mb:.1f} MB -> {new_mb:.1f} MB (saved {100*(1 - new_mb/orig_mb):.1f}%)\n")
