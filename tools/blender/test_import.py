import bpy, sys

char_path = r"c:\Users\vuodo\software\battle-chess-3d\public\assets\models\meshy\white\king.glb"
weapon_path = r"c:\Users\vuodo\software\battle-chess-3d\public\assets\models\meshy\weapons\white_king_greatsword.glb"

# Clear existing objects
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import character
bpy.ops.import_scene.gltf(filepath=char_path)
char_objs = [obj for obj in bpy.context.scene.objects]
print("Imported Character objects:", [o.name for o in char_objs])

# Import weapon
bpy.ops.import_scene.gltf(filepath=weapon_path)
all_objs = [obj for obj in bpy.context.scene.objects]
weapon_objs = [o for o in all_objs if o not in char_objs]
print("Imported Weapon objects:", [o.name for o in weapon_objs])

print("Blender successfully loaded both character and weapon!")
