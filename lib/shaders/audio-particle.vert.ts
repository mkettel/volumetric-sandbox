export const audioParticleVertexShader = /* glsl */ `
  attribute vec3 a_color;

  uniform float u_pointSize;
  uniform float u_yScale;

  varying vec3 v_color;

  void main() {
    v_color = a_color;
    vec3 pos = vec3(position.x, position.y * u_yScale, position.z);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = min(u_pointSize * (10.0 / -mvPosition.z), 64.0);
  }
`;
