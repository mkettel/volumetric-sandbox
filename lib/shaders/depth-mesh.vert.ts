export const depthMeshVertexShader = /* glsl */ `
  uniform sampler2D u_depthMap;
  uniform float u_depthScale;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    float depth = texture2D(u_depthMap, uv).r;
    vec3 pos = position;
    pos.z = depth * u_depthScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
