export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Partial<HTMLElementTagNameMap[K]>,
  children?: ReadonlyArray<Node | string>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attributes) Object.assign(el, attributes);
  if (children) {
    for (const child of children) {
      el.append(child);
    }
  }
  return el;
}

export function qs<T extends Element = Element>(
  selector: string,
  parent: ParentNode = document,
): T | null {
  return parent.querySelector<T>(selector);
}

export function qsa<T extends Element = Element>(
  selector: string,
  parent: ParentNode = document,
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

export function escapeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
