import bpy, time

# Ensure addon is loaded
try:
    import blender_mcp
    print("blender_mcp already imported")
except ImportError:
    import addon_utils
    addon_utils.enable("blender_mcp", default_set=True)
    import blender_mcp

server = getattr(bpy.types, "blendermcp_server", None)
if server is None or not server.running:
    server = blender_mcp.BlenderMCPServer(port=9876)
    bpy.types.blendermcp_server = server
    server.start()
    print("BlenderMCP server started on port 9876!")
else:
    print("BlenderMCP server is already running!")
