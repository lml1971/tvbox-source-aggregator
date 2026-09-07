#!/bin/bash
# Hook: SessionStart
# 检查 FEEDBACK-INDEX.md 是否有需要处理的 feedback
# 有条目 → 输出提醒派发 evolution-runner

FEEDBACK_INDEX="$CLAUDE_PROJECT_DIR/.claude/feedback/FEEDBACK-INDEX.md"

if [ ! -f "$FEEDBACK_INDEX" ]; then
  exit 0
fi

COUNT=$(grep -c "^- \[" "$FEEDBACK_INDEX" 2>/dev/null)
COUNT=${COUNT:-0}
COUNT=$(echo "$COUNT" | tr -d '[:space:]')

if [ "$COUNT" -gt 0 ] 2>/dev/null; then
  echo "有 ${COUNT} 条 feedback 记录。建议派发 evolution-runner 检查是否有进化建议。"
fi

exit 0
