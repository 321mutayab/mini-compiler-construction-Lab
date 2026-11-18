import React, { useMemo, useState } from 'react';
import { ASTNode, formatNum } from '../compiler/compiler';

interface PositionedNode {
  node: ASTNode;
  x: number;
  y: number;
  depth: number;
  children: PositionedNode[];
}

interface SyntaxTreeVisualizerProps {
  ast: ASTNode;
}

/**
 * Computes a clean, balanced binary tree layout using leaf-index horizontal slots
 * so nodes never overlap regardless of expression depth.
 */
function buildTreeLayout(root: ASTNode): {
  positionedRoot: PositionedNode;
  nodes: PositionedNode[];
  edges: { from: PositionedNode; to: PositionedNode; role: string }[];
  width: number;
  height: number;
} {
  let leafIndex = 0;
  let maxDepth = 0;
  const horizontalSpacing = 98;
  const verticalSpacing = 94;

  function assignPositions(node: ASTNode, depth: number): PositionedNode {
    if (depth > maxDepth) maxDepth = depth;

    const children: PositionedNode[] = [];
    if (node.left) {
      children.push(assignPositions(node.left, depth + 1));
    }
    if (node.operand) {
      children.push(assignPositions(node.operand, depth + 1));
    }
    if (node.right) {
      children.push(assignPositions(node.right, depth + 1));
    }

    let x = 0;
    if (children.length === 0) {
      x = leafIndex * horizontalSpacing;
      leafIndex++;
    } else if (children.length === 1) {
      x = children[0].x;
    } else {
      x = (children[0].x + children[children.length - 1].x) / 2;
    }

    const y = depth * verticalSpacing;
    return {
      node,
      x,
      y,
      depth,
      children,
    };
  }

  const positionedRoot = assignPositions(root, 0);

  // Collect all nodes and edges, and normalize x/y with padding
  const rawNodes: PositionedNode[] = [];
  function collectNodes(p: PositionedNode) {
    rawNodes.push(p);
    p.children.forEach(collectNodes);
  }
  collectNodes(positionedRoot);

  const minX = Math.min(...rawNodes.map((n) => n.x));
  const maxX = Math.max(...rawNodes.map((n) => n.x));
  const padX = 76;
  const padY = 54;

  const width = Math.max(520, maxX - minX + padX * 2);
  const height = Math.max(270, maxDepth * verticalSpacing + padY * 2 + 24);
  const offsetX = (width - (maxX - minX)) / 2 - minX;

  rawNodes.forEach((n) => {
    n.x = n.x + offsetX;
    n.y = n.y + padY;
  });

  const edges: { from: PositionedNode; to: PositionedNode; role: string }[] = [];
  function collectEdges(p: PositionedNode) {
    if (p.children.length === 2) {
      edges.push({
        from: p,
        to: p.children[0],
        role: p.node.type === 'Assignment' ? 'target' : 'left',
      });
      edges.push({
        from: p,
        to: p.children[1],
        role: p.node.type === 'Assignment' ? 'expr' : 'right',
      });
    } else if (p.children.length === 1) {
      edges.push({
        from: p,
        to: p.children[0],
        role: 'operand',
      });
    }
    p.children.forEach(collectEdges);
  }
  collectEdges(positionedRoot);

  return { positionedRoot, nodes: rawNodes, edges, width, height };
}

export const SyntaxTreeVisualizer: React.FC<SyntaxTreeVisualizerProps> = ({ ast }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const layout = useMemo(() => buildTreeLayout(ast), [ast]);

  const selectedNode = useMemo(
    () => layout.nodes.find((n) => n.node.id === selectedNodeId) ?? null,
    [layout, selectedNodeId]
  );

  function getNodeRoleLabel(node: ASTNode): string {
    switch (node.type) {
      case 'Assignment':
        return 'Assignment Root (=)';
      case 'BinaryExpression':
        return node.operator === '*' || node.operator === '/'
          ? `High-Precedence Operator (${node.operator})`
          : `Additive Operator (${node.operator})`;
      case 'Identifier':
        return `Identifier (${node.label})`;
      case 'NumberLiteral':
        return `Numeric Constant (${node.label})`;
      case 'UnaryExpression':
        return `Unary Operator (${node.operator})`;
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-x-auto rounded-xl border border-slate-800/90 bg-[#050811] p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>Abstract Syntax Tree (AST) · Click any node to inspect its grammar role</span>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
              Assignment / Operator
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
              Identifier
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Number
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="mx-auto block w-full max-w-[680px] select-none"
          role="img"
          aria-label="Abstract Syntax Tree diagram"
        >
          <defs>
            <linearGradient id="ast-op-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="ast-id-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="ast-num-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>

          {/* Branches / Edges */}
          {layout.edges.map((edge, idx) => {
            const midY = (edge.from.y + edge.to.y) / 2;
            const pathD = `M ${edge.from.x} ${edge.from.y + 22} C ${edge.from.x} ${midY}, ${edge.to.x} ${midY}, ${edge.to.x} ${edge.to.y - 22}`;
            const labelX = (edge.from.x + edge.to.x) / 2;
            const labelY = (edge.from.y + edge.to.y) / 2 - 2;

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {edge.role}
                </text>
              </g>
            );
          })}

          {/* Tree Nodes */}
          {layout.nodes.map((item) => {
            const { node, x, y, depth } = item;
            const isSelected = selectedNodeId === node.id;
            const isOperator =
              node.type === 'Assignment' ||
              node.type === 'BinaryExpression' ||
              node.type === 'UnaryExpression';
            const isIdentifier = node.type === 'Identifier';

            const fillUrl = isOperator
              ? 'url(#ast-op-grad)'
              : isIdentifier
              ? 'url(#ast-id-grad)'
              : 'url(#ast-num-grad)';

            const strokeColor = isSelected
              ? '#f8fafc'
              : isOperator
              ? '#818cf8'
              : isIdentifier
              ? '#38bdf8'
              : '#34d399';

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                onClick={() =>
                  setSelectedNodeId((prev) => (prev === node.id ? null : node.id))
                }
                className="cursor-pointer transition-opacity hover:opacity-95"
              >
                {isSelected && (
                  <circle
                    r="30"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}
                <circle
                  r="23"
                  fill={fillUrl}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '2.5' : '1.75'}
                />
                <text
                  y="5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={String(node.label).length > 3 ? '12' : '15'}
                  fontWeight="600"
                  fontFamily="var(--font-mono)"
                >
                  {node.label}
                </text>

                {/* Evaluated sub-expression value annotation on operator nodes */}
                {node.type === 'BinaryExpression' &&
                  node.evaluatedValue !== undefined &&
                  !Number.isNaN(node.evaluatedValue) && (
                    <g transform="translate(27, -14)">
                      <rect
                        x="0"
                        y="-10"
                        width={Math.max(36, formatNum(node.evaluatedValue).length * 8 + 18)}
                        height="18"
                        rx="4"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <text
                        x={Math.max(36, formatNum(node.evaluatedValue).length * 8 + 18) / 2}
                        y="2"
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="10"
                        fontFamily="var(--font-mono)"
                      >
                        ={formatNum(node.evaluatedValue)}
                      </text>
                    </g>
                  )}

                {/* Depth indicator below leaf or root */}
                <text
                  y="36"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9.5"
                  fontFamily="var(--font-sans)"
                >
                  {node.type === 'Assignment'
                    ? 'Root'
                    : node.type === 'BinaryExpression'
                    ? `Level ${depth}`
                    : node.type === 'Identifier'
                    ? 'Var'
                    : 'Const'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Inspection Bar */}
      {selectedNode && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-500/30 bg-indigo-950/25 px-4 py-2.5 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-indigo-300">
              Node [{selectedNode.node.label}]
            </span>
            <span aria-hidden="true">·</span>
            <span>{getNodeRoleLabel(selectedNode.node)}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">Tree Depth: Level {selectedNode.depth}</span>
          </div>
          {selectedNode.node.evaluatedValue !== undefined &&
            !Number.isNaN(selectedNode.node.evaluatedValue) && (
              <span className="font-mono text-emerald-300">
                Subtree Value = {formatNum(selectedNode.node.evaluatedValue)}
              </span>
            )}
        </div>
      )}
    </div>
  );
};
