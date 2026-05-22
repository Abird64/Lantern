import { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Sparkles } from 'lucide-react';
import { NavBar, CapsuleTabs, LanternSvg, themes } from '@/components/ui';
import { useContactStore } from '@/stores/contactStore';
import type { Contact } from '@/types/contact';

const categories = [
  { id: 'all', label: '全部' },
  { id: 'family', label: '家人' },
  { id: 'friend', label: '朋友' },
  { id: 'classmate', label: '同学' },
  { id: 'colleague', label: '同事' },
  { id: 'teacher', label: '老师' },
];

/** 分组名映射：前端 id → DB group_name */
const groupIdToLabel: Record<string, string> = {
  family: '家人',
  friend: '朋友',
  classmate: '同学',
  colleague: '同事',
  teacher: '老师',
};

/** 头像色板（按分组固定颜色） */
const groupColors: Record<string, string> = {
  family: '#D98B58',
  friend: '#F2C94C',
  classmate: '#7A93AC',
  colleague: '#58A968',
  teacher: '#2A8CB7',
};

const theme = themes.relations;

/** 逗号分隔字符串 ↔ 数组 */
function splitTags(s: string): string[] {
  return s.split(/[,，]/).map(v => v.trim()).filter(Boolean);
}
function joinTags(arr: string[]): string {
  return arr.join(', ');
}

/** 标签输入组件（提取到组件外部，避免每次渲染重建导致失焦） */
function TagInput({
  tags, onTagsChange, inputVal, onInputChange, placeholder, accentColor,
}: {
  tags: string[]; onTagsChange: (v: string[]) => void;
  inputVal: string; onInputChange: (v: string) => void;
  placeholder: string; accentColor: string;
}) {
  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              {tag}
              <button
                onClick={() => onTagsChange(tags.filter((_, j) => j !== i))}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={inputVal}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) {
            e.preventDefault();
            const val = inputVal.trim();
            if (!tags.includes(val)) onTagsChange([...tags, val]);
            onInputChange('');
          }
          if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
            onTagsChange(tags.slice(0, -1));
          }
        }}
        placeholder={placeholder}
        className="w-full text-base rounded-2xl px-4 py-3 focus:outline-none"
        style={{
          backgroundColor: `${accentColor}10`,
          color: '#F2E9E0',
        }}
      />
    </div>
  );
}

export function RelationsPage() {
  const { contacts, isLoading, fetchContacts, createContact, updateContact, deleteContact } = useContactStore();
  const [activeCategory, setActiveCategory] = useState('all');

  // 创建弹窗
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNicknames, setNewNicknames] = useState<string[]>([]);
  const [newNicknameInput, setNewNicknameInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newContactInfos, setNewContactInfos] = useState<string[]>([]);
  const [newContactInfoInput, setNewContactInfoInput] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);

  // 详情面板
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editNicknames, setEditNicknames] = useState<string[]>([]);
  const [editNicknameInput, setEditNicknameInput] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editContactInfos, setEditContactInfos] = useState<string[]>([]);
  const [editContactInfoInput, setEditContactInfoInput] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // AI 建议面板（占位）
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Toast
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (showCreate) {
      setTimeout(() => createInputRef.current?.focus(), 100);
    }
  }, [showCreate]);

  const filteredContacts = activeCategory === 'all'
    ? contacts
    : contacts.filter((c) => c.group_name === groupIdToLabel[activeCategory]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function resetCreateForm() {
    setNewName('');
    setNewNicknames([]);
    setNewNicknameInput('');
    setNewGroupName('');
    setNewBirthday('');
    setNewContactInfos([]);
    setNewContactInfoInput('');
    setNewNotes('');
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await createContact({
        name: newName.trim(),
        nickname: newNicknames.length > 0 ? joinTags(newNicknames) : undefined,
        group_name: newGroupName || undefined,
        birthday: newBirthday || undefined,
        contact_info: newContactInfos.length > 0 ? joinTags(newContactInfos) : undefined,
        notes: newNotes.trim() || undefined,
      });
      setShowCreate(false);
      resetCreateForm();
      showToast('已添加');
    } catch (e) {
      showToast(String(e));
    }
  }

  function openDetail(contact: Contact) {
    setSelectedContact(contact);
    setEditName(contact.name);
    setEditNicknames(contact.nickname ? splitTags(contact.nickname) : []);
    setEditNicknameInput('');
    setEditGroupName(contact.group_name || '');
    setEditBirthday(contact.birthday || '');
    setEditContactInfos(contact.contact_info ? splitTags(contact.contact_info) : []);
    setEditContactInfoInput('');
    setEditNotes(contact.notes || '');
  }

  function closeDetail() {
    setSelectedContact(null);
  }

  async function handleSave() {
    if (!selectedContact || !editName.trim()) return;
    try {
      await updateContact(selectedContact.id, {
        name: editName.trim(),
        nickname: editNicknames.length > 0 ? joinTags(editNicknames) : undefined,
        group_name: editGroupName || undefined,
        birthday: editBirthday || undefined,
        contact_info: editContactInfos.length > 0 ? joinTags(editContactInfos) : undefined,
        notes: editNotes.trim() || undefined,
      });
      showToast('已保存');
      closeDetail();
    } catch (e) {
      showToast(String(e));
    }
  }

  async function handleDelete() {
    if (!selectedContact) return;
    try {
      await deleteContact(selectedContact.id);
      showToast('已删除');
      closeDetail();
    } catch (e) {
      showToast(String(e));
    }
  }

  function getGroupColor(groupName: string | null): string {
    if (!groupName) return theme.accent;
    const entry = Object.entries(groupIdToLabel).find(([, label]) => label === groupName);
    return entry ? groupColors[entry[0]] : theme.accent;
  }

  return (
    <div className="h-screen px-4 md:px-6 lg:px-8 relative flex flex-col overflow-hidden" style={{ backgroundColor: theme.bg }}>
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

      {/* 固定控制区：胶囊分类 */}
      <div className="flex-shrink-0 flex flex-col items-center px-8 pt-6 pb-4 relative z-10">
        <div className="w-full max-w-[1000px]">
          <CapsuleTabs
            items={categories}
            activeId={activeCategory}
            onChange={setActiveCategory}
            accentColor={theme.accent}
          />
        </div>
      </div>

      {/* 可滚动内容区：联系人列表 */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 pb-8 relative z-10">
        <div className="max-w-[1000px] mx-auto w-full">
          {isLoading && contacts.length === 0 ? (
            <div className="text-center py-20" style={{ color: `${theme.text}66` }}>
              加载中...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-20" style={{ color: `${theme.text}66` }}>
              暂无联系人
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => openDetail(contact)}
                  className="h-[140px] rounded-[40px] p-6 pl-8 flex items-center gap-5 hover:opacity-90 transition-colors cursor-pointer"
                  style={{ backgroundColor: theme.card }}
                >
                  {/* 头像 */}
                  <div
                    className="w-[60px] h-[60px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: getGroupColor(contact.group_name) }}
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-zhuque text-2xl truncate" style={{ color: theme.text }}>
                        {contact.name}
                      </span>
                      {contact.nickname && (
                        <span className="font-zhuque text-base truncate" style={{ color: `${theme.text}55` }}>
                          ({splitTags(contact.nickname)[0]}{splitTags(contact.nickname).length > 1 ? '...' : ''})
                        </span>
                      )}
                    </div>
                    {contact.group_name && (
                      <span
                        className="font-zhuque text-sm mt-1 px-2 py-0.5 rounded-full w-fit"
                        style={{
                          backgroundColor: `${getGroupColor(contact.group_name)}30`,
                          color: getGroupColor(contact.group_name),
                        }}
                      >
                        {contact.group_name}
                      </span>
                    )}
                    {contact.notes && (
                      <span className="font-zhuque text-lg mt-1 truncate" style={{ color: `${theme.text}99` }}>
                        {contact.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 左下角灯笼按钮（AI 建议） */}
      <button
        onClick={() => setShowAiPanel(true)}
        className="fixed bottom-6 left-6 z-30 w-14 h-14 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        title="AI 建议"
      >
        <div className="w-14 h-14">
          <LanternSvg />
        </div>
      </button>

      {/* 右下角加号按钮 */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-8 z-30 w-14 h-14 rounded-full text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
        style={{ backgroundColor: theme.accent }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* ========== AI 建议面板（占位） ========== */}
      {showAiPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-start pl-6 pb-24">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAiPanel(false)}
          />
          <div
            className="relative w-full max-w-[400px] rounded-3xl shadow-2xl p-8 mx-4"
            style={{ backgroundColor: theme.card }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={20} style={{ color: theme.accent }} />
                <h2 className="text-xl font-zhuque" style={{ color: theme.text }}>提灯问路</h2>
              </div>
              <button
                onClick={() => setShowAiPanel(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ backgroundColor: `${theme.text}15` }}
              >
                <X size={16} style={{ color: theme.text }} />
              </button>
            </div>
            <div className="text-center py-8" style={{ color: `${theme.text}55` }}>
              <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-zhuque text-lg">AI 建议功能即将上线</p>
              <p className="font-zhuque text-sm mt-2 opacity-60">谁快过生日了？该联系谁了？</p>
            </div>
          </div>
        </div>
      )}

      {/* ========== 创建联系人弹窗 ========== */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-32">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setShowCreate(false); resetCreateForm(); }}
          />
          <div
            className="relative w-full max-w-[600px] rounded-3xl shadow-2xl p-8 mx-4"
            style={{ backgroundColor: theme.card }}
          >
            <input
              ref={createInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="姓名（必填）"
              className="w-full text-xl bg-transparent border-b pb-3 mb-5 focus:outline-none"
              style={{
                color: theme.text,
                borderColor: newName ? theme.accent : `${theme.text}20`,
              }}
            />

            {/* 别称/昵称（多值） */}
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ color: `${theme.text}80` }}>别称 / 昵称</label>
              <TagInput
                tags={newNicknames}
                onTagsChange={setNewNicknames}
                inputVal={newNicknameInput}
                onInputChange={setNewNicknameInput}
                placeholder="输入后回车添加，可多个"
                accentColor={theme.accent}
              />
            </div>

            {/* 分组 */}
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ color: `${theme.text}80` }}>分组</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(groupIdToLabel).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setNewGroupName(newGroupName === label ? '' : label)}
                    className="px-3 py-1.5 rounded-full text-sm transition-all"
                    style={{
                      backgroundColor: newGroupName === label ? groupColors[id] : `${theme.text}10`,
                      color: newGroupName === label ? '#fff' : `${theme.text}99`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 生日 */}
            <div className="mb-4">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: `${theme.text}08` }}
              >
                <span className="text-sm shrink-0" style={{ color: `${theme.text}50` }}>生日</span>
                <input
                  type="date"
                  value={newBirthday}
                  onChange={(e) => setNewBirthday(e.target.value)}
                  className="date-input text-sm flex-1"
                  style={{ color: theme.text }}
                />
              </div>
            </div>

            {/* 联系方式（多值） */}
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ color: `${theme.text}80` }}>联系方式</label>
              <TagInput
                tags={newContactInfos}
                onTagsChange={setNewContactInfos}
                inputVal={newContactInfoInput}
                onInputChange={setNewContactInfoInput}
                placeholder="电话/微信/QQ 等，回车添加"
                accentColor={theme.accent}
              />
            </div>

            {/* 备注 */}
            <div className="mb-6">
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="备注..."
                rows={2}
                className="w-full text-base rounded-2xl px-4 py-3 focus:outline-none resize-none"
                style={{
                  backgroundColor: `${theme.text}08`,
                  color: theme.text,
                }}
              />
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreate(false); resetCreateForm(); }}
                className="flex-1 py-3 rounded-full transition-colors"
                style={{ color: `${theme.text}80`, backgroundColor: `${theme.text}10` }}
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 py-3 rounded-full text-white transition-colors disabled:opacity-30"
                style={{ backgroundColor: theme.accent }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== 联系人详情面板 ========== */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDetail}
          />
          {/* 详情面板 */}
          <div
            className="relative w-full max-w-[480px] shadow-2xl flex flex-col animate-slide-in"
            style={{ backgroundColor: theme.bg }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6" style={{ borderBottom: `1px solid ${theme.text}15` }}>
              <h2 className="text-xl font-zhuque" style={{ color: theme.text }}>联系人详情</h2>
              <button
                onClick={closeDetail}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${theme.text}15` }}
              >
                <X size={16} style={{ color: `${theme.text}99` }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 头像预览 */}
              <div className="flex justify-center">
                <div
                  className="w-20 h-20 rounded-full"
                  style={{ backgroundColor: getGroupColor(editGroupName || selectedContact.group_name) }}
                />
              </div>

              {/* 姓名 */}
              <div>
                <label className="block text-sm mb-1.5" style={{ color: `${theme.text}60` }}>姓名</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-lg rounded-2xl px-4 py-3 focus:outline-none"
                  style={{ color: theme.text, backgroundColor: `${theme.text}08` }}
                />
              </div>

              {/* 别称/昵称（多值） */}
              <div>
                <label className="block text-sm mb-1.5" style={{ color: `${theme.text}60` }}>别称 / 昵称</label>
                <TagInput
                  tags={editNicknames}
                  onTagsChange={setEditNicknames}
                  inputVal={editNicknameInput}
                  onInputChange={setEditNicknameInput}
                  placeholder="输入后回车添加"
                  accentColor={theme.accent}
                />
              </div>

              {/* 分组 */}
              <div>
                <label className="block text-sm mb-1.5" style={{ color: `${theme.text}60` }}>分组</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(groupIdToLabel).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setEditGroupName(editGroupName === label ? '' : label)}
                      className="px-4 py-1.5 rounded-full text-sm transition-all"
                      style={{
                        backgroundColor: editGroupName === label ? groupColors[id] : `${theme.text}10`,
                        color: editGroupName === label ? '#fff' : `${theme.text}99`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 生日 */}
              <div>
                <label className="block text-sm mb-1.5" style={{ color: `${theme.text}60` }}>生日</label>
                <input
                  type="date"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  className="date-input w-full text-base rounded-2xl px-4 py-3 focus:outline-none"
                  style={{ color: theme.text, backgroundColor: `${theme.text}08` }}
                />
              </div>

              {/* 联系方式（多值） */}
              <div>
                <label className="block text-sm mb-1.5" style={{ color: `${theme.text}60` }}>联系方式</label>
                <TagInput
                  tags={editContactInfos}
                  onTagsChange={setEditContactInfos}
                  inputVal={editContactInfoInput}
                  onInputChange={setEditContactInfoInput}
                  placeholder="电话/微信/QQ 等，回车添加"
                  accentColor={theme.accent}
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm mb-1.5" style={{ color: `${theme.text}60` }}>备注</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="备注..."
                  rows={3}
                  className="w-full text-base rounded-2xl px-4 py-3 focus:outline-none resize-none"
                  style={{ color: theme.text, backgroundColor: `${theme.text}08` }}
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-6 flex gap-3" style={{ borderTop: `1px solid ${theme.text}15` }}>
              <button
                onClick={handleDelete}
                className="px-5 py-3 rounded-full flex items-center gap-2 transition-colors"
                style={{ color: '#ef4444', backgroundColor: '#ef444420' }}
              >
                <Trash2 size={16} />
                删除
              </button>
              <button
                onClick={handleSave}
                disabled={!editName.trim()}
                className="flex-1 py-3 rounded-full text-white transition-colors disabled:opacity-30"
                style={{ backgroundColor: theme.accent }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-2xl shadow-lg text-sm max-w-[500px]">
          {toast}
        </div>
      )}

      {/* 滑入动画 + 日期输入样式 */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
        .date-input {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          cursor: pointer;
        }
        .date-input::-webkit-calendar-picker-indicator {
          opacity: 0.4;
          cursor: pointer;
          filter: grayscale(1);
        }
        .date-input::-webkit-calendar-picker-indicator:hover {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
