extends Node2D

var t := 0.0

func _process(delta: float) -> void:
	t += delta
	queue_redraw()

func _draw() -> void:
	# Ambient digital motes and drifting leaves above the route.
	for i in range(54):
		var x := 165.0 + fmod(float(i * 47) + t * 4.0, 300.0)
		var y := 110.0 + fmod(float(i * 31) + sin(t * 0.7 + float(i)) * 9.0, 145.0)
		var color := Color(0.55, 0.95, 0.72, 0.35) if i % 3 == 0 else Color(0.95, 0.86, 0.48, 0.26)
		draw_rect(Rect2(Vector2(floor(x), floor(y)), Vector2(2, 2)), color)
