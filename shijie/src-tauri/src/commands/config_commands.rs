use tauri::State;

use crate::db::connection::DbState;
use crate::db::repositories::setting_repo;

#[tauri::command]
pub fn get_setting(
    state: State<'_, DbState>,
    key: String,
) -> Result<Option<setting_repo::Setting>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    setting_repo::get_setting(&conn, &key)
}

#[tauri::command]
pub fn set_setting(
    state: State<'_, DbState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    setting_repo::set_setting(&conn, &key, &value)
}

#[tauri::command]
pub fn list_settings(
    state: State<'_, DbState>,
) -> Result<Vec<setting_repo::Setting>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    setting_repo::list_settings(&conn)
}

#[tauri::command]
pub fn delete_setting(
    state: State<'_, DbState>,
    key: String,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    setting_repo::delete_setting(&conn, &key)
}
