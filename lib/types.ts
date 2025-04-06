export interface Category {
  id: string
  name: string
  parentId: string | null
}

export interface Note {
  id: string
  title: string
  content: string
  categoryId: string | null
  createdAt: string
  updatedAt: string
  color: string
}

