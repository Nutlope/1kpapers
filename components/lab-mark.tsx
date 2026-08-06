type LabMarkProps = {
  lab: "OpenAI" | "Anthropic" | "Moonshot / Kimi" | "DeepSeek" | "MiniMax" | "Z.ai / GLM";
};

export function LabMark({ lab }: LabMarkProps) {
  const icon = {
    OpenAI: <OpenAIMark />,
    Anthropic: <AnthropicMark />,
    "Moonshot / Kimi": <MoonshotMark />,
    DeepSeek: <DeepSeekMark />,
    MiniMax: <MiniMaxMark />,
    "Z.ai / GLM": <GlmMark />,
  }[lab];

  return (
    <div className="lab-mark">
      {icon}
      <span>{lab}</span>
    </div>
  );
}

function OpenAIMark() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M18 4a7 7 0 0 1 6.5 4.4 7 7 0 0 1 5.1 10.4 7 7 0 0 1-1.4 10.7 7 7 0 0 1-11.5 1.3A7 7 0 0 1 6.2 27 7 7 0 0 1 4.9 15.7 7 7 0 0 1 11.8 6" />
        <path d="m11 9 13 7.5v14M5.7 17h15.4l7.2-4.3M8.3 28l7.5-13.2V6.2M25 27 12 19.5" />
      </g>
    </svg>
  );
}

function AnthropicMark() {
  return (
    <svg viewBox="0 0 42 36" aria-hidden="true">
      <path d="M3 31 14 5h7l11 26h-7l-2-5H12l-2 5H3Zm11-11h7l-3.5-9L14 20ZM31 5h8v26h-8z" fill="currentColor" />
    </svg>
  );
}

function MoonshotMark() {
  return (
    <svg viewBox="0 0 42 36" aria-hidden="true">
      <path d="M35 6C22 7 11 15 6 27c8-4 16-4 25 0-5-6-6-11-2-15 2-2 4-4 6-6Z" fill="currentColor" />
      <path d="M8 28c7-8 16-13 27-15M12 31c7-6 15-9 24-9" fill="none" stroke="var(--paper)" strokeWidth="1.2" />
    </svg>
  );
}

function DeepSeekMark() {
  return (
    <svg viewBox="0 0 45 36" aria-hidden="true" className="deepseek-mark">
      <path d="M5 21c1-8 9-13 18-11 5-5 12-5 17-1-3 2-5 5-5 9 0 9-8 14-17 13C10 31 5 27 5 21Z" fill="currentColor" />
      <circle cx="30" cy="14" r="2" fill="var(--paper)" />
      <path d="M8 24c7 2 13 0 18-6M4 17 1 12c4 0 7 1 9 4" fill="none" stroke="var(--paper)" strokeWidth="1.4" />
    </svg>
  );
}

function MiniMaxMark() {
  return (
    <svg viewBox="0 0 42 36" aria-hidden="true" className="minimax-mark">
      {[4, 8, 12, 16, 20, 24, 28, 32, 36].map((x, index) => (
        <path
          key={x}
          d={`M${x} ${14 - Math.abs(4 - index) * 2}v${8 + Math.abs(4 - index) * 4}`}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function GlmMark() {
  return (
    <svg viewBox="0 0 42 36" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="m21 3 5 10 11 1-8 8 2 11-10-5-10 5 2-11-8-8 11-1 5-10Z" />
        <ellipse cx="21" cy="18" rx="17" ry="7" transform="rotate(58 21 18)" />
        <ellipse cx="21" cy="18" rx="17" ry="7" transform="rotate(-58 21 18)" />
      </g>
    </svg>
  );
}
