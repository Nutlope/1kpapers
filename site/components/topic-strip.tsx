import Link from "next/link";

export type TopicStripItem = {
  slug: string;
  label: string;
  count: number;
};

type TopicStripProps = {
  topics: readonly TopicStripItem[];
};

export function TopicStrip({ topics }: TopicStripProps) {
  return (
    <ol className="topic-strip">
      {topics.map((topic, index) => (
        <li key={topic.slug}>
          <Link href={`/topics/${topic.slug}`} className="focus-ring">
            <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="display-serif">{topic.label}</span>
            <small className="tabular-nums">{topic.count}</small>
          </Link>
        </li>
      ))}
    </ol>
  );
}
