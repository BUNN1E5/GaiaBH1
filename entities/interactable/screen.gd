extends MeshInstance3D

@export var screen_svp : SubViewport

func _process(delta: float) -> void:
	screen_svp.get_texture()
