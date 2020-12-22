import {
  createESLintRule,
  getTemplateParserServices,
} from '../utils/create-eslint-rule';

type Options = [];
export type MessageIds = 'useTrackByFunction';
export const RULE_NAME = 'use-track-by-function';

export default createESLintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures trackBy function is used',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
    messages: {
      useTrackByFunction: 'Missing trackBy function in ngFor directive',
    },
  },
  defaultOptions: [],
  create(context) {
    const parserServices = getTemplateParserServices(context);

    return {
      'BoundAttribute.inputs[name="ngForOf"]'({
        parent: { inputs },
        sourceSpan,
      }: any) {
        if (hasNgForTrackBy(inputs)) return;

        const loc = parserServices.convertNodeSourceSpanToLoc(sourceSpan);

        context.report({
          messageId: 'useTrackByFunction',
          loc,
        });
      },
      'BoundAttribute.templateAttrs[name="ngForOf"]'({
        parent: { templateAttrs },
      }: any) {
        if (hasNgForTrackBy(templateAttrs)) return;

        const start = parserServices.convertNodeSourceSpanToLoc(
          templateAttrs[0].sourceSpan,
        ).start;
        const end = parserServices.convertNodeSourceSpanToLoc(
          templateAttrs[templateAttrs.length - 1].sourceSpan,
        ).end;
        const loc = {
          start: {
            ...start,
            column: start.column - 1,
          },
          end: {
            ...end,
            column: end.column + 1,
          },
        } as const;

        context.report({
          messageId: 'useTrackByFunction',
          loc,
        });
      },
    };
  },
});

function hasNgForTrackBy(
  source: Readonly<{ name: string; type: string }>[],
): boolean {
  return source.some(
    ({ name, type }) => name === 'ngForTrackBy' && type === 'BoundAttribute',
  );
}
