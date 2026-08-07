import type { CSSProperties } from "react";

type LabAsset = {
  src: string;
  alt: string;
  label: string;
  color?: string;
};

const labAssets: Record<string, LabAsset> = {
  "Together AI": { src: "/brands/together-mark.svg", alt: "Together AI logo", label: "Together AI" },
  OpenAI: { src: "/brands/openai.svg", alt: "OpenAI logo", label: "OpenAI", color: "#10a37f" },
  Anthropic: { src: "/brands/anthropic.svg", alt: "Anthropic logo", label: "Anthropic", color: "#d97757" },
  "Moonshot AI": { src: "/brands/kimi.svg", alt: "Moonshot AI logo", label: "Moonshot AI", color: "#4f63d9" },
  "Moonshot / Kimi": { src: "/brands/kimi.svg", alt: "Moonshot AI logo", label: "Moonshot AI", color: "#4f63d9" },
  "Moonshot AI / Kimi": { src: "/brands/kimi.svg", alt: "Moonshot AI logo", label: "Moonshot AI", color: "#4f63d9" },
  DeepSeek: { src: "/brands/deepseek.svg", alt: "DeepSeek logo", label: "DeepSeek" },
  MiniMax: { src: "/brands/minimax.svg", alt: "MiniMax logo", label: "MiniMax" },
  "Z.ai / GLM": { src: "/brands/zai.svg", alt: "Z.ai logo", label: "Z.ai / GLM" },
  "Z.ai / Zhipu / GLM": { src: "/brands/zai.svg", alt: "Z.ai logo", label: "Z.ai / GLM" },
  "Meta AI / FAIR": { src: "/brands/meta.svg", alt: "Meta logo", label: "Meta AI", color: "#0866ff" },
  "Google DeepMind / Google": { src: "/brands/google.svg", alt: "Google logo", label: "Google DeepMind", color: "#4285f4" },
  "Alibaba / Qwen": { src: "/brands/qwen.svg", alt: "Qwen logo", label: "Qwen", color: "#615ced" },
  NVIDIA: { src: "/brands/nvidia.svg", alt: "NVIDIA logo", label: "NVIDIA", color: "#76b900" },
  "Mistral AI": { src: "/brands/mistral.svg", alt: "Mistral AI logo", label: "Mistral AI", color: "#fa520f" },
};

export function LabLogo({ lab, className = "" }: { lab: string; className?: string }) {
  const asset = labAssets[lab];
  if (!asset) return null;

  return (
    <span className={`lab-logo-box ${className}`.trim()}>
      {asset.color ? (
        <span
          className="lab-logo-glyph"
          role="img"
          aria-label={asset.alt}
          style={{
            "--lab-logo-color": asset.color,
            WebkitMaskImage: `url(${asset.src})`,
            maskImage: `url(${asset.src})`,
          } as CSSProperties}
        />
      ) : (
        <img src={asset.src} alt={asset.alt} />
      )}
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
