use tauri::State;

use crate::ai::client;
use crate::ai::{prompts, tool_executor, tools};
use crate::db::connection::DbState;
use crate::db::repositories::{ai_repo, setting_repo};

fn get_setting_or(conn: &rusqlite::Connection, key: &str, fallback: &str) -> String {
    setting_repo::get_setting(conn, key)
        .ok()
        .flatten()
        .map(|s| s.value)
        .unwrap_or_else(|| fallback.to_string())
}

#[tauri::command]
pub fn create_conversation(
    state: State<'_, DbState>,
    title: Option<String>,
) -> Result<ai_repo::Conversation, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    ai_repo::create_conversation(&conn, title.as_deref())
}

#[tauri::command]
pub fn list_conversations(
    state: State<'_, DbState>,
) -> Result<Vec<ai_repo::Conversation>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    ai_repo::list_conversations(&conn)
}

#[tauri::command]
pub fn delete_conversation(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    ai_repo::delete_conversation(&conn, &id)
}

#[tauri::command]
pub fn rename_conversation(
    state: State<'_, DbState>,
    id: String,
    title: String,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    ai_repo::rename_conversation(&conn, &id, &title)
}

#[tauri::command]
pub fn list_messages(
    state: State<'_, DbState>,
    conversation_id: String,
) -> Result<Vec<ai_repo::Message>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    ai_repo::list_messages(&conn, &conversation_id)
}

/// 核心命令：发送用户消息 → 调用 AI → 保存 AI 回复 → 返回 AI 回复
#[tauri::command]
pub async fn send_message(
    state: State<'_, DbState>,
    conversation_id: String,
    content: String,
) -> Result<ai_repo::Message, String> {
    // 1. 保存用户消息 + 读取消息历史 + 构建系统提示词 + 读取配置，然后释放锁
    let (chat_messages, config, tool_defs) = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;

        // 保存用户消息
        ai_repo::create_message(&conn, &conversation_id, "user", Some(&content), None, None, None)?;

        // 构建系统提示词
        let personality = get_setting_or(&conn, "ai.personality", "你是一个温暖的人生管理助手，名叫提灯。");
        let system_prompt = prompts::build_system_prompt(&personality);

        // 构建消息列表：系统提示词 + 历史消息
        let mut chat_messages: Vec<client::ChatMessage> = Vec::new();

        // 系统提示词永远在第一条
        chat_messages.push(client::ChatMessage {
            role: "system".to_string(),
            content: Some(system_prompt),
            tool_calls: None,
            tool_call_id: None,
            name: None,
            reasoning_content: None,
        });

        // 追加历史消息
        let db_messages = ai_repo::list_messages(&conn, &conversation_id)?;
        for m in &db_messages {
            // 解析历史消息中的 tool_calls（如果有）
            let tc: Option<Vec<serde_json::Value>> = m
                .tool_calls
                .as_deref()
                .and_then(|s| serde_json::from_str(s).ok());

            chat_messages.push(client::ChatMessage {
                role: m.role.clone(),
                content: m.content.clone(),
                tool_calls: tc,
                tool_call_id: m.tool_call_id.clone(),
                name: None,
                reasoning_content: m.reasoning_content.clone(),
            });
        }

        // 获取工具定义
        let tool_defs = tools::get_tools();

        // 读取 AI 配置
        let config = client::AiConfig {
            api_url: get_setting_or(&conn, "ai.api_url", "https://api.deepseek.com/v1"),
            api_key: get_setting_or(&conn, "ai.api_key", ""),
            model: get_setting_or(&conn, "ai.model", "deepseek-chat"),
        };

        (chat_messages, config, tool_defs)
        // 锁在此释放
    };

    // 2. 调用 AI（不持有锁，带工具定义）
    let ai_reply = client::chat_completion(&config, chat_messages, Some(tool_defs)).await?;

    // 3. 保存 AI 回复（含 tool_calls）
    let saved_msg = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let tool_calls_json = ai_reply
            .tool_calls
            .as_ref()
            .map(|tc| serde_json::to_string(tc).unwrap_or_default());

        ai_repo::create_message(
            &conn,
            &conversation_id,
            "assistant",
            ai_reply.content.as_deref(),
            tool_calls_json.as_deref(),
            None,
            ai_reply.reasoning_content.as_deref(),
        )?
    };

    // 4. 如果对话标题还是默认的"新对话"，自动生成标题
    {
        let needs_title = {
            let conn = state.conn.lock().map_err(|e| e.to_string())?;
            let conv = ai_repo::get_conversation(&conn, &conversation_id)?;
            conv.title == "新对话"
        };
        if needs_title {
            // 取首条用户消息来生成标题
            let first_user_content = {
                let conn = state.conn.lock().map_err(|e| e.to_string())?;
                let msgs = ai_repo::list_messages(&conn, &conversation_id)?;
                msgs.iter()
                    .find(|m| m.role == "user")
                    .and_then(|m| m.content.clone())
            };
            if let Some(user_msg) = first_user_content {
                match client::generate_title(&config, &user_msg).await {
                    Ok(title) => {
                        if let Ok(conn) = state.conn.lock() {
                            let _ = ai_repo::rename_conversation(&conn, &conversation_id, &title);
                        }
                    }
                    Err(_) => { /* 标题生成失败不影响主流程 */ }
                }
            }
        }
    }

    Ok(saved_msg)
}

// ========== 工具执行 + AI 跟进 ==========

/// 构建发送给 AI 的完整消息上下文（系统提示词 + 历史消息 + 配置）
fn build_chat_context(
    conn: &rusqlite::Connection,
    conversation_id: &str,
) -> Result<(Vec<client::ChatMessage>, client::AiConfig), String> {
    let personality = get_setting_or(
        conn,
        "ai.personality",
        "你是一个温暖的人生管理助手，名叫提灯。",
    );
    let system_prompt = prompts::build_system_prompt(&personality);

    let mut chat_messages = vec![client::ChatMessage {
        role: "system".to_string(),
        content: Some(system_prompt),
        tool_calls: None,
        tool_call_id: None,
        name: None,
        reasoning_content: None,
    }];

    let db_messages = ai_repo::list_messages(conn, conversation_id)?;
    for m in &db_messages {
        let tc: Option<Vec<serde_json::Value>> = m
            .tool_calls
            .as_deref()
            .and_then(|s| serde_json::from_str(s).ok());

        chat_messages.push(client::ChatMessage {
            role: m.role.clone(),
            content: m.content.clone(),
            tool_calls: tc,
            tool_call_id: m.tool_call_id.clone(),
            name: None,
            reasoning_content: m.reasoning_content.clone(),
        });
    }

    let config = client::AiConfig {
        api_url: get_setting_or(conn, "ai.api_url", "https://api.deepseek.com/v1"),
        api_key: get_setting_or(conn, "ai.api_key", ""),
        model: get_setting_or(conn, "ai.model", "deepseek-chat"),
    };

    Ok((chat_messages, config))
}

/// 用户确认执行工具调用
///
/// 1. 解析 AI 消息中的 tool_calls
/// 2. 逐个执行工具，写入 tool 角色消息
/// 3. 调 AI 跟进回复（不带工具）
/// 4. 返回对话全部消息
#[tauri::command]
pub async fn execute_tool_calls(
    state: State<'_, DbState>,
    conversation_id: String,
    message_id: String,
) -> Result<Vec<ai_repo::Message>, String> {
    // 1. 执行工具 + 获取配置
    let config = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;

        let ai_msg = ai_repo::get_message(&conn, &message_id)?;
        let tool_calls_str = ai_msg
            .tool_calls
            .ok_or("该消息不包含 tool_calls".to_string())?;

        let tool_calls: Vec<tools::ToolCall> =
            serde_json::from_str(&tool_calls_str)
                .map_err(|e| format!("tool_calls 解析失败: {}", e))?;

        for tc in &tool_calls {
            let result = tool_executor::execute_tool(
                &conn,
                &tc.function.name,
                &tc.function.arguments,
            )?;

            ai_repo::create_message(
                &conn,
                &conversation_id,
                "tool",
                Some(&result),
                None,
                Some(&tc.id),
                None,
            )?;
        }

        drop(conn);
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let (_, config) = build_chat_context(&conn, &conversation_id)?;
        config
    };

    // 2. 构建聊天上下文 + 调 AI 跟进（不带工具）
    //    分两步以避免 MutexGuard 跨 await
    let chat_messages = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let (msgs, _) = build_chat_context(&conn, &conversation_id)?;
        msgs
    };

    let follow_up_msg = client::chat_completion(&config, chat_messages, None).await?;

    // 3. 保存 AI 跟进 + 返回全部消息
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    ai_repo::create_message(
        &conn,
        &conversation_id,
        "assistant",
        follow_up_msg.content.as_deref(),
        None,
        None,
        follow_up_msg.reasoning_content.as_deref(),
    )?;
    ai_repo::list_messages(&conn, &conversation_id)
}

/// 用户对工具调用卡片提出修改意见
///
/// 取消未执行的 tool_calls → 写入用户反馈 → AI 重新生成 → 返回全部消息
#[tauri::command]
pub async fn modify_tool_calls(
    state: State<'_, DbState>,
    conversation_id: String,
    feedback: String,
) -> Result<Vec<ai_repo::Message>, String> {
    // 1. 取消未执行的 tool_calls + 保存反馈 + 构建上下文
    let (chat_messages, config, tool_defs) = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;

        // 查找最后一个带 tool_calls 的 assistant 消息，写入取消 tool 消息
        {
            let msgs = ai_repo::list_messages(&conn, &conversation_id)?;
            if let Some(last_assistant) =
                msgs.iter().rev().find(|m| m.role == "assistant" && m.tool_calls.is_some())
            {
                // 检查该消息之后是否有 tool 消息（即是否已被执行/取消）
                let last_idx = msgs.iter().position(|m| m.id == last_assistant.id).unwrap();
                let has_tool_after = msgs[last_idx + 1..].iter().any(|m| m.role == "tool");
                if !has_tool_after {
                    let tool_calls: Vec<tools::ToolCall> =
                        serde_json::from_str(last_assistant.tool_calls.as_deref().unwrap_or("[]"))
                            .unwrap_or_default();
                    for tc in &tool_calls {
                        ai_repo::create_message(
                            &conn,
                            &conversation_id,
                            "tool",
                            Some("[用户要求修改，此操作已取消]"),
                            None,
                            Some(&tc.id),
                            None,
                        )?;
                    }
                }
            }
        }

        // 保存用户反馈
        ai_repo::create_message(
            &conn,
            &conversation_id,
            "user",
            Some(&feedback),
            None,
            None,
            None,
        )?;

        let (chat_messages, _) = build_chat_context(&conn, &conversation_id)?;
        let tool_defs = tools::get_tools();

        let config = client::AiConfig {
            api_url: get_setting_or(&conn, "ai.api_url", "https://api.deepseek.com/v1"),
            api_key: get_setting_or(&conn, "ai.api_key", ""),
            model: get_setting_or(&conn, "ai.model", "deepseek-chat"),
        };

        (chat_messages, config, tool_defs)
    };

    // 2. 调 AI 重新生成（带工具定义，AI 可能更新 tool_calls）
    let ai_reply = client::chat_completion(&config, chat_messages, Some(tool_defs)).await?;

    // 3. 保存 AI 回复 + 返回全部消息
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let tool_calls_json = ai_reply
        .tool_calls
        .as_ref()
        .map(|tc| serde_json::to_string(tc).unwrap_or_default());

    ai_repo::create_message(
        &conn,
        &conversation_id,
        "assistant",
        ai_reply.content.as_deref(),
        tool_calls_json.as_deref(),
        None,
        ai_reply.reasoning_content.as_deref(),
    )?;
    ai_repo::list_messages(&conn, &conversation_id)
}
/// 用户取消工具调用
///
/// 写入取消信息为 tool 消息，让 AI 知道用户拒绝了
#[tauri::command]
pub async fn cancel_tool_calls(
    state: State<'_, DbState>,
    conversation_id: String,
    message_id: String,
) -> Result<Vec<ai_repo::Message>, String> {
    // 1. 写入取消 tool 消息 + 获取配置
    let config = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;

        let ai_msg = ai_repo::get_message(&conn, &message_id)?;
        let tool_calls_str = ai_msg
            .tool_calls
            .ok_or("该消息不包含 tool_calls".to_string())?;

        let tool_calls: Vec<tools::ToolCall> =
            serde_json::from_str(&tool_calls_str)
                .map_err(|e| format!("tool_calls 解析失败: {}", e))?;

        for tc in &tool_calls {
            ai_repo::create_message(
                &conn,
                &conversation_id,
                "tool",
                Some("[用户取消了此操作]"),
                None,
                Some(&tc.id),
                None,
            )?;
        }

        drop(conn);
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let (_, config) = build_chat_context(&conn, &conversation_id)?;
        config
    };

    // 2. 构建上下文 + 调 AI 跟进
    let chat_messages = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let (msgs, _) = build_chat_context(&conn, &conversation_id)?;
        msgs
    };

    let follow_up_msg = client::chat_completion(&config, chat_messages, None).await?;

    // 3. 保存 AI 跟进 + 返回全部消息
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    ai_repo::create_message(
        &conn,
        &conversation_id,
        "assistant",
        follow_up_msg.content.as_deref(),
        None,
        None,
        follow_up_msg.reasoning_content.as_deref(),
    )?;
    ai_repo::list_messages(&conn, &conversation_id)
}
