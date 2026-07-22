/* global self, performance */
"use strict";

const advanceStringIndex = (text, index, unicode) => {
  if (!unicode) return index + 1;
  const first = text.charCodeAt(index);
  if (first < 0xD800 || first > 0xDBFF || index + 1 >= text.length) return index + 1;
  const second = text.charCodeAt(index + 1);
  return second >= 0xDC00 && second <= 0xDFFF ? index + 2 : index + 1;
};

const preview = (value, maximum) => value.length > maximum ? `${value.slice(0, maximum)}…` : value;

self.onmessage = (event) => {
  const started = performance.now();
  try {
    const { pattern, flags, text, maximumMatches, maximumPreviewCharacters } = event.data;
    const expression = new RegExp(pattern, flags);
    const matches = [];
    let truncated = false;
    const repeat = expression.global || expression.sticky;

    while (matches.length < maximumMatches) {
      const match = expression.exec(text);
      if (!match) break;
      const namedCaptures = match.groups
        ? Object.fromEntries(Object.entries(match.groups).slice(0, 50).map(([key, value]) => [
            key,
            value === undefined ? null : preview(value, maximumPreviewCharacters),
          ]))
        : {};
      const indices = Array.isArray(match.indices)
        ? match.indices.slice(0, 51).map((value) => Array.isArray(value) ? [value[0], value[1]] : null)
        : null;
      matches.push({
        index: match.index,
        endIndex: match.index + match[0].length,
        value: preview(match[0], maximumPreviewCharacters),
        captures: match.slice(1, 51).map((value) => value === undefined ? null : preview(value, maximumPreviewCharacters)),
        namedCaptures,
        indices,
      });
      if (!repeat) break;
      if (match[0] === "") {
        expression.lastIndex = advanceStringIndex(text, expression.lastIndex, expression.unicode || expression.unicodeSets);
      }
    }

    if (matches.length === maximumMatches && expression.exec(text)) truncated = true;
    self.postMessage({
      kind: "result",
      ok: true,
      matchCount: matches.length,
      truncated,
      elapsedMilliseconds: performance.now() - started,
      matches,
    });
  } catch (error) {
    self.postMessage({ kind: "result", ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};

self.postMessage({ kind: "ready" });
