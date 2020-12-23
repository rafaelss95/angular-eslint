import rule, { RULE_NAME } from '../../src/rules/no-attribute-decorator';
import {
  convertAnnotatedSourceToFailureCase,
  RuleTester,
} from '@angular-eslint/utils';

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------
const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
});

const messageId = 'noAttributeDecorator';

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // should pass if constructor does not exist
    `
    class Test {
      foo() {}
    }
    `,
    // should pass if constructor exists but no parameter
    `
    class Test {
      constructor() {}
    }
    `,
    // should pass if constructor exists and have one parameter without decorator
    `
    class Test {
      constructor(foo: string) {}
    }
  `,
    // should pass if constructor exists and have one parameter with decorator
    `
    class Test {
      constructor(@Optional() foo: string) {}
    }
    `,
    // // should pass if constructor exists and have multiple parameters without decorator
    `
    class Test {
      constructor(foo: string, @Optional() bar: string) {}
    }
    `,
    // // should pass if constructor exists and have multiple parameters with decorator
    `
    class Test {
      constructor(@Optional() foo: string, @Optional() bar: string) {}
    }
    `,
  ],
  invalid: [
    convertAnnotatedSourceToFailureCase({
      description:
        'should fail if constructor has one parameter with @Attribute decorator',
      annotatedSource: `
        class Test {
          constructor(@Attribute() foo: string) {}
                      ~~~~~~~~~~~~
        }
      `,
      messageId,
    }),
    convertAnnotatedSourceToFailureCase({
      description:
        'should fail if constructor has one parameter with an alias on the @Attribute decorator',
      annotatedSource: `
        class Test {
          constructor(@Attribute("name") foo: string) {}
                      ~~~~~~~~~~~~~~~~~~
        }
      `,
      messageId,
    }),
    convertAnnotatedSourceToFailureCase({
      description:
        'should fail if constructor has multiple parameters but one with @Attribute decorator',
      annotatedSource: `
        class Test {
          constructor(foo: string, @Attribute() bar: string, @Host() @Self() @SkipSelf() @Optional() baz: string) {}
                                   ~~~~~~~~~~~~
        }
      `,
      messageId,
    }),
    convertAnnotatedSourceToFailureCase({
      description:
        'should fail if constructor has multiple parameters with @Attribute decorator',
      annotatedSource: `
        class Test {
          constructor(@Attribute() foo: string, @Attribute() bar: string) {}
                      ~~~~~~~~~~~~              ^^^^^^^^^^^^
        }
      `,
      messages: [
        { char: '~', messageId },
        { char: '^', messageId },
      ],
    }),
  ],
});
