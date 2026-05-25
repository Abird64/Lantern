use chrono::Datelike;
use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Schedule {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_at: String,
    pub end_at: Option<String>,
    pub rrule: Option<String>,
    pub reminder: Option<String>,
    pub color: Option<String>,
    pub is_all_day: i32,
    pub location: Option<String>,
    pub source_type: String,
    pub source_id: Option<String>,
    pub category: Option<String>,
    pub exdates: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const SCHEDULE_COLUMNS: &str = "id, title, description, start_at, end_at, rrule, reminder, color, is_all_day, location, source_type, source_id, category, exdates, created_at, updated_at";

fn schedule_from_row(row: &Row) -> rusqlite::Result<Schedule> {
    Ok(Schedule {
        id: row.get("id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        start_at: row.get("start_at")?,
        end_at: row.get("end_at")?,
        rrule: row.get("rrule")?,
        reminder: row.get("reminder")?,
        color: row.get("color")?,
        is_all_day: row.get("is_all_day")?,
        location: row.get("location")?,
        source_type: row.get("source_type")?,
        source_id: row.get("source_id")?,
        category: row.get("category")?,
        exdates: row.get("exdates")?,
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

/// 创建日程
pub fn create_schedule(
    conn: &Connection,
    title: &str,
    description: Option<&str>,
    start_at: &str,
    end_at: Option<&str>,
    rrule: Option<&str>,
    reminder: Option<&str>,
    color: Option<&str>,
    is_all_day: i32,
    location: Option<&str>,
    source_type: &str,
    source_id: Option<&str>,
    category: Option<&str>,
) -> Result<Schedule, String> {
    let id = gen_id();
    let time = now();

    conn.execute(
        "INSERT INTO schedules (id, title, description, start_at, end_at, rrule, reminder, color, is_all_day, location, source_type, source_id, category, exdates, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, NULL, ?14, ?15)",
        params![id, title, description, start_at, end_at, rrule, reminder, color, is_all_day, location, source_type, source_id, category, time, time],
    )
    .map_err(|e| format!("Failed to create schedule: {}", e))?;

    get_schedule(conn, &id)
}

/// 获取单个日程
pub fn get_schedule(conn: &Connection, id: &str) -> Result<Schedule, String> {
    conn.query_row(
        &format!("SELECT {} FROM schedules WHERE id = ?1", SCHEDULE_COLUMNS),
        params![id],
        schedule_from_row,
    )
    .map_err(|e| format!("Schedule not found: {}", e))
}

/// 更新日程
pub fn update_schedule(
    conn: &Connection,
    id: &str,
    title: Option<&str>,
    description: Option<&str>,
    start_at: Option<&str>,
    end_at: Option<&str>,
    rrule: Option<&str>,
    reminder: Option<&str>,
    color: Option<&str>,
    is_all_day: Option<i32>,
    location: Option<&str>,
    category: Option<&str>,
) -> Result<Schedule, String> {
    let time = now();

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
    if let Some(v) = start_at {
        sets.push("start_at = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = end_at {
        sets.push("end_at = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = rrule {
        sets.push("rrule = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = reminder {
        sets.push("reminder = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = color {
        sets.push("color = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = is_all_day {
        sets.push("is_all_day = ?".to_string());
        param_values.push(Box::new(v));
    }
    if let Some(v) = location {
        sets.push("location = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = category {
        sets.push("category = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }

    if sets.is_empty() {
        return get_schedule(conn, id);
    }

    sets.push("updated_at = ?".to_string());
    param_values.push(Box::new(time));

    let sql = format!("UPDATE schedules SET {} WHERE id = ?", sets.join(", "));
    param_values.push(Box::new(id.to_string()));

    let param_refs: Vec<&dyn rusqlite::ToSql> = param_values
        .iter()
        .map(|v| v.as_ref() as &dyn rusqlite::ToSql)
        .collect();

    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| format!("Failed to update schedule: {}", e))?;

    get_schedule(conn, id)
}

/// 给重复事件添加 exdate（排除某个日期的实例）
pub fn add_exdate(conn: &Connection, id: &str, date_str: &str) -> Result<Schedule, String> {
    let schedule = get_schedule(conn, id)?;

    let mut exdates: Vec<String> = match &schedule.exdates {
        Some(s) => serde_json::from_str::<Vec<String>>(s).unwrap_or_default(),
        None => Vec::new(),
    };

    if !exdates.contains(&date_str.to_string()) {
        exdates.push(date_str.to_string());
    }

    let exdates_json = serde_json::to_string(&exdates).map_err(|e| e.to_string())?;
    let time = now();

    conn.execute(
        "UPDATE schedules SET exdates = ?1, updated_at = ?2 WHERE id = ?3",
        params![exdates_json, time, id],
    )
    .map_err(|e| format!("Failed to add exdate: {}", e))?;

    get_schedule(conn, id)
}

/// 删除日程
pub fn delete_schedule(conn: &Connection, id: &str) -> Result<u64, String> {
    let affected = conn.execute("DELETE FROM schedules WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete schedule: {}", e))?;
    Ok(affected as u64)
}

/// 按时间范围查询日程（含 rrule 展开 + 任务合并）
/// range_start 和 range_end 为 ISO8601 格式
pub fn list_schedules_in_range(
    conn: &Connection,
    range_start: &str,
    range_end: &str,
) -> Result<Vec<Schedule>, String> {
    // 1. 查询 schedules 表中可能命中的事件
    //    - 无重复事件：start_at 在范围内
    //    - 有重复事件（rrule 不为空）：start_at 在 range_end 之前（可能向后展开进范围）
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {} FROM schedules WHERE source_type != 'task_sync' AND start_at < ?1 ORDER BY start_at ASC",
            SCHEDULE_COLUMNS
        ))
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let base_schedules: Vec<Schedule> = stmt
        .query_map(params![range_end], schedule_from_row)
        .map_err(|e| format!("Failed to query schedules: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect schedules: {}", e))?;

    let mut results: Vec<Schedule> = Vec::new();

    // 解析 exdates JSON
    fn parse_exdates(exdates: &Option<String>) -> Vec<String> {
        match exdates {
            Some(s) => serde_json::from_str::<Vec<String>>(s).unwrap_or_default(),
            None => Vec::new(),
        }
    }

    for sched in base_schedules {
        if let Some(ref rrule_str) = sched.rrule {
            // 重复事件：展开实例
            let exdates = parse_exdates(&sched.exdates);
            let instances = expand_rrule(&sched, rrule_str, range_start, range_end, &exdates);
            results.extend(instances);
        } else {
            // 普通事件：检查是否在范围内
            if sched.start_at.as_str() < range_end {
                results.push(sched);
            }
        }
    }

    // 2. 合并 tasks 表中 scheduled_at 在范围内的未完成任务
    let mut task_stmt = conn
        .prepare(
            "SELECT id, title, description, scheduled_at, deadline FROM tasks
             WHERE scheduled_at IS NOT NULL AND scheduled_at >= ?1 AND scheduled_at < ?2
               AND status != 'completed'
             ORDER BY scheduled_at ASC",
        )
        .map_err(|e| format!("Failed to prepare task query: {}", e))?;

    let task_rows = task_stmt
        .query_map(params![range_start, range_end], |row| {
            Ok((
                row.get::<_, String>(0)?,  // id
                row.get::<_, String>(1)?,  // title
                row.get::<_, Option<String>>(2)?,  // description
                row.get::<_, String>(3)?,  // scheduled_at
                row.get::<_, Option<String>>(4)?,  // deadline
            ))
        })
        .map_err(|e| format!("Failed to query tasks: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect tasks: {}", e))?;

    for (task_id, task_title, task_desc, task_scheduled, task_deadline) in task_rows {
        let time = now();
        results.push(Schedule {
            id: format!("task_{}", task_id),
            title: task_title,
            description: task_desc,
            start_at: task_scheduled,
            end_at: task_deadline,
            rrule: None,
            reminder: None,
            color: Some("#58A968".to_string()),
            is_all_day: 0,
            location: None,
            source_type: "task_sync".to_string(),
            source_id: Some(task_id),
            category: None,
            exdates: None,
            created_at: time.clone(),
            updated_at: time,
        });
    }

    // 3. 按 start_at 排序
    results.sort_by(|a, b| a.start_at.cmp(&b.start_at));

    Ok(results)
}

/// 展开 rrule 为具体实例（支持 DAILY/WEEKLY/MONTHLY）
fn expand_rrule(
    base: &Schedule,
    rrule: &str,
    range_start: &str,
    range_end: &str,
    exdates: &[String],
) -> Vec<Schedule> {
    // 解析 rrule 参数
    let rules = parse_rrule(rrule);

    let freq = rules.get("FREQ").map(|s| s.as_str()).unwrap_or("");

    match freq {
        "DAILY" => expand_daily(base, &rules, range_start, range_end, exdates),
        "WEEKLY" => expand_weekly(base, &rules, range_start, range_end, exdates),
        "MONTHLY" => expand_monthly(base, &rules, range_start, range_end, exdates),
        _ => Vec::new(),
    }
}

/// 展开 DAILY 重复事件
fn expand_daily(
    base: &Schedule,
    rules: &std::collections::HashMap<String, String>,
    range_start: &str,
    range_end: &str,
    exdates: &[String],
) -> Vec<Schedule> {
    let base_start = match chrono::DateTime::parse_from_rfc3339(&base.start_at) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    let range_start_dt = match chrono::DateTime::parse_from_rfc3339(range_start) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    let range_end_dt = match chrono::DateTime::parse_from_rfc3339(range_end) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    let until_dt = rules.get("UNTIL").and_then(|u| chrono::DateTime::parse_from_rfc3339(u).ok());
    let count_limit = rules.get("COUNT").and_then(|c| c.parse::<u32>().ok());

    let mut instances = Vec::new();
    let mut generated_count: u32 = 0;

    // 从 base_start 开始，逐天生成
    let mut current = base_start;

    // 跳到 range_start 之前
    while current < range_start_dt {
        current = current + chrono::Duration::days(1);
    }

    while current < range_end_dt {
        // 检查 UNTIL
        if let Some(ref until) = until_dt {
            if current > *until {
                break;
            }
        }

        // 检查 COUNT
        if let Some(count) = count_limit {
            if generated_count >= count {
                break;
            }
        }

        // 检查 exdates
        let date_str = current.format("%Y-%m-%d").to_string();
        if exdates.contains(&date_str) {
            current = current + chrono::Duration::days(1);
            continue;
        }

        // 生成实例
        let instance = make_instance(base, &current);
        instances.push(instance);
        generated_count += 1;

        current = current + chrono::Duration::days(1);
    }

    instances
}

/// 展开 WEEKLY 重复事件
fn expand_weekly(
    base: &Schedule,
    rules: &std::collections::HashMap<String, String>,
    range_start: &str,
    range_end: &str,
    exdates: &[String],
) -> Vec<Schedule> {
    let byday_str = match rules.get("BYDAY") {
        Some(s) => s.clone(),
        None => return Vec::new(),
    };

    let bydays: Vec<&str> = byday_str.split(',').collect();
    let day_offsets: std::collections::HashMap<&str, i64> = [
        ("MO", 0), ("TU", 1), ("WE", 2), ("TH", 3), ("FR", 4), ("SA", 5), ("SU", 6),
    ].into_iter().collect();

    let base_start = match chrono::DateTime::parse_from_rfc3339(&base.start_at) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    let range_start_dt = match chrono::DateTime::parse_from_rfc3339(range_start) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    let range_end_dt = match chrono::DateTime::parse_from_rfc3339(range_end) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    // UNTIL 限制
    let until_dt = rules.get("UNTIL").and_then(|u| {
        chrono::DateTime::parse_from_rfc3339(u).ok()
    });

    // COUNT 限制
    let count_limit = rules.get("COUNT").and_then(|c| c.parse::<u32>().ok());

    let mut instances = Vec::new();
    let mut generated_count: u32 = 0;

    // 从 base 的 start_at 所在周的周一算起
    let base_weekday = base_start.weekday().num_days_from_monday() as i64;
    let week_start = base_start - chrono::Duration::days(base_weekday);

    // 从 range_start 所在周开始生成
    let range_weekday = range_start_dt.weekday().num_days_from_monday() as i64;
    let range_week_start = range_start_dt - chrono::Duration::days(range_weekday);

    // 从哪个周开始
    let start_week = if range_week_start > week_start { range_week_start } else { week_start };

    let mut current_week = start_week;

    while current_week < range_end_dt {
        // 检查 UNTIL
        if let Some(ref until) = until_dt {
            if current_week > *until {
                break;
            }
        }

        // 检查 COUNT
        if let Some(count) = count_limit {
            if generated_count >= count {
                break;
            }
        }

        for day_name in &bydays {
            if let Some(&offset) = day_offsets.get(day_name.trim()) {
                let instance_start = current_week + chrono::Duration::days(offset);

                // 必须在 base_start 之后
                if instance_start < base_start {
                    continue;
                }

                // 检查 UNTIL（精确到天）
                if let Some(ref until) = until_dt {
                    if instance_start > *until {
                        continue;
                    }
                }

                // 检查 COUNT
                if let Some(count) = count_limit {
                    if generated_count >= count {
                        break;
                    }
                }

                // 检查是否在范围内
                if instance_start < range_start_dt || instance_start >= range_end_dt {
                    continue;
                }

                // 检查 exdates
                let date_str = instance_start.format("%Y-%m-%d").to_string();
                if exdates.contains(&date_str) {
                    continue;
                }

                // 生成实例
                let instance = make_instance(base, &instance_start);
                instances.push(instance);
                generated_count += 1;
            }
        }

        current_week = current_week + chrono::Duration::weeks(1);
    }

    instances
}

/// 展开 MONTHLY 重复事件
fn expand_monthly(
    base: &Schedule,
    rules: &std::collections::HashMap<String, String>,
    range_start: &str,
    range_end: &str,
    exdates: &[String],
) -> Vec<Schedule> {
    let base_start = match chrono::DateTime::parse_from_rfc3339(&base.start_at) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    let range_start_dt = match chrono::DateTime::parse_from_rfc3339(range_start) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    let range_end_dt = match chrono::DateTime::parse_from_rfc3339(range_end) {
        Ok(dt) => dt,
        Err(_) => return Vec::new(),
    };

    let until_dt = rules.get("UNTIL").and_then(|u| chrono::DateTime::parse_from_rfc3339(u).ok());
    let count_limit = rules.get("COUNT").and_then(|c| c.parse::<u32>().ok());

    let mut instances = Vec::new();
    let mut generated_count: u32 = 0;

    let day_of_month = base_start.day();

    // 从 base_start 所在月份开始
    let mut year = base_start.year();
    let mut month = base_start.month();

    loop {
        // 构造当月的同一天
        let instance_opt = chrono::NaiveDate::from_ymd_opt(year, month, day_of_month);
        let instance_date = match instance_opt {
            Some(d) => d,
            None => {
                // 当月没有这一天（如 2 月 31 日），跳过
                month += 1;
                if month > 12 {
                    month = 1;
                    year += 1;
                }
                continue;
            }
        };

        let instance_start = instance_date
            .and_time(base_start.time())
            .and_local_timezone(chrono::Local)
            .earliest()
            .unwrap_or_else(|| chrono::Local::now());

        // 超出范围则停止
        if instance_start >= range_end_dt {
            break;
        }

        // 检查 UNTIL
        if let Some(ref until) = until_dt {
            if instance_start > *until {
                break;
            }
        }

        // 检查 COUNT
        if let Some(count) = count_limit {
            if generated_count >= count {
                break;
            }
        }

        // 必须在 base_start 之后且在范围内
        if instance_start >= base_start && instance_start >= range_start_dt {
            // 检查 exdates
            let date_str = instance_start.format("%Y-%m-%d").to_string();
            if !exdates.contains(&date_str) {
                let instance = make_instance(base, &instance_start);
                instances.push(instance);
                generated_count += 1;
            }
        }

        // 下个月
        month += 1;
        if month > 12 {
            month = 1;
            year += 1;
        }
    }

    instances
}

/// 根据基础事件和新时间生成实例
fn make_instance<Tz: chrono::TimeZone>(base: &Schedule, instance_start: &chrono::DateTime<Tz>) -> Schedule
where
    Tz::Offset: std::fmt::Display,
{
    let date_str = instance_start.format("%Y-%m-%d").to_string();

    let instance_end_at = if let Some(ref end) = base.end_at {
        if let Ok(base_end) = chrono::DateTime::parse_from_rfc3339(end) {
            if let Ok(base_start) = chrono::DateTime::parse_from_rfc3339(&base.start_at) {
                let duration = base_end.signed_duration_since(base_start);
                let inst_end = instance_start.clone() + duration;
                Some(inst_end.to_rfc3339())
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    Schedule {
        id: format!("{}_{}", base.id, date_str),
        title: base.title.clone(),
        description: base.description.clone(),
        start_at: instance_start.to_rfc3339(),
        end_at: instance_end_at,
        rrule: None,
        reminder: base.reminder.clone(),
        color: base.color.clone(),
        is_all_day: base.is_all_day,
        location: base.location.clone(),
        source_type: base.source_type.clone(),
        source_id: base.source_id.clone(),
        category: base.category.clone(),
        exdates: None,
        created_at: base.created_at.clone(),
        updated_at: base.updated_at.clone(),
    }
}

/// 解析 rrule 字符串为 key-value 对
/// 例: "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=2026-07-01T00:00:00Z"
fn parse_rrule(rrule: &str) -> std::collections::HashMap<String, String> {
    let mut map = std::collections::HashMap::new();
    for part in rrule.split(';') {
        if let Some((key, value)) = part.split_once('=') {
            map.insert(key.to_uppercase(), value.to_string());
        }
    }
    map
}
