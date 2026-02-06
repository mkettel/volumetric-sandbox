export const particleFragmentShader = /* glsl */ `
  uniform float u_opacity;

  varying vec3 v_color;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(v_color, alpha * u_opacity);
  }
`;
