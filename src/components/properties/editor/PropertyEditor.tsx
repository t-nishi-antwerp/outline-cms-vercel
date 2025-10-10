"use client";

import { useState, useEffect } from "react";
import {
  PropertyData,
  PropertySection as PropertySectionType,
  PropertyItem,
} from "@/types/property";
import { PropertySection } from "./PropertySection";
import { PropertyPreview } from "./PropertyPreview";
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
} from "@dnd-kit/sortable";

interface PropertyEditorProps {
  propertyId: string;
  initialData: PropertyData;
}

export function PropertyEditor({ propertyId, initialData }: PropertyEditorProps) {
  const [data, setData] = useState<PropertyData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState<{
    lockedBy?: { name: string; email: string };
    expiresAt?: Date;
  } | null>(null);
  const [lockCheckInterval, setLockCheckInterval] = useState<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 自動保存関数
  const autoSave = async (dataToSave: PropertyData) => {
    try {
      await fetch(`/api/properties/${propertyId}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });
    } catch (error) {
      console.error("自動保存エラー:", error);
    }
  };

  // ロック取得・延長
  const acquireLock = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/lock`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        setIsLocked(false);
        return true;
      } else if (response.status === 409) {
        // 他のユーザーがロック中
        setIsLocked(true);
        setLockInfo({
          lockedBy: result.lockedBy,
          expiresAt: new Date(result.expiresAt),
        });
        return false;
      }
    } catch (error) {
      console.error("Lock acquisition error:", error);
    }
    return false;
  };

  // ロック解除
  const releaseLock = async () => {
    try {
      await fetch(`/api/properties/${propertyId}/lock`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Lock release error:", error);
    }
  };

  // 初期ロック取得とクリーンアップ
  useEffect(() => {
    // ロックを取得
    acquireLock();

    // 5分ごとにロックを延長
    const interval = setInterval(() => {
      acquireLock();
    }, 5 * 60 * 1000);

    setLockCheckInterval(interval);

    // ページ離脱時にロック解除
    const handleBeforeUnload = () => {
      releaseLock();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      if (interval) {
        clearInterval(interval);
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
      releaseLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = data.sections.findIndex((section) => section.id === active.id);
      const newIndex = data.sections.findIndex((section) => section.id === over.id);

      const newSections = arrayMove(data.sections, oldIndex, newIndex);
      const updatedData = {
        ...data,
        sections: newSections,
      };

      setData(updatedData);

      // 並び替え後に自動保存
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      const timer = setTimeout(() => {
        autoSave(updatedData);
      }, 500);
      setAutoSaveTimer(timer);
    }
  };

  // セクション更新
  const handleUpdateSection = (
    sectionId: string,
    updates: Partial<PropertySectionType>
  ) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    }));
  };

  // セクション削除
  const handleDeleteSection = (sectionId: string) => {
    if (!confirm("このセクションを削除しますか?")) return;

    setData((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  };

  // セクション複製
  const handleDuplicateSection = (sectionId: string) => {
    const section = data.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const duplicatedSection: PropertySectionType = {
      ...section,
      id: uuidv4(),
      title: `${section.title}のコピー`,
      items: section.items.map((item) => ({
        ...item,
        id: uuidv4(),
      })),
    };

    // 元のセクションの次に挿入
    const sectionIndex = data.sections.findIndex((s) => s.id === sectionId);
    const newSections = [...data.sections];
    newSections.splice(sectionIndex + 1, 0, duplicatedSection);

    setData((prev) => ({
      ...prev,
      sections: newSections,
    }));
  };

  // 項目更新
  const handleUpdateItem = (
    sectionId: string,
    itemId: string,
    updates: Partial<PropertyItem>
  ) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : section
      ),
    }));
  };

  // 項目削除
  const handleDeleteItem = (sectionId: string, itemId: string) => {
    if (!confirm("この項目を削除しますか?")) return;

    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter((item) => item.id !== itemId),
            }
          : section
      ),
    }));
  };

  // 項目複製
  const handleDuplicateItem = (sectionId: string, itemId: string) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;

        const item = section.items.find((i) => i.id === itemId);
        if (!item) return section;

        const duplicatedItem: PropertyItem = {
          ...item,
          id: uuidv4(),
        };

        // 元の項目の次に挿入
        const itemIndex = section.items.findIndex((i) => i.id === itemId);
        const newItems = [...section.items];
        newItems.splice(itemIndex + 1, 0, duplicatedItem);

        return {
          ...section,
          items: newItems,
        };
      }),
    }));
  };

  // 項目追加
  const handleAddItem = (sectionId: string, item: PropertyItem) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [...section.items, item],
            }
          : section
      ),
    }));
  };

  // 項目の並び替え
  const handleReorderItems = (sectionId: string, items: PropertyItem[]) => {
    const updatedData = {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items,
            }
          : section
      ),
    };

    setData(updatedData);

    // 並び替え後に自動保存
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    const timer = setTimeout(() => {
      autoSave(updatedData);
    }, 500);
    setAutoSaveTimer(timer);
  };

  // セクション追加
  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: PropertySectionType = {
      id: uuidv4(),
      type: "variable",
      title: newSectionTitle,
      order: data.sections.length,
      items: [],
    };

    setData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));

    setNewSectionTitle("");
    setIsAddingSection(false);
  };

  // 下書き保存
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const response = await fetch(`/api/properties/${propertyId}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("保存に失敗しました");
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("保存エラー:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ロック警告 */}
      {isLocked && lockInfo && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">
                この物件は現在編集できません
              </h3>
              <p className="text-sm text-yellow-800">
                {lockInfo.lockedBy?.name}さん（{lockInfo.lockedBy?.email}）が編集中です。
                {lockInfo.expiresAt && (
                  <span className="block mt-1">
                    ロック期限: {new Date(lockInfo.expiresAt).toLocaleString("ja-JP")}
                  </span>
                )}
              </p>
              <button
                onClick={() => acquireLock()}
                className="mt-3 px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* タブとアクションバー */}
      <div className="sticky top-0 bg-white border-b border-gray-200 pb-4 z-10">
        {/* タブ */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "edit"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              編集
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "preview"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              プレビュー
            </button>
          </div>
        </div>

        {/* 保存ボタンとステータス */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || isLocked}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "下書き保存"}
            </button>
            {saveStatus === "saved" && (
              <span className="text-sm text-green-600">✓ 保存しました</span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm text-red-600">✗ 保存に失敗しました</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            最終更新: {new Date(data.lastUpdated).toLocaleString("ja-JP")}
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      {activeTab === "edit" ? (
        <>
          {isLocked ? (
            <div className="text-center py-16 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-lg font-medium mb-2">編集がロックされています</p>
              <p className="text-sm">他のユーザーが編集中のため、編集できません</p>
            </div>
          ) : (
            <>
              {/* セクション一覧 */}
              <div className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSectionDragEnd}
                >
                  <SortableContext
                    items={data.sections.map((section) => section.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {data.sections.map((section) => (
                      <PropertySection
                        key={section.id}
                        section={section}
                        onUpdateSection={handleUpdateSection}
                        onDeleteSection={handleDeleteSection}
                        onDuplicateSection={handleDuplicateSection}
                        onUpdateItem={handleUpdateItem}
                        onDeleteItem={handleDeleteItem}
                        onDuplicateItem={handleDuplicateItem}
                        onAddItem={handleAddItem}
                        onReorderItems={handleReorderItems}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {/* セクション追加 */}
              {isAddingSection ? (
                <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="セクション名を入力"
                      autoFocus
                    />
                    <button
                      onClick={handleAddSection}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSection(false);
                        setNewSectionTitle("");
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSection(true)}
                  className="w-full px-4 py-3 text-blue-600 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  + セクションを追加
                </button>
              )}
            </>
          )}
        </>
      ) : (
        <PropertyPreview data={data} />
      )}
    </div>
  );
}
