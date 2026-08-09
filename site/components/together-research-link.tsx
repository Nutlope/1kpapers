import { TOGETHER_REFERRAL_URL } from "../lib/external-links";

export function TogetherResearchLink() {
  return (
    <a className="focus-ring" href={TOGETHER_REFERRAL_URL} target="_blank" rel="noreferrer">
      together.ai / research
    </a>
  );
}
