import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface Guardian3DCanvasProps {
  className?: string;
  variant?: "shield" | "coin";
  accentColor?: string;
}

/**
 * Visualizador interactivo 3D con Three.js
 * Cumple con el requerimiento de importar Three.js directamente en la vista previa,
 * renderizando el Escudo de Titanio de Nido y la Moneda Holográfica de Toto con rotación fluida y limpieza de memoria.
 */
export function Guardian3DCanvas({
  className = "w-full h-48",
  variant = "shield",
  accentColor = "#2EC4B6",
}: Guardian3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 192;

    // 1. Escena y Cámara Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    // 2. Renderizador con pixelRatio optimizado y transparencia
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Grupo principal para rotación interactiva
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 4. Geometría 3D según la variante (Escudo de Titanio o Moneda Holográfica)
    const primaryColor = new THREE.Color(accentColor);
    const goldColor = new THREE.Color("#F6BE22");

    let coreMesh: THREE.Mesh;
    let ringMesh: THREE.Mesh;

    if (variant === "shield") {
      // Escudo Cilíndrico de Titanio
      const shieldGeo = new THREE.CylinderGeometry(1.2, 0.9, 0.25, 6);
      const shieldMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        metalness: 0.85,
        roughness: 0.25,
        wireframe: false,
      });
      coreMesh = new THREE.Mesh(shieldGeo, shieldMat);
      coreMesh.rotation.x = Math.PI / 4;
      mainGroup.add(coreMesh);

      // Anillo de energía exterior
      const ringGeo = new THREE.TorusGeometry(1.5, 0.04, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: goldColor,
        transparent: true,
        opacity: 0.8,
      });
      ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      mainGroup.add(ringMesh);
    } else {
      // Moneda Holográfica de Inversión
      const coinGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.18, 32);
      const coinMat = new THREE.MeshStandardMaterial({
        color: goldColor,
        metalness: 0.9,
        roughness: 0.2,
      });
      coreMesh = new THREE.Mesh(coinGeo, coinMat);
      coreMesh.rotation.x = Math.PI / 3;
      mainGroup.add(coreMesh);

      // Anillo cuántico
      const ringGeo = new THREE.TorusGeometry(1.6, 0.03, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.7,
      });
      ringMesh = new THREE.Mesh(ringGeo, ringMat);
      mainGroup.add(ringMesh);
    }

    // Partículas orbitales de dopamina y solidez financiera
    const particleCount = 45;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.8 + (Math.random() - 0.5) * 0.4;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x4ee2d5,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
    });
    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particlesMesh);

    // 5. Iluminación PBR
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x2ec4b6, 1.2);
    dirLight2.position.set(-3, -2, 2);
    scene.add(dirLight2);

    // 6. Interacción táctil y de ratón sutil
    let mouseX = 0;
    let mouseY = 0;
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();
      mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("touchmove", handlePointerMove, { passive: true });

    // 7. Bucle de Animación
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotación continua
      mainGroup.rotation.y = elapsedTime * 0.7 + mouseX * 0.4;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.5) * 0.15 - mouseY * 0.3;

      if (ringMesh) {
        ringMesh.rotation.z = elapsedTime * 0.9;
      }
      if (particlesMesh) {
        particlesMesh.rotation.y = -elapsedTime * 0.4;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Manejador de redimensionamiento
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 300;
      const newH = container.clientHeight || 192;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    // 9. Limpieza estricta de memoria WebGL en desmontaje
    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("touchmove", handlePointerMove);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      coreMesh.geometry.dispose();
      if (Array.isArray(coreMesh.material)) {
        coreMesh.material.forEach((m) => m.dispose());
      } else {
        coreMesh.material.dispose();
      }

      if (ringMesh) {
        ringMesh.geometry.dispose();
        if (Array.isArray(ringMesh.material)) {
          ringMesh.material.forEach((m) => m.dispose());
        } else {
          ringMesh.material.dispose();
        }
      }

      if (particlesMesh) {
        particleGeo.dispose();
        particleMat.dispose();
      }

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [variant, accentColor]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing flex items-center justify-center"
      />
    </div>
  );
}

export default Guardian3DCanvas;
