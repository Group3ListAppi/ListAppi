export type MealDbMeal = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
};

const BASE = "https://www.themealdb.com/api/json/v1/1";

export async function fetchRandomMeals(count = 6): Promise<MealDbMeal[]> {
  const reqs = Array.from({ length: count }, async () => {
    const res = await fetch(`${BASE}/random.php`);
    if (!res.ok) throw new Error(`TheMealDB random failed: ${res.status}`);
    const json = await res.json();
    return json?.meals?.[0] as MealDbMeal | undefined;
  });

  const results = await Promise.all(reqs);
  // poista undefinedit ja duplikaatit (randomissa voi tulla sama resepti)
  const unique = new Map<string, MealDbMeal>();
  for (const m of results) {
    if (m?.idMeal) unique.set(m.idMeal, m);
  }
  return Array.from(unique.values()).slice(0, count);
}