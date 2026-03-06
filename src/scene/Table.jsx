import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createFeltTexture } from './textures/feltTexture';
import { createWoodTexture } from './textures/woodTexture';

// Semicircular blackjack table — felt surface + padded wood rail + legs
export default function Table({ quality = 'high' }) {
  const feltTex = useMemo(() => createFeltTexture(), []);
  const woodTex = useMemo(() => createWoodTexture(42), []);

  // Semicircle shape for extrusion
  const tableShape = useMemo(() => {
    const shape = new THREE.Shape();
    const rx = 3.2; // half-width
    const ry = 2.0; // depth
    // Flat front edge (near side, facing player)
    shape.moveTo(-rx, 0);
    // Semicircular back
    const segments = quality === 'high' ? 48 : 24;
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI * (i / segments);
      shape.lineTo(-Math.cos(angle) * rx, -Math.sin(angle) * ry);
    }
    shape.lineTo(-rx, 0);
    return shape;
  }, [quality]);

  // Rail path — arc along the curved edge
  const railCurve = useMemo(() => {
    const points = [];
    const rx = 3.3;
    const ry = 2.1;
    const segments = quality === 'high' ? 48 : 24;
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI * (i / segments);
      points.push(new THREE.Vector3(-Math.cos(angle) * rx, 0.12, -Math.sin(angle) * ry));
    }
    return new THREE.CatmullRomCurve3(points, false);
  }, [quality]);

  // Leg positions
  const legPositions = [
    [-2.5, -0.6, -0.3],
    [2.5, -0.6, -0.3],
    [-1.5, -0.6, -1.8],
    [1.5, -0.6, -1.8],
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* Felt surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 0]}
        receiveShadow
      >
        <extrudeGeometry
          args={[tableShape, {
            depth: 0.08,
            bevelEnabled: quality === 'high',
            bevelThickness: quality === 'high' ? 0.02 : 0,
            bevelSize: quality === 'high' ? 0.02 : 0,
            bevelSegments: quality === 'high' ? 3 : 1,
          }]}
        />
        <meshStandardMaterial
          map={feltTex}
          roughness={0.92}
          metalness={0}
          color="#0f3040"
        />
      </mesh>

      {/* Padded rail — tube along the curved edge */}
      <mesh castShadow>
        <tubeGeometry args={[railCurve, quality === 'high' ? 48 : 24, 0.12, 8, false]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.7}
          metalness={0.05}
          color="#5a3820"
        />
      </mesh>

      {/* Front rail — straight edge */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[6.4, 0.2, 0.2]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.7}
          metalness={0.05}
          color="#5a3820"
        />
      </mesh>

      {/* Table legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
          <meshStandardMaterial
            map={woodTex}
            roughness={0.75}
            metalness={0.05}
            color="#4a2e18"
          />
        </mesh>
      ))}
    </group>
  );
}
