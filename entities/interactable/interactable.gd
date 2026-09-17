extends PhysicsBody3D
class_name Interactable

@export var nodes_to_affect: Array[Node]
@export var flavor_text : String
@export var interaction_flavor_text : String

@export var color : Color = Color.DIM_GRAY

enum InteractionType{
	DEFAULT,
}

@onready var mesh : MeshInstance3D = find_children("*", "MeshInstance3D")[0]
@export var interaction_type : InteractionType = InteractionType.DEFAULT

@export var can_interact: bool = true
@export var is_interacting: bool = false

@export var can_pickup: bool = true
@export var is_picked_up : bool = false
var player_hand : Marker3D

func _ready() -> void:
	pass
	#self.set_collision_layer_value(1, true)
	#self.set_collision_layer_value(2, true)
	#self.top_level
	
func pre_interact(hand : Marker3D):
	player_hand = hand
	is_interacting = true
	
	return
	
func post_interact():
	is_interacting = false
	pass

func interact():
	if not can_interact:
		return
	print("Interacting")

#Runs every frame the player is looking at it
func highlight():
	Signals.emit_signal("show_object_screen_bounds", self)
	pass

func pre_pickup(hand : Marker3D):
	if !can_pickup:
		return
	player_hand = hand
	#self.set_collision_layer_value(1, false)
	#self.set_collision_layer_value(2, true)
	self.continuous_cd = true
	self.sleeping = false
	self.can_sleep = false
	is_picked_up = true
	
func post_pickup():
	is_picked_up = false
	self.set_collision_layer_value(1, true)
	self.set_collision_layer_value(2, true)
	self.continuous_cd = false
	self.can_sleep = true

func throw():
	post_pickup()
	var player_hand_position : Vector3 = player_hand.global_position
	var object_distance: Vector3 = player_hand_position - global_position
	
	var throw_direction = -player_hand.global_transform.basis.z.normalized()
	var throw_strength: float = 1.
	self.linear_velocity = throw_direction * throw_strength


func pickup(state: PhysicsDirectBodyState3D):
	var object_distance: Vector3 = (player_hand.global_position - global_position)
	var goal_lin_vel = (object_distance) / state.step
	state.linear_velocity = goal_lin_vel

func _process(delta: float) -> void:
	if !is_picked_up:
		return
	highlight()
	pass

func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
	
	if !is_picked_up:
		return
	pickup(state)
	pass

func _physics_process(delta: float) -> void:
	pass
