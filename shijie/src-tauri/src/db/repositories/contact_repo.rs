use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Contact {
    pub id: String,
    pub name: String,
    pub nickname: Option<String>,
    pub group_name: Option<String>,
    pub avatar_path: Option<String>,
    pub birthday: Option<String>,
    pub contact_info: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

const CONTACT_COLUMNS: &str = "id, name, nickname, group_name, avatar_path, birthday, contact_info, notes, created_at, updated_at";

fn contact_from_row(row: &Row) -> rusqlite::Result<Contact> {
    Ok(Contact {
        id: row.get("id")?,
        name: row.get("name")?,
        nickname: row.get("nickname")?,
        group_name: row.get("group_name")?,
        avatar_path: row.get("avatar_path")?,
        birthday: row.get("birthday")?,
        contact_info: row.get("contact_info")?,
        notes: row.get("notes")?,
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

/// 创建联系人
pub fn create_contact(
    conn: &Connection,
    name: &str,
    nickname: Option<&str>,
    group_name: Option<&str>,
    avatar_path: Option<&str>,
    birthday: Option<&str>,
    contact_info: Option<&str>,
    notes: Option<&str>,
) -> Result<Contact, String> {
    let id = gen_id();
    let time = now();

    conn.execute(
        "INSERT INTO contacts (id, name, nickname, group_name, avatar_path, birthday, contact_info, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![id, name, nickname, group_name, avatar_path, birthday, contact_info, notes, time, time],
    )
    .map_err(|e| format!("Failed to create contact: {}", e))?;

    get_contact(conn, &id)
}

/// 获取单个联系人
pub fn get_contact(conn: &Connection, id: &str) -> Result<Contact, String> {
    conn.query_row(
        &format!("SELECT {} FROM contacts WHERE id = ?1", CONTACT_COLUMNS),
        params![id],
        contact_from_row,
    )
    .map_err(|e| format!("Contact not found: {}", e))
}

/// 获取联系人列表（可按分组筛选）
pub fn list_contacts(
    conn: &Connection,
    group_name: Option<&str>,
) -> Result<Vec<Contact>, String> {
    let mut sql = format!("SELECT {} FROM contacts WHERE 1=1", CONTACT_COLUMNS);
    let mut params_vec: Vec<String> = Vec::new();

    if let Some(g) = group_name {
        sql.push_str(" AND group_name = ?");
        params_vec.push(g.to_string());
    }

    sql.push_str(" ORDER BY created_at DESC");

    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = params_vec
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();

    let contacts = stmt
        .query_map(param_refs.as_slice(), contact_from_row)
        .map_err(|e| format!("Failed to query contacts: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect contacts: {}", e))?;

    Ok(contacts)
}

/// 更新联系人
pub fn update_contact(
    conn: &Connection,
    id: &str,
    name: Option<&str>,
    nickname: Option<&str>,
    group_name: Option<&str>,
    avatar_path: Option<&str>,
    birthday: Option<&str>,
    contact_info: Option<&str>,
    notes: Option<&str>,
) -> Result<Contact, String> {
    let time = now();

    let mut sets: Vec<String> = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = name {
        sets.push("name = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = nickname {
        sets.push("nickname = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = group_name {
        sets.push("group_name = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = avatar_path {
        sets.push("avatar_path = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = birthday {
        sets.push("birthday = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = contact_info {
        sets.push("contact_info = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }
    if let Some(v) = notes {
        sets.push("notes = ?".to_string());
        param_values.push(Box::new(v.to_string()));
    }

    if sets.is_empty() {
        return get_contact(conn, id);
    }

    sets.push("updated_at = ?".to_string());
    param_values.push(Box::new(time));

    let sql = format!(
        "UPDATE contacts SET {} WHERE id = ?",
        sets.join(", ")
    );
    param_values.push(Box::new(id.to_string()));

    let param_refs: Vec<&dyn rusqlite::ToSql> = param_values
        .iter()
        .map(|v| v.as_ref() as &dyn rusqlite::ToSql)
        .collect();

    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| format!("Failed to update contact: {}", e))?;

    get_contact(conn, id)
}

/// 删除联系人
pub fn delete_contact(conn: &Connection, id: &str) -> Result<u64, String> {
    let affected = conn.execute("DELETE FROM contacts WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete contact: {}", e))?;

    Ok(affected as u64)
}

/// 搜索联系人（按 name / nickname / notes）
pub fn search_contacts(conn: &Connection, query: &str) -> Result<Vec<Contact>, String> {
    let pattern = format!("%{}%", query);
    let sql = format!(
        "SELECT {} FROM contacts WHERE name LIKE ?1 OR nickname LIKE ?1 OR notes LIKE ?1 ORDER BY created_at DESC",
        CONTACT_COLUMNS
    );
    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| format!("Failed to prepare search: {}", e))?;

    let contacts = stmt
        .query_map(params![pattern], contact_from_row)
        .map_err(|e| format!("Failed to search contacts: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect search results: {}", e))?;

    Ok(contacts)
}
