/** 技能 - 对应后端 skill_repo::Skill */
export interface Skill {
  id: string;          // 'knowledge', 'physique', 'charm', 'talent', 'worldliness', 'cultivation'
  name: string;        // '学识', '筋骨', '风华', '才情', '入世', '修为'
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  category: string | null;
  level: number;
  total_xp: number;
  is_unlocked: number;
  created_at: string;
  updated_at: string;
}

/** 任务技能关联 - 对应后端 skill_repo::TaskSkill */
export interface TaskSkill {
  task_id: string;
  skill_id: string;
  xp_amount: number;
}

/** 设置任务XP分配的输入 */
export interface SetTaskSkillsInput {
  skill_id: string;
  xp_amount: number;
}
