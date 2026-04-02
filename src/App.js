import { useState, useCallback } from "react";
import {
  Package, Thermometer, Wind, Home, ShoppingCart, UtensilsCrossed,
  Plus, Minus, Trash2, Search, X, Bell, AlertTriangle, CheckCircle2,
  ChefHat, Clock, RefreshCw, PartyPopper, ShoppingBag, Sparkles
} from "lucide-react";

const CATEGORIES = {
  pantry:    { label: "Pantry",    Icon: Package,          color: "#C8956C" },
  fridge:    { label: "Fridge",    Icon: Thermometer,      color: "#7BAFC4" },
  freezer:   { label: "Freezer",   Icon: Wind,             color: "#9BC4CB" },
  household: { label: "Household", Icon: Home,             color: "#B5935A" },
};

const UNITS = ["oz", "lbs", "cups", "liters", "ml", "count", "bags", "boxes", "cans", "bottles"];

const INITIAL_ITEMS = [
  { id: 1,  name: "Olive Oil",       category: "pantry",    qty: 1, unit: "bottles", low: 1 },
  { id: 2,  name: "Pasta",           category: "pantry",    qty: 3, unit: "boxes",   low: 1 },
  { id: 3,  name: "Canned Tomatoes", category: "pantry",    qty: 4, unit: "cans",    low: 2 },
  { id: 4,  name: "Rice",            category: "pantry",    qty: 2, unit: "lbs",     low: 1 },
  { id: 5,  name: "Eggs",            category: "fridge",    qty: 6, unit: "count",   low: 4 },
  { id: 6,  name: "Milk",            category: "fridge",    qty: 1, unit: "liters",  low: 1 },
  { id: 7,  name: "Cheddar Cheese",  category: "fridge",    qty: 1, unit: "lbs",     low: 0 },
  { id: 8,  name: "Chicken Breast",  category: "freezer",   qty: 2, unit: "lbs",     low: 1 },
  { id: 9,  name: "Paper Towels",    category: "household", qty: 2, unit: "count",   low: 1 },
  { id: 10, name: "Dish Soap",       category: "household", qty: 1, unit: "bottles", low: 1 },
  { id: 11, name: "Garlic",          category: "pantry",    qty: 1, unit: "count",   low: 1 },
  { id: 12, name: "Onions",          category: "pantry",    qty: 3, unit: "count",   low: 2 },
  { id: 13, name: "Butter",          category: "fridge",    qty: 2, unit: "count",   low: 1 },
  { id: 14, name: "Parmesan",        category: "fridge",    qty: 1, unit: "count",   low: 0 },
];

const FONT      = `'Lora', serif`;
const FONT_BODY = `'Source Sans 3', sans-serif`;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #FDF6EE; font-family: ${FONT_BODY}; color: #3D2B1F; min-height: 100vh; }

  .app { max-width: 430px; margin: 0 auto; min-height: 100vh; background: #FDF6EE; position: relative; overflow-x: hidden; }

  /* Header */
  .header { background: #3D2B1F; padding: 20px 20px 16px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(61,43,31,0.18); }
  .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .header h1 { font-family: ${FONT}; font-size: 22px; color: #F5E6D3; font-weight: 700; letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px; }
  .header h1 span { color: #C8956C; font-style: italic; }
  .low-badge { display: flex; align-items: center; gap: 5px; background: #E07B39; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; font-family: ${FONT_BODY}; }

  /* Tabs */
  .tabs { display: flex; gap: 4px; }
  .tab { flex: 1; padding: 8px 4px; border: none; background: transparent; color: #9E8070; font-size: 11px; font-family: ${FONT_BODY}; font-weight: 500; cursor: pointer; border-radius: 8px; transition: all 0.2s; letter-spacing: 0.3px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .tab.active { background: #C8956C; color: #fff; }

  /* Content */
  .content { padding: 16px; padding-bottom: 88px; }

  /* Category */
  .category-section { margin-bottom: 20px; }
  .category-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .category-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .category-header h2 { font-family: ${FONT}; font-size: 16px; font-weight: 600; color: #3D2B1F; }
  .cat-count { font-size: 11px; color: #9E8070; font-family: ${FONT_BODY}; margin-left: auto; }

  /* Item cards */
  .item-card { background: #fff; border-radius: 14px; padding: 12px 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(61,43,31,0.07); border: 1.5px solid transparent; transition: border-color 0.2s; }
  .item-card.low { border-color: #E07B39; background: #FFF8F3; }
  .item-info { flex: 1; min-width: 0; }
  .item-name { font-size: 15px; font-weight: 500; color: #3D2B1F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item-meta { font-size: 12px; color: #9E8070; margin-top: 3px; display: flex; align-items: center; gap: 4px; }
  .item-meta.low-text { color: #E07B39; font-weight: 500; }

  /* Qty controls */
  .qty-controls { display: flex; align-items: center; gap: 8px; }
  .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .qty-btn.minus { background: #F0E8DF; color: #7A5C45; }
  .qty-btn.minus:hover { background: #E5D5C6; }
  .qty-btn.plus { background: #C8956C; color: #fff; }
  .qty-btn.plus:hover { background: #B5804F; }
  .qty-num { font-size: 15px; font-weight: 600; color: #3D2B1F; min-width: 20px; text-align: center; }
  .unit-label { font-size: 12px; color: #9E8070; min-width: 32px; text-align: center; }
  .delete-btn { background: none; border: none; cursor: pointer; color: #C4A98A; padding: 2px 4px; transition: color 0.15s; display: flex; align-items: center; }
  .delete-btn:hover { color: #C0392B; }

  /* FAB */
  .add-fab { position: fixed; bottom: 88px; right: calc(50% - 215px + 16px); width: 52px; height: 52px; border-radius: 50%; background: #3D2B1F; color: #F5E6D3; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(61,43,31,0.3); display: flex; align-items: center; justify-content: center; transition: transform 0.2s, background 0.2s; z-index: 50; }
  .add-fab:hover { transform: scale(1.08); background: #5A3E2B; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(61,43,31,0.45); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  .modal { background: #FDF6EE; border-radius: 24px 24px 0 0; padding: 24px 20px 40px; width: 100%; max-width: 430px; animation: slideUp 0.28s ease; }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal h3 { font-family: ${FONT}; font-size: 20px; color: #3D2B1F; margin-bottom: 18px; font-weight: 700; }
  .form-row { margin-bottom: 14px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; color: #7A5C45; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input, .form-select { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid #E5D5C6; background: #fff; font-size: 15px; color: #3D2B1F; font-family: ${FONT_BODY}; outline: none; transition: border-color 0.2s; }
  .form-input:focus, .form-select:focus { border-color: #C8956C; }
  .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .btn-row { display: flex; gap: 10px; margin-top: 20px; }
  .btn { flex: 1; padding: 13px; border-radius: 12px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; font-family: ${FONT_BODY}; transition: all 0.18s; }
  .btn-primary { background: #3D2B1F; color: #F5E6D3; }
  .btn-primary:hover { background: #5A3E2B; }
  .btn-secondary { background: #F0E8DF; color: #7A5C45; }
  .btn-secondary:hover { background: #E5D5C6; }

  /* Shopping */
  .section-title { font-family: ${FONT}; font-size: 18px; font-weight: 700; color: #3D2B1F; margin-bottom: 4px; }
  .section-sub { font-size: 13px; color: #9E8070; margin-bottom: 16px; }
  .shop-item { background: #fff; border-radius: 14px; padding: 13px 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(61,43,31,0.07); cursor: pointer; transition: opacity 0.18s; }
  .shop-item.checked { opacity: 0.5; }
  .shop-check { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #C8956C; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; color: transparent; }
  .shop-item.checked .shop-check { background: #C8956C; border-color: #C8956C; color: #fff; }
  .shop-item-info { flex: 1; }
  .shop-item-name { font-size: 15px; font-weight: 500; color: #3D2B1F; }
  .shop-item.checked .shop-item-name { text-decoration: line-through; color: #9E8070; }
  .shop-item-cat { font-size: 12px; color: #9E8070; margin-top: 2px; display: flex; align-items: center; gap: 4px; }

  /* Empty state */
  .empty-state { text-align: center; padding: 40px 20px; color: #9E8070; }
  .empty-icon { width: 64px; height: 64px; border-radius: 50%; background: #F0E8DF; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: #C8956C; }
  .empty-state p { font-size: 15px; line-height: 1.5; }

  .clear-btn { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #E5D5C6; background: transparent; color: #9E8070; font-size: 14px; font-weight: 500; cursor: pointer; font-family: ${FONT_BODY}; margin-top: 8px; transition: all 0.18s; }
  .clear-btn:hover { background: #F0E8DF; color: #7A5C45; }

  /* Meals */
  .meal-intro { background: linear-gradient(135deg, #3D2B1F 0%, #6B4226 100%); border-radius: 18px; padding: 18px; margin-bottom: 18px; color: #F5E6D3; }
  .meal-intro-header { font-family: ${FONT}; font-size: 17px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
  .meal-intro p { font-size: 13px; opacity: 0.8; margin-bottom: 12px; line-height: 1.5; }
  .meal-btn { background: #C8956C; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: ${FONT_BODY}; transition: background 0.18s; display: flex; align-items: center; gap: 8px; }
  .meal-btn:hover { background: #B5804F; }
  .meal-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .meal-card { background: #fff; border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 6px rgba(61,43,31,0.09); animation: fadeIn 0.4s ease both; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .meal-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
  .meal-name { font-family: ${FONT}; font-size: 17px; font-weight: 600; color: #3D2B1F; line-height: 1.3; }
  .meal-time { display: flex; align-items: center; gap: 4px; background: #F0E8DF; color: #7A5C45; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .meal-desc { font-size: 13px; color: #7A5C45; line-height: 1.5; margin-bottom: 10px; }
  .meal-ingredients { display: flex; flex-wrap: wrap; gap: 5px; }
  .ingredient-tag { background: #FDF6EE; border: 1px solid #E5D5C6; color: #7A5C45; font-size: 11px; padding: 3px 8px; border-radius: 20px; font-weight: 500; }

  .loading-dots { display: flex; gap: 6px; justify-content: center; padding: 30px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #C8956C; animation: bounce 1.2s infinite; }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }

  /* Alerts banner */
  .alerts-banner { background: linear-gradient(135deg, #E07B39, #C85E20); border-radius: 14px; padding: 14px 16px; margin-bottom: 16px; color: #fff; }
  .alerts-banner-header { display: flex; align-items: center; gap: 7px; font-family: ${FONT}; font-size: 15px; font-weight: 600; margin-bottom: 8px; }
  .alert-items { display: flex; flex-wrap: wrap; gap: 5px; }
  .alert-tag { background: rgba(255,255,255,0.2); font-size: 12px; padding: 3px 9px; border-radius: 20px; font-weight: 500; }

  /* Search */
  .search-bar { background: #F0E8DF; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: #B5935A; }
  .search-bar input { flex: 1; background: none; border: none; outline: none; font-size: 15px; color: #3D2B1F; font-family: ${FONT_BODY}; }
  .search-bar input::placeholder { color: #B5935A; }
  .search-clear { background: none; border: none; cursor: pointer; color: #B5935A; display: flex; align-items: center; }

  /* Bottom nav */
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; background: #fff; border-top: 1.5px solid #EDE0D4; display: flex; padding: 8px 0 16px; z-index: 100; }
  .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; border: none; background: none; cursor: pointer; padding: 6px 4px; transition: all 0.18s; color: #C4A98A; }
  .nav-btn.active { color: #3D2B1F; }
  .nav-btn.active svg { transform: scale(1.12); }
  .nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; font-family: ${FONT_BODY}; }
`;

// ── Meal Suggestions ──────────────────────────────────────────────
function MealSuggestions({ items }) {
  const [meals, setMeals]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const inventoryStr = items
    .filter(i => i.category !== "household")
    .map(i => `${i.name} (${i.qty} ${i.unit})`)
    .join(", ");

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    setMeals([]);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `I have these ingredients: ${inventoryStr}. Suggest 4 meals I can make with what I have. Respond ONLY with a JSON array, no markdown, no preamble. Each meal object: { "name": string, "time": string like "20 min", "description": string (1 sentence), "ingredients": string[] (only items from my list) }`
          }]
        })
      });
      const data  = await response.json();
      const text  = data.content.map(b => b.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setMeals(JSON.parse(clean));
      setFetched(true);
    } catch {
      setMeals([{ name: "Couldn't load suggestions", time: "", description: "Please try again in a moment.", ingredients: [] }]);
    }
    setLoading(false);
  }, [inventoryStr]);

  const foodCount = items.filter(i => i.category !== "household").length;

  return (
    <div>
      <div className="meal-intro">
        <div className="meal-intro-header">
          <ChefHat size={20} />
          What's for dinner?
        </div>
        <p>Based on {foodCount} food items in your pantry, fridge &amp; freezer.</p>
        <button className="meal-btn" onClick={fetchMeals} disabled={loading}>
          {loading
            ? <><RefreshCw size={15} className="spin" /> Thinking…</>
            : fetched
              ? <><RefreshCw size={15} /> Refresh ideas</>
              : <><Sparkles size={15} /> Suggest meals</>
          }
        </button>
      </div>

      {loading && (
        <div className="loading-dots">
          <div className="dot" /><div className="dot" /><div className="dot" />
        </div>
      )}

      {meals.map((meal, i) => (
        <div className="meal-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="meal-card-header">
            <div className="meal-name">{meal.name}</div>
            {meal.time && (
              <div className="meal-time"><Clock size={11} />{meal.time}</div>
            )}
          </div>
          <div className="meal-desc">{meal.description}</div>
          <div className="meal-ingredients">
            {(meal.ingredients || []).map((ing, j) => (
              <span className="ingredient-tag" key={j}>{ing}</span>
            ))}
          </div>
        </div>
      ))}

      {!loading && !fetched && (
        <div className="empty-state">
          <div className="empty-icon"><ChefHat size={28} /></div>
          <p>Tap the button above and I'll figure out what you can cook with what you've got.</p>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]               = useState("inventory");
  const [items, setItems]           = useState(INITIAL_ITEMS);
  const [showAdd, setShowAdd]       = useState(false);
  const [search, setSearch]         = useState("");
  const [shopChecked, setShopChecked] = useState({});
  const [newItem, setNewItem]       = useState({ name: "", category: "pantry", qty: 1, unit: "count", low: 1 });

  const lowItems  = items.filter(i => i.qty <= i.low);
  const shopItems = lowItems;

  const updateQty  = (id, delta) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i));
  const deleteItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const addItem = () => {
    if (!newItem.name.trim()) return;
    setItems(prev => [...prev, { ...newItem, id: Date.now(), qty: Number(newItem.qty), low: Number(newItem.low) }]);
    setNewItem({ name: "", category: "pantry", qty: 1, unit: "count", low: 1 });
    setShowAdd(false);
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const grouped = Object.keys(CATEGORIES).reduce((acc, cat) => {
    acc[cat] = filteredItems.filter(i => i.category === cat);
    return acc;
  }, {});

  const toggleShop   = (id) => setShopChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const clearChecked = () => setShopChecked({});

  const NAV = [
    { key: "inventory", Icon: Package,           label: "Inventory" },
    { key: "shopping",  Icon: ShoppingCart,       label: "Shopping"  },
    { key: "meals",     Icon: UtensilsCrossed,    label: "Meals"     },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Header */}
        <div className="header">
          <div className="header-top">
            <h1>
              <Home size={20} color="#C8956C" />
              Home <span>Pantry</span>
            </h1>
            {lowItems.length > 0 && (
              <div className="low-badge">
                <AlertTriangle size={12} />
                {lowItems.length} running low
              </div>
            )}
          </div>
          <div className="tabs">
            {NAV.map(({ key, Icon, label }) => (
              <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>

        <div className="content">

          {/* INVENTORY */}
          {tab === "inventory" && (
            <>
              {lowItems.length > 0 && (
                <div className="alerts-banner">
                  <div className="alerts-banner-header"><Bell size={16} />Running low</div>
                  <div className="alert-items">
                    {lowItems.map(i => <span className="alert-tag" key={i.id}>{i.name}</span>)}
                  </div>
                </div>
              )}

              <div className="search-bar">
                <Search size={16} />
                <input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
                {search && (
                  <button className="search-clear" onClick={() => setSearch("")}><X size={16} /></button>
                )}
              </div>

              {Object.entries(CATEGORIES).map(([catKey, cat]) => {
                const catItems = grouped[catKey];
                if (!catItems.length) return null;
                return (
                  <div className="category-section" key={catKey}>
                    <div className="category-header">
                      <div className="category-icon" style={{ background: cat.color + "22" }}>
                        <cat.Icon size={16} color={cat.color} />
                      </div>
                      <h2>{cat.label}</h2>
                      <span className="cat-count">{catItems.length} items</span>
                    </div>
                    {catItems.map(item => {
                      const isLow = item.qty <= item.low;
                      return (
                        <div className={`item-card ${isLow ? "low" : ""}`} key={item.id}>
                          <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className={`item-meta ${isLow ? "low-text" : ""}`}>
                              {isLow ? <><AlertTriangle size={11} />Running low</> : `Min: ${item.low} ${item.unit}`}
                            </div>
                          </div>
                          <div className="qty-controls">
                            <button className="qty-btn minus" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                            <span className="qty-num">{item.qty}</span>
                            <button className="qty-btn plus" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                          </div>
                          <span className="unit-label">{item.unit}</span>
                          <button className="delete-btn" onClick={() => deleteItem(item.id)}><Trash2 size={15} /></button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}

          {/* SHOPPING */}
          {tab === "shopping" && (
            <>
              <div className="section-title">Shopping List</div>
              <div className="section-sub">
                {shopItems.length > 0
                  ? `${shopItems.length} items running low — auto-generated from your inventory`
                  : "Your pantry is well stocked!"}
              </div>

              {shopItems.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon"><PartyPopper size={28} /></div>
                  <p>Nothing to buy right now. All your items are above their minimum levels.</p>
                </div>
              )}

              {shopItems.map(item => {
                const { Icon: CatIcon, color, label } = CATEGORIES[item.category];
                const checked = shopChecked[item.id];
                return (
                  <div key={item.id} className={`shop-item ${checked ? "checked" : ""}`} onClick={() => toggleShop(item.id)}>
                    <div className="shop-check">
                      {checked && <CheckCircle2 size={14} />}
                    </div>
                    <div className="shop-item-info">
                      <div className="shop-item-name">{item.name}</div>
                      <div className="shop-item-cat">
                        <CatIcon size={12} color={color} />{label} · {item.qty} {item.unit} left
                      </div>
                    </div>
                    <ShoppingBag size={16} color="#C4A98A" />
                  </div>
                );
              })}

              {Object.values(shopChecked).some(Boolean) && (
                <button className="clear-btn" onClick={clearChecked}>Clear checked items</button>
              )}
            </>
          )}

          {/* MEALS */}
          {tab === "meals" && <MealSuggestions items={items} />}
        </div>

        {/* FAB */}
        {tab === "inventory" && (
          <button className="add-fab" onClick={() => setShowAdd(true)}><Plus size={24} /></button>
        )}

        {/* Add Item Modal */}
        {showAdd && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
            <div className="modal">
              <h3>Add Item</h3>
              <div className="form-row">
                <label className="form-label">Item Name</label>
                <input className="form-input" placeholder="e.g. Olive Oil" value={newItem.name}
                  onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-row">
                <label className="form-label">Category</label>
                <select className="form-select" value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="form-row-2">
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" min="0" value={newItem.qty}
                    onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))} />
                </div>
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 14 }}>
                <label className="form-label">Low Stock Alert When Below</label>
                <input className="form-input" type="number" min="0" value={newItem.low}
                  onChange={e => setNewItem(p => ({ ...p, low: e.target.value }))} />
              </div>
              <div className="btn-row">
                <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addItem}>Add Item</button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <div className="bottom-nav">
          {NAV.map(({ key, Icon, label }) => (
            <button key={key} className={`nav-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              <Icon size={22} />
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </div>

      </div>
    </>
  );
}
