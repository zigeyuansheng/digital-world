extends Node2D

const TILE := 16
const MAP_W := 40
const MAP_H := 24
const CreatureScript = preload("res://scripts/creature.gd")

const SPECIES := [
	{"name": "Agumon", "texture": "res://assets/digimon/Agumon_f0.png", "pos": Vector2i(19, 12), "radius": Vector2(10, 5), "speed": 0.62, "phase": 0.2},
	{"name": "Gabumon", "texture": "res://assets/digimon/Gabumon_f0.png", "pos": Vector2i(24, 15), "radius": Vector2(16, 4), "speed": 0.48, "phase": 1.7},
	{"name": "Patamon", "texture": "res://assets/digimon/Patamon_f0.png", "pos": Vector2i(15, 16), "radius": Vector2(24, 9), "speed": 0.7, "phase": 3.4},
	{"name": "Palmon", "texture": "res://assets/digimon/Palmon_f0.png", "pos": Vector2i(25, 16), "radius": Vector2(14, 7), "speed": 0.38, "phase": 2.2},
	{"name": "Gomamon", "texture": "res://assets/digimon/Gomamon_f0.png", "pos": Vector2i(17, 10), "radius": Vector2(8, 5), "speed": 0.8, "phase": 4.5},
	{"name": "Biyomon", "texture": "res://assets/digimon/Piyomon_f0.png", "pos": Vector2i(27, 12), "radius": Vector2(10, 8), "speed": 0.55, "phase": 5.8},
]

var tile_map: TileMapLayer
var objects: Node2D
var creatures: Node2D
var camera: Camera2D
var water_cells: Array[Vector2i] = []
var water_frame := 0
var water_timer := 0.0
var time := 0.0
var tree_nodes: Array[Sprite2D] = []
var tree_phases: Array[float] = []

func _ready() -> void:
	tile_map = $TileMap
	objects = $Objects
	creatures = $Creatures
	camera = $Camera2D
	build_tileset()
	build_map()
	build_objects()
	build_creatures()

func _process(delta: float) -> void:
	time += delta
	# Animated water: cycle the three water atlas frames.
	water_timer += delta
	if water_timer >= 0.38:
		water_timer = 0.0
		water_frame = (water_frame + 1) % 3
		for cell in water_cells:
			tile_map.set_cell(cell, 0, Vector2i(2 + water_frame, 1))
	# Subtle camera breathing — the scene feels alive without a controlled player.
	camera.position = Vector2(320.0, 192.0) + Vector2(sin(time * 0.23) * 4.0, cos(time * 0.17) * 2.0)
	# Tree canopy sway.
	for i in range(tree_nodes.size()):
		tree_nodes[i].rotation = sin(time * 0.35 + tree_phases[i]) * 0.006

func build_tileset() -> void:
	var tile_set := TileSet.new()
	tile_set.tile_size = Vector2i(TILE, TILE)
	var source := TileSetAtlasSource.new()
	source.texture = load("res://assets/tiles/terrain.png")
	source.texture_region_size = Vector2i(TILE, TILE)
	for y in range(3):
		for x in range(8):
			if y == 2 and x >= 3:
				continue
			source.create_tile(Vector2i(x, y))
	tile_set.add_source(source, 0)
	tile_map.tile_set = tile_set

func set_tile(x: int, y: int, atlas: Vector2i) -> void:
	if x >= 0 and x < MAP_W and y >= 0 and y < MAP_H:
		tile_map.set_cell(Vector2i(x, y), 0, atlas)

func build_map() -> void:
	water_cells.clear()
	# base grass
	for y in range(MAP_H):
		for x in range(MAP_W):
			set_tile(x, y, Vector2i((x * 7 + y * 13) % 4, 0))
	# main route path
	for x in range(19, 22):
		for y in range(7, MAP_H):
			set_tile(x, y, Vector2i(4 + ((x + y) % 4), 0))
	for x in range(14, 30):
		for y in range(14, 17):
			set_tile(x, y, Vector2i(4 + ((x + y) % 4), 0))
	# pond
	for x in range(28, 36):
		for y in range(7, 14):
			set_tile(x, y, Vector2i(2, 1))
			water_cells.append(Vector2i(x, y))
	# tall grass fields
	for x in range(11, 18):
		for y in range(15, 21):
			set_tile(x, y, Vector2i((x + y) % 2, 1))
	for x in range(23, 30):
		for y in range(18, 22):
			set_tile(x, y, Vector2i((x + y) % 2, 1))
	# flower patches
	for cell in [Vector2i(15, 9), Vector2i(17, 10), Vector2i(25, 6), Vector2i(31, 16), Vector2i(12, 11), Vector2i(22, 21)]:
		set_tile(cell.x, cell.y, Vector2i(5 + ((cell.x + cell.y) % 2), 1))
	# fence along house garden
	for x in range(12, 18):
		set_tile(x, 11, Vector2i(0, 2))
	for y in range(8, 11):
		set_tile(11, y, Vector2i(1, 2))

func add_object(path: String, tile_x: int, tile_y: int, z: int = 10) -> Sprite2D:
	var sprite := Sprite2D.new()
	sprite.texture = load(path)
	sprite.centered = false
	sprite.position = Vector2(tile_x * TILE, tile_y * TILE)
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	sprite.z_index = z
	objects.add_child(sprite)
	return sprite

func build_objects() -> void:
	# Cottage + sign + rock props around the route.
	add_object("res://assets/objects/house.png", 11, 7, 8)
	add_object("res://assets/objects/sign.png", 18, 10, 12)
	add_object("res://assets/objects/rock.png", 8, 12, 12)
	add_object("res://assets/objects/rock.png", 33, 17, 12)
	# Trees; z follows the tile row so foreground trees overlap correctly.
	var tree_positions := [
		Vector2i(2, 2), Vector2i(5, 2), Vector2i(8, 3), Vector2i(21, 2), Vector2i(25, 2), Vector2i(33, 2), Vector2i(37, 3),
		Vector2i(2, 8), Vector2i(4, 13), Vector2i(7, 18), Vector2i(2, 21), Vector2i(37, 9), Vector2i(39, 15), Vector2i(35, 22),
		Vector2i(14, 2), Vector2i(18, 4), Vector2i(30, 3), Vector2i(34, 5), Vector2i(9, 22), Vector2i(20, 20),
	]
	for pos in tree_positions:
		var tree := add_object("res://assets/objects/tree.png", pos.x, pos.y, 4 + pos.y)
		tree_nodes.append(tree)
		tree_phases.append(float(pos.x * 0.7 + pos.y * 0.3))
	# small grass/shrub clusters near the pond and path
	for pos in [Vector2i(26, 6), Vector2i(27, 15), Vector2i(12, 12), Vector2i(30, 19)]:
		add_object("res://assets/objects/rock.png", pos.x, pos.y, 3 + pos.y)

func build_creatures() -> void:
	for data in SPECIES:
		var creature := CreatureScript.new()
		creature.texture = load(data["texture"])
		creature.position = Vector2(data["pos"].x * TILE + 8, data["pos"].y * TILE + 8)
		creature.scale = Vector2(0.7, 0.7)
		creature.wander_radius = data["radius"]
		creature.speed = data["speed"]
		creature.phase = data["phase"]
		creature.name = data["name"]
		creature.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		creature.z_index = int(creature.position.y)
		creatures.add_child(creature)
