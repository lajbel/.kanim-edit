uniform vec2 u_box_position;
uniform vec2 u_box_size;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
	if (
		gl_FragCoord.x < u_box_position.x ||
		gl_FragCoord.x > u_box_position.x + u_box_size.x ||
		gl_FragCoord.y < u_box_position.y - u_box_size.y / 2.0 ||
		gl_FragCoord.y > u_box_position.y + u_box_size.y / 2.0
		
	) {
		return def_frag() * vec4(0.0, 0.0, 0.0, 0.0);
	}
	return def_frag();
}
