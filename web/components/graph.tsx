"use client"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Node,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  addNode,
  getFutureSuggestions,
  type AddNodeInput,
  type GetFutureSuggestionsResult,
} from "@/actions/nodes/actions"
import { nodeTypes } from "@/components/circle-node"
import { GraphFutureSuggestionsPanel } from "@/components/graph-future-suggestions-panel"
import {
  GraphNodeAddDialog,
  type GraphNodeAddDraft,
} from "@/components/graph-node-add-dialog"
import { Info } from "lucide-react"
import { useGraphState } from "@/hooks/use-graph-state"
import type { GraphTreeData } from "@/lib/user-tree"

const SUGGESTION_NODE_PREFIX = "future-suggestion:"
const GRAPH_NODE_DIAMETER = 80
const GRAPH_NODE_RADIUS = GRAPH_NODE_DIAMETER / 2
const OVERLAY_MOBILE_NODE_DIAMETER = 58
const OVERLAY_DESKTOP_NODE_DIAMETER = 80
const OVERLAY_MOBILE_BRANCH_GAP_X = 78
const OVERLAY_DESKTOP_BRANCH_GAP_X = 148
const OVERLAY_MOBILE_STEP_GAP_Y = 82
const OVERLAY_DESKTOP_STEP_GAP_Y = 114
const OVERLAY_EDGE_COLOR = "#f472b6"
const OVERLAY_NODE_OPACITY = [0.92, 0.82, 0.72] as const

type OverlayPoint = {
  x: number
  y: number
}

function getCircleEdgePoints(args: {
  from: OverlayPoint
  fromRadius: number
  to: OverlayPoint
  toRadius: number
}) {
  const dx = args.to.x - args.from.x
  const dy = args.to.y - args.from.y
  const distance = Math.hypot(dx, dy) || 1
  const unitX = dx / distance
  const unitY = dy / distance

  return {
    end: {
      x: args.to.x - unitX * args.toRadius,
      y: args.to.y - unitY * args.toRadius,
    },
    start: {
      x: args.from.x + unitX * args.fromRadius,
      y: args.from.y + unitY * args.fromRadius,
    },
  }
}

function getNodeLabel(node: Node) {
  const value = (node.data as { label?: unknown } | undefined)?.label
  return typeof value === "string" ? value : ""
}

export default function Graph({
  initialGraphData,
}: {
  initialGraphData?: GraphTreeData | null
}) {
  const {
    nodes,
    edges,
    errorMessage,
    isLoading,
    isUsingMockData,
    onNodesChange,
    onEdgesChange,
  } = useGraphState(initialGraphData)
  const router = useRouter()
  const graphWrapperRef = useRef<HTMLDivElement | null>(null)
  const reactFlowRef = useRef<ReactFlowInstance | null>(null)
  const [draft, setDraft] = useState<GraphNodeAddDraft | null>(null)
  const [concreteAnswer, setConcreteAnswer] = useState("")
  const [abstractAnswer, setAbstractAnswer] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [futureSuggestions, setFutureSuggestions] =
    useState<GetFutureSuggestionsResult | null>(null)
  const [futureSuggestionNodeId, setFutureSuggestionNodeId] = useState<
    string | null
  >(null)
  const [futureSuggestionError, setFutureSuggestionError] = useState<
    string | null
  >(null)
  const [isSuggesting, startSuggestionTransition] = useTransition()
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [isInfoExpanded, setIsInfoExpanded] = useState(false)
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    zoom: 1,
  })
  const [containerSize, setContainerSize] = useState({
    height: 0,
    width: 0,
  })
  const futureSuggestionRequestIdRef = useRef(0)
  const isMobileViewport = containerSize.width > 0 && containerSize.width < 768

  const displayGraph = useMemo(() => {
    const selectedNodeId = futureSuggestionNodeId
    return {
      edges,
      nodes: nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: selectedNodeId !== null && node.id === selectedNodeId,
        },
      })),
    }
  }, [edges, futureSuggestionNodeId, nodes])

  useEffect(() => {
    const element = graphWrapperRef.current
    if (!element) {
      return
    }

    const updateSize = () => {
      setContainerSize({
        height: element.clientHeight,
        width: element.clientWidth,
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (displayGraph.nodes.length === 0) {
      return
    }

    requestAnimationFrame(() => {
      reactFlowRef.current?.fitView({ padding: 0.2 })
      if (reactFlowRef.current) {
        setViewport(reactFlowRef.current.getViewport())
      }
    })
  }, [displayGraph.edges, displayGraph.nodes])

  useEffect(() => {
    let showFrameId = 0
    const hideFrameId = requestAnimationFrame(() => {
      setIsOverlayVisible(false)

      if (!futureSuggestions || futureSuggestions.suggestions.length === 0) {
        return
      }

      showFrameId = requestAnimationFrame(() => {
        setIsOverlayVisible(true)
      })
    })

    return () => {
      cancelAnimationFrame(hideFrameId)
      cancelAnimationFrame(showFrameId)
    }
  }, [futureSuggestions])

  const suggestionOverlay = useMemo(() => {
    if (
      !futureSuggestions ||
      futureSuggestions.suggestions.length === 0 ||
      containerSize.width === 0 ||
      containerSize.height === 0
    ) {
      return null
    }

    const sourceNode = displayGraph.nodes.find(
      (node) => node.id === futureSuggestions.nodeId
    )

    if (!sourceNode) {
      return null
    }

    const isMobileViewport = containerSize.width < 768
    const overlayNodeDiameter = isMobileViewport
      ? OVERLAY_MOBILE_NODE_DIAMETER
      : OVERLAY_DESKTOP_NODE_DIAMETER
    const overlayNodeRadius = overlayNodeDiameter / 2
    const overlayBranchGapX = isMobileViewport
      ? OVERLAY_MOBILE_BRANCH_GAP_X
      : OVERLAY_DESKTOP_BRANCH_GAP_X
    const overlayStepGapY = isMobileViewport
      ? OVERLAY_MOBILE_STEP_GAP_Y
      : OVERLAY_DESKTOP_STEP_GAP_Y
    const sidePadding = overlayNodeRadius + (isMobileViewport ? 10 : 16)
    const topReservedSpace = isMobileViewport ? 108 : 56
    const sourceCenterX =
      (sourceNode.position.x + GRAPH_NODE_RADIUS) * viewport.zoom + viewport.x
    const sourceCenterY =
      (sourceNode.position.y + GRAPH_NODE_RADIUS) * viewport.zoom + viewport.y
    const sourceRadius = GRAPH_NODE_RADIUS * viewport.zoom
    const maxVisibleDepth = Math.max(
      1,
      Math.min(
        isMobileViewport ? 2 : 3,
        Math.floor(
          Math.max(sourceCenterY - topReservedSpace, 0) / overlayStepGapY
        ) || 1
      )
    )
    const minCenterX = sidePadding
    const maxCenterX = containerSize.width - sidePadding
    const availableTrackWidth = Math.max(maxCenterX - minCenterX, 0)

    const nodes = futureSuggestions.suggestions.flatMap(
      (suggestion, branchIndex, allSuggestions) => {
        const centeredOffset =
          (branchIndex - (allSuggestions.length - 1) / 2) * overlayBranchGapX
        const preferredCenterX = sourceCenterX + centeredOffset
        const distributedCenterX =
          allSuggestions.length === 1
            ? sourceCenterX
            : minCenterX +
              (availableTrackWidth * branchIndex) / (allSuggestions.length - 1)
        const blendRatio = isMobileViewport ? 0.82 : 0.38
        const branchCenterX = Math.min(
          maxCenterX,
          Math.max(
            minCenterX,
            preferredCenterX * (1 - blendRatio) +
              distributedCenterX * blendRatio
          )
        )

        return suggestion.steps
          .slice(0, maxVisibleDepth)
          .map((step, stepIndex) => ({
            centerX: branchCenterX,
            centerY: sourceCenterY - (stepIndex + 1) * overlayStepGapY,
            diameter: overlayNodeDiameter,
            id: `${suggestion.id}:${step.id}:${stepIndex}`,
            label: step.label,
            profileHref: suggestion.profileHref,
            previousPoint:
              stepIndex === 0
                ? { x: sourceCenterX, y: sourceCenterY }
                : {
                    x: branchCenterX,
                    y: sourceCenterY - stepIndex * overlayStepGapY,
                  },
            stepIndex,
          }))
      }
    )

    const edges = nodes.map((node) => {
      const { end, start } = getCircleEdgePoints({
        from: node.previousPoint,
        fromRadius: node.stepIndex === 0 ? sourceRadius : overlayNodeRadius,
        to: { x: node.centerX, y: node.centerY },
        toRadius: overlayNodeRadius,
      })

      return {
        end,
        id: `edge:${node.id}`,
        start,
        stepIndex: node.stepIndex,
      }
    })

    return {
      edges,
      isMobileViewport,
      nodeDiameter: overlayNodeDiameter,
      nodes,
    }
  }, [
    containerSize.height,
    containerSize.width,
    displayGraph.nodes,
    futureSuggestions,
    viewport.x,
    viewport.y,
    viewport.zoom,
  ])

  function closeFutureSuggestions() {
    futureSuggestionRequestIdRef.current += 1
    setFutureSuggestions(null)
    setFutureSuggestionNodeId(null)
    setFutureSuggestionError(null)
  }

  const interactiveNodes = useMemo(
    () =>
      displayGraph.nodes.map((node) => {
        const isSuggestionPreview = node.id.startsWith(SUGGESTION_NODE_PREFIX)

        return {
          ...node,
          data: {
            ...node.data,
            canAddFuture: !isUsingMockData && !isSuggestionPreview,
            canAddPast: !isUsingMockData && !isSuggestionPreview,
            onAddFuture:
              isUsingMockData || isSuggestionPreview
                ? undefined
                : () => {
                    setDraft({
                      anchor: "future",
                      nodeId: node.id,
                      nodeLabel: getNodeLabel(node),
                    })
                    setConcreteAnswer("")
                    setAbstractAnswer("")
                    setSubmitError(null)
                  },
            onAddPast:
              isUsingMockData || isSuggestionPreview
                ? undefined
                : () => {
                    setDraft({
                      anchor: "past",
                      nodeId: node.id,
                      nodeLabel: getNodeLabel(node),
                    })
                    setConcreteAnswer("")
                    setAbstractAnswer("")
                    setSubmitError(null)
                  },
          },
        }
      }),
    [displayGraph.nodes, isUsingMockData]
  )

  function closeDialog() {
    setDraft(null)
    setConcreteAnswer("")
    setAbstractAnswer("")
    setSubmitError(null)
  }

  function buildAddNodePayload(
    activeDraft: GraphNodeAddDraft
  ): AddNodeInput | null {
    const parentEdge = edges.find((edge) => edge.target === activeDraft.nodeId)
    const childEdges = edges.filter(
      (edge) => edge.source === activeDraft.nodeId
    )

    if (activeDraft.anchor === "future") {
      if (childEdges.length > 1) {
        setSubmitError(
          "分岐しているノードの未来追加はまだ未対応です。直線の経路で使ってください。"
        )
        return null
      }

      return {
        mutateMode: childEdges.length === 0 ? "append" : "insert-between",
        parentId: activeDraft.nodeId,
        targetChildId:
          childEdges.length === 1 ? childEdges[0]?.target : undefined,
        concreteAnswer: concreteAnswer.trim(),
        abstractAnswer:
          abstractAnswer.trim() === "" ? undefined : abstractAnswer.trim(),
      }
    }

    if (!parentEdge) {
      return {
        mutateMode: "prepend-root",
        parentId: activeDraft.nodeId,
        concreteAnswer: concreteAnswer.trim(),
        abstractAnswer:
          abstractAnswer.trim() === "" ? undefined : abstractAnswer.trim(),
      }
    }

    return {
      mutateMode: "insert-between",
      parentId: parentEdge.source,
      targetChildId: activeDraft.nodeId,
      concreteAnswer: concreteAnswer.trim(),
      abstractAnswer:
        abstractAnswer.trim() === "" ? undefined : abstractAnswer.trim(),
    }
  }

  function handleSubmit() {
    if (!draft) {
      return
    }

    const payload = buildAddNodePayload(draft)
    if (!payload) {
      return
    }

    startTransition(async () => {
      setSubmitError(null)
      const result = await addNode(payload)

      if ("error" in result) {
        setSubmitError(result.error.message)
        return
      }

      closeDialog()
      router.refresh()
    })
  }

  function handleNodeClick(nodeId: string) {
    if (isUsingMockData || nodeId.startsWith(SUGGESTION_NODE_PREFIX)) {
      return
    }

    if (futureSuggestionNodeId === nodeId && !isSuggesting) {
      closeFutureSuggestions()
      return
    }

    setFutureSuggestionNodeId(nodeId)
    setFutureSuggestionError(null)
    setFutureSuggestions(null)
    futureSuggestionRequestIdRef.current += 1
    const requestId = futureSuggestionRequestIdRef.current

    startSuggestionTransition(async () => {
      const result = await getFutureSuggestions({ nodeId })
      if (requestId !== futureSuggestionRequestIdRef.current) {
        return
      }

      if ("error" in result) {
        setFutureSuggestionError(result.error.message)
        return
      }

      setFutureSuggestions(result)
    })
  }

  return (
    <div ref={graphWrapperRef} className="relative h-full w-full">
      <ReactFlow
        nodes={interactiveNodes}
        edges={displayGraph.edges}
        onInit={(instance) => {
          reactFlowRef.current = instance as unknown as ReactFlowInstance
          setViewport(instance.getViewport())
        }}
        onMove={(_event, nextViewport) => {
          setViewport(nextViewport)
        }}
        onNodeClick={(_event, node) => {
          handleNodeClick(node.id)
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={() => {
          closeFutureSuggestions()
        }}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        minZoom={0.1}
        className="fixed top-0"
      >
        <Controls position="top-right" />
        <Background color="#ccc" variant={BackgroundVariant.Dots} />
      </ReactFlow>

      {suggestionOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-10">
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            {suggestionOverlay.edges.map((edge) => (
              <line
                key={edge.id}
                x1={edge.start.x}
                y1={edge.start.y}
                x2={edge.end.x}
                y2={edge.end.y}
                stroke={OVERLAY_EDGE_COLOR}
                strokeDasharray="6 4"
                strokeWidth={suggestionOverlay.isMobileViewport ? 1.5 : 2}
                style={{
                  opacity: isOverlayVisible ? 1 : 0,
                  transitionDelay: `${edge.stepIndex * 55}ms`,
                  transitionDuration: "320ms",
                  transitionProperty: "opacity",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            ))}
          </svg>

          {suggestionOverlay.nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              aria-label={`${node.label} のプロフィールを見る`}
              className="pointer-events-auto absolute flex items-center justify-center rounded-full border border-rose-200/90 bg-linear-to-br from-rose-50 via-white to-rose-100 text-center font-medium text-rose-950 backdrop-blur-sm will-change-transform hover:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:outline-none"
              onClick={() => {
                router.push(node.profileHref)
              }}
              style={{
                boxShadow: suggestionOverlay.isMobileViewport
                  ? "0 12px 30px rgba(244,114,182,0.16)"
                  : "0 18px 45px rgba(244,114,182,0.14)",
                fontSize: suggestionOverlay.isMobileViewport ? "10px" : "12px",
                height: suggestionOverlay.nodeDiameter,
                left: node.centerX,
                opacity: isOverlayVisible
                  ? (OVERLAY_NODE_OPACITY[node.stepIndex] ?? 0.72)
                  : 0,
                paddingInline: suggestionOverlay.isMobileViewport
                  ? "8px"
                  : "12px",
                top: node.centerY,
                transform: isOverlayVisible
                  ? "translate3d(-50%, -50%, 0) scale(1)"
                  : "translate3d(-50%, calc(-50% + 18px), 0) scale(0.86)",
                transitionDelay: `${node.stepIndex * 55}ms`,
                transitionDuration: "360ms",
                transitionProperty: "transform, opacity",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                width: suggestionOverlay.nodeDiameter,
              }}
            >
              <span
                className={
                  suggestionOverlay.isMobileViewport
                    ? "line-clamp-2 break-all"
                    : "line-clamp-3 break-all"
                }
              >
                {node.label}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-2">
        {isUsingMockData ? (
          <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm">
            mock graph data
          </div>
        ) : null}
        {isLoading ? (
          <div className="rounded-full border border-border/80 bg-card/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            ツリーを読み込み中...
          </div>
        ) : null}
        {!isUsingMockData && !isLoading ? (
          <div className="pointer-events-auto flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setIsInfoExpanded((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-card/95 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Info size={14} />
            </button>
            {isInfoExpanded ? (
              <div className="max-w-xs rounded-2xl border border-border/80 bg-card/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                ノード上部で未来、下部で過去を追加。ノード本体を押すと未来候補を最大5本、各3手先まで表示します
              </div>
            ) : null}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="pointer-events-auto max-w-sm rounded-2xl border border-destructive/20 bg-card/95 px-4 py-3 text-sm text-destructive shadow-sm">
            {errorMessage}
          </div>
        ) : null}
      </div>

      {!isMobileViewport ? (
        <GraphFutureSuggestionsPanel
          errorMessage={futureSuggestionError}
          isLoading={isSuggesting}
          onClose={closeFutureSuggestions}
          payload={futureSuggestions}
        />
      ) : null}

      <GraphNodeAddDialog
        abstractAnswer={abstractAnswer}
        concreteAnswer={concreteAnswer}
        draft={draft}
        errorMessage={submitError}
        isPending={isPending}
        onAbstractAnswerChange={setAbstractAnswer}
        onClose={closeDialog}
        onConcreteAnswerChange={setConcreteAnswer}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
