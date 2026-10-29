"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Cube } from "@phosphor-icons/react";

interface Topic {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  status?: string;
  confident_error?: boolean;
}

interface Props {
  topics: Topic[];
  onSelectTopic: (topicId: string) => void;
  selectedTopicId?: string | null;
}

const STATUS_COLORS: Record<string, number> = {
  demonstrated: 0xa8f25c, // Lime brand
  developing: 0x60a5fa,   // Blue
  needs_work: 0xfbbf24,   // Amber
  not_started: 0x52525b,  // Zinc-600
};

export function ThreeRootTree({ topics, onSelectTopic, selectedTopicId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || topics.length === 0) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 360;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e10);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa8f25c, 1.2);
    dirLight.position.set(5, 10, 8);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xa8f25c, 2, 20);
    pointLight.position.set(0, 0, 4);
    scene.add(pointLight);

    // 5. Partition canopy vs roots
    const aboveCount = Math.max(1, Math.ceil(topics.length * 0.65));
    const canopy = topics.slice(0, aboveCount);
    const roots = topics.slice(aboveCount);

    // Mesh tracking for raycasting
    const topicMeshes: { mesh: THREE.Mesh; topic: Topic }[] = [];
    const interactiveObjects: THREE.Object3D[] = [];

    // Soil divider plane in 3D
    const soilGeo = new THREE.PlaneGeometry(24, 0.05);
    const soilMat = new THREE.MeshBasicMaterial({ color: 0x27272a, transparent: true, opacity: 0.6 });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.set(0, 0, 0);
    scene.add(soilMesh);

    // Center Trunk
    const trunkPoints = [
      new THREE.Vector3(0, -5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 4, 0),
    ];
    const trunkGeo = new THREE.BufferGeometry().setFromPoints(trunkPoints);
    const trunkMat = new THREE.LineBasicMaterial({ color: 0x3f3f46, linewidth: 2 });
    const trunkLine = new THREE.Line(trunkGeo, trunkMat);
    scene.add(trunkLine);

    // Position canopy topics (above Y = 0)
    canopy.forEach((topic, i) => {
      const angle = (i / canopy.length) * Math.PI * 1.4 - Math.PI * 0.7;
      const radius = 3.5 + (i % 2) * 1.2;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius * 0.7 + 0.6;
      const z = Math.sin(i * 1.5) * 1.2;

      // Color based on status or confident error
      let color = STATUS_COLORS[topic.status || "not_started"] || 0x52525b;
      if (topic.confident_error) color = 0xf87171; // red knot

      const geo = new THREE.SphereGeometry(0.38, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.2,
        emissive: color,
        emissiveIntensity: topic.id === selectedTopicId ? 0.6 : 0.25,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      topicMeshes.push({ mesh, topic });
      interactiveObjects.push(mesh);

      // Branch to trunk
      const branchGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.4, 0),
        new THREE.Vector3(x * 0.5, y * 0.4, z * 0.5),
        new THREE.Vector3(x, y, z),
      ]);
      const branchMat = new THREE.LineBasicMaterial({
        color: topic.status === "demonstrated" ? 0xa8f25c : 0x27272a,
        transparent: true,
        opacity: 0.8,
      });
      scene.add(new THREE.Line(branchGeo, branchMat));
    });

    // Position prerequisite roots (below Y = 0)
    roots.forEach((topic, i) => {
      const angle = (i / Math.max(roots.length, 1)) * Math.PI * 1.2 - Math.PI * 0.6;
      const radius = 2.8 + (i % 2) * 1.0;
      const x = Math.sin(angle) * radius;
      const y = -(Math.cos(angle) * radius * 0.6 + 0.8);
      const z = Math.cos(i * 2) * 1.0;

      let color = STATUS_COLORS[topic.status || "not_started"] || 0x52525b;
      if (topic.confident_error) color = 0xf87171;

      const geo = new THREE.SphereGeometry(0.32, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        emissive: color,
        emissiveIntensity: topic.id === selectedTopicId ? 0.5 : 0.2,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      topicMeshes.push({ mesh, topic });
      interactiveObjects.push(mesh);

      // Root branch
      const rootBranchGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.4, 0),
        new THREE.Vector3(x * 0.4, y * 0.5, z * 0.4),
        new THREE.Vector3(x, y, z),
      ]);
      const rootBranchMat = new THREE.LineBasicMaterial({
        color: 0x3f3f46,
        transparent: true,
        opacity: 0.6,
      });
      scene.add(new THREE.Line(rootBranchGeo, rootBranchMat));
    });

    // 6. Interaction: Mouse move + Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotationY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        targetRotationY += deltaX * 0.006;
        prevMouseX = e.clientX;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);
      if (intersects.length > 0) {
        const found = topicMeshes.find((item) => item.mesh === intersects[0].object);
        if (found) {
          setHoveredTopic(found.topic);
          container.style.cursor = "pointer";
          return;
        }
      }
      setHoveredTopic(null);
      container.style.cursor = isDragging ? "grabbing" : "default";
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);
      if (intersects.length > 0) {
        const found = topicMeshes.find((item) => item.mesh === intersects[0].object);
        if (found) {
          onSelectTopic(found.topic.id);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousemove", handlePointerMove);
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("click", handleClick);

    // 7. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth rotate
      scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.08;
      if (!isDragging) {
        targetRotationY += 0.001; // gentle idle rotation
      }

      // Gentle floating pulse
      topicMeshes.forEach(({ mesh, topic }, idx) => {
        mesh.position.y += Math.sin(elapsed * 1.5 + idx) * 0.0008;
        if (topic.confident_error) {
          const pulse = (Math.sin(elapsed * 4) + 1) * 0.15 + 0.3;
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousemove", handlePointerMove);
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("click", handleClick);
      resizeObserver.disconnect();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
      renderer.dispose();
    };
  }, [topics, onSelectTopic, selectedTopicId]);

  return (
    <div className="relative w-full h-[380px] rounded-lg overflow-hidden border border-bg-border bg-bg-surface select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* 3D Controls hint badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-bg-base/80 backdrop-blur-md border border-bg-border px-2.5 py-1 rounded-md text-[10px] text-text-tertiary">
        <Cube size={13} className="text-lime-400" />
        <span>Three.js 3D Engine • Drag to rotate • Click node to inspect</span>
      </div>

      {/* Hover tooltip */}
      {hoveredTopic && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-bg-elevated/90 backdrop-blur-md border border-lime-500/30 px-3.5 py-1.5 rounded-full text-xs text-text-primary flex items-center gap-2 shadow-lg pointer-events-none transition-all">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span className="font-medium">{hoveredTopic.title}</span>
          <span className="text-[10px] text-text-tertiary uppercase font-mono">
            {hoveredTopic.status?.replace("_", " ") || "Not Started"}
          </span>
        </div>
      )}
    </div>
  );
}
