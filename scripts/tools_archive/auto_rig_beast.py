import bpy
import math
from mathutils import Vector, Euler

# 1. Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# 2. Import GLB
input_path = r'public/assets/models/meshy/black/knight_standing.glb'
bpy.ops.import_scene.gltf(filepath=input_path)

mesh_obj = None
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break

if not mesh_obj:
    raise Exception("Mesh not found!")

# Ensure mesh is active
bpy.context.view_layer.objects.active = mesh_obj
mesh_obj.select_set(True)

# 3. Create Armature
bpy.ops.object.armature_add(enter_editmode=True, align='WORLD', location=(0, 0, 0))
arm_obj = bpy.context.active_object
arm_obj.name = "KnightArmature"
arm_data = arm_obj.data
arm_data.name = "KnightArmatureData"

# Remove default bone
edit_bones = arm_data.edit_bones
for b in list(edit_bones):
    edit_bones.remove(b)

# Define Quadruped Skeleton Bones
# Head facing +Y, Back at -Y
# Root
b_root = edit_bones.new('root')
b_root.head = (0, 0, 0)
b_root.tail = (0, 0, 0.2)

# Spine & Pelvis
b_spine = edit_bones.new('spine')
b_spine.head = (0, -0.4, 0.7)
b_spine.tail = (0, 0.2, 0.75)
b_spine.parent = b_root

# Chest
b_chest = edit_bones.new('chest')
b_chest.head = (0, 0.2, 0.75)
b_chest.tail = (0, 0.55, 0.85)
b_chest.parent = b_spine

# Head
b_head = edit_bones.new('head')
b_head.head = (0, 0.55, 0.85)
b_head.tail = (0, 0.85, 1.0)
b_head.parent = b_chest

# Front Left Leg
b_fl_upper = edit_bones.new('leg_FL_upper')
b_fl_upper.head = (0.28, 0.42, 0.7)
b_fl_upper.tail = (0.28, 0.40, 0.35)
b_fl_upper.parent = b_chest

b_fl_lower = edit_bones.new('leg_FL_lower')
b_fl_lower.head = (0.28, 0.40, 0.35)
b_fl_lower.tail = (0.28, 0.38, 0.05)
b_fl_lower.parent = b_fl_upper

# Front Right Leg
b_fr_upper = edit_bones.new('leg_FR_upper')
b_fr_upper.head = (-0.28, 0.42, 0.7)
b_fr_upper.tail = (-0.28, 0.40, 0.35)
b_fr_upper.parent = b_chest

b_fr_lower = edit_bones.new('leg_FR_lower')
b_fr_lower.head = (-0.28, 0.40, 0.35)
b_fr_lower.tail = (-0.28, 0.38, 0.05)
b_fr_lower.parent = b_fr_upper

# Back Left Leg
b_bl_upper = edit_bones.new('leg_BL_upper')
b_bl_upper.head = (0.3, -0.45, 0.68)
b_bl_upper.tail = (0.3, -0.48, 0.35)
b_bl_upper.parent = b_spine

b_bl_lower = edit_bones.new('leg_BL_lower')
b_bl_lower.head = (0.3, -0.48, 0.35)
b_bl_lower.tail = (0.3, -0.50, 0.05)
b_bl_lower.parent = b_bl_upper

# Back Right Leg
b_br_upper = edit_bones.new('leg_BR_upper')
b_br_upper.head = (-0.3, -0.45, 0.68)
b_br_upper.tail = (-0.3, -0.48, 0.35)
b_br_upper.parent = b_spine

b_br_lower = edit_bones.new('leg_BR_lower')
b_br_lower.head = (-0.3, -0.48, 0.35)
b_br_lower.tail = (-0.3, -0.50, 0.05)
b_br_lower.parent = b_br_upper

# Exit edit mode
bpy.ops.object.mode_set(mode='OBJECT')

# 4. Parent Mesh to Armature with Automatic Weights
mesh_obj.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

print("Parenting successful!")

# 5. Create Running Animation Action
action = bpy.data.actions.new(name="running")
arm_obj.animation_data_create()
arm_obj.animation_data.action = action

fps = 30
duration_frames = 24  # 0.8 second gallop loop

# Gallop keyframes for legs & spine
pose_bones = arm_obj.pose.bones

def key_rot(bone, frame, euler_deg):
    bone.rotation_mode = 'XYZ'
    bone.rotation_euler = Euler((math.radians(euler_deg[0]), math.radians(euler_deg[1]), math.radians(euler_deg[2])), 'XYZ')
    bone.keyframe_insert(data_path="rotation_euler", frame=frame)

# 4-beat trot/gallop cycle across 24 frames
# FL and BR move forward while FR and BL move back, then alternate
frames = [1, 6, 12, 18, 24]

# Front Left
key_rot(pose_bones['leg_FL_upper'], 1, (25, 0, 0))
key_rot(pose_bones['leg_FL_upper'], 6, (0, 0, 0))
key_rot(pose_bones['leg_FL_upper'], 12, (-25, 0, 0))
key_rot(pose_bones['leg_FL_upper'], 18, (0, 0, 0))
key_rot(pose_bones['leg_FL_upper'], 24, (25, 0, 0))

# Front Right
key_rot(pose_bones['leg_FR_upper'], 1, (-25, 0, 0))
key_rot(pose_bones['leg_FR_upper'], 6, (0, 0, 0))
key_rot(pose_bones['leg_FR_upper'], 12, (25, 0, 0))
key_rot(pose_bones['leg_FR_upper'], 18, (0, 0, 0))
key_rot(pose_bones['leg_FR_upper'], 24, (-25, 0, 0))

# Back Left
key_rot(pose_bones['leg_BL_upper'], 1, (-22, 0, 0))
key_rot(pose_bones['leg_BL_upper'], 6, (0, 0, 0))
key_rot(pose_bones['leg_BL_upper'], 12, (22, 0, 0))
key_rot(pose_bones['leg_BL_upper'], 18, (0, 0, 0))
key_rot(pose_bones['leg_BL_upper'], 24, (-22, 0, 0))

# Back Right
key_rot(pose_bones['leg_BR_upper'], 1, (22, 0, 0))
key_rot(pose_bones['leg_BR_upper'], 6, (0, 0, 0))
key_rot(pose_bones['leg_BR_upper'], 12, (-22, 0, 0))
key_rot(pose_bones['leg_BR_upper'], 18, (0, 0, 0))
key_rot(pose_bones['leg_BR_upper'], 24, (22, 0, 0))

# Head & Spine rhythmic bobbing
key_rot(pose_bones['chest'], 1, (-4, 0, 0))
key_rot(pose_bones['chest'], 12, (4, 0, 0))
key_rot(pose_bones['chest'], 24, (-4, 0, 0))

key_rot(pose_bones['head'], 1, (6, 0, 0))
key_rot(pose_bones['head'], 12, (-6, 0, 0))
key_rot(pose_bones['head'], 24, (6, 0, 0))

# Set playback range
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 24

# 6. Export GLB with Armature & Animation
export_path = r'public/assets/models/meshy/black/knight_run.glb'
bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format='GLB',
    use_selection=False,
    export_animations=True,
    export_skins=True
)

# Also save as main knight.glb
export_main = r'public/assets/models/meshy/black/knight.glb'
bpy.ops.export_scene.gltf(
    filepath=export_main,
    export_format='GLB',
    use_selection=False,
    export_animations=True,
    export_skins=True
)

print("SUCCESS: Black Knight rigged and exported with running animation!")
