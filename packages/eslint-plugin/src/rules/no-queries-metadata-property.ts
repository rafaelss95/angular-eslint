import { TSESTree } from '@typescript-eslint/experimental-utils';
import { createESLintRule } from '../utils/create-eslint-rule';
import { COMPONENT_OR_DIRECTIVE_CLASS_DECORATOR } from '../utils/selectors';

type Options = [];
export type MessageIds = 'noQueriesMetadataProperty';
export const RULE_NAME = 'no-queries-metadata-property';
const METADATA_PROPERTY_NAME = 'queries';
const STYLE_GUIDE_LINK = 'https://angular.io/styleguide#style-05-12';

export default createESLintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: `Disallows usage of the \`${METADATA_PROPERTY_NAME}\` metadata property. See more at ${STYLE_GUIDE_LINK}.`,
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
    messages: {
      noQueriesMetadataProperty: `Use @Output rather than the \`${METADATA_PROPERTY_NAME}\` metadata property (${STYLE_GUIDE_LINK})`,
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      [`${COMPONENT_OR_DIRECTIVE_CLASS_DECORATOR} Identifier[name="${METADATA_PROPERTY_NAME}"]`]({
        parent,
      }: TSESTree.Identifier) {
        context.report({
          node: parent!,
          messageId: 'noQueriesMetadataProperty',
        });
      },
    };
  },
});
