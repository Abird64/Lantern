export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  builtin: boolean;
  sort_order: number;
}

/** 系统内置锦囊 */
export const BUILTIN_PROMPTS: PromptTemplate[] = [
  {
    id: '__recommend_task', title: '推荐任务', builtin: true, sort_order: 1,
    prompt: '根据我当前的任务列表和权重设置，推荐一个最优任务，告诉我为什么推荐它',
  },
  {
    id: '__week_schedule', title: '本周日程', builtin: true, sort_order: 2,
    prompt: '帮我总结本周的日程安排，有哪些重要的日程需要注意',
  },
  {
    id: '__birthday', title: '近期生日', builtin: true, sort_order: 3,
    prompt: '帮我查一下最近一个月有哪些联系人过生日',
  },
  {
    id: '__skill_progress', title: '属性成长', builtin: true, sort_order: 4,
    prompt: '帮我分析当前的属性成长情况，哪些属性需要重点提升',
  },
  {
    id: '__review_day', title: '回顾今天', builtin: true, sort_order: 5,
    prompt: '帮我回顾今天的日记内容，给我一些反思和建议',
  },
  {
    id: '__weekly_review', title: '周报总结', builtin: true, sort_order: 6,
    prompt: '根据本周已完成的任务和日记，帮我写一个本周总结',
  },
];
