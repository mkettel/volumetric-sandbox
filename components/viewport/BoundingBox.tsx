"use client";

import * as THREE from "three";

export function BoundingBox() {
  return (
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
      <lineBasicMaterial color="#666666" transparent opacity={0.4} />
    </lineSegments>
  );
}
