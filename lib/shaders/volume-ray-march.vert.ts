export const volumeVertexShader = /* glsl */ `
out vec3 v_position;
out vec3 v_cameraLocal;

void main() {
  v_position = position + 0.5; // shift from [-0.5,0.5] to [0,1]

  // Camera position in local (model) space
  v_cameraLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz + 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
