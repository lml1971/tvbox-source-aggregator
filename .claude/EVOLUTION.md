[职责]
    本文件描述进化引擎的概念和层级。具体执行由两个 sub-agent 负责：

    - **feedback-observer**：记录用户反馈和经验教训（使用 feedback-writer skill）
    - **evolution-runner**：扫描 feedback 积累，生成进化建议（使用 evolution-engine skill）

[进化层级]
    四层进化路径，逐层递进：

    **第一层：经验积累**
    用户给出修正或反馈时，主 Agent 派发 feedback-observer 记录。

    **第二层：规则毕业**
    feedback 重复出现 3+ 次 → evolution-runner 提议升级为 SKILL.md 或 CLAUDE.md 中的正式规则。

    **第三层：Skill 优化**
    某 Skill 来源的 feedback 评分持续偏低 → evolution-runner 提议调整该 Skill。

    **第四层：Skill 自动生成**
    某操作模式反复出现（5+ 次）但无 Skill 覆盖 → evolution-runner 提议创建新 Skill。

[用户体验]
    进化是养成式的，不是打扰式的。

    - 记录 feedback → 无感（sub-agent 静默执行）
    - 归纳扫描 → 无感（session 初始化时静默）
    - 有待处理提议 → 轻触（一行提示）
    - 展示提议 → 用户主动选择查看
    - 执行变更 → 每条需用户确认，绝不自动改规则
