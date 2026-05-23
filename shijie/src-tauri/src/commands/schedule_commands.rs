use crate::db::repositories::schedule_repo;
use crate::db::connection::DbState;
use serde::Deserialize;
use tauri::State;
use chrono::{DateTime, NaiveDate, NaiveDateTime, NaiveTime};

#[derive(Deserialize)]
pub struct CreateScheduleInput {
    pub title: String,
    pub description: Option<String>,
    pub start_at: String,
    pub end_at: Option<String>,
    pub rrule: Option<String>,
    pub reminder: Option<String>,
    pub color: Option<String>,
    pub is_all_day: Option<i32>,
    pub location: Option<String>,
    pub source_type: Option<String>,
    pub source_id: Option<String>,
    pub category: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateScheduleInput {
    pub title: Option<String>,
    pub description: Option<String>,
    pub start_at: Option<String>,
    pub end_at: Option<String>,
    pub rrule: Option<String>,
    pub reminder: Option<String>,
    pub color: Option<String>,
    pub is_all_day: Option<i32>,
    pub location: Option<String>,
    pub category: Option<String>,
}

#[derive(Deserialize)]
pub struct ListSchedulesInput {
    pub range_start: String,
    pub range_end: String,
}

#[derive(Deserialize)]
pub struct DeleteScheduleInput {
    pub id: String,
}

#[tauri::command]
pub fn create_schedule(
    state: State<'_, DbState>,
    input: CreateScheduleInput,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let schedule = schedule_repo::create_schedule(
        &conn,
        &input.title,
        input.description.as_deref(),
        &input.start_at,
        input.end_at.as_deref(),
        input.rrule.as_deref(),
        input.reminder.as_deref(),
        input.color.as_deref(),
        input.is_all_day.unwrap_or(0),
        input.location.as_deref(),
        input.source_type.as_deref().unwrap_or("manual"),
        input.source_id.as_deref(),
        input.category.as_deref(),
    )?;
    serde_json::to_value(schedule).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_schedule(
    state: State<'_, DbState>,
    id: String,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let schedule = schedule_repo::get_schedule(&conn, &id)?;
    serde_json::to_value(schedule).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_schedules_in_range(
    state: State<'_, DbState>,
    input: ListSchedulesInput,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let schedules = schedule_repo::list_schedules_in_range(&conn, &input.range_start, &input.range_end)?;
    serde_json::to_value(schedules).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_schedule(
    state: State<'_, DbState>,
    id: String,
    input: UpdateScheduleInput,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let schedule = schedule_repo::update_schedule(
        &conn,
        &id,
        input.title.as_deref(),
        input.description.as_deref(),
        input.start_at.as_deref(),
        input.end_at.as_deref(),
        input.rrule.as_deref(),
        input.reminder.as_deref(),
        input.color.as_deref(),
        input.is_all_day,
        input.location.as_deref(),
        input.category.as_deref(),
    )?;
    serde_json::to_value(schedule).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct AddExdateInput {
    pub id: String,
    pub date: String,
}

#[tauri::command]
pub fn add_exdate(
    state: State<'_, DbState>,
    input: AddExdateInput,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let schedule = schedule_repo::add_exdate(&conn, &input.id, &input.date)?;
    serde_json::to_value(schedule).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_schedule(
    state: State<'_, DbState>,
    input: DeleteScheduleInput,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let affected = schedule_repo::delete_schedule(&conn, &input.id)?;
    serde_json::to_value(serde_json::json!({ "success": true, "deleted": affected }))
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct IcsEvent {
    pub uid: String,
    pub title: String,
    pub description: Option<String>,
    pub start_at: String,
    pub end_at: Option<String>,
    pub rrule: Option<String>,
    pub location: Option<String>,
    pub category: Option<String>,
    pub exdates: Option<String>,
}

#[tauri::command]
pub fn import_ics_events(
    state: State<'_, DbState>,
    events: Vec<IcsEvent>,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let mut imported = 0;
    let mut skipped = 0;

    for event in &events {
        // 按 UID 去重：检查 source_type='ics_import' + source_id=uid 是否已存在
        let existing = conn.query_row(
            "SELECT id FROM schedules WHERE source_type = 'ics_import' AND source_id = ?1",
            rusqlite::params![event.uid],
            |row| row.get::<_, String>(0),
        );

        if existing.is_ok() {
            // 已存在，跳过（或可选择更新）
            skipped += 1;
            continue;
        }

        schedule_repo::create_schedule(
            &conn,
            &event.title,
            event.description.as_deref(),
            &event.start_at,
            event.end_at.as_deref(),
            event.rrule.as_deref(),
            None, // reminder
            Some("#3A8FB7"), // 默认天水碧颜色
            0, // is_all_day
            event.location.as_deref(),
            "ics_import",
            Some(&event.uid),
            event.category.as_deref(),
        )?;

        imported += 1;
    }

    serde_json::to_value(serde_json::json!({
        "success": true,
        "imported": imported,
        "skipped": skipped,
        "total": events.len()
    }))
    .map_err(|e| e.to_string())
}

/// 导出日程为 ICS 格式字符串
///
/// 返回纯文本 ICS 内容，前端负责保存为 .ics 文件
#[tauri::command]
pub fn export_ics_events(
    state: State<'_, DbState>,
) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    // 查询所有非 task_sync 的日程
    let mut stmt = conn
        .prepare(
            "SELECT title, description, start_at, end_at, rrule, is_all_day, location, source_id, exdates
             FROM schedules WHERE source_type != 'task_sync' ORDER BY start_at ASC",
        )
        .map_err(|e| format!("查询日程失败: {}", e))?;

    struct RawSchedule {
        title: String,
        description: Option<String>,
        start_at: String,
        end_at: Option<String>,
        rrule: Option<String>,
        is_all_day: i32,
        location: Option<String>,
        source_id: Option<String>,
        exdates: Option<String>,
    }

    let schedules: Vec<RawSchedule> = stmt
        .query_map([], |row| {
            Ok(RawSchedule {
                title: row.get(0)?,
                description: row.get(1)?,
                start_at: row.get(2)?,
                end_at: row.get(3)?,
                rrule: row.get(4)?,
                is_all_day: row.get(5)?,
                location: row.get(6)?,
                source_id: row.get(7)?,
                exdates: row.get(8)?,
            })
        })
        .map_err(|e| format!("查询日程失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("读取日程数据失败: {}", e))?;

    let mut ics = String::new();
    ics.push_str("BEGIN:VCALENDAR\r\n");
    ics.push_str("VERSION:2.0\r\n");
    ics.push_str("PRODID:-//拾阶//日程导出//CN\r\n");
    ics.push_str("CALSCALE:GREGORIAN\r\n");

    for s in &schedules {
        let uid = s.source_id.as_deref().unwrap_or("");

        // 格式化日期时间
        let (dtstart, dtend) = format_ics_datetime(&s.start_at, s.end_at.as_deref(), s.is_all_day != 0);

        ics.push_str("BEGIN:VEVENT\r\n");
        ics.push_str(&format!("UID:{}\r\n", uid));
        ics.push_str(&format!("SUMMARY:{}\r\n", escape_ics_text(&s.title)));

        if let Some(ref desc) = s.description {
            if !desc.is_empty() {
                ics.push_str(&format!("DESCRIPTION:{}\r\n", escape_ics_text(desc)));
            }
        }

        ics.push_str(&format!("DTSTART:{}\r\n", dtstart));
        if let Some(ref de) = dtend {
            ics.push_str(&format!("DTEND:{}\r\n", de));
        }

        // 如果是全天事件且无结束时间，DTEND 为次日
        if s.is_all_day != 0 && dtend.is_none() {
            if let Ok(date) = NaiveDate::parse_from_str(&s.start_at[..10], "%Y-%m-%d") {
                let next_day = date.succ_opt().unwrap_or(date);
                ics.push_str(&format!("DTEND;VALUE=DATE:{}\r\n", next_day.format("%Y%m%d")));
            }
        }

        if let Some(ref loc) = s.location {
            if !loc.is_empty() {
                ics.push_str(&format!("LOCATION:{}\r\n", escape_ics_text(loc)));
            }
        }

        if let Some(ref rrule) = s.rrule {
            if !rrule.is_empty() {
                ics.push_str(&format!("RRULE:{}\r\n", rrule));
            }
        }

        // EXDATE
        if let Some(ref exdates_str) = s.exdates {
            if let Ok(dates) = serde_json::from_str::<Vec<String>>(exdates_str) {
                for date in &dates {
                    ics.push_str(&format!("EXDATE:{}\r\n", date));
                }
            }
        }

        ics.push_str("END:VEVENT\r\n");
    }

    ics.push_str("END:VCALENDAR\r\n");
    Ok(ics)
}

/// 将 ISO 8601 时间转为 ICS 属性值
///
/// 返回 (DTSTART属性, DTEND属性可选)，属性已包含参数（如 VALUE=DATE）和值
fn format_ics_datetime(start: &str, end: Option<&str>, is_all_day: bool) -> (String, Option<String>) {
    if is_all_day {
        let start_date = start[..10].replace('-', "");
        let end_date = end.and_then(|e| {
            if e.len() >= 10 { Some(e[..10].replace('-', "")) } else { None }
        });
        return (
            format!(";VALUE=DATE:{}", start_date),
            end_date.map(|d| format!(";VALUE=DATE:{}", d)),
        );
    }

    // 非全天事件：转为本地时间 YYYYMMDDTHHMMSS
    fn to_local(s: &str) -> String {
        if let Ok(dt) = DateTime::parse_from_rfc3339(s) {
            return dt.naive_local().format("%Y%m%dT%H%M%S").to_string();
        }
        if let Ok(dt) = NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S") {
            return dt.format("%Y%m%dT%H%M%S").to_string();
        }
        if let Ok(dt) = NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S") {
            return dt.format("%Y%m%dT%H%M%S").to_string();
        }
        s.chars().filter(|c| c.is_ascii_digit()).collect()
    }

    let start_fmt = format!(":{}", to_local(start));
    let end_fmt = end.map(|e| format!(":{}", to_local(e)));
    (start_fmt, end_fmt)
}

/// ICS 文本转义：\ → \\, ; → \\;, , → \\,, \n → \\n
fn escape_ics_text(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace(';', "\\;")
        .replace(',', "\\,")
        .replace('\n', "\\n")
}
