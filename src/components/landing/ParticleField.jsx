import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ParticleField - Animated particle system for background ambience
 * Creates a field of floating particles with subtle movement
 */
export default function ParticleField({ count = 1000 }) {
    const points = useRef()

    // Generate random particle positions
    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            // Spread particles in a sphere
            const distance = Math.random() * 20 + 10
            const theta = THREE.MathUtils.randFloatSpread(360)
            const phi = THREE.MathUtils.randFloatSpread(360)

            positions[i * 3] = distance * Math.sin(theta) * Math.cos(phi)
            positions[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi)
            positions[i * 3 + 2] = distance * Math.cos(theta)
        }

        return positions
    }, [count])

    // Animate particles
    useFrame((state) => {
        if (points.current) {
            points.current.rotation.y = state.clock.elapsedTime * 0.05
            points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
        }
    })

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color="#21808d"
                transparent
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}
