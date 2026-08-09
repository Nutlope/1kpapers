import { TOGETHER_REFERRAL_URL } from "../lib/external-links";

export function TogetherResearchLink() {
  return (
    <a className="footer-together-link focus-ring" href={TOGETHER_REFERRAL_URL} target="_blank" rel="noreferrer">
      <img src="/brands/together-ai.svg" alt="Together AI" width="1147" height="241" />
      <span>/ Research</span>
    </a>
  );
}
