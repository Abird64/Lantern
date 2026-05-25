use crate::db::repositories::calendar_repo;
use crate::db::connection::DbState;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
pub struct CreateCalendarInput {
    pub name: String,
    pub color: String,
    pub is_default: Option<i32>,
}

#[derive(Deserialize)]
pub struct UpdateCalendarInput {
    pub name: Option<String>,
    pub color: Option<String>,
}

#[derive(Deserialize)]
pub struct DeleteCalendarInput {
    pub id: String,
}

#[tauri::command]
pub fn list_calendars(
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let calendars = calendar_repo::list_calendars(&conn)?;
    serde_json::to_value(calendars).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_calendar(
    state: State<'_, DbState>,
    input: CreateCalendarInput,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let calendar = calendar_repo::create_calendar(
        &conn,
        &input.name,
        &input.color,
        input.is_default.unwrap_or(0),
    )?;
    serde_json::to_value(calendar).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_calendar(
    state: State<'_, DbState>,
    id: String,
    input: UpdateCalendarInput,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let calendar = calendar_repo::update_calendar(
        &conn,
        &id,
        input.name.as_deref(),
        input.color.as_deref(),
    )?;
    serde_json::to_value(calendar).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_calendar(
    state: State<'_, DbState>,
    input: DeleteCalendarInput,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let affected = calendar_repo::delete_calendar(&conn, &input.id)?;
    serde_json::to_value(serde_json::json!({ "success": true, "deleted": affected }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_default_calendar(
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let calendar = calendar_repo::get_default_calendar(&conn)?;
    serde_json::to_value(calendar).map_err(|e| e.to_string())
}
