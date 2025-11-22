import { Canvas } from '@react-three/fiber'
// import { PerspectiveCamera, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import FloatingObject from './FloatingObject'
import ParticleField from './ParticleField'

/**
 * Scene3D - Main 3D scene wrapper using React Three Fiber
 * Contains camera, lights, and 3D objects
 */
export default function Scene3D() {
    return (
        <div className="absolute inset-0 pointer-events-none">
            <Canvas
                className="pointer-events-auto"
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    {/* Camera */}
                    {/* <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} /> */}

                    {/* Lights */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
                    <pointLight position={[-10, -10, -5]} intensity={0.5} color="#21808d" />
                    <spotLight
                        position={[0, 10, 0]}
                        angle={0.3}
                        penumbra={1}
                        intensity={1}
                        color="#8b5cf6"
                    />

                    {/* 3D Objects */}
                    <FloatingObject />
                    {/* <ParticleField count={800} /> */}

                    {/* Environment */}
                    {/* <Environment preset="city" /> */}
                </Suspense>
            </Canvas>
        </div>
    )
}
