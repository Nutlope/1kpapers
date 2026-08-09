export type LabDefinition = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  aliases?: string[];
};

export const labs: LabDefinition[] = [
  { slug: "together-ai", name: "Together AI", shortName: "Together AI", description: "Open models, systems research, inference, training, and the infrastructure behind production AI." },
  { slug: "openai", name: "OpenAI", shortName: "OpenAI", description: "Frontier model research spanning reasoning, multimodality, agents, safety, and scientific discovery." },
  { slug: "anthropic", name: "Anthropic", shortName: "Anthropic", description: "Research on reliable, interpretable, capable, and aligned frontier AI systems." },
  { slug: "meta-ai", name: "Meta AI / FAIR", shortName: "Meta AI", description: "Open research from Meta AI and FAIR across vision, language, multimodal systems, and embodied intelligence." },
  { slug: "google-deepmind", name: "Google DeepMind / Google", shortName: "Google DeepMind", description: "Research from Google and Google DeepMind across foundation models, agents, science, robotics, and safety." },
  { slug: "deepseek", name: "DeepSeek", shortName: "DeepSeek", description: "Open model research focused on reasoning, efficient architectures, coding, mathematics, and multimodal systems." },
  { slug: "moonshot-kimi", name: "Moonshot AI", shortName: "Moonshot AI", description: "Long-context, agentic, multimodal, and open foundation-model research from Moonshot AI.", aliases: ["Moonshot / Kimi", "Moonshot AI / Kimi"] },
  { slug: "minimax", name: "MiniMax", shortName: "MiniMax", description: "Foundation-model research across language, speech, video, multimodal generation, and agents." },
  { slug: "zai-glm", name: "Z.ai / Zhipu / GLM", shortName: "Z.ai / GLM", description: "The GLM family of open language, reasoning, coding, agentic, and multimodal models." },
  { slug: "qwen", name: "Alibaba / Qwen", shortName: "Qwen", description: "Alibaba and Qwen research across language, vision, audio, coding, agents, and efficient open models." },
  { slug: "nvidia", name: "NVIDIA", shortName: "NVIDIA", description: "Research on models, simulation, robotics, graphics, systems, and accelerated AI computing." },
  { slug: "mistral-ai", name: "Mistral AI", shortName: "Mistral AI", description: "Efficient open and frontier models for language, code, reasoning, and multimodal applications." },
];

export function getLabBySlug(slug: string) {
  return labs.find((lab) => lab.slug === slug);
}

export function getLabByName(name: string | null) {
  if (!name) return undefined;
  return labs.find((lab) => lab.name === name || lab.aliases?.includes(name));
}

export function labDisplayName(name: string | null | undefined) {
  if (!name) return undefined;
  return getLabByName(name)?.shortName ?? name;
}

export function labIncludesPaper(lab: LabDefinition, paperLab: string | null) {
  if (!paperLab) return false;
  return paperLab === lab.name || Boolean(lab.aliases?.includes(paperLab));
}
