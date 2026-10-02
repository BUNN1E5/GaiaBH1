#include "GlobalUniform"

struct Params {
	skybox_brightness : f32,

	star_center : vec3<f32>,
	star_radius : f32,
	star_color : vec4<f32>,

	black_hole_center : vec3<f32>,
	schwarzschild_radius : f32,

	near_bh_step_mult : f32,

	max_dist : f32,
	epsilon : f32,
	iterations : u32,

	use_redshift : i32, //this is bool, int here for padding
}

@group(2) @binding(0) var<uniform> materialUniform : Params;

@group(1) @binding(0) var baseMapSampler : sampler;
@group(1) @binding(1) var baseMap : texture_cube<f32>;

@vertex
fn vs_main(	
	@builtin(vertex_index) index:u32
) -> @builtin(position) vec4<f32> {
	//Code "borrowed" from:
	//https://wallisc.github.io/rendering/2021/04/18/Fullscreen-Pass.html
	
	let u : f32 = f32((index << 1) & 2);
	let v : f32 = f32(index & 2);
	let uv : vec2f = vec2f(u, v);

	return vec4f(uv * vec2f(2, -2) + vec2f(-1, 1), 0, 1);
}

@fragment
fn fs_main(
	@builtin(position) fragcoord	: vec4f
) -> @location(0) vec4f {
	//let screen_uv = fragcoord.xy / vec2f(globalUniform.windowWidth , globalUniform.windowHeight);
	let screen_uv = fragcoord.xy;
	let ro = globalUniform.CameraPos;
	
	let clip = vec4f(screen_uv, 1.0, 1.0);
	var view_dir :vec4f = globalUniform.projMatInv * clip;
	view_dir = vec4f(view_dir.xyz / view_dir.w, 0.0);
	let rd = normalize((globalUniform.viewToWorld * view_dir).xyz);

	let r : Ray = raymarch(ro, rd);
	return vec4f(solve_ray_color(r), 1);
}

struct Ray{
	origin : vec3f,
	dir : vec3f,
	pos : vec3f,
	dist : f32,
	hit : bool,
	inside_bh : bool,
	iterations : u32,
	id : u32,
}

struct Surface{
	dist : f32,
	id : u32
}

fn op_union(a : Surface, b : Surface ) -> Surface{
   	var res : Surface;
	res.dist = min(a.dist, b.dist);
	res.id = select(a.id, b.id, b.dist < a.dist);
	return res;
}

fn sd_sphere( p : vec3f, s : f32 ) -> f32{
  return length(p) - s;
}

fn map(r : Ray) -> Surface{
	var skybox : Surface;
	skybox.dist = materialUniform.max_dist;
	skybox.id = 0;

	var star : Surface;
	var p : vec3f = r.pos - materialUniform.star_center;
	
	star.dist = sd_sphere(p, materialUniform.star_radius);
	star.id = 2;
	return op_union(star, skybox);
}

fn raymarch(ro : vec3f, rd : vec3f) -> Ray{
	var r : Ray;
	r.origin = ro;
	r.pos = ro + rd * r.dist;
	r.dir = rd;
	for(var i : u32 =0; i < materialUniform.iterations; i += 1){
		r.iterations = i;
        let sdf : Surface = map(r);
		let d : f32 = sdf.dist;
		r.id = sdf.id;
		
		if(d < materialUniform.epsilon){
			r.hit = true; 
			return r; 
		}
		
		let rel_p : vec3f = r.pos - materialUniform.black_hole_center;
        let r2 : f32 = dot(rel_p, rel_p);
        let r_len : f32 = sqrt(r2);
		
		if (r_len < materialUniform.schwarzschild_radius * .1) {
            r.inside_bh = true;
			return r;
        }
		
        let L : vec3f = cross(rel_p, r.dir);
        let h2 : f32= dot(L, L);
        let accel : vec3f = -1.5 * materialUniform.schwarzschild_radius * h2 * rel_p / (r2 * r2 * r_len);
		let step_size : f32 = min(d, r_len * materialUniform.near_bh_step_mult);
		
		r.dist += step_size;
		r.pos += r.dir * step_size;
		r.dir = normalize(r.dir + accel * step_size);
		
		if(r.dist > materialUniform.max_dist) { break; }
    }
	return r;
}

fn solve_ray_color(r : Ray) -> vec3f{
	var color : vec3f;
	if(r.inside_bh){
		color = vec3f(0);
	} else if (r.hit){
		//Technically there is only the star atm... 
		let sun_mask : f32 = select(0.0, 1.0, r.id == 2); 
		color = (materialUniform.star_color.rgb * sun_mask) * materialUniform.star_color.a;
	} else{

		let dist_from_bh : f32 = length(r.origin - materialUniform.black_hole_center);
		let safe_dist: f32 = max(dist_from_bh, materialUniform.schwarzschild_radius + 0.001);
		let g_shift : f32 = 1./sqrt(1.0 - (materialUniform.schwarzschild_radius / (safe_dist)));
		var sky_color : vec3f = textureSampleLevel(baseMap, baseMapSampler, r.dir, 0.0).rgb;
		let brightness : f32 = clamp(1.0 / g_shift, 0.0, 1.0);
		if(materialUniform.use_redshift > 0){			
			sky_color.r *= brightness; // Red stays longest
			sky_color.g *= pow(brightness, 2.0);
			sky_color.b *= pow(brightness, 3.0); // Blue vanishes first
		}

		color = mix(vec3(0.0), sky_color * materialUniform.skybox_brightness, 1.);
	}
	return color;
}