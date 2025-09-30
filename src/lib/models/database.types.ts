export interface Blog {
    id:number;
    title:string;
    description:string;
    content:string;
    images:string[];
    tags:string[];
    author_id:string;
    published:boolean;
    created_at:string;
    updated_at:string;
    profile: {
        username:string;
        image_url:string;
    }
}

export interface Beverage {
    id:number;
    name:string;
    description:string;
    execution: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}



export interface Ingredient {
  id: number;
  name: string;
  category?: string;
  description?: string;
  measurement_unit?: string;
  recipe_ingredients: { count: number }[]; 
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: number;
  beverage_id: number;
  ingredient_id: number;
  quantity: number;
  notes?: string;
  ingredients: Pick<Ingredient, 'name' | 'measurement_unit'>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id:string;
  username:string;
  email:string;
  role:string;
  created_at:string;
  updated_at:string;
  image_url:string;
  org_id:number; 
}

export interface Organization {
  id:number;
  store_name:string | null;
  location:string;
  phone: string | null;
  status: boolean;
  country:string;
  created_at:string;
  updated_at:string;
  manager_id:string;
}