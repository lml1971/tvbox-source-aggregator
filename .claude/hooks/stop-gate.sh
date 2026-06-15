#!/bin/bash
# Hook: Stop
# 代码文件被修改但未 review 时阻止停止（仅阻塞一次）

STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/.needs-review"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

STATE=$(cat "$STATE_FILE" 2>/dev/null | tr -d '[:space:]')

case "$STATE" in
  "needs_review")
    # 阻塞一次后标记为 reminded，不再重复阻塞
    echo "reminded" > "$STATE_FILE"
    echo '{"decision": "block", "reason": "代码已修改但未进行 code review。请先完成审查再结束 session。"}'
    exit 0
    ;;
  "reminded"|"clean")
    # 已提醒过或已清除，放行
    rm -f "$STATE_FILE"
    exit 0
    ;;
  *)
    exit 0
    ;;
esac
