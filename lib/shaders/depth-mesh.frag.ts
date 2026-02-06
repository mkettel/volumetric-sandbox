export const depthMeshFragmentShader = /* glsl */ `
  uniform sampler2D u_colorMap;
  uniform sampler2D u_depthMap;
  uniform float u_opacity;
  uniform float u_useDepthColor;

  varying vec2 vUv;

  void main() {
    vec3 photoColor = texture2D(u_colorMap, vUv).rgb;
    float depth = texture2D(u_depthMap, vUv).r;
    vec3 depthColor = mix(vec3(0.1, 0.2, 0.8), vec3(1.0, 0.3, 0.1), depth);
    vec3 color = mix(photoColor, depthColor, u_useDepthColor);
    gl_FragColor = vec4(color, u_opacity);
  }
`;
