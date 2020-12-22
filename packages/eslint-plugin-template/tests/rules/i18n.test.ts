import {
  convertAnnotatedSourceToFailureCase,
  RuleTester,
} from '@angular-eslint/utils';
import rule, { MessageIds, RULE_NAME } from '../../src/rules/i18n';

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  parser: '@angular-eslint/template-parser',
});

const i18nId: MessageIds = 'i18nId';
const i18nText: MessageIds = 'i18nText';
const i18nAttribute: MessageIds = 'i18nAttribute';
const i18nIdOnAttribute: MessageIds = 'i18nIdOnAttribute';

ruleTester.run(RULE_NAME, rule, {
  valid: [
    `
      <div>
        <span i18n="@@my-custom-id">Some text to translate</span>
      </div>
    `,
    `
      <div i18n-tooltip="@@my-custom-id" tooltip="This also requires translation">
        <span i18n="@@my-custom-id">Some text to translate</span>
      </div>
    `,
    `
      <div>
        <span class="red" i18n="@@my-custom-id">
          Some text to translate
        </span>
      </div>
    `,
    {
      code: `
        <div tooltip="This tooltip property is ignored">
          <span i18n>Some text to translate</span>
        </div>
      `,
      options: [{ checkId: false, ignoreAttributes: ['tooltip'] }],
    },
    {
      code: `
        <div i18n-tooltip="@@tooltip.label" tooltip="This tooltip property is ignored">
          <span>Some text to translate</span>
        </div>
      `,
      options: [{ checkText: false }],
    },
    {
      code: `
        <div i18n-tooltip="@@tooltip.label" tooltip="This tooltip property is ignored">
          <mat-icon>valid</mat-icon>
        </div>
      `,
      options: [{ ignoreTags: ['mat-icon'] }],
    },
    {
      code: `
        <div i18n-tooltip="@@tooltip.label" tooltip="This tooltip property is ignored">
          -{{data_from_backend}}
        </div>
      `,
      options: [{}],
    },
  ],
  invalid: [
    convertAnnotatedSourceToFailureCase({
      description: 'it should fail if i18n is missing',
      annotatedSource: `
        <div>
          <span>Some text to translate</span>
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        </div>`,
      messageId: i18nText,
      annotatedOutput: `
        <div>
          <span i18n>Some text to translate</span>
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        </div>`,
      options: [{ ignoreAttributes: [] }],
    }),
    {
      filename: 'test.component.html',
      code: `
        <div
          tooltip="This also requires translation"
          i18n-placeholder
          placeholder="More translation, please"
          class="red"
        >
          <div
            *ngIf="true"
            width="100px"
            label="Templates need translation too."
          >
            <span i18n label="valid with i18n">Some text to translate</span>
          </div>
        </div>`,
      errors: [
        { column: 9, line: 2, messageId: i18nAttribute },
        { column: 9, line: 2, messageId: i18nIdOnAttribute },
        { column: 11, line: 8, messageId: i18nAttribute },
        { column: 11, line: 8, messageId: i18nAttribute },
        { column: 13, line: 13, messageId: i18nId },
      ],
      output: `
        <div i18n-tooltip
          tooltip="This also requires translation"
          i18n-placeholder
          placeholder="More translation, please"
          class="red"
        >
          <div i18n-label
            *ngIf="true"
            width="100px"
            label="Templates need translation too."
          >
            <span i18n label="valid with i18n">Some text to translate</span>
          </div>
        </div>`,
      options: [{ ignoreAttributes: ['span[label]'] }],
    },
    convertAnnotatedSourceToFailureCase({
      description: 'it should fail because of the custom pattern',
      annotatedSource: `
        <div>
          <span>-{{data_from_backend}}</span>
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        </div>`,
      messageId: i18nText,
      annotatedOutput: `
        <div>
          <span i18n>-{{data_from_backend}}</span>
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        </div>`,
      options: [{ boundTextAllowedPattern: '-' }],
    }),
  ],
});
