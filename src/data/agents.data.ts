interface AgentData {
  name: string
  imageSupport: boolean
  model: {
    displayName: string
    referenceName: string
  }
  provider: {
    displayName: string
    referenceName: string
  }
}

export const AGENTS: AgentData[] = [
  {
    name: "Luna",
    model: {
      displayName: "Gpt-Luna",
      referenceName: "@preset/luna",
    },
    imageSupport: true,
    provider: {
      displayName: "custom",
      referenceName: "Open-Router",
    },
  },
  {
    name: "Deepy",
    model: {
      displayName: "DeepSeek v4 flash",
      referenceName: "deepseek-v4-flash-free",
    },
    imageSupport: true,
    provider: {
      displayName: "OpenCode",
      referenceName: "opencode",
    },
  },
  /*{
    id: 3,
    displayName: "MiniMax M3",
    modelID: "@preset/mini-max-m3",
    provider: {
      displayName: "custom",
      referenceName: "Open-Router",
    },
  },
  {
    id: 4,
    name: "DeepSeek v4 pro",
    modelID: "deepseek-v4-pro",
    provider: {
      id: "deepseek",
      name: "DeepSeek",
    },
  },*/
];
