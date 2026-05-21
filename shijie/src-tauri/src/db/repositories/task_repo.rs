use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub parent_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: Option<String>,
    pub scheduled_at: Option<String>,
    pub deadline: Option<String>,
    pub completed_at: Option<String>,
    pub xp_earned: i32,
    pub estimated_minutes: i32,
    pub notes: Option<String>,
    pub tags: Option<String>,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

const TASK_COLUMNS: &str = "id, parent_id, title, description, status, priority, scheduled_at, deadline, completed_at, xp_earned, estimated_minutes, notes, tags, sort_order, created_at, updated_at";

fn task_from_row(row: &Row) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get("id")?,
        parent_id: row.get("parent_id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        status: row.get("status")?,
        priority: row.get("priority")?,
        scheduled_at: row.get("scheduled_at")?,
        deadline: row.get("deadline")?,
        completed_at: row.get("completed_at")?,
        xp_earned: row.get("xp_earned")?,
        estimated_minutes: row.get("estimated_minutes")?,
        notes: row.get("notes")?,
        tags: row.get("tags")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn now() -> String {
    chrono::Local::now().to_rfc3339()
}

fn gen_id() -> String {
    nanoid::nanoid!()
}

/// 创建任务
pub fn create_task(
    conn: &Connection,
    title: &str,
    parent_id: Option<&str>,
    description: Option<&str>,
    priority: Option<&str>,
    scheduled_at: Option<&str>,
    deadline: Option<&str>,
    estimated_minutes: i32,
    tags: Option<&str>,
) -> Result<Task, String> {
    let id = gen_id();
    let time = now();

    conn.execute(
        "INSERT INTO tasks (id, parent_id, title, description, status, priority, scheduled_at, deadline, estimated_minutes, tags, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 'pending', ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![id, parent_id, title, description, priority, scheduled_at, deadline, estimated_minutes, tags, time, time],
    )
    .map_err(|e| format!("Failed to create task: {}", e))?;

    get_task(conn, &id)
}

/// 获取单个任务
pub fn get_task(conn: &Connection, id: &str) -> Result<Task, String> {
    conn.query_row(
        &format!("SELECT {} FROM tasks WHERE id = ?1", TASK_COLUMNS),
        params![id],
        task_from_row,
    )
    .map_err(|e| format!("Task not found: {}", e))
}

/// 获取所有任务 (可按状态筛选)
pub fn list_tasks(
    conn: &Connection,
    status: Option<&str>,
    parent_id: Option<Option<&str>>,
) -> Result<Vec<Task>, String> {
    let mut sql = format!(
        "SELECT {} FROM tasks WHERE 1=1",
        TASK_COLUMNS
    );
    let mut params_vec: Vec<String> = Vec::new();

    if let Some(s) = status {
        sql.push_str(" AND status = ?");
        params_vec.push(s.to_string());
    }

    match parent_id {
        Some(Some(pid)) => {
            sql.push_str(" AND parent_id = ?");
            params_vec.push(pid.to_string());
        }
        Some(None) => {
            sql.push_str(" AND parent_id IS NULL");
        }
        None => {}
    }

    sql.push_str(" ORDER BY sort_order ASC, created_at DESC");

    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = params_vec
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();

    let tasks = stmt
        .query_map(param_refs.as_slice(), task_from_row)
        .map_err(|e| format!("Failed to query tasks: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect tasks: {}", e))?;

    Ok(tasks)
}

/// 更新任务
pub fn update_task(
    conn: &Connection,
    id: &str,
    title: Option<&str>,
    description: Option<&str>,
    status: Option<&str>,
    priority: Option<&str>,
    scheduled_at: Option<&str>,
    deadline: Option<&str>,
    estimated_minutes: Option<i32>,
    notes: Option<&str>,
    tags: Option<&str>,
) -> Result<Task, String> {
    let time = now();

    // 构建动态 UPDATE
    let mut sets: Vec<String> = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = title {
        sets.push("title = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = description {
        sets.push("description = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = status {
        sets.push("status = ?".to_string());
        param_values.push(Box::new(v.to_string()));
        if v == "completed" {
            sets.push("completed_at = ?".to_string());
            param_values.push(Box::new(time.clone()));
        }
    }
    if let Some(v) = priority {
        sets.push("priority = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = scheduled_at {
        sets.push("scheduled_at = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = deadline {
        sets.push("deadline = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = estimated_minutes {
        sets.push("estimated_minutes = ?".to_string());
        param_values.push(Box::new(v));
    }
    if let Some(v) = notes {
        sets.push("notes = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = tags {
        sets.push("tags = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }

    if sets.is_empty() {
        return get_task(conn, id);
    }

    sets.push("updated_at = ?".to_string());
    param_values.push(Box::new(time));

    let sql = format!(
        "UPDATE tasks SET {} WHERE id = ?",
        sets.join(", ")
    );
    param_values.push(Box::new(id.to_string()));

    let param_refs: Vec<&dyn rusqlite::ToSql> = param_values
        .iter()
        .map(|v| v.as_ref() as &dyn rusqlite::ToSql)
        .collect();

    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| format!("Failed to update task: {}", e))?;

    get_task(conn, id)
}

/// 删除任务
pub fn delete_task(conn: &Connection, id: &str, cascade: bool) -> Result<u64, String> {
    if cascade {
        // 先删除所有子任务
        conn.execute(
            "DELETE FROM tasks WHERE parent_id = ?1",
            params![id],
        )
        .map_err(|e| format!("Failed to delete subtasks: {}", e))?;
    } else {
        // 将子任务的 parent_id 设为 NULL
        conn.execute(
            "UPDATE tasks SET parent_id = NULL WHERE parent_id = ?1",
            params![id],
        )
        .map_err(|e| format!("Failed to update subtasks: {}", e))?;
    }

    let affected = conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete task: {}", e))?;

    Ok(affected as u64)
}

/// 完成任务并分配XP
pub fn complete_task(conn: &mut Connection, id: &str) -> Result<CompleteResult, String> {
    let time = now();

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 更新任务状态
    tx.execute(
        "UPDATE tasks SET status = 'completed', completed_at = ?1, updated_at = ?1 WHERE id = ?2",
        params![time, id],
    )
    .map_err(|e| format!("Failed to complete task: {}", e))?;

    // 查询关联的技能
    let skill_xps: Vec<(String, i32)> = {
        let mut stmt = tx
            .prepare("SELECT skill_id, xp_amount FROM task_skills WHERE task_id = ?1")
            .map_err(|e| format!("Failed to query task_skills: {}", e))?;

        let rows: Vec<(String, i32)> = stmt.query_map(params![id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
        })
        .map_err(|e| format!("Failed to read skill_xps: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect skill_xps: {}", e))?;

        rows
    };

    let mut total_xp = 0;
    let mut result_skills = Vec::new();

    for (skill_id, xp) in &skill_xps {
        total_xp += xp;

        // 给技能加XP
        tx.execute(
            "UPDATE skills SET total_xp = total_xp + ?1, updated_at = ?2 WHERE id = ?3",
            params![xp, time, skill_id],
        )
        .map_err(|e| format!("Failed to update skill xp: {}", e))?;

        // 记录XP流水
        let event_id = gen_id();
        tx.execute(
            "INSERT INTO skill_events (id, skill_id, xp_amount, source_type, source_id, note, created_at)
             VALUES (?1, ?2, ?3, 'task', ?4, '任务完成', ?5)",
            params![event_id, skill_id, xp, id, time],
        )
        .map_err(|e| format!("Failed to create skill event: {}", e))?;

        // 获取技能名称
        let skill_name: String = tx
            .query_row("SELECT name FROM skills WHERE id = ?1", params![skill_id], |row| row.get(0))
            .unwrap_or_else(|_| "未知技能".to_string());

        result_skills.push(SkillXp {
            skill_id: skill_id.clone(),
            skill_name,
            xp: *xp,
        });
    }

    // 更新任务的 xp_earned
    tx.execute(
        "UPDATE tasks SET xp_earned = ?1 WHERE id = ?2",
        params![total_xp, id],
    )
    .map_err(|e| format!("Failed to update task xp_earned: {}", e))?;

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(CompleteResult {
        xp_earned: total_xp,
        skill_xps: result_skills,
    })
}

/// 取消完成任务并撤回XP
pub fn uncomplete_task(conn: &mut Connection, id: &str) -> Result<(), String> {
    let time = now();

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 查询关联的技能XP（完成时分配的）
    let skill_xps: Vec<(String, i32)> = {
        let mut stmt = tx
            .prepare("SELECT skill_id, xp_amount FROM task_skills WHERE task_id = ?1")
            .map_err(|e| format!("Failed to query task_skills: {}", e))?;

        let rows: Vec<(String, i32)> = stmt.query_map(params![id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
        })
        .map_err(|e| format!("Failed to read skill_xps: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect skill_xps: {}", e))?;

        rows
    };

    // 撤回每个技能的XP
    for (skill_id, xp) in &skill_xps {
        // 回退技能XP
        tx.execute(
            "UPDATE skills SET total_xp = CASE WHEN total_xp >= ?1 THEN total_xp - ?1 ELSE 0 END, updated_at = ?2 WHERE id = ?3",
            params![xp, time, skill_id],
        )
        .map_err(|e| format!("Failed to rollback skill xp: {}", e))?;

        // 记录撤回流水（负值）
        let event_id = gen_id();
        tx.execute(
            "INSERT INTO skill_events (id, skill_id, xp_amount, source_type, source_id, note, created_at)
             VALUES (?1, ?2, ?3, 'task', ?4, '取消完成', ?5)",
            params![event_id, skill_id, -xp, id, time],
        )
        .map_err(|e| format!("Failed to create skill event: {}", e))?;
    }

    // 重置任务状态
    tx.execute(
        "UPDATE tasks SET status = 'pending', completed_at = NULL, xp_earned = 0, updated_at = ?1 WHERE id = ?2",
        params![time, id],
    )
    .map_err(|e| format!("Failed to uncomplete task: {}", e))?;

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}

/// 搜索任务 (关键词)
pub fn search_tasks(conn: &Connection, query: &str) -> Result<Vec<Task>, String> {
    let pattern = format!("%{}%", query);
    let sql = format!(
        "SELECT {} FROM tasks WHERE title LIKE ?1 OR description LIKE ?1 OR notes LIKE ?1 ORDER BY created_at DESC",
        TASK_COLUMNS
    );
    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| format!("Failed to prepare search: {}", e))?;

    let tasks = stmt
        .query_map(params![pattern], task_from_row)
        .map_err(|e| format!("Failed to search tasks: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect search results: {}", e))?;

    Ok(tasks)
}

#[derive(Debug, Serialize)]
pub struct SkillXp {
    pub skill_id: String,
    pub skill_name: String,
    pub xp: i32,
}

#[derive(Debug, Serialize)]
pub struct CompleteResult {
    pub xp_earned: i32,
    pub skill_xps: Vec<SkillXp>,
}
