import { useState } from 'react';
import { NavBar, CapsuleTabs, themes } from '@/components/ui';

const categories = [
  { id: 'all', label: '全部' },
  { id: 'family', label: '至亲' },
  { id: 'friend', label: '知己' },
  { id: 'classmate', label: '同窗' },
  { id: 'colleague', label: '共事' },
  { id: 'teacher', label: '恩师' },
];

const contacts = [
  { id: '1', name: '爸爸', category: 'family', note: '上次通话：3-20', color: '#D98B58' },
  { id: '2', name: '令狐楚', category: 'teacher', note: '欠师傅1000两白银', color: '#2A8CB7' },
  { id: '3', name: '小鹏', category: 'friend', note: '最爱吃番茄炒蛋', color: '#F2C94C' },
  { id: '4', name: '妈妈', category: 'family', note: '最近睡眠不好', color: '#D98B58' },
  { id: '5', name: '王氏', category: 'teacher', note: '昨天做了蓝色美甲', color: '#D98B58' },
  { id: '6', name: '阿月', category: 'classmate', note: '一起打篮球', color: '#7A93AC' },
];

// 使用主题配置
const theme = themes.relations;

export function RelationsPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredContacts = activeCategory === 'all'
    ? contacts
    : contacts.filter((c) => c.category === activeCategory);

  return (
    <div className={`min-h-screen px-4 md:px-6 lg:px-8 relative flex flex-col`} style={{ backgroundColor: theme.bg }}>
      {/* 网格背景 */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 顶部导航栏 */}
      <NavBar 
        title="相识"
        navColor={theme.nav}
        quote="何当共剪西窗烛，却话巴山夜雨时"
      />

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center px-8">
        
        {/* 顶部间隔 */}
        <div className="h-6" />
        
        {/* 胶囊分类栏 */}
        <div className="w-full max-w-[1000px]">
          <CapsuleTabs
            items={categories}
            activeId={activeCategory}
            onChange={setActiveCategory}
            accentColor={theme.accent}
          />
        </div>

        {/* 中间间隔 */}
        <div className="h-6" />

        {/* 联系人列表 */}
        <div className="max-w-[1000px] mx-auto w-full pb-12">
          <div className="grid grid-cols-2 gap-6">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="h-[140px] rounded-[40px] p-6 pl-8 flex items-center gap-5 hover:opacity-90 transition-colors cursor-pointer"
                style={{ backgroundColor: theme.card }}
              >
                {/* 头像 */}
                <div
                  className="w-[60px] h-[60px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: contact.color }}
                />

                <div className="flex flex-col min-w-0">
                  <span className="font-zhuque text-2xl truncate" style={{ color: theme.text }}>
                    {contact.name}
                  </span>
                  <span className="font-zhuque text-lg mt-1 truncate" style={{ color: `${theme.text}99` }}>
                    {contact.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 pointer-events-none">
        <img
          src="/assets/CodeBuddyAssets/47_57/12.png"
          alt="装饰"
          className="w-[160px] h-auto"
        />
      </div>
    </div>
  );
}
