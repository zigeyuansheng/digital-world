extends Node2D

# Ambient, side-view field scene inspired by the Digital Partner clean-day
# background. There is deliberately no player-controlled character.
const CreatureScript = preload("res://scripts/creature.gd")

const ACTORS := [
	{"name": "Agumon", "texture": "res://assets/digimon/Agumon_f0.png", "pos": Vector2(140, 280), "radius": Vector2(7, 4), "speed": 0.55, "phase": 0.1},
	{"name": "Gabumon", "texture": "res://assets/digimon/Gabumon_f0.png", "pos": Vector2(205, 294), "radius": Vector2(13, 5), "speed": 0.42, "phase": 1.4},
	{"name": "Patamon", "texture": "res://assets/digimon/Patamon_f0.png", "pos": Vector2(360, 286), "radius": Vector2(18, 6), "speed": 0.63, "phase": 2.8},
	{"name": "Palmon", "texture": "res://assets/digimon/Palmon_f0.png", "pos": Vector2(430, 300), "radius": Vector2(10, 5), "speed": 0.35, "phase": 4.0},
	{"name": "Gomamon", "texture": "res://assets/digimon/Gomamon_f0.png", "pos": Vector2(484, 282), "radius": Vector2(12, 6), "speed": 0.72, "phase": 5.1},
	{"name": "Biyomon", "texture": "res://assets/digimon/Piyomon_f0.png", "pos": Vector2(90, 310), "radius": Vector2(8, 4), "speed": 0.5, "phase": 3.3},
]

var camera: Camera2D
var time := 0.0

func _ready() -> void:
	camera = $Camera2D
	var bg := Sprite2D.new()
	bg.texture = load("res://assets/backgrounds/field_background.png")
	bg.centered = false
	bg.scale = Vector2(0.5, 0.5)
	bg.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	bg.z_index = -100
	add_child(bg)
	for data in ACTORS:
		var creature := CreatureScript.new()
		creature.texture = load(data["texture"])
		# The baked background is 640x360; scene uses the 320x180 viewport.
		creature.position = data["pos"] * 0.5
		creature.scale = Vector2(0.4, 0.4)
		creature.wander_radius = data["radius"]
		creature.speed = data["speed"]
		creature.phase = data["phase"]
		creature.name = data["name"]
		creature.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		creature.z_index = int(creature.position.y)
		add_child(creature)

func _process(delta: float) -> void:
	time += delta
	camera.position = Vector2(160.0, 90.0) + Vector2(sin(time * 0.18) * 2.0, cos(time * 0.13) * 1.0)
