extends Node2D

# Ambient Digimon actors for the FireRed-style File City map.
# No player-controlled character is included in this scene.
const CreatureScript = preload("res://scripts/creature.gd")

const ACTORS := [
	{"name": "Agumon", "texture": "res://assets/digimon/Agumon_f0.png", "pos": Vector2(105, 190), "radius": Vector2(8, 4), "speed": 0.55, "phase": 0.1},
	{"name": "Gabumon", "texture": "res://assets/digimon/Gabumon_f0.png", "pos": Vector2(165, 195), "radius": Vector2(12, 5), "speed": 0.42, "phase": 1.4},
	{"name": "Patamon", "texture": "res://assets/digimon/Patamon_f0.png", "pos": Vector2(65, 225), "radius": Vector2(18, 6), "speed": 0.63, "phase": 2.8},
	{"name": "Palmon", "texture": "res://assets/digimon/Palmon_f0.png", "pos": Vector2(160, 235), "radius": Vector2(10, 5), "speed": 0.35, "phase": 4.0},
	{"name": "Gomamon", "texture": "res://assets/digimon/Gomamon_f0.png", "pos": Vector2(105, 240), "radius": Vector2(12, 6), "speed": 0.72, "phase": 5.1},
	{"name": "Biyomon", "texture": "res://assets/digimon/Piyomon_f0.png", "pos": Vector2(265, 240), "radius": Vector2(8, 4), "speed": 0.5, "phase": 3.3},
]

func _ready() -> void:
	for data in ACTORS:
		var creature := CreatureScript.new()
		creature.texture = load(data["texture"])
		creature.position = data["pos"]
		creature.scale = Vector2(0.7, 0.7)
		creature.wander_radius = data["radius"]
		creature.speed = data["speed"]
		creature.phase = data["phase"]
		creature.name = data["name"]
		creature.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		creature.z_index = int(creature.position.y) + 40
		add_child(creature)
