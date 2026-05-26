use tauri::State;

use crate::db::connection::DbState;
use crate::db::repositories::memory_repo;

#[tauri::command]
pub fn list_memories(
    state: State<'_, DbState>,
    memory_type: Option<String>,
) -> Result<Vec<memory_repo::Memory>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    memory_repo::list_memories(&conn, memory_type.as_deref())
}

#[tauri::command]
pub fn delete_memory(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    memory_repo::delete_memory(&conn, &id)
}
