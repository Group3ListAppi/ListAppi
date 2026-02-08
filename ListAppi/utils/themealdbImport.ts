import type { CreateRecipeFormData } from "../components/RecipeModal";
import type { MealDbMeal } from "../api/themealdb";

export const mealDbToCreateRecipeForm = (meal: any): (CreateRecipeFormData & { link?: string; image?: string }) => {
  const title = (meal?.strMeal ?? "").trim();
  const instructions = (meal?.strInstructions ?? "").trim();

  const link = (meal?.strSource ?? "").trim() || (meal?.strYoutube ?? "").trim() || "";

  const lines: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = String(meal?.[`strIngredient${i}`] ?? "").trim();
    const meas = String(meal?.[`strMeasure${i}`] ?? "").trim();
    if (!ing) continue;
    lines.push(meas ? `• ${meas} ${ing}`.trim() : `• ${ing}`);
  }

  return {
    title,
    ingredients: lines.join("\n"),
    instructions,
    // pakolliset metat pitää silti käyttäjän valita:
    mealType: null,
    mainIngredient: null,
    dietType: [],
    ...(link ? { link } : {}),
    ...(meal?.strMealThumb ? { image: meal.strMealThumb } : {}), // HUOM: tämä on URL
  };
};