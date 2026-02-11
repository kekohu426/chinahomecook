/**
 * ESLint 规则：禁止硬编码的 i18n 三元表达式
 *
 * 检测以下模式：
 * - isEn ? "..." : "..."
 * - locale === "en" ? "..." : "..."
 *
 * 用法：在 .eslintrc.js 中添加此规则
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "禁止使用硬编码的 i18n 三元表达式，应使用 t() 函数",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noHardcodedI18n:
        "禁止使用硬编码 i18n 表达式 '{{ pattern }}'。请使用 t() 函数替代。参考：docs/I18N_WORKFLOW.md",
    },
    schema: [],
  },

  create(context) {
    return {
      ConditionalExpression(node) {
        const sourceCode = context.getSourceCode();
        const testText = sourceCode.getText(node.test);

        // 检测 isEn ? 或 locale === "en" ? 模式
        const patterns = [
          /^isEn$/,
          /^locale\s*===?\s*["']en["']$/,
          /^locale\s*!==?\s*["']zh["']$/,
        ];

        const isI18nPattern = patterns.some((p) => p.test(testText.trim()));

        if (isI18nPattern) {
          // 检查是否在 JSX 文本上下文中（更可能是需要翻译的内容）
          const consequent = node.consequent;
          const alternate = node.alternate;

          // 如果两边都是字符串字面量，则报告
          if (
            (consequent.type === "Literal" && typeof consequent.value === "string") ||
            (consequent.type === "TemplateLiteral") ||
            (alternate.type === "Literal" && typeof alternate.value === "string") ||
            (alternate.type === "TemplateLiteral")
          ) {
            context.report({
              node,
              messageId: "noHardcodedI18n",
              data: {
                pattern: testText,
              },
            });
          }
        }
      },
    };
  },
};
