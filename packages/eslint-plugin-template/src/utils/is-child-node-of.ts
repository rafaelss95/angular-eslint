import { TmplAstElement } from '@angular/compiler';

export function isChildNodeOf(
  root: TmplAstElement,
  childNodeName: string,
): boolean {
  function traverseChildNodes({ children }: TmplAstElement): boolean {
    return children.some(
      (childNode) =>
        childNode instanceof TmplAstElement &&
        (childNode.name === childNodeName || traverseChildNodes(childNode)),
    );
  }

  return traverseChildNodes(root);
}
