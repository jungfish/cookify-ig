export type Recipe = {
  id?: string;
  title: string;
  category: "Dessert" | "Soupe" | "Plat principal" | "Entrée" | "Bébé";
  ingredients: string[];
  instructions: string[];
  illustration?: string;
  url?: string;
  videoUrl?: string;
  servings: number;
  createdAt?: Date;
  updatedAt?: Date;
}; 