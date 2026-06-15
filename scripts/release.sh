#!/bin/bash
# 发版脚本：自动生成 CHANGELOG、更新版本号、打 tag
# 用法: bash scripts/release.sh [patch|minor|major]

set -e

BUMP_TYPE="${1:-patch}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# 校验参数
if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  echo "用法: $0 [patch|minor|major]"
  exit 1
fi

# 确保工作区干净
if [[ -n "$(git status --porcelain)" ]]; then
  echo "错误: 工作区有未提交的变更，请先提交或暂存"
  exit 1
fi

# 当前版本
OLD_VERSION=$(node -p "require('./package.json').version")
echo "当前版本: v$OLD_VERSION"

# 计算新版本
IFS='.' read -r MAJOR MINOR PATCH <<< "$OLD_VERSION"
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "新版本:   v$NEW_VERSION"
echo ""

# 确定上一个 tag（如果没有 tag，使用第一个 commit）
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)

# 从 git log 生成 CHANGELOG 条目
echo "生成 CHANGELOG..."

FEATURES=""
FIXES=""
PERF=""
OTHER=""

while IFS= read -r line; do
  # 提取 conventional commit 类型和描述
  if [[ "$line" =~ ^feat(\(.+\))?:\ (.+)$ ]]; then
    FEATURES="$FEATURES\n- ${BASH_REMATCH[2]}"
  elif [[ "$line" =~ ^fix(\(.+\))?:\ (.+)$ ]]; then
    FIXES="$FIXES\n- ${BASH_REMATCH[2]}"
  elif [[ "$line" =~ ^perf(\(.+\))?:\ (.+)$ ]]; then
    PERF="$PERF\n- ${BASH_REMATCH[2]}"
  fi
done <<< "$(git log "$LAST_TAG"..HEAD --pretty=format:"%s" --no-merges)"

DATE=$(date +%Y-%m-%d)
ENTRY="## v$NEW_VERSION ($DATE)\n"

if [[ -n "$FEATURES" ]]; then
  ENTRY="$ENTRY\n### Features\n$FEATURES\n"
fi
if [[ -n "$FIXES" ]]; then
  ENTRY="$ENTRY\n### Fixes\n$FIXES\n"
fi
if [[ -n "$PERF" ]]; then
  ENTRY="$ENTRY\n### Performance\n$PERF\n"
fi

# 如果没有任何 conventional commits
if [[ -z "$FEATURES" && -z "$FIXES" && -z "$PERF" ]]; then
  ENTRY="$ENTRY\n- Maintenance release\n"
fi

# 写入 CHANGELOG.md
if [[ -f "CHANGELOG.md" ]]; then
  # 在标题行后插入新条目
  EXISTING=$(cat CHANGELOG.md)
  HEADER="# Changelog"
  REST="${EXISTING#*$HEADER}"
  printf "%s\n\n%b\n%s" "$HEADER" "$ENTRY" "$REST" > CHANGELOG.md
else
  printf "# Changelog\n\n%b\n" "$ENTRY" > CHANGELOG.md
fi

echo "CHANGELOG.md 已更新"

# 更新 package.json 版本号
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version > /dev/null 2>&1
echo "package.json 已更新到 v$NEW_VERSION"

# 提交并打 tag
git add package.json package-lock.json CHANGELOG.md
git commit -m "release: v$NEW_VERSION"
git tag "v$NEW_VERSION"

echo ""
echo "✅ 发版完成: v$NEW_VERSION"
echo ""
echo "下一步:"
echo "  git push && git push --tags"
echo ""
echo "如需撤销:"
echo "  git tag -d v$NEW_VERSION && git reset --soft HEAD~1"
