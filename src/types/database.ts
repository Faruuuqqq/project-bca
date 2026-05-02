export type Category = {
  id: string
  name: string
  sort_order: number
}

export type MenuOptionValue = {
  id: string
  option_id: string
  label: string
  extra_price: number
}

export type MenuOption = {
  id: string
  menu_id: string
  name: string
  is_required: boolean
  selection_type: 'single' | 'multiple'
  values: MenuOptionValue[]
}

export type Menu = {
  id: string
  category_id: string
  name: string
  description: string
  price: number
  image_url: string
  is_sold_out: boolean
  options?: MenuOption[]
}
