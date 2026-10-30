"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ArrowRight, Cube, TreeStructure } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const ThreeRootTree = dynamic(
  () => import("./three-root-tree").then((m) => m.ThreeRootTree),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] flex items-center justify-center text-xs text-text-tertiary">
        Loading 3D visualization…
      </div>
    ),
  }
);

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
}

export function LivingRootTree({ topics, onSelectTopic }: Props) {
  const [selectedNode, setSelectedNode] = useState<Topic | null>(
    topics.length > 0 ? topics[0] : null
  );
  const [renderMode, setRenderMode] = useState<"2d" | "3d">("2d");

  if (topics.length === 0) {
    return (
      <div className="card p-12 text-center text-xs text-text-tertiary">
        <p>No topics available to grow the tree.</p>
        <p className="mt-1">Add topics in the Topic Map to visualize your knowledge branches.</p>
      </div>
    );
  }

  // Divide topics: first 60% above ground, rest as prerequisite foundation roots
  const aboveGroundCount = Math.max(1, Math.ceil(topics.length * 0.65));
  const canopyTopics = topics.slice(0, aboveGroundCount);
  const rootTopics = topics.slice(aboveGroundCount);

  return (
    <div className="space-y-4">
      {/* Visual Canvas Container */}
      <div className="card p-6 bg-gradient-to-b from-bg-surface via-bg-surface to-bg-elevated/40 border-bg-border relative overflow-hidden">
        {/* Top Legend & 2D/3D Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-bg-border/60 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">Living Root Tree</span>
            <div className="flex items-center gap-1 bg-bg-base border border-bg-border p-0.5 rounded-md">
              <button
                onClick={() => setRenderMode("3d")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                  renderMode === "3d"
                    ? "bg-lime-500/15 text-lime-700 dark:text-lime-300 font-semibold"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                <Cube size={12} weight={renderMode === "3d" ? "fill" : "regular"} />
                3D Three.js
              </button>
              <button
                onClick={() => setRenderMode("2d")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                  renderMode === "2d"
                    ? "bg-lime-500/15 text-lime-700 dark:text-lime-300 font-semibold"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                <TreeStructure size={12} weight={renderMode === "2d" ? "fill" : "regular"} />
                2D Blueprint
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
              Demonstrated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              Developing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Needs Work
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-red-400/30" />
              Knot (Confident Error)
            </span>
          </div>
        </div>

        {/* Tree Visualizer: 3D Three.js or 2D SVG */}
        {renderMode === "3d" ? (
          <div className="my-2">
            <ThreeRootTree
              topics={topics}
              onSelectTopic={(id) => {
                const node = topics.find((t) => t.id === id);
                if (node) setSelectedNode(node);
                onSelectTopic(id);
              }}
              selectedTopicId={selectedNode?.id}
            />
          </div>
        ) : (
          <div className="relative w-full h-[360px] flex items-center justify-center my-2">
            <svg
              viewBox="0 0 600 360"
              className="w-full h-full max-w-2xl select-none"
            >
            {/* Ground Soil Divider Line */}
            <line
              x1="40"
              y1="190"
              x2="560"
              y2="190"
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-bg-border stroke-[1.5]"
            />
            <text
              x="50"
              y="182"
              className="text-[10px] fill-text-tertiary font-mono tracking-wider uppercase"
            >
              Above Ground (Syllabus Concepts)
            </text>
            <text
              x="50"
              y="206"
              className="text-[10px] fill-text-tertiary font-mono tracking-wider uppercase"
            >
              Below Ground (Foundation Roots)
            </text>

            {/* Central Trunk */}
            <motion.path
              d="M 300 190 L 300 110 Q 300 90 280 60 M 300 110 Q 300 90 320 60"
              stroke="#A8F25C"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="opacity-70"
            />

            {/* Central Root */}
            <motion.path
              d="M 300 190 L 300 270 Q 300 290 260 320 M 300 270 Q 300 290 340 320"
              stroke="#A8F25C"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="opacity-50"
            />

            {/* Canopy Branches & Nodes (Above Ground) */}
            {canopyTopics.map((topic, i) => {
              const total = canopyTopics.length;
              // Distribute nodes in an arc above ground
              const angle = Math.PI * (0.15 + (0.7 * (i / (Math.max(1, total - 1)))));
              const radius = 105;
              const cx = 300 + Math.cos(angle - Math.PI) * radius * 1.5;
              const cy = 180 - Math.sin(angle) * (radius * 0.95);

              const isSelected = selectedNode?.id === topic.id;
              const nodeColor =
                topic.status === "demonstrated"
                  ? "#A8F25C"
                  : topic.status === "developing"
                  ? "#60A5FA"
                  : topic.status === "needs_work"
                  ? "#FBBF24"
                  : "#525252";

              return (
                <g
                  key={topic.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(topic)}
                >
                  {/* Branch line from trunk to node */}
                  <line
                    x1="300"
                    y1="130"
                    x2={cx}
                    y2={cy}
                    stroke={nodeColor}
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    strokeOpacity={isSelected ? 0.9 : 0.4}
                  />

                  {/* Knot marker if confident error */}
                  {topic.confident_error && (
                    <circle
                      cx={(300 + cx) / 2}
                      cy={(130 + cy) / 2}
                      r="5.5"
                      fill="#EF4444"
                      className="animate-pulse"
                    />
                  )}

                  {/* Topic Node Circle */}
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "11" : "8"}
                    fill={nodeColor}
                    whileHover={{ scale: 1.3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  />

                  {/* Text label */}
                  <text
                    x={cx}
                    y={cy - 14}
                    textAnchor="middle"
                    className="text-[10px] font-sans font-medium fill-text-primary pointer-events-none drop-shadow-sm"
                  >
                    {topic.title.length > 18
                      ? `${topic.title.slice(0, 16)}…`
                      : topic.title}
                  </text>
                </g>
              );
            })}

            {/* Root System Nodes (Below Ground) */}
            {rootTopics.map((topic, i) => {
              const total = Math.max(1, rootTopics.length);
              const angle = Math.PI * (0.2 + (0.6 * (i / total)));
              const radius = 90;
              const cx = 300 + Math.cos(angle - Math.PI) * radius * 1.4;
              const cy = 205 + Math.sin(angle) * (radius * 0.9);

              const isSelected = selectedNode?.id === topic.id;
              const nodeColor =
                topic.status === "demonstrated"
                  ? "#A8F25C"
                  : topic.status === "developing"
                  ? "#60A5FA"
                  : topic.status === "needs_work"
                  ? "#FBBF24"
                  : "#525252";

              return (
                <g
                  key={topic.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(topic)}
                >
                  <line
                    x1="300"
                    y1="250"
                    x2={cx}
                    y2={cy}
                    stroke={nodeColor}
                    strokeWidth={isSelected ? "2" : "1"}
                    strokeOpacity={0.4}
                    strokeDasharray="2 2"
                  />

                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "9" : "6.5"}
                    fill={nodeColor}
                    whileHover={{ scale: 1.3 }}
                  />

                  <text
                    x={cx}
                    y={cy + 16}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-text-secondary pointer-events-none"
                  >
                    {topic.title.length > 16
                      ? `${topic.title.slice(0, 14)}…`
                      : topic.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

        {/* Selected Node Details Card */}
        {selectedNode && (
          <div className="card p-4 bg-bg-elevated/70 border-bg-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary truncate">
                  {selectedNode.title}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border",
                    selectedNode.status === "demonstrated"
                      ? "bg-lime-500/10 border-lime-500/20 text-lime-700 dark:text-lime-300"
                      : selectedNode.status === "developing"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : selectedNode.status === "needs_work"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-bg-elevated border-bg-border text-text-tertiary"
                  )}
                >
                  {selectedNode.status ? selectedNode.status.replace(/_/g, " ") : "not assessed"}
                </span>
                {selectedNode.confident_error && (
                  <span className="text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                    Knot Pending Recheck
                  </span>
                )}
              </div>
              {selectedNode.description && (
                <p className="text-xs text-text-secondary line-clamp-1">
                  {selectedNode.description}
                </p>
              )}
            </div>

            <button
              onClick={() => onSelectTopic(selectedNode.id)}
              className="px-3.5 py-1.5 bg-lime-300 text-text-inverse text-xs font-bold rounded-md hover:bg-lime-400 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <span>Diagnose Topic</span>
              <ArrowRight size={13} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
