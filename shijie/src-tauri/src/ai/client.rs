use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::tools::ToolDefinition;

// ========== 请求/响应结构 ==========

#[derive(Debug, Serialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// DeepSeek thinking 模式返回的推理链，后续请求必须原样带回
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning_content: Option<String>,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<ToolDefinition>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ResponseMessage {
    content: Option<String>,
    #[serde(default)]
    tool_calls: Option<Vec<ToolCall>>,
    /// DeepSeek thinking 模式的推理链
    #[serde(default)]
    reasoning_content: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ToolCall {
    id: String,
    #[serde(rename = "type")]
    call_type: String,
    function: FunctionCall,
}

#[derive(Debug, Deserialize)]
struct FunctionCall {
    name: String,
    arguments: String,
}

/// AI 配置（从 settings 表读取后传入）
#[derive(Debug, Clone)]
pub struct AiConfig {
    pub api_url: String,
    pub api_key: String,
    pub model: String,
}

/// 用 AI 根据首条用户消息生成对话标题（10 字以内）
pub async fn generate_title(config: &AiConfig, user_message: &str) -> Result<String, String> {
    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: Some(
                "你是标题生成器。把用户输入总结成10字以内标题，只返回标题文本，不加引号、标点、解释。".into(),
            ),
            tool_calls: None,
            tool_call_id: None,
            name: None,
            reasoning_content: None,
        },
        ChatMessage {
            role: "user".to_string(),
            content: Some(format!("为以下对话起标题：{}", user_message)),
            tool_calls: None,
            tool_call_id: None,
            name: None,
            reasoning_content: None,
        },
    ];

    let reply = chat_completion(config, messages, None).await?;
    let title = reply.content.unwrap_or_default().trim().to_string();
    // 限制长度，去掉可能残留的引号
    let title = title.trim_matches(|c| c == '"' || c == '"' || c == '"' || c == '\'');
    if title.is_empty() {
        Ok("新对话".to_string())
    } else {
        Ok(title.chars().take(20).collect())
    }
}

/// 调用 OpenAI 兼容 API（支持函数调用）
///
/// 如果传了 tools，会自动设置 tool_choice="auto"
/// 返回值中 tool_calls 可能不为 None
pub async fn chat_completion(
    config: &AiConfig,
    messages: Vec<ChatMessage>,
    tools: Option<Vec<ToolDefinition>>,
) -> Result<ChatMessage, String> {
    if config.api_key.is_empty() {
        return Err("未配置 AI API Key，请在设置页面填写".to_string());
    }

    let url = format!("{}/chat/completions", config.api_url.trim_end_matches('/'));

    let tool_choice = if tools.is_some() {
        Some("auto".to_string())
    } else {
        None
    };

    let body = ChatRequest {
        model: config.model.clone(),
        messages,
        tools,
        tool_choice,
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("AI 请求失败: {}", e))?;

    let status = resp.status();
    if !status.is_success() {
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("AI API 返回错误 {}: {}", status, err_text));
    }

    let chat_resp: ChatResponse = resp
        .json()
        .await
        .map_err(|e| format!("AI 响应解析失败: {}", e))?;

    let msg = chat_resp
        .choices
        .into_iter()
        .next()
        .ok_or("AI 响应为空")?;

    // 转换 tool_calls 为 Value 数组，方便存 DB 和传前端
    let tool_calls_value: Option<Vec<Value>> =
        msg.message.tool_calls.map(|tc| {
            tc.into_iter()
                .map(|t| {
                    serde_json::json!({
                        "id": t.id,
                        "type": t.call_type,
                        "function": {
                            "name": t.function.name,
                            "arguments": t.function.arguments,
                        }
                    })
                })
                .collect()
        });

    Ok(ChatMessage {
        role: "assistant".to_string(),
        content: msg.message.content,
        tool_calls: tool_calls_value,
        tool_call_id: None,
        name: None,
        reasoning_content: msg.message.reasoning_content,
    })
}
