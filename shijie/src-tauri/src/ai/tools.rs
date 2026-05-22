use serde::Serialize;
use serde_json::Value;

// ========== 工具定义结构 ==========

#[derive(Debug, Serialize, Clone)]
pub struct ToolDefinition {
    #[serde(rename = "type")]
    pub tool_type: String,
    pub function: FunctionDef,
}

#[derive(Debug, Serialize, Clone)]
pub struct FunctionDef {
    pub name: String,
    pub description: String,
    pub parameters: ToolParameters,
}

#[derive(Debug, Serialize, Clone)]
pub struct ToolParameters {
    #[serde(rename = "type")]
    pub param_type: String,
    pub properties: Value,
    pub required: Vec<String>,
}

// ========== AI 返回的 tool_calls 结构 ==========

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct ToolCall {
    pub id: String,
    #[serde(rename = "type")]
    pub call_type: String,
    pub function: FunctionCall,
}

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct FunctionCall {
    pub name: String,
    /// JSON 字符串，需要二次解析
    pub arguments: String,
}

// ========== 工具清单 ==========

/// 返回所有可用工具的定义（OpenAI Function Calling 格式）
pub fn get_tools() -> Vec<ToolDefinition> {
    vec![
        create_task_definition(),
        complete_task_definition(),
        delete_task_definition(),
        search_tasks_definition(),
    ]
}

fn create_task_definition() -> ToolDefinition {
    ToolDefinition {
        tool_type: "function".to_string(),
        function: FunctionDef {
            name: "create_task".to_string(),
            description: "创建一个新任务。当用户说[帮我记一下/提醒我/加个任务]等意图时调用。".to_string(),
            parameters: ToolParameters {
                param_type: "object".to_string(),
                properties: serde_json::json!({
                    "title": {
                        "type": "string",
                        "description": "任务标题，用简洁的语言概括要做的事"
                    },
                    "description": {
                        "type": "string",
                        "description": "任务描述/详情，用户补充的额外信息"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["high", "medium", "low", "none"],
                        "description": "优先级：high=紧急且重要，medium=重要但不紧急，low=一般，none=未指定。默认根据语气推断"
                    },
                    "deadline": {
                        "type": "string",
                        "description": "截止时间，ISO8601格式如 2026-05-23T18:00:00+08:00。如果用户说明天下午3点前，请推算为带时区的完整时间"
                    },
                    "scheduled_at": {
                        "type": "string",
                        "description": "计划开始时间，ISO8601格式。用户说周六做就填周六的日期"
                    },
                    "estimated_minutes": {
                        "type": "integer",
                        "description": "预估耗时（分钟），用户如果说大概要2小时就填120"
                    },
                    "notes": {
                        "type": "string",
                        "description": "备注信息，用户提到的补充说明"
                    },
                    "tags": {
                        "type": "string",
                        "description": "标签，JSON字符串数组格式，如'[\"学习\",\"编程\"]'"
                    }
                }),
                required: vec!["title".to_string()],
            },
        },
    }
}

fn complete_task_definition() -> ToolDefinition {
    ToolDefinition {
        tool_type: "function".to_string(),
        function: FunctionDef {
            name: "complete_task".to_string(),
            description: "完成一个任务。当用户说做完了/完成了/搞定了某件事时调用。用query参数搜索任务标题。".to_string(),
            parameters: ToolParameters {
                param_type: "object".to_string(),
                properties: serde_json::json!({
                    "query": {
                        "type": "string",
                        "description": "任务标题关键词，用于搜索要完成的任务。用任务名中的关键词搜索"
                    }
                }),
                required: vec!["query".to_string()],
            },
        },
    }
}

fn delete_task_definition() -> ToolDefinition {
    ToolDefinition {
        tool_type: "function".to_string(),
        function: FunctionDef {
            name: "delete_task".to_string(),
            description: "删除一个任务。当用户说删掉/取消/不要了某个任务时调用。用query参数搜索任务标题。".to_string(),
            parameters: ToolParameters {
                param_type: "object".to_string(),
                properties: serde_json::json!({
                    "query": {
                        "type": "string",
                        "description": "任务标题关键词，用于搜索要删除的任务"
                    }
                }),
                required: vec!["query".to_string()],
            },
        },
    }
}

fn search_tasks_definition() -> ToolDefinition {
    ToolDefinition {
        tool_type: "function".to_string(),
        function: FunctionDef {
            name: "search_tasks".to_string(),
            description: "查看/搜索任务列表。当用户问[有哪些任务/帮我看看任务/找一下某个任务/今天有什么安排]时调用。query为空则列出所有任务。".to_string(),
            parameters: ToolParameters {
                param_type: "object".to_string(),
                properties: serde_json::json!({
                    "query": {
                        "type": "string",
                        "description": "搜索关键词，匹配标题/描述/备注。不填则返回所有任务"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["pending", "in_progress", "completed", "cancelled"],
                        "description": "按状态筛选，不填则返回所有状态"
                    }
                }),
                required: vec![],
            },
        },
    }
}
