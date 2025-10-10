"use client";

import { useState } from "react";
import { PropertySection as PropertySectionType, PropertyItem } from "@/types/property";
import { SectionItem } from "./SectionItem";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PropertySectionProps {
  section: PropertySectionType;
  onUpdateSection: (id: string, updates: Partial<PropertySectionType>) => void;
  onDeleteSection: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onUpdateItem: (sectionId: string, itemId: string, updates: Partial<PropertyItem>) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
  onDuplicateItem: (sectionId: string, itemId: string) => void;
  onAddItem: (sectionId: string, item: PropertyItem) => void;
  onReorderItems: (sectionId: string, items: PropertyItem[]) => void;
}

export function PropertySection({
  section,
  onUpdateSection,
  onDeleteSection,
  onDuplicateSection,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onAddItem,
  onReorderItems,
}: PropertySectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemValue, setNewItemValue] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isFixed = section.type === "fixed";

  const {
    attributes: sectionAttributes,
    listeners: sectionListeners,
    setNodeRef: setSectionNodeRef,
    transform: sectionTransform,
    transition: sectionTransition,
    isDragging: isSectionDragging,
  } = useSortable({ id: section.id });

  const sectionStyle = {
    transform: CSS.Transform.toString(sectionTransform),
    transition: sectionTransition,
    opacity: isSectionDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = section.items.findIndex((item) => item.id === active.id);
      const newIndex = section.items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(section.items, oldIndex, newIndex);
      onReorderItems(section.id, newItems);
    }
  };

  const handleSaveTitle = () => {
    onUpdateSection(section.id, { title });
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTitle(section.title);
    setIsEditingTitle(false);
  };

  const handleAddItem = () => {
    if (!newItemLabel.trim()) return;

    const newItem: PropertyItem = {
      id: uuidv4(),
      label: newItemLabel,
      value: newItemValue,
      order: section.items.length,
    };

    onAddItem(section.id, newItem);
    setNewItemLabel("");
    setNewItemValue("");
    setIsAddingItem(false);
  };

  const handleItemUpdate = (itemId: string, updates: Partial<PropertyItem>) => {
    onUpdateItem(section.id, itemId, updates);
  };

  const handleItemDelete = (itemId: string) => {
    onDeleteItem(section.id, itemId);
  };

  const handleItemDuplicate = (itemId: string) => {
    onDuplicateItem(section.id, itemId);
  };

  const handleToggleSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === section.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(section.items.map((item) => item.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;

    if (
      !confirm(
        `選択した${selectedItems.size}件の項目を削除しますか？\n\nこの操作は取り消せません。`
      )
    ) {
      return;
    }

    selectedItems.forEach((itemId) => {
      onDeleteItem(section.id, itemId);
    });

    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  return (
    <div
      ref={setSectionNodeRef}
      style={sectionStyle}
      className="border border-gray-200 rounded-lg p-4 bg-white"
    >
      {/* セクションヘッダー */}
      <div className="flex items-center justify-between mb-3">
        {isEditingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="セクション名"
            />
            <button
              onClick={handleSaveTitle}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
            <button
              onClick={handleCancelTitle}
              className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span
              {...sectionAttributes}
              {...sectionListeners}
              className="cursor-move text-gray-400 hover:text-gray-600"
            >
              ⋮⋮
            </span>
            <h4 className="font-medium text-gray-900">{section.title}</h4>
            {isFixed && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                固定
              </span>
            )}
            {section.items.length > 0 && !isFixed && (
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedItems(new Set());
                }}
                className={`ml-auto px-2 py-1 text-xs rounded transition-colors ${
                  isSelectionMode
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {isSelectionMode ? "✓ 選択中" : "一括削除"}
              </button>
            )}
          </div>
        )}

        {!isFixed && !isEditingTitle && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="セクション操作"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      setIsEditingTitle(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    タイトル編集
                  </button>
                  <button
                    onClick={() => {
                      onDuplicateSection(section.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    セクションを複製
                  </button>
                  <button
                    onClick={() => {
                      onDeleteSection(section.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg border-t border-gray-100"
                  >
                    セクションを削除
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 項目リスト */}
      <div className="space-y-2">
        {/* 選択モード時の一括操作バー */}
        {isSelectionMode && section.items.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedItems.size === section.items.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  全て選択
                </span>
              </label>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                {selectedItems.size}/{section.items.length}件選択中
              </span>
            </div>
            {selectedItems.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors"
              >
                削除 ({selectedItems.size}件)
              </button>
            )}
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={section.items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.items.map((item) => (
              <SectionItem
                key={item.id}
                item={item}
                onUpdate={handleItemUpdate}
                onDelete={handleItemDelete}
                onDuplicate={handleItemDuplicate}
                isFixed={isFixed}
                isSelectionMode={isSelectionMode}
                isSelected={selectedItems.has(item.id)}
                onToggleSelection={handleToggleSelection}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* 項目追加フォーム */}
        {isAddingItem ? (
          <div className="grid grid-cols-[1fr_2fr] gap-4 p-3 bg-green-50 border-2 border-green-400 rounded shadow-sm">
            <div>
              <input
                type="text"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="項目名"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <textarea
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                rows={3}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                placeholder="値（複数行可）"
              />
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleAddItem}
                  className="px-2.5 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap font-medium"
                  disabled={!newItemLabel.trim()}
                >
                  追加
                </button>
                <button
                  onClick={() => {
                    setIsAddingItem(false);
                    setNewItemLabel("");
                    setNewItemValue("");
                  }}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-white whitespace-nowrap"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingItem(true)}
            className="w-full px-4 py-2.5 text-sm text-gray-600 border border-dashed border-gray-300 rounded hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            + 項目を追加
          </button>
        )}
      </div>
    </div>
  );
}
