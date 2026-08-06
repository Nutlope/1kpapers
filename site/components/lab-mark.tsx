const labAssets: Record<string, { src: string; alt: string; label: string }> = {
  "Together AI": { src: "/brands/together-mark.svg", alt: "Together AI logo", label: "Together AI" },
  OpenAI: { src: "/brands/openai.svg", alt: "OpenAI logo", label: "OpenAI" },
  Anthropic: { src: "/brands/anthropic.svg", alt: "Anthropic logo", label: "Anthropic" },
  "Moonshot AI": { src: "/brands/kimi.svg", alt: "Moonshot AI logo", label: "Moonshot AI" },
  "Moonshot / Kimi": { src: "/brands/kimi.svg", alt: "Moonshot AI logo", label: "Moonshot AI" },
  "Moonshot AI / Kimi": { src: "/brands/kimi.svg", alt: "Moonshot AI logo", label: "Moonshot AI" },
  DeepSeek: { src: "/brands/deepseek.svg", alt: "DeepSeek logo", label: "DeepSeek" },
  MiniMax: { src: "/brands/minimax.svg", alt: "MiniMax logo", label: "MiniMax" },
  "Z.ai / GLM": { src: "/brands/zai.svg", alt: "Z.ai logo", label: "Z.ai / GLM" },
  "Z.ai / Zhipu / GLM": { src: "/brands/zai.svg", alt: "Z.ai logo", label: "Z.ai / GLM" },
  "Meta AI / FAIR": { src: "/brands/meta.svg", alt: "Meta logo", label: "Meta AI" },
  "Google DeepMind / Google": { src: "/brands/google.svg", alt: "Google logo", label: "Google DeepMind" },
  "Alibaba / Qwen": { src: "/brands/qwen.svg", alt: "Qwen logo", label: "Qwen" },
  NVIDIA: { src: "/brands/nvidia.svg", alt: "NVIDIA logo", label: "NVIDIA" },
  "Mistral AI": { src: "/brands/mistral.svg", alt: "Mistral AI logo", label: "Mistral AI" },
};

export function LabLogo({ lab, className = "" }: { lab: string; className?: string }) {
  const asset = labAssets[lab];
  if (!asset) return null;

  return (
    <span className={`lab-logo-box ${className}`.trim()}>
      <img src={asset.src} alt={asset.alt} />
    </span>
  );
}

export function LabMark({ lab }: { lab: string }) {
  const asset = labAssets[lab];
  if (!asset) return null;

  return (
    <span className="lab-mark">
      <LabLogo lab={lab} />
      <span className="lab-label">{asset.label}</span>
    </span>
  );
}
