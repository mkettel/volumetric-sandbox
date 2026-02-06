export const particleVertexShader = /* glsl */ `
  attribute vec3 a_color;
  attribute float a_zCurrent;
  attribute float a_zTarget;

  uniform float u_pointSize;
  uniform float u_zScale;
  uniform float u_explode;
  uniform float u_transition;

  varying vec3 v_color;

  void main() {
    v_color = a_color;

    // Lerp Z between current and target
    float z = mix(a_zCurrent, a_zTarget, u_transition) * u_zScale;

    // Radial explode push in XY
    vec2 dir = position.xy;
    float len = length(dir);
    vec2 push = len > 0.001 ? normalize(dir) * u_explode * len : vec2(0.0);

    vec3 pos = vec3(position.xy + push, z);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = min(u_pointSize * (10.0 / -mvPosition.z), 64.0);
  }
`;
