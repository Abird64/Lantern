import { useUIStore } from '@/stores/uiStore';
import { Menu } from 'lucide-react';

interface HeaderButtonProps {
  title: string;
}

export function HeaderButton({ title }: HeaderButtonProps) {
  const { setMenuOpen } = useUIStore();

  return (
    <button
      onClick={() => setMenuOpen(true)}
      className="w-[120px] h-10 rounded-full bg-[#666] flex items-center justify-center hover:bg-[#777] transition-colors"
    >
      <Menu size={20} className="text-white mr-2" />
      <span className="font-zhuque text-white text-xl">{title}</span>
    </button>
  );
}
