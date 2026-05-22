use rusqlite::{params, Connection};
use serde::Deserialize;

use crate::db::repositories::task_repo;

// ========== 工具参数解析 ==========

#[derive(Debug, Deserialize)]
struct ToolCreateTaskArgs {
    title: String,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    priority: Option<String>,
    #[serde(default)]
    scheduled_at: Option<String>,
    #[serde(default)]
    deadline: Option<String>,
    #[serde(default)]
    estimated_minutes: Option<i32>,
    #[serde(default)]
    notes: Option<String>,
    #[serde(default)]
    tags: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ToolQueryArgs {
    query: String,
}

#[derive(Debug, Deserialize)]
struct ToolSearchArgs {
    #[serde(default)]
    query: Option<String>,
    #[serde(default)]
    status: Option<String>,
}

// ========== 工具调度 ==========

/// 根据工具名和参数执行对应的数据库操作，返回结果描述文本
pub fn execute_tool(conn: &Connection, name: &str, arguments: &str) -> Result<String, String> {
    match name {
        "create_task" => execute_create_task(conn, arguments),
        "complete_task" => execute_complete_task(conn, arguments),
        "delete_task" => execute_delete_task(conn, arguments),
        "search_tasks" => execute_search_tasks(conn, arguments),
        _ => Err(format!("未知工具: {}", name)),
    }
}

// ========== 具体工具实现 ==========

fn execute_create_task(conn: &Connection, arguments: &str) -> Result<String, String> {
    let args: ToolCreateTaskArgs = serde_json::from_str(arguments)
        .map_err(|e| format!("create_task 参数解析失败: {}", e))?;

    let task = task_repo::create_task(
        conn,
        &args.title,
        None,
        args.description.as_deref(),
        args.priority.as_deref(),
        args.scheduled_at.as_deref(),
        args.deadline.as_deref(),
        args.estimated_minutes.unwrap_or(0),
        args.tags.as_deref(),
    )?;

    let mut result = format!("任务已创建：{}", task.title);
    if let Some(ref deadline) = task.deadline {
        result.push_str(&format!("，截止时间：{}", deadline));
    }
    if let Some(ref priority) = task.priority {
        let label = match priority.as_str() {
            "high" => "紧急",
            "medium" => "重要",
            "low" => "一般",
            _ => priority,
        };
        result.push_str(&format!("，优先级：{}", label));
    }

    Ok(result)
}

// ========== 辅助函数 ==========

/// 按标题关键词搜索任务，返回 (任务列表, 总数)
fn find_tasks_by_query(
    conn: &Connection,
    query: &str,
) -> Result<(Vec<task_repo::Task>, usize), String> {
    let tasks = task_repo::search_tasks(conn, query)?;
    let count = tasks.len();
    Ok((tasks, count))
}

fn status_cn(status: &str) -> &str {
    match status {
        "pending" => "待办",
        "in_progress" => "进行中",
        "completed" => "已完成",
        "cancelled" => "已取消",
        _ => status,
    }
}

fn now_str() -> String {
    chrono::Local::now().to_rfc3339()
}

// ========== 完成任务 ==========

fn execute_complete_task(conn: &Connection, arguments: &str) -> Result<String, String> {
    let args: ToolQueryArgs = serde_json::from_str(arguments)
        .map_err(|e| format!("complete_task 参数解析失败: {}", e))?;

    let (tasks, count) = find_tasks_by_query(conn, &args.query)?;

    // 过滤掉已完成的
    let pending: Vec<&task_repo::Task> = tasks
        .iter()
        .filter(|t| t.status == "pending" || t.status == "in_progress")
        .collect();

    if pending.is_empty() {
        if count == 0 {
            return Err(format!("没有找到标题包含[{}]的任务。", args.query));
        }
        // 全完成了
        let info: Vec<String> = tasks.iter().map(|t| format!("[{}]{}", status_cn(&t.status), t.title)).collect();
        return Err(format!("找到的任务都已完成或取消：{}", info.join("; ")));
    }

    if pending.len() > 1 {
        let info: Vec<String> = pending.iter().map(|t| t.title.clone()).collect();
        return Err(format!("找到{}个未完成任务：{}。请更具体地指定要完成哪个。", pending.len(), info.join("、")));
    }

    let task = pending[0];

    // 简化的完成操作：更新状态 + 完成时间
    let ts = now_str();
    conn.execute(
        "UPDATE tasks SET status = 'completed', completed_at = ?1, updated_at = ?1 WHERE id = ?2",
        params![ts, task.id],
    )
    .map_err(|e| format!("完成任务失败: {}", e))?;

    Ok(format!("任务已完成：{}", task.title))
}

// ========== 删除任务 ==========

fn execute_delete_task(conn: &Connection, arguments: &str) -> Result<String, String> {
    let args: ToolQueryArgs = serde_json::from_str(arguments)
        .map_err(|e| format!("delete_task 参数解析失败: {}", e))?;

    let (tasks, count) = find_tasks_by_query(conn, &args.query)?;

    if count == 0 {
        return Err(format!("没有找到标题包含[{}]的任务。", args.query));
    }

    if count > 1 {
        let info: Vec<String> = tasks.iter().map(|t| format!("[{}]{}", status_cn(&t.status), t.title)).collect();
        return Err(format!("找到{}个匹配任务：{}。请更具体地指定要删除哪个。", count, info.join("、")));
    }

    let task = &tasks[0];
    let title = task.title.clone();

    task_repo::delete_task(conn, &task.id, false)?;

    Ok(format!("任务已删除：{}", title))
}

// ========== 搜索/列出任务 ==========

fn execute_search_tasks(conn: &Connection, arguments: &str) -> Result<String, String> {
    let args: ToolSearchArgs = serde_json::from_str(arguments)
        .map_err(|e| format!("search_tasks 参数解析失败: {}", e))?;

    // 查询任务
    let all_tasks: Vec<task_repo::Task> = match &args.query {
        Some(q) if !q.trim().is_empty() => task_repo::search_tasks(conn, q)?,
        _ => {
            // 没有搜索词 → 列出所有任务
            task_repo::list_tasks(conn, None, None)?
        }
    };

    // 按状态筛选
    let tasks: Vec<&task_repo::Task> = match &args.status {
        Some(s) if !s.is_empty() => all_tasks.iter().filter(|t| t.status == *s).collect(),
        _ => all_tasks.iter().collect(),
    };

    if tasks.is_empty() {
        let hint = match (&args.query, &args.status) {
            (Some(q), Some(s)) => format!("没有找到匹配[{}]且状态为[{}]的任务", q, status_cn(s)),
            (Some(q), _) => format!("没有找到匹配[{}]的任务", q),
            (_, Some(s)) => format!("没有[{}]状态的任务", status_cn(s)),
            _ => "目前还没有任何任务。试试说「帮我记一下…」来创建第一个任务吧！".to_string(),
        };
        return Ok(hint);
    }

    // 格式化输出：按状态分组
    let mut result = String::new();
    result.push_str(&format!("找到{}个任务：\n\n", tasks.len()));

    // 按状态排序：pending > in_progress > completed > cancelled
    let status_order = |s: &str| match s {
        "pending" => 0,
        "in_progress" => 1,
        "completed" => 2,
        "cancelled" => 3,
        _ => 4,
    };
    let mut sorted: Vec<&&task_repo::Task> = tasks.iter().collect();
    sorted.sort_by_key(|t| (status_order(&t.status), t.title.clone()));

    for task in sorted {
        let status_badge = match task.status.as_str() {
            "pending" => "⬜",
            "in_progress" => "🔄",
            "completed" => "✅",
            "cancelled" => "❌",
            _ => "❓",
        };

        result.push_str(&format!("{} **{}**", status_badge, task.title));

        // 优先级
        if let Some(ref p) = task.priority {
            if p != "none" {
                result.push_str(&format!(" `{}`", status_cn(p)));
            }
        }

        // 截止时间
        if let Some(ref d) = task.deadline {
            result.push_str(&format!("，截止：{}", d));
        }

        result.push('\n');
    }

    result.push_str("\n提示：你可以对这些任务进行操作，比如「完成xxx」或「删掉xxx」。");
    Ok(result)
}
