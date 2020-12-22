import { Message } from '@angular/compiler/src/i18n/i18n_ast';
import { Element, Template } from '@angular/compiler/src/render3/r3_ast';
import {
  createESLintRule,
  getTemplateParserServices,
} from '../utils/create-eslint-rule';

const ATTRIBUTE_I18N = 'i18n';
const TEXT_TYPE_NAMES: ReadonlySet<string> = new Set(['Text', 'Icu']);
const DEFAULT_BOUND_TEXT_ALLOWED_PATTERN = /[a-z]/i;
const DEFAULT_IGNORE_ATTRIBUTES: ReadonlySet<string> = new Set([
  'charset',
  'class',
  'color',
  'colspan',
  'fill',
  'formControlName',
  'height',
  'href',
  'id',
  'lang',
  'src',
  'stroke',
  'stroke-width',
  'style',
  'svgIcon',
  'tabindex',
  'target',
  'type',
  'viewBox',
  'width',
  'xmlns',
]);

type Options = [
  {
    checkId?: boolean;
    checkText?: boolean;
    checkAttributes?: boolean;
    ignoreAttributes?: string[];
    ignoreTags?: string[];
    boundTextAllowedPattern?: string;
  },
];
export type MessageIds =
  | 'i18nAttribute'
  | 'i18nId'
  | 'i18nIdOnAttribute'
  | 'i18nSuggestIgnore'
  | 'i18nText';
export const RULE_NAME = 'i18n';
const DEFAULT_OPTIONS: Options[0] = {
  checkId: true,
  checkText: true,
  checkAttributes: true,
  ignoreAttributes: [''],
  ignoreTags: [],
  boundTextAllowedPattern: '',
};
const STYLE_GUIDE_LINK = 'https://angular.io/guide/i18n';
const STYLE_GUIDE_I18N_ATTRIBUTE_LINK = `${STYLE_GUIDE_LINK}#translate-attributes`;
const STYLE_GUIDE_I18N_ATTRIBUTE_ID_LINK = `${STYLE_GUIDE_LINK}#use-a-custom-id-with-a-description`;

export default createESLintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Helps to ensure following best practices for i18n. ' +
        'Checks for missing i18n attributes on elements and non-ignored attributes ' +
        'containing text. Can also highlight tags that do not use Custom ID (@@) feature. ' +
        'Default Config = ' +
        JSON.stringify(DEFAULT_OPTIONS),
      category: 'Best Practices',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          checkId: {
            type: 'boolean',
          },
          checkText: {
            type: 'boolean',
          },
          checkAttributes: {
            type: 'boolean',
          },
          ignoreAttributes: {
            items: {
              type: 'string',
            },
            type: 'array',
            uniqueItems: true,
          },
          ignoreTags: {
            items: {
              type: 'string',
            },
            type: 'array',
            uniqueItems: true,
          },
          boundTextAllowedPattern: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      i18nAttribute: `Attribute '{{attributeName}}' has no corresponding i18n attribute. See more at ${STYLE_GUIDE_I18N_ATTRIBUTE_LINK}.`,
      i18nId: `Missing custom message identifier. See more at ${STYLE_GUIDE_I18N_ATTRIBUTE_ID_LINK}.`,
      i18nIdOnAttribute: `Missing custom message identifier on attribute "{{attributeName}}". See more at ${STYLE_GUIDE_I18N_ATTRIBUTE_ID_LINK}.`,
      i18nSuggestIgnore:
        'Add the attribute name "{{attributeName}}" to the ignoreAttributes option in the eslint config',
      i18nText: `Each element containing text node should have an i18n attribute. See more at ${STYLE_GUIDE_LINK}.`,
    },
  },
  defaultOptions: [DEFAULT_OPTIONS],
  create(
    context,
    [
      {
        boundTextAllowedPattern,
        checkAttributes,
        checkId,
        checkText,
        ignoreAttributes,
        ignoreTags,
      },
    ],
  ) {
    const parserServices = getTemplateParserServices(context);
    const sourceCode = context.getSourceCode();
    const checkIgnoreTags: ReadonlySet<string> = new Set(ignoreTags);
    const checkBoundTextAllowedPattern = boundTextAllowedPattern
      ? new RegExp(boundTextAllowedPattern)
      : DEFAULT_BOUND_TEXT_ALLOWED_PATTERN;
    const allIgnoredAttributes: ReadonlySet<string> = new Set([
      ...DEFAULT_IGNORE_ATTRIBUTES,
      ...(ignoreAttributes ?? []),
    ]);

    function checkNode(node: Element | Template, tagName: string): void {
      const loc = parserServices.convertNodeSourceSpanToLoc(node.sourceSpan);
      const startIndex = sourceCode.getIndexFromLoc(loc.start);
      const insertIndex = startIndex + 1 + tagName.length;

      for (const { i18n, name, value } of node.attributes) {
        if (i18n) {
          if (checkId && !(i18n as Message).customId) {
            context.report({
              messageId: 'i18nIdOnAttribute',
              loc,
              data: { attributeName: name },
            });
          }

          continue;
        }

        const hasInvalidAttribute =
          checkAttributes &&
          value &&
          typeof value === 'string' &&
          value.length > 0 &&
          value !== 'true' &&
          value !== 'false' &&
          !isSizeOrNumber(value) &&
          !name.startsWith(':xml') &&
          !allIgnoredAttributes.has(name) &&
          !allIgnoredAttributes.has(`${tagName}[${name}]`);

        if (!hasInvalidAttribute) continue;

        context.report({
          messageId: 'i18nAttribute',
          loc,
          data: { attributeName: name },
          fix: (fixer) =>
            fixer.replaceTextRange(
              [insertIndex, insertIndex],
              ` ${ATTRIBUTE_I18N}-${name}`,
            ),
          suggest: [
            {
              messageId: 'i18nSuggestIgnore',
              data: { attributeName: name },
              // Little bit of a hack as VSCode ignores suggestions with no fix!?
              fix: (fixer) => fixer.insertTextBeforeRange([0, 0], ''),
            },
          ],
        });
      }

      if (node.i18n) {
        if (!checkId || (node.i18n as Message).customId) return;

        context.report({
          messageId: 'i18nId',
          loc,
        });

        return;
      }

      if (!checkText || checkIgnoreTags.has((node as Element).name)) return;

      /**
        Attempted to check for child nodes that also include i18n
        however these throw a template parser error before the linter
        is allowed to run, so no need!
       */

      const hasInvalidChild = node.children?.some(
        ({ type, value }: any) =>
          TEXT_TYPE_NAMES.has(type) ||
          (type === 'BoundText' &&
            checkBoundTextAllowedPattern.test(
              value.ast.strings.join('').trim(),
            )),
      );

      if (!hasInvalidChild) return;

      context.report({
        messageId: 'i18nText',
        loc,
        fix: (fixer) =>
          fixer.replaceTextRange(
            [insertIndex, insertIndex],
            ` ${ATTRIBUTE_I18N}`,
          ),
      });
    }

    return {
      Element(node: Element) {
        checkNode(node, node.name);
      },
      Template(node: Template) {
        checkNode(node, node.tagName);
      },
    };
  },
});

function isSizeOrNumber(value: string) {
  const parsedSize = value.replace(/px$/, '');

  return String(Number(parsedSize)) === String(parsedSize);
}
