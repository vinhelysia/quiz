import { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  children: string;
}

/** One parsed segment of a mixed text+LaTeX string. */
type Segment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string };

/**
 * Split a string into plain-text, inline-math ($...$) and block-math ($$...$$)
 * segments. A lone/unmatched `$` is left as literal text and never crashes.
 */
function parse(input: string): Segment[] {
  const segments: Segment[] = [];
  // Block math first: match $$...$$ pairs (greedy on inner, non-greedy across pairs).
  const blockRe = /\$\$([\s\S]+?)\$\$/g;
  let cursor = 0;
  let blockMatch: RegExpExecArray | null;
  let lastIndex = 0;

  while ((blockMatch = blockRe.exec(input)) !== null) {
    const before = input.slice(lastIndex, blockMatch.index);
    if (before.length > 0) {
      // Inline math lives only in the plain text between block segments.
      pushInlineSegments(segments, before);
    }
    segments.push({ type: 'block', value: blockMatch[1] });
    lastIndex = blockMatch.index + blockMatch[0].length;
    cursor = lastIndex;
  }
  // Trailing plain text after the last block.
  if (cursor < input.length) {
    pushInlineSegments(segments, input.slice(cursor));
  }
  return segments.length > 0 ? segments : [{ type: 'text', value: input }];
}

/** Split a chunk (no $$ inside) on inline $...$ pairs; lone $ stays literal. */
function pushInlineSegments(out: Segment[], chunk: string): void {
  const inlineRe = /\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = inlineRe.exec(chunk)) !== null) {
    if (match.index > lastIndex) {
      out.push({ type: 'text', value: chunk.slice(lastIndex, match.index) });
    }
    out.push({ type: 'inline', value: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < chunk.length) {
    out.push({ type: 'text', value: chunk.slice(lastIndex) });
  }
}

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode,
      output: 'html',
    });
  } catch {
    // throwOnError:false makes this practically unreachable, but never crash.
    return tex;
  }
}

/** Renders a string that mixes Vietnamese text with LaTeX ($...$, $$...$$). */
function MathText({ children }: MathTextProps) {
  const segments = useMemo(() => {
    // Fast path: plain strings with no math delimiter.
    if (!children.includes('$')) {
      return null as Segment[] | null;
    }
    return parse(children);
  }, [children]);

  if (segments === null) {
    return <span>{children}</span>;
  }

  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>;
        }
        const html = renderMath(seg.value, seg.type === 'block');
        if (seg.type === 'block') {
          return (
            <span
              key={i}
              className="math-block"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return (
          <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </span>
  );
}

export default MathText;
