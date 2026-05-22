use crate::db::connection::{AppDataState, DbState};
use crate::db::repositories::journal_repo;
use serde::Deserialize;
use std::path::PathBuf;
use tauri::State;

#[derive(Deserialize)]
pub struct GetJournalInput {
    pub date: String,
}

#[derive(Deserialize)]
pub struct SaveJournalInput {
    pub date: String,
    pub content: String,
    pub mood: Option<String>,
}

#[derive(Deserialize)]
pub struct GetTimelineInput {
    pub year: i32,
    pub month: i32,
}

#[derive(Deserialize)]
pub struct GetAiDiaryInput {
    pub date: String,
}

#[derive(Deserialize)]
pub struct SaveAiDiaryInput {
    pub date: String,
    pub content: String,
}

/// 获取或创建指定日期的日记（返回元数据 + 文件内容）
#[tauri::command]
pub fn get_journal_by_date(
    db_state: State<'_, DbState>,
    app_data: State<'_, AppDataState>,
    input: GetJournalInput,
) -> Result<serde_json::Value, String> {
    let conn = db_state
        .conn
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let journal =
        journal_repo::get_or_create_journal(&conn, &app_data.dir, &input.date)?;

    let content = journal_repo::read_md_file(PathBuf::from(&journal.file_path).as_path())?;

    serde_json::to_value(serde_json::json!({
        "journal": journal,
        "content": content,
    }))
    .map_err(|e| e.to_string())
}

/// 保存日记内容（写 .md 文件 + 更新 DB 元数据）
#[tauri::command]
pub fn save_journal(
    db_state: State<'_, DbState>,
    app_data: State<'_, AppDataState>,
    input: SaveJournalInput,
) -> Result<serde_json::Value, String> {
    let conn = db_state
        .conn
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    // 确保 journal 记录存在
    let journal =
        journal_repo::get_or_create_journal(&conn, &app_data.dir, &input.date)?;

    // 计算字数
    let word_count = if input.content.trim().is_empty() {
        0
    } else {
        input.content.split_whitespace().count() as i32
    };

    // 写入 .md 文件
    let file_path = PathBuf::from(&journal.file_path);
    journal_repo::write_md_file(
        &file_path,
        &input.date,
        input.mood.as_deref(),
        journal.tags.as_deref(),
        word_count,
        "user",
        &input.content,
    )?;

    // 更新 DB 元数据
    let title = if input.content.trim().is_empty() {
        None
    } else {
        // 取第一行作为标题（最多30字）
        let first_line = input.content.lines().next().unwrap_or("");
        let title_text: String = first_line.chars().take(30).collect();
        Some(format!("{} 尘笺", if title_text.is_empty() { &input.date } else { &title_text }))
    };

    let updated = journal_repo::update_journal_metadata(
        &conn,
        &journal.id,
        title.as_deref(),
        input.mood.as_deref(),
        word_count,
    )?;

    serde_json::to_value(updated).map_err(|e| e.to_string())
}

/// 获取某月有日记的日期列表
#[tauri::command]
pub fn get_timeline(
    db_state: State<'_, DbState>,
    input: GetTimelineInput,
) -> Result<serde_json::Value, String> {
    let conn = db_state
        .conn
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let dates = journal_repo::get_timeline_entries(&conn, input.year, input.month)?;
    serde_json::to_value(dates).map_err(|e| e.to_string())
}

/// 获取指定日期的 AI 尘笺
#[tauri::command]
pub fn get_ai_diary(
    _db_state: State<'_, DbState>,
    app_data: State<'_, AppDataState>,
    input: GetAiDiaryInput,
) -> Result<serde_json::Value, String> {
    let ai_path = journal_repo::date_to_file_path(&app_data.dir, &input.date, true);

    if ai_path.exists() {
        let content = journal_repo::read_md_file(&ai_path)?;
        let exists = !content.trim().is_empty();
        serde_json::to_value(serde_json::json!({
            "content": content,
            "exists": exists,
        }))
    } else {
        serde_json::to_value(serde_json::json!({
            "content": "",
            "exists": false,
        }))
    }
    .map_err(|e| e.to_string())
}

/// 保存 AI 尘笺
#[tauri::command]
pub fn save_ai_diary(
    db_state: State<'_, DbState>,
    app_data: State<'_, AppDataState>,
    input: SaveAiDiaryInput,
) -> Result<(), String> {
    let conn = db_state
        .conn
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    // 确保 AI 日记 DB 记录存在
    journal_repo::save_ai_diary_meta(&conn, &app_data.dir, &input.date)?;

    // 写入 .md 文件
    let ai_path = journal_repo::date_to_file_path(&app_data.dir, &input.date, true);
    let word_count = if input.content.trim().is_empty() {
        0
    } else {
        input.content.split_whitespace().count() as i32
    };

    journal_repo::write_md_file(
        &ai_path,
        &input.date,
        None,
        None,
        word_count,
        "ai",
        &input.content,
    )
}
