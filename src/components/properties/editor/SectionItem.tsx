"use client";

import { useState } from "react";
import { PropertyItem } from "@/types/property";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SectionItemProps {
  item: PropertyItem;
  onUpdate: (id: string, updates: Partial<PropertyItem>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isFixed: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export function SectionItem({
  item,
  onUpdate,
  onDelete,
  onDuplicate,
  isFixed,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
}: SectionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [value, setValue] = useState(item.value);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(item.id, { label, value });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLabel(item.label);
    setValue(item.value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="grid grid-cols-[1fr_2fr] gap-4 p-3 bg-blue-50 border-2 border-blue-400 rounded shadow-sm"
      >
        <div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="項目名"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="値（複数行可）"
          />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleSave}
              className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap font-medium"
              title="保存 (Enter)"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              className="px-2.5 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-white whitespace-nowrap"
              title="キャンセル (Esc)"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_1fr_2fr] gap-4 p-3 bg-gray-50 rounded group hover:bg-gray-100"
    >
      {/* チェックボックス（選択モード時のみ表示） */}
      {isSelectionMode ? (
        <div className="flex items-start pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection?.(item.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
          />
        </div>
      ) : (
        <div className="flex items-start pt-1">
          <span
            {...attributes}
            {...listeners}
            className="cursor-move text-gray-400 mt-0.5"
          >
            ⋮⋮
          </span>
        </div>
      )}

      <div className="text-sm font-medium text-gray-700 flex items-start gap-2 pt-1">
        {item.label}
      </div>
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-600 whitespace-pre-wrap flex-1 break-words">
          {item.value || "(未入力)"}
        </span>
        {!isSelectionMode && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity ml-2 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
              title="編集"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDuplicate(item.id)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
              title="複製"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {!isFixed && (
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="削除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
