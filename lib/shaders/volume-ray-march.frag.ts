export const volumeFragmentShader = /* glsl */ `
precision highp float;
precision highp sampler3D;

in vec3 v_position;
in vec3 v_cameraLocal;

uniform sampler3D u_volumeData;
uniform sampler2D u_transferFunction;

uniform int u_renderMode;     // 0=DVR, 1=MIP, 2=Slice
uniform float u_windowCenter;
uniform float u_windowWidth;
uniform float u_thresholdMin;
uniform float u_thresholdMax;
uniform float u_opacity;
uniform int u_stepCount;

uniform bool u_sliceEnabled;
uniform vec3 u_sliceNormal;
uniform float u_slicePosition;
uniform float u_sliceThickness;

out vec4 fragColor;

// Ray-box intersection for unit cube [0,1]^3
vec2 intersectBox(vec3 origin, vec3 dir) {
  vec3 invDir = 1.0 / dir;
  vec3 t0 = (vec3(0.0) - origin) * invDir;
  vec3 t1 = (vec3(1.0) - origin) * invDir;
  vec3 tmin = min(t0, t1);
  vec3 tmax = max(t0, t1);
  float tNear = max(max(tmin.x, tmin.y), tmin.z);
  float tFar = min(min(tmax.x, tmax.y), tmax.z);
  return vec2(tNear, tFar);
}

// Apply windowing: remap scalar based on center and width
float applyWindow(float scalar) {
  float low = u_windowCenter - u_windowWidth * 0.5;
  float high = u_windowCenter + u_windowWidth * 0.5;
  return clamp((scalar - low) / (high - low), 0.0, 1.0);
}

void main() {
  vec3 rayOrigin = v_cameraLocal;
  vec3 rayDir = normalize(v_position - v_cameraLocal);

  vec2 tHit = intersectBox(rayOrigin, rayDir);
  tHit.x = max(tHit.x, 0.0);

  if (tHit.x >= tHit.y) {
    discard;
  }

  float stepSize = (tHit.y - tHit.x) / float(u_stepCount);

  // Slice mode: jump directly to the slice position
  if (u_renderMode == 2) {
    // Find intersection with slice plane
    // Plane: dot(p, normal) = position
    float denom = dot(rayDir, u_sliceNormal);
    if (abs(denom) < 0.0001) {
      discard;
    }
    float tSlice = (u_slicePosition - dot(rayOrigin, u_sliceNormal)) / denom;
    if (tSlice < tHit.x || tSlice > tHit.y) {
      discard;
    }

    vec3 samplePos = rayOrigin + rayDir * tSlice;
    float scalar = texture(u_volumeData, samplePos).r;
    scalar = applyWindow(scalar);

    if (scalar < u_thresholdMin || scalar > u_thresholdMax) {
      discard;
    }

    vec4 color = texture(u_transferFunction, vec2(scalar, 0.5));
    fragColor = vec4(color.rgb, 1.0);
    return;
  }

  // DVR and MIP modes
  vec4 accumulated = vec4(0.0);
  float maxIntensity = 0.0;
  vec3 maxColor = vec3(0.0);

  for (int i = 0; i < 512; i++) {
    if (i >= u_stepCount) break;

    float t = tHit.x + stepSize * (float(i) + 0.5);
    if (t > tHit.y) break;

    vec3 samplePos = rayOrigin + rayDir * t;

    // Clip against slice plane if enabled
    if (u_sliceEnabled) {
      float planeDist = dot(samplePos, u_sliceNormal) - u_slicePosition;
      if (planeDist > u_sliceThickness) continue;
    }

    float scalar = texture(u_volumeData, samplePos).r;
    scalar = applyWindow(scalar);

    // Threshold filter
    if (scalar < u_thresholdMin || scalar > u_thresholdMax) continue;

    vec4 tfColor = texture(u_transferFunction, vec2(scalar, 0.5));

    if (u_renderMode == 0) {
      // DVR: front-to-back compositing
      float alpha = tfColor.a * u_opacity * stepSize * 20.0;
      accumulated.rgb += (1.0 - accumulated.a) * tfColor.rgb * alpha;
      accumulated.a += (1.0 - accumulated.a) * alpha;

      // Early ray termination
      if (accumulated.a > 0.95) break;
    } else if (u_renderMode == 1) {
      // MIP: track maximum intensity
      if (scalar > maxIntensity) {
        maxIntensity = scalar;
        maxColor = tfColor.rgb;
      }
    }
  }

  if (u_renderMode == 0) {
    fragColor = vec4(accumulated.rgb, accumulated.a);
  } else if (u_renderMode == 1) {
    fragColor = vec4(maxColor, maxIntensity * u_opacity);
  }

  if (fragColor.a < 0.01) discard;
}
`;
