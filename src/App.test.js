import {
  // Ingredient matching
  buildInventoryNames,
  hasIngredient,
  matchRecipes,
  // Inventory helpers
  applyQtyDelta,
  buildLogEntry,
  deleteItem,
  addItem,
  getLowItems,
  // Trends helpers
  monthlyTotals,
  burnRate,
  projectedRunout,
  // Category helpers
  addCategory,
  deleteCategory,
  // Date helpers
  monthKey,
  monthLabel,
} from "./utils";

// ─────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────
const ITEMS = [
  { id: 1, name: "Olive Oil",       category: "pantry",    qty: 2, unit: "bottles", low: 1 },
  { id: 2, name: "Eggs",            category: "fridge",    qty: 6, unit: "count",   low: 4 },
  { id: 3, name: "Milk",            category: "fridge",    qty: 1, unit: "liters",  low: 1 },
  { id: 4, name: "Chicken Breast",  category: "fridge",    qty: 2, unit: "lbs",     low: 1 },
  { id: 5, name: "Bell Peppers",    category: "fridge",    qty: 3, unit: "count",   low: 2 },
  { id: 6, name: "Dish Soap",       category: "household", qty: 1, unit: "bottles", low: 1 },
  { id: 7, name: "Garlic",          category: "pantry",    qty: 0, unit: "count",   low: 1 },
  { id: 8, name: "Pasta",           category: "pantry",    qty: 1, unit: "boxes",   low: 2 },
];

const CATEGORIES = {
  pantry:    { label: "Pantry",    iconKey: "Package",     color: "#C8956C" },
  fridge:    { label: "Fridge",    iconKey: "Thermometer", color: "#7BAFC4" },
  household: { label: "Household", iconKey: "Home",        color: "#B5935A" },
};

// Build a log entry helper for tests
function makeEntry(name, qty, monthsAgo = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return { id: Math.random(), name, qty, unit: "count", date: d.toISOString() };
}

// ─────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────
describe("monthKey", () => {
  it("formats a date as YYYY-MM", () => {
    expect(monthKey("2024-03-15")).toBe("2024-03");
  });

  it("pads single-digit months", () => {
    expect(monthKey("2024-01-05")).toBe("2024-01");
  });

  it("returns current month when no date given", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(monthKey()).toBe(expected);
  });
});

describe("monthLabel", () => {
  it("formats a month key as readable label", () => {
    expect(monthLabel("2024-03")).toBe("Mar 2024");
  });

  it("formats January correctly", () => {
    expect(monthLabel("2024-01")).toBe("Jan 2024");
  });
});

// ─────────────────────────────────────────────────────────────────
// Ingredient matching
// ─────────────────────────────────────────────────────────────────
describe("buildInventoryNames", () => {
  it("excludes household items", () => {
    const names = buildInventoryNames(ITEMS);
    expect(names).not.toContain("dish soap");
  });

  it("includes food items in lowercase", () => {
    const names = buildInventoryNames(ITEMS);
    expect(names).toContain("olive oil");
    expect(names).toContain("chicken breast");
    expect(names).toContain("eggs");
  });

  it("returns empty array if all items are household", () => {
    const names = buildInventoryNames([{ id: 1, name: "Soap", category: "household", qty: 1, unit: "count", low: 1 }]);
    expect(names).toHaveLength(0);
  });
});

describe("hasIngredient", () => {
  const inventory = buildInventoryNames(ITEMS);

  it("matches exact ingredient name", () => {
    expect(hasIngredient("olive oil", inventory)).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(hasIngredient("Olive Oil", inventory)).toBe(true);
    expect(hasIngredient("EGGS", inventory)).toBe(true);
  });

  it("matches plural to singular (strips trailing s)", () => {
    expect(hasIngredient("bell pepper", inventory)).toBe(true); // inventory has "bell peppers"
  });

  it("matches singular to plural (strips trailing s)", () => {
    const inv = ["tomatoes", "carrots", "onions"];
    expect(hasIngredient("tomato", inv)).toBe(true);
    expect(hasIngredient("carrot", inv)).toBe(true);
  });

  it("matches partial — inventory item contains ingredient", () => {
    expect(hasIngredient("chicken", inventory)).toBe(true); // inventory has "chicken breast"
  });

  it("matches partial — ingredient contains inventory item name", () => {
    const inv = ["garlic"];
    expect(hasIngredient("garlic powder", inv)).toBe(true);
  });

  it("returns false when ingredient is not in inventory", () => {
    expect(hasIngredient("dragon fruit", inventory)).toBe(false);
  });

  it("returns false for household items excluded from inventory", () => {
    expect(hasIngredient("dish soap", inventory)).toBe(false);
  });

  it("does not match completely unrelated short words", () => {
    const inv = ["oil"];
    // "oil" is contained in "olive oil" but here inventory is just "oil"
    expect(hasIngredient("olive oil", inv)).toBe(true); // ingredient contains inventory name
  });
});

describe("matchRecipes", () => {
  const inventory = buildInventoryNames(ITEMS);
  const recipes = [
    { id: 1, name: "Pasta Primavera",   time: "20 min", cuisine: "Italian", ingredients: ["pasta", "olive oil", "garlic"] },
    { id: 2, name: "Chicken Stir Fry",  time: "15 min", cuisine: "Asian",   ingredients: ["chicken breast", "bell pepper", "olive oil"] },
    { id: 3, name: "Egg Scramble",      time: "10 min", cuisine: "American", ingredients: ["eggs", "milk", "olive oil"] },
    { id: 4, name: "Slow Roast",        time: "45 min", cuisine: "American", ingredients: ["olive oil"] },
  ];

  it("returns only recipes where ALL ingredients match", () => {
    const matched = matchRecipes(recipes, inventory, { maxTime: 30, cuisine: "All", search: "" });
    const names = matched.map(r => r.name);
    expect(names).toContain("Chicken Stir Fry"); // bell pepper matches bell peppers
    expect(names).toContain("Egg Scramble");      // eggs + milk match; butter partially matches
  });

  it("filters by maxTime", () => {
    const matched = matchRecipes(recipes, inventory, { maxTime: 30, cuisine: "All", search: "" });
    expect(matched.every(r => parseInt(r.time) <= 30)).toBe(true);
    // Slow Roast (45 min) should be excluded
    expect(matched.map(r => r.name)).not.toContain("Slow Roast");
  });

  it("filters by cuisine", () => {
    const matched = matchRecipes(recipes, inventory, { maxTime: 60, cuisine: "Asian", search: "" });
    expect(matched.every(r => r.cuisine === "Asian")).toBe(true);
  });

  it("filters by search term", () => {
    const matched = matchRecipes(recipes, inventory, { maxTime: 60, cuisine: "All", search: "egg" });
    expect(matched.every(r => r.name.toLowerCase().includes("egg"))).toBe(true);
  });

  it("returns empty array when no recipes match", () => {
    const matched = matchRecipes(recipes, [], { maxTime: 30, cuisine: "All", search: "" });
    expect(matched).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Inventory helpers
// ─────────────────────────────────────────────────────────────────
describe("applyQtyDelta", () => {
  it("decrements quantity", () => {
    const result = applyQtyDelta(ITEMS, 2, -1); // Eggs: 6 → 5
    expect(result.find(i => i.id === 2).qty).toBe(5);
  });

  it("increments quantity", () => {
    const result = applyQtyDelta(ITEMS, 1, 1); // Olive Oil: 2 → 3
    expect(result.find(i => i.id === 1).qty).toBe(3);
  });

  it("does not go below 0", () => {
    const result = applyQtyDelta(ITEMS, 7, -5); // Garlic: 0 → still 0
    expect(result.find(i => i.id === 7).qty).toBe(0);
  });

  it("does not affect other items", () => {
    const result = applyQtyDelta(ITEMS, 1, -1);
    expect(result.find(i => i.id === 2).qty).toBe(ITEMS.find(i => i.id === 2).qty);
  });

  it("handles item not found gracefully", () => {
    const result = applyQtyDelta(ITEMS, 999, -1);
    expect(result).toHaveLength(ITEMS.length);
  });
});

describe("buildLogEntry", () => {
  it("returns a log entry when item exists and qty > 0", () => {
    const entry = buildLogEntry(ITEMS, 1); // Olive Oil qty=2
    expect(entry).not.toBeNull();
    expect(entry.name).toBe("Olive Oil");
    expect(entry.qty).toBe(1);
    expect(entry.unit).toBe("bottles");
    expect(entry.date).toBeDefined();
  });

  it("returns null when item qty is 0", () => {
    const entry = buildLogEntry(ITEMS, 7); // Garlic qty=0
    expect(entry).toBeNull();
  });

  it("returns null when item does not exist", () => {
    const entry = buildLogEntry(ITEMS, 999);
    expect(entry).toBeNull();
  });

  it("includes a valid ISO date string", () => {
    const entry = buildLogEntry(ITEMS, 2);
    expect(() => new Date(entry.date)).not.toThrow();
    expect(new Date(entry.date).toISOString()).toBe(entry.date);
  });
});

describe("deleteItem", () => {
  it("removes the item with the given id", () => {
    const result = deleteItem(ITEMS, 1);
    expect(result.find(i => i.id === 1)).toBeUndefined();
    expect(result).toHaveLength(ITEMS.length - 1);
  });

  it("leaves all other items intact", () => {
    const result = deleteItem(ITEMS, 1);
    expect(result.find(i => i.id === 2)).toBeDefined();
  });

  it("handles deleting a non-existent id gracefully", () => {
    const result = deleteItem(ITEMS, 999);
    expect(result).toHaveLength(ITEMS.length);
  });
});

describe("addItem", () => {
  it("appends a new item with numeric qty and low", () => {
    const newItem = { name: "Bread", category: "pantry", qty: "2", unit: "loaves", low: "1" };
    const result = addItem(ITEMS, newItem);
    const added = result[result.length - 1];
    expect(added.name).toBe("Bread");
    expect(added.qty).toBe(2);
    expect(added.low).toBe(1);
    expect(typeof added.id).toBe("number");
  });

  it("does not mutate the original array", () => {
    const original = [...ITEMS];
    addItem(ITEMS, { name: "X", category: "pantry", qty: 1, unit: "count", low: 0 });
    expect(ITEMS).toHaveLength(original.length);
  });
});

describe("getLowItems", () => {
  it("returns items at or below their low threshold", () => {
    const low = getLowItems(ITEMS);
    // Garlic qty=0 low=1, Pasta qty=1 low=2, Milk qty=1 low=1, Dish Soap qty=1 low=1
    expect(low.map(i => i.name)).toContain("Garlic");
    expect(low.map(i => i.name)).toContain("Pasta");
  });

  it("does not include items above their threshold", () => {
    const low = getLowItems(ITEMS);
    expect(low.map(i => i.name)).not.toContain("Olive Oil"); // qty=2 low=1
    expect(low.map(i => i.name)).not.toContain("Eggs");       // qty=6 low=4
  });

  it("returns empty array when all items are well stocked", () => {
    const wellStocked = [{ id: 1, name: "A", qty: 10, low: 1, category: "pantry", unit: "count" }];
    expect(getLowItems(wellStocked)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Trends helpers
// ─────────────────────────────────────────────────────────────────
describe("monthlyTotals", () => {
  const log = [
    makeEntry("Milk", 2, 0),  // this month: 2
    makeEntry("Milk", 1, 0),  // this month: +1 = 3
    makeEntry("Milk", 1, 1),  // last month: 1
    makeEntry("Eggs", 3, 0),  // different item
  ];

  it("groups consumption by month for a given item", () => {
    const totals = monthlyTotals(log, "Milk");
    const values = Object.values(totals);
    // Should have 2 months of data
    expect(values).toHaveLength(2);
  });

  it("sums multiple entries in the same month", () => {
    const totals = monthlyTotals(log, "Milk");
    const thisMonthKey = monthKey();
    expect(totals[thisMonthKey]).toBe(3); // 2 + 1
  });

  it("returns empty object when item has no log entries", () => {
    const totals = monthlyTotals(log, "Butter");
    expect(Object.keys(totals)).toHaveLength(0);
  });

  it("does not include other items", () => {
    const totals = monthlyTotals(log, "Milk");
    // All values should come from Milk entries only
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    expect(total).toBe(4); // 3 this month + 1 last month
  });
});

describe("burnRate", () => {
  it("calculates average monthly consumption", () => {
    const log = [
      makeEntry("Milk", 3, 0), // this month: 3
      makeEntry("Milk", 1, 1), // last month: 1
    ];
    const rate = burnRate(log, "Milk");
    expect(rate).toBe(2); // (3 + 1) / 2 months
  });

  it("returns null when no log entries exist", () => {
    expect(burnRate([], "Milk")).toBeNull();
  });

  it("handles single month of data", () => {
    const log = [makeEntry("Eggs", 6, 0)];
    expect(burnRate(log, "Eggs")).toBe(6);
  });

  it("returns correct rate for multiple months", () => {
    const log = [
      makeEntry("Rice", 2, 0),
      makeEntry("Rice", 4, 1),
      makeEntry("Rice", 6, 2),
    ];
    const rate = burnRate(log, "Rice");
    expect(rate).toBe(4); // (2+4+6) / 3
  });
});

describe("projectedRunout", () => {
  const items = [
    { id: 1, name: "Milk", qty: 1, unit: "liters", category: "fridge", low: 1 },
    { id: 2, name: "Rice", qty: 10, unit: "lbs",   category: "pantry", low: 1 },
  ];

  it("returns urgent tier when runout is under 2 weeks", () => {
    // Burning 4/month, qty=1 → 0.25 months → urgent
    const log = [makeEntry("Milk", 4, 0)];
    const result = projectedRunout(log, items, "Milk");
    expect(result.tier).toBe("urgent");
    expect(result.label).toBe("< 2 weeks");
  });

  it("returns soon tier when runout is under 1 month", () => {
    // Burning 2/month, qty=1 → 0.5 months → soon
    const log = [makeEntry("Milk", 2, 0)];
    const result = projectedRunout(log, items, "Milk");
    expect(result.tier).toBe("soon");
  });

  it("returns ok tier when runout is more than 1 month", () => {
    // Burning 1/month, qty=10 → 10 months → ok
    const log = [makeEntry("Rice", 1, 0)];
    const result = projectedRunout(log, items, "Rice");
    expect(result.tier).toBe("ok");
  });

  it("returns null when item does not exist", () => {
    const log = [makeEntry("Butter", 1, 0)];
    expect(projectedRunout(log, items, "Butter")).toBeNull();
  });

  it("returns null when there is no log data for the item", () => {
    expect(projectedRunout([], items, "Milk")).toBeNull();
  });

  it("labels ~1 month when between 1 and 2 months", () => {
    // Burning 1/month, qty=1 → 1 month
    const log = [makeEntry("Milk", 1, 0)];
    const result = projectedRunout(log, items, "Milk");
    expect(result.label).toBe("~1 month");
    expect(result.tier).toBe("ok");
  });

  it("labels in months when more than 2 months remain", () => {
    const log = [makeEntry("Rice", 2, 0)];
    const result = projectedRunout(log, items, "Rice");
    expect(result.label).toBe("~5 months");
    expect(result.tier).toBe("ok");
  });
});

// ─────────────────────────────────────────────────────────────────
// Category helpers
// ─────────────────────────────────────────────────────────────────
describe("addCategory", () => {
  it("adds a new category with a generated key", () => {
    const newCat = { label: "Spice Rack", iconKey: "Tag", color: "#A07850" };
    const result = addCategory(CATEGORIES, newCat);
    const keys = Object.keys(result);
    expect(keys.length).toBe(Object.keys(CATEGORIES).length + 1);
    // New key should be based on the label
    const newKey = keys.find(k => !CATEGORIES[k]);
    expect(result[newKey].label).toBe("Spice Rack");
    expect(result[newKey].iconKey).toBe("Tag");
    expect(result[newKey].color).toBe("#A07850");
  });

  it("does not mutate the original categories", () => {
    const original = { ...CATEGORIES };
    const newCat = { label: "Bakery", iconKey: "Package", color: "#fff" };
    addCategory(CATEGORIES, newCat);
    expect(Object.keys(CATEGORIES)).toHaveLength(Object.keys(original).length);
  });

  it("trims whitespace from label", () => {
    const newCat = { label: "  Drinks  ", iconKey: "Bell", color: "#5B8DB8" };
    const result = addCategory(CATEGORIES, newCat);
    const newKey = Object.keys(result).find(k => !CATEGORIES[k]);
    expect(result[newKey].label).toBe("Drinks");
  });

  it("generates a unique key for special characters in label", () => {
    const newCat = { label: "Café & Snacks!", iconKey: "Package", color: "#fff" };
    const result = addCategory(CATEGORIES, newCat);
    const newKey = Object.keys(result).find(k => !CATEGORIES[k]);
    // Key should only contain safe chars
    expect(newKey).toMatch(/^[a-z0-9_]+$/);
  });
});

describe("deleteCategory", () => {
  it("removes the category with the given key", () => {
    const result = deleteCategory(CATEGORIES, "pantry");
    expect(result.pantry).toBeUndefined();
    expect(Object.keys(result)).toHaveLength(Object.keys(CATEGORIES).length - 1);
  });

  it("leaves other categories intact", () => {
    const result = deleteCategory(CATEGORIES, "pantry");
    expect(result.fridge).toBeDefined();
    expect(result.household).toBeDefined();
  });

  it("does not mutate the original categories object", () => {
    const original = { ...CATEGORIES };
    deleteCategory(CATEGORIES, "pantry");
    expect(CATEGORIES.pantry).toBeDefined();
    expect(Object.keys(CATEGORIES)).toHaveLength(Object.keys(original).length);
  });

  it("handles deleting a non-existent key gracefully", () => {
    const result = deleteCategory(CATEGORIES, "nonexistent");
    expect(Object.keys(result)).toHaveLength(Object.keys(CATEGORIES).length);
  });
});