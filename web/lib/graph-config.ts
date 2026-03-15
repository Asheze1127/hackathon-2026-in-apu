function parseBooleanEnv(value: string | undefined) {
  return value?.trim().toLowerCase() === "true"
}

export const SHOULD_USE_MOCK_GRAPH_DATA = parseBooleanEnv(
  process.env.NEXT_PUBLIC_USE_MOCK_GRAPH_DATA
)
