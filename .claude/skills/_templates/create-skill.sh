#!/bin/bash
#
# create-skill.sh - 快速创建新 Skill
#
# Usage: ./create-skill.sh <skill-name> "<description>"
#
# Example: ./create-skill.sh deploy-check "Check deployment readiness"
#

set -e

SKILLS_DIR="$(dirname "$0")/.."
TEMPLATES_DIR="$(dirname "$0")"

if [ -z "$1" ]; then
    echo "Usage: $0 <skill-name> [description]"
    echo "Example: $0 deploy-check \"Check deployment readiness\""
    exit 1
fi

SKILL_NAME="$1"
SKILL_DESC="${2:-TODO: Add description}"
SKILL_DIR="$SKILLS_DIR/$SKILL_NAME"

# 检查是否已存在
if [ -d "$SKILL_DIR" ]; then
    echo "Error: Skill '$SKILL_NAME' already exists"
    exit 1
fi

# 创建目录
mkdir -p "$SKILL_DIR"

# 创建 SKILL.md
cat > "$SKILL_DIR/SKILL.md" << EOF
---
name: $SKILL_NAME
description: $SKILL_DESC
allowed-tools: Read, Grep, Glob
---

# ${SKILL_NAME//-/ }

## Overview

TODO: Describe what this skill does.

## When to Use

Use this skill when:
- TODO: Add use case 1
- TODO: Add use case 2
- TODO: Add use case 3

## Instructions

### Step 1: TODO
TODO: Add instructions

### Step 2: TODO
TODO: Add instructions

## Examples

### Example 1: TODO
\`\`\`
TODO: Add example
\`\`\`

## Notes

TODO: Add any additional notes
EOF

echo "Created skill: $SKILL_DIR"
echo ""
echo "Next steps:"
echo "1. Edit $SKILL_DIR/SKILL.md"
echo "2. Update description with trigger keywords"
echo "3. Add detailed instructions and examples"
echo "4. Restart Claude Code to load the skill"
