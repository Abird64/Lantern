use crate::db::repositories::schedule_repo;
use crate::db::connection::DbState;
use serde::Deserialize;
use tauri::State;

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
