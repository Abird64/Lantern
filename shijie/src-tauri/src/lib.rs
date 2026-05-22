mod db;
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::Manager;

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 初始化数据库
            let (db_state, app_data_state) = db::connection::init_db(app.handle())?;
            app.manage(db_state);
            app.manage(app_data_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::task_commands::create_task,
            commands::task_commands::get_task,
            commands::task_commands::list_tasks,
            commands::task_commands::update_task,
            commands::task_commands::delete_task,
            commands::task_commands::complete_task,
            commands::task_commands::uncomplete_task,
            commands::task_commands::search_tasks,
            commands::skill_commands::list_skills,
            commands::skill_commands::get_task_skills,
            commands::skill_commands::set_task_skills,
            commands::journal_commands::get_journal_by_date,
            commands::journal_commands::save_journal,
            commands::journal_commands::get_timeline,
            commands::journal_commands::get_ai_diary,
            commands::journal_commands::save_ai_diary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
