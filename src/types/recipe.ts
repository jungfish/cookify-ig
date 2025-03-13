export type Recipe = {
  id?: string;
  title: string;
  category: "Dessert" | "Soupe" | "Plat principal" | "Entrée" | "Bébé";
  ingredients: string[];
  instructions: string[];
  illustration?: string;
  url?: string;
  videoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}; 