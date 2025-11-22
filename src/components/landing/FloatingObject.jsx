import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
// import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

/**
 * FloatingObject - Animated 3D geometric shape as hero centerpiece
 * Features: Rotation, distortion, color shifting
 */
export default function FloatingObject() {
    const meshRef = useRef()

    // Rotate and animate the object
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
            meshRef.current.rotation.y += 0.005
        }
    })

    return (
        // <Float
        //     speed={2}
        //     rotationIntensity={0.5}
        //     floatIntensity={1}
        // >
        <mesh ref={meshRef} scale={2.5}>
            <torusKnotGeometry args={[1, 0.3, 128, 16]} />
            {/* <MeshDistortMaterial
                    color="#21808d"
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0.2}
                    metalness={0.8}
                /> */}
            <meshStandardMaterial color="#21808d" />
        </mesh>
        // </Float>
    )
}
