export type MealDbMeal = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
};

// Kevyt listatyyppi (filter.php palauttaa vain nämä)
export type MealDbListItem = MealDbMeal;

export type MealDbFilterMode = "category" | "area" | "ingredient";

const BASE = "https://www.themealdb.com/api/json/v1/1";

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheMealDB failed: ${res.status} ${url}`);
  return res.json();
}

export async function fetchRandomMeals(count = 6): Promise<MealDbMeal[]> {
  const reqs = Array.from({ length: count }, async () => {
    const json = await fetchJson(`${BASE}/random.php`);
    return json?.meals?.[0] as MealDbMeal | undefined;
  });

  const results = await Promise.all(reqs);
  const unique = new Map<string, MealDbMeal>();
  for (const m of results) {
    if (m?.idMeal) unique.set(m.idMeal, m);
  }
  return Array.from(unique.values()).slice(0, count);
}

// --------- UUSI: nimi-haku ---------
export async function searchMealsByName(query: string): Promise<MealDbListItem[]> {
  const q = query.trim();
  if (!q) return [];

  const json = await fetchJson(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
  const meals = (json?.meals ?? null) as any[] | null;
  if (!meals) return [];

  return meals
    .map((m) => ({
      idMeal: String(m.idMeal),
      strMeal: String(m.strMeal ?? ""),
      strMealThumb: String(m.strMealThumb ?? ""),
    }))
    .filter((m) => m.idMeal && m.strMeal);
}

// --------- UUSI: filter.php (yksi suodatin kerrallaan) ---------
export async function filterMeals(
  mode: MealDbFilterMode,
  value: string
): Promise<MealDbListItem[]> {
  const v = value.trim();
  if (!v) return [];

  const param = mode === "category" ? "c" : mode === "area" ? "a" : "i";
  const json = await fetchJson(`${BASE}/filter.php?${param}=${encodeURIComponent(v)}`);
  const meals = (json?.meals ?? null) as any[] | null;
  if (!meals) return [];

  return meals
    .map((m) => ({
      idMeal: String(m.idMeal),
      strMeal: String(m.strMeal ?? ""),
      strMealThumb: String(m.strMealThumb ?? ""),
    }))
    .filter((m) => m.idMeal && m.strMeal);
}

// --------- UUSI: list.php?c/a/i=list ---------
export async function listFilterValues(mode: MealDbFilterMode): Promise<string[]> {
  const param = mode === "category" ? "c" : mode === "area" ? "a" : "i";
  const json = await fetchJson(`${BASE}/list.php?${param}=list`);

  const key =
    mode === "category" ? "strCategory" : mode === "area" ? "strArea" : "strIngredient";

  const arr: string[] = Array.isArray(json?.meals)
    ? json.meals.map((x: any) => String(x?.[key] ?? "").trim()).filter(Boolean)
    : [];

  // uniikit + aakkosjärjestys
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}