import React from 'react';
import { Trash2, X, CheckSquare } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  itemName?: string;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onDeleteSelected,
  itemName = 'item',
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
          <CheckSquare className="w-4 h-4" />
        </div>
        <span className="font-semibold text-white">
          <strong className="text-emerald-400 font-mono text-sm">{selectedCount}</strong> {itemName} dipilih (dari {totalCount})
        </span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Batal Pilih</span>
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus {selectedCount} Terpilih (Multi-Delete)</span>
        </button>
      </div>
    </div>
  );
};
