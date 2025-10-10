import { PropertyData } from "@/types/property";
import { v4 as uuidv4 } from "uuid";

/**
 * 新規物件作成時のデフォルトデータを生成
 */
export function createDefaultPropertyData(userId: string): PropertyData {
  const now = new Date().toISOString();

  return {
    version: "1.0",
    lastUpdated: now,
    updatedBy: userId,
    sections: [
      {
        id: uuidv4(),
        type: "variable",
        title: "全体概要",
        order: 1,
        items: [
          {
            id: uuidv4(),
            label: "名称",
            value: "",
            order: 1,
          },
        ],
      },
      {
        id: uuidv4(),
        type: "variable",
        title: "情報更新日",
        order: 999,
        items: [
          {
            id: uuidv4(),
            label: "更新日",
            value: new Date().toLocaleDateString("ja-JP"),
            order: 1,
          },
        ],
      },
    ],
  };
}

/**
 * slugを生成（物件識別子）
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
