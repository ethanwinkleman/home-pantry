// ── Pure utility functions ────────────────────────────────────────
// Extracted so they can be unit tested independently of React components.

// ── Date helpers ─────────────────────────────────────────────────
export function monthKey(date) {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// ── Ingredient matching ───────────────────────────────────────────
/**
 * Build a normalised list of inventory ingredient names from items,
 * excluding household items which are never used in recipes.
 */
export function buildInventoryNames(items) {
  return items
    .filter((i) => i.category !== "household")
    .map((i) => i.name.toLowerCase());
}

/**
 * Fuzzy ingredient match.
 * Returns true if any inventory item name contains the recipe ingredient
 * or the recipe ingredient contains the inventory item name.
 * Strips trailing "s" to handle simple pluralisation.
 */
export function hasIngredient(ing, inventoryNames) {
  const ingL = ing.toLowerCase().replace(/s$/, "");
  return inventoryNames.some((name) => {
    const nameL = name.replace(/s$/, "");
    return nameL.includes(ingL) || ingL.includes(nameL);
  });
}

/**
 * Filter recipes against the current inventory.
 * All ingredients must fuzzy-match an inventory item.
 */
export function matchRecipes(recipes, inventoryNames, { maxTime, cuisine, search }) {
  return recipes.filter((r) => {
    const timeNum = parseInt(r.time);
    if (timeNum > maxTime) return false;
    if (cuisine !== "All" && r.cuisine !== cuisine) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return r.ingredients.every((ing) => hasIngredient(ing, inventoryNames));
  });
}

// ── Inventory helpers ─────────────────────────────────────────────
/**
 * Update the quantity of an item by delta.
 * Returns the new items array. Never goes below 0.
 */
export function applyQtyDelta(items, id, delta) {
  return items.map((i) =>
    i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i
  );
}

/**
 * Build a consumption log entry when an item is decremented.
 * Returns null if the item doesn't exist or qty is already 0.
 */
export function buildLogEntry(items, id) {
  const item = items.find((i) => i.id === id);
  if (!item || item.qty <= 0) return null;
  return {
    id: Date.now(),
    name: item.name,
    qty: 1,
    unit: item.unit,
    date: new Date().toISOString(),
  };
}

/**
 * Delete an item by id. Returns the filtered array.
 */
export function deleteItem(items, id) {
  return items.filter((i) => i.id !== id);
}

/**
 * Add a new item to the items array.
 * Converts qty and low to numbers.
 */
export function addItem(items, newItem) {
  return [
    ...items,
    {
      ...newItem,
      id: Date.now(),
      qty: Number(newItem.qty),
      low: Number(newItem.low),
    },
  ];
}

/**
 * Returns items that are at or below their low threshold.
 */
export function getLowItems(items) {
  return items.filter((i) => i.qty <= i.low);
}

// ── Trends helpers ────────────────────────────────────────────────
/**
 * Build a map of { monthKey -> total qty consumed } for a named item.
 */
export function monthlyTotals(log, name) {
  const entries = log.filter((e) => e.name === name);
  const map = {};
  entries.forEach((e) => {
    const k = monthKey(e.date);
    map[k] = (map[k] || 0) + e.qty;
  });
  return map;
}

/**
 * Calculate average units consumed per month for a named item.
 * Returns null if no data.
 */
export function burnRate(log, name) {
  const totals = monthlyTotals(log, name);
  const vals = Object.values(totals);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Project when an item will run out based on current qty and burn rate.
 * Returns { label, tier } or null if no data.
 */
export function projectedRunout(log, items, name) {
  const item = items.find((i) => i.name === name);
  if (!item) return null;
  const rate = burnRate(log, name);
  if (!rate) return null;
  const months = item.qty / rate;
  if (months < 0.5) return { label: "< 2 weeks", tier: "urgent" };
  if (months < 1) return { label: `~${Math.round(months * 30)} days`, tier: "soon" };
  return { label: months < 2 ? "~1 month" : `~${Math.round(months)} months`, tier: "ok" };
}

/**
 * Add a new category. Generates a unique key from the label.
 */
export function addCategory(categories, newCat) {
  const key =
    newCat.label.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
  return {
    ...categories,
    [key]: {
      label: newCat.label.trim(),
      iconKey: newCat.iconKey,
      color: newCat.color,
    },
  };
}

/**
 * Delete a category by key. Returns the new categories object.
 */
export function deleteCategory(categories, key) {
  const next = { ...categories };
  delete next[key];
  return next;
}
