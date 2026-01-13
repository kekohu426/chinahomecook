import { describe, expect, test } from "vitest";
import {
  buildRuleWhereClause,
  validateRuleConfig,
} from "@/lib/collection/rule-engine";
import {
  calculateProgress,
  calculateQualifiedStatus,
  QualifiedStatus,
} from "@/lib/types/collection";
import type { RuleConfig } from "@/lib/types/collection";

describe("CollectionRuleEngine", () => {
  test("auto rule: cuisineId", () => {
    const where = buildRuleWhereClause(
      { mode: "auto", field: "cuisineId", value: "c1" },
      { cuisineId: "c1" }
    );
    expect(where).toMatchObject({ cuisineId: "c1" });
  });

  test("custom rule: OR then AND with NOT", () => {
    const rules: RuleConfig = {
      mode: "custom",
      groups: [
        {
          logic: "OR",
          conditions: [
            { field: "tag", operator: "eq", value: "减脂", tagType: "crowd" },
            { field: "tag", operator: "eq", value: "清淡", tagType: "taste" },
          ],
        },
        {
          logic: "AND",
          conditions: [{ field: "cookTime", operator: "lte", value: 30 }],
        },
      ],
      exclude: [{ field: "tag", operator: "eq", value: "重口味", tagType: "taste" }],
    };

    const where = buildRuleWhereClause(rules, { excludedRecipeIds: [] });

    expect(where).toMatchObject({
      AND: [
        {
          OR: [
            {
              tags: {
                some: { tag: { type: "crowd" }, tagId: "减脂" },
              },
            },
            {
              tags: {
                some: { tag: { type: "taste" }, tagId: "清淡" },
              },
            },
          ],
        },
        {
          AND: [{ cookTime: { lte: 30 } }],
        },
      ],
      NOT: {
        OR: [
          {
            tags: {
              some: { tag: { type: "taste" }, tagId: "重口味" },
            },
          },
        ],
      },
    });
  });

  test("empty groups ignored", () => {
    const rules: RuleConfig = {
      mode: "custom",
      groups: [{ logic: "OR", conditions: [] }],
      exclude: [],
    };
    const where = buildRuleWhereClause(rules, { excludedRecipeIds: [] });
    expect(where).toMatchObject({});
  });

  test("validate rule config", () => {
    const invalid: RuleConfig = {
      mode: "custom",
      groups: [
        {
          logic: "INVALID" as any,
          conditions: [{ field: "cookTime", operator: "eq", value: "abc" }],
        },
      ],
      exclude: [],
    };
    const result = validateRuleConfig(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("Qualified calculation", () => {
  test("qualified when publishedCount >= minRequired", () => {
    expect(calculateQualifiedStatus(25, 20, 60)).toBe(QualifiedStatus.QUALIFIED);
  });

  test("near when 80% <= progress < 100%", () => {
    expect(calculateQualifiedStatus(50, 60, 60)).toBe(QualifiedStatus.NEAR);
  });

  test("unqualified otherwise", () => {
    expect(calculateQualifiedStatus(10, 20, 60)).toBe(
      QualifiedStatus.UNQUALIFIED
    );
  });

  test("progress calculation", () => {
    expect(calculateProgress(45, 60)).toBe(75);
    expect(calculateProgress(0, 0)).toBe(0);
  });
});
