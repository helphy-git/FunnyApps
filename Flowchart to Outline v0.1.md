/\*
Converts the current Excalidraw flowchart to a Markdown outline.
Assumes a tree structure (one parent per node). Copies result to clipboard.

```javascript
*/
const elements = ea.getViewElements();

const arrows = elements.filter((el) => el.type === "arrow");
const containers = elements.filter((el) =>
  ["rectangle", "ellipse", "diamond"].includes(el.type),
);
const texts = elements.filter((el) => el.type === "text");

const labelMap = {};
texts.forEach((el) => {
  const key = el.containerId ?? el.id;
  labelMap[key] = (labelMap[key] || el.text || "").trim();
});

const nodeIds = new Set([
  ...containers.map((el) => el.id),
  ...texts.filter((el) => !el.containerId).map((el) => el.id),
]);

const children = {};
const hasParent = new Set();
nodeIds.forEach((id) => {
  children[id] = [];
});

arrows.forEach((arrow) => {
  const from = arrow.startBinding?.elementId;
  const to = arrow.endBinding?.elementId;
  if (from && to && nodeIds.has(from) && nodeIds.has(to)) {
    children[from].push(to);
    hasParent.add(to);
  }
});

const roots = [...nodeIds].filter((id) => !hasParent.has(id));

function toLines(id, depth) {
  const label = labelMap[id] || "(unlabeled)";
  const line =
    depth <= 2
      ? `${"#".repeat(depth + 1)} ${label}`
      : `${"  ".repeat(depth - 3)}- ${label}`;
  return [line, ...(children[id] || []).flatMap((c) => toLines(c, depth + 1))];
}

const markdown = roots.flatMap((r) => toLines(r, 0)).join("\n");
await navigator.clipboard.writeText(markdown);
new Notice("Outline copied to clipboard!");
```
