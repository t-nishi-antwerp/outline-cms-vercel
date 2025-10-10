// 物件データの型定義

export interface PropertySection {
  id: string;
  type: "fixed" | "variable";
  title: string;
  order: number;
  items: PropertyItem[];
}

export interface PropertyItem {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface PropertyData {
  version: string;
  lastUpdated: string;
  updatedBy: string;
  sections: PropertySection[];
}

export interface Property {
  id: string;
  name: string;
  slug: string;
  siteUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyWithData extends Property {
  currentData?: PropertyData;
  draftData?: PropertyData;
}
