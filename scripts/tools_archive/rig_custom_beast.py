import bpy
import math
from mathutils import Vector, Euler

bpy.ops.wm.read_factory_settings(use_empty=True)

input_path = r'public/assets/models/meshy/black/knight_standing.glb'
bpy.ops.import_scene.gltf(filepath=input_path)

mesh_obj = None
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break

bpy.context.view_layer.objects.active = mesh_obj
mesh_obj.select_set(True)

# 1. Add Armature
bpy.ops.object.armature_add(enter_editmode=True, align='WORLD', location=(0, 0, 0))
arm_obj = bpy.context.active_object
arm_obj.name = "KnightArmature"
arm_data = arm_obj.data

edit_bones = arm_data.edit_bones
for b in list(edit_bones):
    edit_bones.remove(b)

# Bones
b_root = edit_bones.new('root')
b_root.head = (0, 0, 0)
b_root.tail = (0, 0, 0.2)

b_spine = edit_bones.new('spine')
b_spine.head = (0, -0.4, 0.7)
b_spine.tail = (0, 0.2, 0.75)
b_spine.parent = b_root

b_chest = edit_bones.new('chest')
b_chest.head = (0, 0.2, 0.75)
b_chest.tail = (0, 0.55, 0.85)
b_chest.parent = b_spine

b_head = edit_bones.new('head')
b_head.head = (0, 0.55, 0.85)
b_head.tail = (0, 0.85, 1.0)
b_head.parent = b_chest

# Front Left
b_fl = edit_bones.new('leg_FL')
b_fl.head = (0.28, 0.42, 0.65)
b_fl.tail = (0.28, 0.38, 0.05)
b_fl.parent = b_chest

# Front Right
b_fr = edit_bones.new('leg_FR')
b_fr.head = (-0.28, 0.42, 0.65)
b_fr.tail = (-0.28, 0.38, 0.05)
b_fr.parent = b_chest

# Back Left
b_bl = edit_bones.new('leg_BL')
b_bl.head = (0.3, -0.45, 0.65)
b_bl.tail = (0.3, -0.50, 0.05)
b_bl.parent = b_spine

# Back Right
b_br = edit_bones.new('leg_BR')
b_br.head = (-0.3, -0.45, 0.65)
b_br.tail = (-0.3, -0.50, 0.05)
b_br.parent = b_spine

# Set envelope radiuses
for b in [b_root, b_spine, b_chest, b_head, b_fl, b_fr, b_bl, b_br]:
    b.envelope_distance = 0.35
    b.head_radius = 0.2
    b.tail_radius = 0.2

bpy.ops.object.mode_set(mode='OBJECT')

# 2. Add Armature Modifier to Mesh
mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
mod.object = arm_obj
mesh_obj.parent = arm_obj

# 3. Compute deterministic proximity vertex groups
bone_names = ['head', 'chest', 'spine', 'leg_FL', 'leg_FR', 'leg_BL', 'leg_BR']
for bname in bone_names:
    mesh_obj.vertex_groups.new(name=bname)

vg_map = {bname: mesh_obj.vertex_groups[bname] for bname in bone_names}

# Assign weights by vertex location
mesh = mesh_obj.data
for v in mesh.vertices:
    co = v.co
    # Check regions
    # Front legs vs Back legs
    is_left = co.x > 0.05
    is_right = co.x < -0.05
    is_front = co.y > 0.15
    is_back = co.y < -0.15
    is_lower = co.z < 0.65

    assigned = False
    if is_lower:
        if is_front and is_left:
            vg_map['leg_FL'].add([v.index], 1.0, 'REPLACE')
            assigned = True
        elif is_front and is_right:
            vg_map['leg_FR'].add([v.index], 1.0, 'REPLACE')
            assigned = True
        elif is_back and is_left:
            vg_map['leg_BL'].add([v.index], 1.0, 'REPLACE')
            assigned = True
        elif is_back and is_right:
            vg_map['leg_BR'].add([v.index], 1.0, 'REPLACE')
            assigned = True

    if not assigned:
        if co.y > 0.55:
            vg_map['head'].add([v.index], 1.0, 'REPLACE')
        elif co.y > 0.0:
            vg_map['chest'].add([v.index], 1.0, 'REPLACE')
        else:
            vg_map['spine'].add([v.index], 1.0, 'REPLACE')

print("Custom vertex weighting complete!")

# 4. Create Animation
action = bpy.data.actions.new(name="running")
arm_obj.animation_data_create()
arm_obj.animation_data.action = action

pose_bones = arm_obj.pose.bones

def key_rot(bone, frame, euler_deg):
    bone.rotation_mode = 'XYZ'
    bone.rotation_euler = Euler((math.radians(euler_deg[0]), math.radians(euler_deg[1]), math.radians(euler_deg[2])), 'XYZ')
    bone.keyframe_insert(data_path="rotation_euler", frame=frame)

# Gallop loop 24 frames
# Legs forward & backward swing
key_rot(pose_bones['leg_FL'], 1, (30, 0, 0))
key_rot(pose_bones['leg_FL'], 6, (0, 0, 0))
key_rot(pose_bones['leg_FL'], 12, (-30, 0, 0))
key_rot(pose_bones['leg_FL'], 18, (0, 0, 0))
key_rot(pose_bones['leg_FL'], 24, (30, 0, 0))

key_rot(pose_bones['leg_FR'], 1, (-30, 0, 0))
key_rot(pose_bones['leg_FR'], 6, (0, 0, 0))
key_rot(pose_bones['leg_FR'], 12, (30, 0, 0))
key_rot(pose_bones['leg_FR'], 18, (0, 0, 0))
key_rot(pose_bones['leg_FR'], 24, (-30, 0, 0))

key_rot(pose_bones['leg_BL'], 1, (-25, 0, 0))
key_rot(pose_bones['leg_BL'], 6, (0, 0, 0))
key_rot(pose_bones['leg_BL'], 12, (25, 0, 0))
key_rot(pose_bones['leg_BL'], 18, (0, 0, 0))
key_rot(pose_bones['leg_BL'], 24, (-25, 0, 0))

key_rot(pose_bones['leg_BR'], 1, (25, 0, 0))
key_rot(pose_bones['leg_BR'], 6, (0, 0, 0))
key_rot(pose_bones['leg_BR'], 12, (-25, 0, 0))
key_rot(pose_bones['leg_BR'], 18, (0, 0, 0))
key_rot(pose_bones['leg_BR'], 24, (25, 0, 0))

# Chest & Head bobbing
key_rot(pose_bones['chest'], 1, (-5, 0, 0))
key_rot(pose_bones['chest'], 12, (5, 0, 0))
key_rot(pose_bones['chest'], 24, (-5, 0, 0))

key_rot(pose_bones['head'], 1, (8, 0, 0))
key_rot(pose_bones['head'], 12, (-8, 0, 0))
key_rot(pose_bones['head'], 24, (8, 0, 0))

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 24

# Export
for p in [r'public/assets/models/meshy/black/knight_run.glb', r'public/assets/models/meshy/black/knight.glb']:
    bpy.ops.export_scene.gltf(
        filepath=p,
        export_format='GLB',
        use_selection=False,
        export_animations=True,
        export_skins=True
    )
print("SUCCESS: Exported rigged and skinned Black Knight!")
