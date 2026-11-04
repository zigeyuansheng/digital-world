extends Sprite2D

@export var wander_radius := Vector2(12, 6)
@export var speed := 0.6
@export var phase := 0.0

var base_position := Vector2.ZERO
var t := 0.0

func _ready() -> void:
	base_position = position
	centered = true
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	z_as_relative = false
	var shadow := Sprite2D.new()
	shadow.texture = load("res://assets/objects/shadow.png")
	shadow.centered = true
	shadow.position = Vector2(0, 14)
	shadow.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	shadow.z_index = -1
	shadow.z_as_relative = true
	shadow.modulate = Color(1, 1, 1, 0.65)
	add_child(shadow)

func _process(delta: float) -> void:
	t += delta
	position = base_position + Vector2(
		sin(t * speed + phase) * wander_radius.x,
		cos(t * speed * 0.68 + phase) * wander_radius.y
	)
	flip_h = cos(t * speed + phase) < 0.0
	z_index = int(position.y) + 40
