import { TmplAstElement } from '@angular/compiler';
import {
  createESLintRule,
  getTemplateParserServices,
} from '../utils/create-eslint-rule';

type Options = [];
export type MessageIds = 'accessibilityAltText';
export const RULE_NAME = 'accessibility-alt-text';

export default createESLintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforces alternate text for elements which require the alt, aria-label, aria-labelledby attributes',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
    messages: {
      accessibilityAltText:
        '<{{element}}/> element must have a text alternative',
    },
  },
  defaultOptions: [],
  create(context) {
    const parserServices = getTemplateParserServices(context);

    return {
      'Element[name=/^(area|img|input|object)$/]'(node: TmplAstElement) {
        if (isValidNode(node)) return;

        const loc = parserServices.convertElementSourceSpanToLoc(context, node);

        context.report({
          loc,
          messageId: 'accessibilityAltText',
          data: { element: node.name },
        });
      },
    };
  },
});

const tagValidationMapper = {
  area: isValidAreaNode,
  img: isValidImgNode,
  input: isValidInputNode,
  object: isValidObjectNode,
} as const;

function isValidNode(node: TmplAstElement): boolean {
  return tagValidationMapper[node.name as keyof typeof tagValidationMapper](
    node,
  );
}

/**
 * In this case, we check that the `<img>` element has an `alt` attribute or `attr.alt` binding.
 */
function isValidImgNode({ attributes, inputs }: TmplAstElement): boolean {
  return [...attributes, ...inputs].map(({ name }) => name).some(isAlt);
}

/**
 * In this case, we check that the `<object>` element has a `title` or `aria-label` attribute.
 * Otherwise, we check for the presence of `attr.title` or `attr.aria-label` bindings.
 */
function isValidObjectNode({
  attributes,
  children,
  inputs,
}: TmplAstElement): boolean {
  const hasTitleOrAriaLabel = [...attributes, ...inputs].some(
    ({ name }) => name === 'title' || isAriaLabel(name),
  );

  return hasTitleOrAriaLabel || !!(children?.[0] as any)?.value;
}

/**
 * In this case, we check that the `<area>` element has an `alt` or `aria-label` attribute.
 * Otherwise, we check for the presence of `attr.alt` or `attr.aria-label` bindings.
 */
function isValidAreaNode({ attributes, inputs }: TmplAstElement): boolean {
  return [...attributes, ...inputs].some(
    ({ name }) => isAlt(name) || isAriaLabel(name),
  );
}

/**
 * In this case, we check that the `<input>` element has an `alt` or `aria-label` attribute.
 * Otherwise, we check for the presence of `attr.alt` or `attr.aria-label` bindings.
 */
function isValidInputNode(node: TmplAstElement): boolean {
  const isTypeImage =
    [...node.attributes, ...node.inputs].find(({ name }) => name === 'type')
      ?.value === 'image';

  return !isTypeImage || isValidAreaNode(node);
}

function isAriaLabel(name: string): name is 'aria-label' | 'aria-labelledby' {
  return name === 'aria-label' || name === 'aria-labelledby';
}

function isAlt(name: string): name is 'alt' {
  return name === 'alt';
}
