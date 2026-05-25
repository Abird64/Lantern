use tauri::State;
use crate::db::connection::DbState;
use crate::db::repositories::favorite_repo;

#[tauri::command]
pub fn add_favorite(
    db: State<'_, DbState>,
    content: String,
    role: String,
    conversation_title: Option<String>,
) -> Result<favorite_repo::AiFavorite, String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock: {}", e))?;
    favorite_repo::add_favorite(
        &conn,
        &content,
        &role,
        conversation_title.as_deref(),
    )
}

#[tauri::command]
pub fn list_favorites(db: State<'_, DbState>) -> Result<Vec<favorite_repo::AiFavorite>, String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock: {}", e))?;
    favorite_repo::list_favorites(&conn)
}

#[tauri::command]
pub fn delete_favorite(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock: {}", e))?;
    favorite_repo::delete_favorite(&conn, &id)
}

#[tauri::command]
pub fn delete_all_favorites(db: State<'_, DbState>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock: {}", e))?;
    favorite_repo::delete_all_favorites(&conn)
}
