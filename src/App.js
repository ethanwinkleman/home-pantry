import { useState, useEffect, useRef, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { RECIPES as RECIPES_DATA } from "./recipes";

import {
  Package, Thermometer, Wind, Home, ShoppingCart, UtensilsCrossed,
  Plus, Minus, Trash2, Search, X, Bell, AlertTriangle, CheckCircle2,
  ChefHat, Clock, PartyPopper, ShoppingBag, Sparkles,
  TrendingDown, BarChart2, Calendar, Filter, ChevronDown, FolderPlus, Tag,
  Settings, RotateCcw, Zap, AlertOctagon, Info, BookOpen, Users,
  Heart, PenLine, ClipboardList
} from "lucide-react";

// ── Firebase ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDB6Ee49nhAu-ca9r1OABY-0Y8YHirRR7Y",
  authDomain: "home-pantry-f1f52.firebaseapp.com",
  projectId: "home-pantry-f1f52",
  storageBucket: "home-pantry-f1f52.firebasestorage.app",
  messagingSenderId: "544293545",
  appId: "1:544293545:web:af600cc0029877e6cd9fb8"
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

// ── Constants ─────────────────────────────────────────────────────
const ICON_OPTIONS = [
  { key: "Package",     Icon: Package     },
  { key: "Thermometer", Icon: Thermometer },
  { key: "Wind",        Icon: Wind        },
  { key: "Home",        Icon: Home        },
  { key: "ShoppingBag", Icon: ShoppingBag },
  { key: "ChefHat",     Icon: ChefHat     },
  { key: "Tag",         Icon: Tag         },
  { key: "Sparkles",    Icon: Sparkles    },
  { key: "Bell",        Icon: Bell        },
  { key: "BarChart2",   Icon: BarChart2   },
];
function iconFromKey(key) {
  const m = ICON_OPTIONS.find(o => o.key === key);
  return m ? m.Icon : Package;
}
const UNITS = ["oz","lbs","cups","liters","ml","count","bags","boxes","cans","bottles"];
const INITIAL_ITEMS = [
  { id:1,  name:"Olive Oil",       category:"pantry",    qty:1, unit:"bottles", low:1 },
  { id:2,  name:"Pasta",           category:"pantry",    qty:3, unit:"boxes",   low:1 },
  { id:3,  name:"Canned Tomatoes", category:"pantry",    qty:4, unit:"cans",    low:2 },
  { id:4,  name:"Rice",            category:"pantry",    qty:2, unit:"lbs",     low:1 },
  { id:5,  name:"Eggs",            category:"fridge",    qty:6, unit:"count",   low:4 },
  { id:6,  name:"Milk",            category:"fridge",    qty:1, unit:"liters",  low:1 },
  { id:7,  name:"Cheddar Cheese",  category:"fridge",    qty:1, unit:"lbs",     low:0 },
  { id:8,  name:"Chicken Breast",  category:"freezer",   qty:2, unit:"lbs",     low:1 },
  { id:9,  name:"Paper Towels",    category:"household", qty:2, unit:"count",   low:1 },
  { id:10, name:"Dish Soap",       category:"household", qty:1, unit:"bottles", low:1 },
  { id:11, name:"Garlic",          category:"pantry",    qty:1, unit:"count",   low:1 },
  { id:12, name:"Onions",          category:"pantry",    qty:3, unit:"count",   low:2 },
  { id:13, name:"Butter",          category:"fridge",    qty:2, unit:"count",   low:1 },
  { id:14, name:"Parmesan",        category:"fridge",    qty:1, unit:"count",   low:0 },
];

const DEMO_CATEGORIES = {
  pantry:    { label:"Pantry",    iconKey:"Package",     color:"#C8956C" },
  fridge:    { label:"Fridge",    iconKey:"Thermometer", color:"#7BAFC4" },
  freezer:   { label:"Freezer",   iconKey:"Wind",        color:"#9BC4CB" },
  household: { label:"Household", iconKey:"Home",        color:"#B5935A" },
  spices:    { label:"Spices",    iconKey:"Tag",         color:"#A07850" },
  baking:    { label:"Baking",    iconKey:"Sparkles",    color:"#6B9E8A" },
  snacks:    { label:"Snacks",    iconKey:"ShoppingBag", color:"#C4826E" },
  beverages: { label:"Beverages", iconKey:"Bell",        color:"#5B8DB8" },
};

let _demoId = 1000;
const di = (name, category, qty, unit, low) => ({ id: _demoId++, name, category, qty, unit, low });
const DEMO_ITEMS = [
  di("Olive Oil","pantry",2,"bottles",1),di("Vegetable Oil","pantry",1,"bottles",1),di("Coconut Oil","pantry",1,"jars",1),
  di("Pasta","pantry",4,"boxes",2),di("Spaghetti","pantry",2,"boxes",1),di("Penne","pantry",2,"boxes",1),
  di("Rice","pantry",3,"lbs",1),di("Brown Rice","pantry",2,"lbs",1),di("Quinoa","pantry",1,"lbs",1),
  di("Canned Tomatoes","pantry",6,"cans",3),di("Tomato Paste","pantry",3,"cans",2),di("Tomato Sauce","pantry",4,"cans",2),
  di("Chicken Broth","pantry",4,"cans",2),di("Beef Broth","pantry",2,"cans",1),di("Vegetable Broth","pantry",2,"cans",1),
  di("Black Beans","pantry",4,"cans",2),di("Kidney Beans","pantry",3,"cans",2),di("Chickpeas","pantry",3,"cans",2),
  di("Lentils","pantry",2,"lbs",1),di("Canned Tuna","pantry",6,"cans",3),di("Canned Salmon","pantry",3,"cans",2),
  di("Canned Corn","pantry",4,"cans",2),di("Canned Peas","pantry",3,"cans",2),di("Coconut Milk","pantry",3,"cans",2),
  di("Soy Sauce","pantry",1,"bottles",1),di("Fish Sauce","pantry",1,"bottles",1),di("Worcestershire","pantry",1,"bottles",1),
  di("Hot Sauce","pantry",1,"bottles",1),di("Sriracha","pantry",1,"bottles",1),di("Honey","pantry",1,"bottles",1),
  di("Maple Syrup","pantry",1,"bottles",1),di("Apple Cider Vinegar","pantry",1,"bottles",1),
  di("Balsamic Vinegar","pantry",1,"bottles",1),di("White Vinegar","pantry",1,"bottles",1),
  di("Peanut Butter","pantry",2,"jars",1),di("Almond Butter","pantry",1,"jars",1),di("Jam","pantry",1,"jars",1),
  di("Salsa","pantry",2,"jars",1),di("Pasta Sauce","pantry",3,"jars",2),di("BBQ Sauce","pantry",1,"bottles",1),
  di("Ketchup","pantry",1,"bottles",1),di("Mustard","pantry",1,"bottles",1),di("Mayo","pantry",1,"jars",1),
  di("Ranch Dressing","pantry",1,"bottles",1),di("Soy Milk","pantry",2,"boxes",1),di("Oats","pantry",1,"lbs",1),
  di("Granola","pantry",1,"bags",1),di("Bread Crumbs","pantry",1,"boxes",1),di("Panko","pantry",1,"boxes",1),
  di("Crackers","pantry",2,"boxes",1),di("Bread","pantry",1,"count",1),di("Tortillas","pantry",1,"bags",1),
  di("Pita Bread","pantry",1,"bags",1),di("Ramen Noodles","pantry",6,"count",3),di("Couscous","pantry",1,"boxes",1),
  di("Polenta","pantry",1,"boxes",1),di("Sun-Dried Tomatoes","pantry",1,"jars",1),di("Olives","pantry",1,"jars",1),
  di("Capers","pantry",1,"jars",1),di("Tahini","pantry",1,"jars",1),di("Sesame Oil","pantry",1,"bottles",1),
  di("Teriyaki Sauce","pantry",1,"bottles",1),di("Oyster Sauce","pantry",1,"bottles",1),di("Curry Paste","pantry",1,"jars",1),
  di("Garlic","pantry",3,"count",2),di("Onions","pantry",4,"count",2),di("Potatoes","pantry",4,"lbs",2),di("Sweet Potatoes","pantry",3,"count",2),
  di("Eggs","fridge",12,"count",6),di("Milk","fridge",1,"liters",1),di("Butter","fridge",2,"count",1),
  di("Cream Cheese","fridge",1,"count",1),di("Sour Cream","fridge",1,"count",1),di("Greek Yogurt","fridge",2,"count",1),
  di("Heavy Cream","fridge",1,"count",1),di("Half and Half","fridge",1,"count",1),di("Cheddar Cheese","fridge",1,"lbs",1),
  di("Mozzarella","fridge",1,"count",1),di("Parmesan","fridge",1,"count",1),di("Feta Cheese","fridge",1,"count",1),
  di("Cottage Cheese","fridge",1,"count",1),di("Ricotta","fridge",1,"count",1),di("Shredded Cheese","fridge",2,"bags",1),
  di("Chicken Breast","fridge",2,"lbs",1),di("Ground Beef","fridge",1,"lbs",1),di("Bacon","fridge",1,"count",1),
  di("Ham","fridge",1,"lbs",1),di("Italian Sausage","fridge",1,"count",1),di("Hot Dogs","fridge",1,"count",1),
  di("Deli Turkey","fridge",1,"lbs",1),di("Salami","fridge",1,"count",1),di("Carrots","fridge",1,"bags",1),
  di("Celery","fridge",1,"count",1),di("Broccoli","fridge",1,"count",1),di("Bell Peppers","fridge",3,"count",2),
  di("Spinach","fridge",1,"bags",1),di("Lettuce","fridge",1,"count",1),di("Kale","fridge",1,"bags",1),
  di("Mushrooms","fridge",1,"count",1),di("Zucchini","fridge",2,"count",1),di("Cucumber","fridge",2,"count",1),
  di("Tomatoes","fridge",4,"count",2),di("Cherry Tomatoes","fridge",1,"count",1),di("Lemon","fridge",3,"count",2),
  di("Lime","fridge",3,"count",2),di("Jalapeño","fridge",2,"count",1),di("Green Onions","fridge",1,"count",1),
  di("Fresh Ginger","fridge",1,"count",1),di("Avocado","fridge",2,"count",1),di("Orange Juice","fridge",1,"count",1),
  di("Apple Juice","fridge",1,"count",1),di("Tortillas (fridge)","fridge",1,"bags",1),di("Salsa (fridge)","fridge",1,"jars",1),
  di("Hummus","fridge",1,"count",1),di("Tofu","fridge",1,"count",1),
  di("Frozen Chicken","freezer",3,"lbs",1),di("Ground Turkey","freezer",2,"lbs",1),di("Pork Chops","freezer",2,"lbs",1),
  di("Salmon Fillets","freezer",2,"lbs",1),di("Shrimp","freezer",1,"lbs",1),di("Tilapia","freezer",2,"lbs",1),
  di("Beef Strips","freezer",1,"lbs",1),di("Frozen Peas","freezer",2,"bags",1),di("Frozen Corn","freezer",2,"bags",1),
  di("Frozen Broccoli","freezer",1,"bags",1),di("Frozen Spinach","freezer",1,"bags",1),di("Frozen Green Beans","freezer",1,"bags",1),
  di("Frozen Mixed Veg","freezer",2,"bags",1),di("Frozen Berries","freezer",2,"bags",1),di("Frozen Pizza","freezer",2,"count",1),
  di("Frozen Waffles","freezer",1,"boxes",1),di("Ice Cream","freezer",1,"count",1),di("Frozen Edamame","freezer",1,"bags",1),
  di("Frozen Burritos","freezer",4,"count",2),di("Frozen Fries","freezer",1,"bags",1),di("Frozen Meatballs","freezer",1,"bags",1),
  di("Frozen Dumplings","freezer",1,"bags",1),di("Frozen Stir Fry Mix","freezer",1,"bags",1),
  di("Bread (frozen)","freezer",1,"count",1),di("Butter (frozen)","freezer",2,"count",1),
  di("Paper Towels","household",4,"count",2),di("Toilet Paper","household",12,"count",4),di("Tissue Box","household",3,"count",1),
  di("Dish Soap","household",2,"count",1),di("Hand Soap","household",3,"count",2),di("Laundry Detergent","household",1,"count",1),
  di("Fabric Softener","household",1,"count",1),di("Dishwasher Pods","household",1,"boxes",1),
  di("All-Purpose Cleaner","household",2,"count",1),di("Bathroom Cleaner","household",1,"count",1),
  di("Glass Cleaner","household",1,"count",1),di("Trash Bags","household",1,"boxes",1),
  di("Zip Lock Bags","household",2,"boxes",1),di("Aluminum Foil","household",1,"count",1),
  di("Plastic Wrap","household",1,"count",1),di("Parchment Paper","household",1,"count",1),
  di("Sponges","household",4,"count",2),di("Toothpaste","household",2,"count",1),di("Shampoo","household",1,"count",1),
  di("Conditioner","household",1,"count",1),di("Body Wash","household",2,"count",1),di("Deodorant","household",2,"count",1),
  di("Razors","household",1,"count",1),di("Ibuprofen","household",1,"count",1),di("Vitamins","household",1,"count",1),
  di("Band-Aids","household",1,"boxes",1),di("Sunscreen","household",1,"count",1),di("Bug Spray","household",1,"count",1),
  di("Batteries (AA)","household",1,"boxes",1),di("Batteries (AAA)","household",1,"boxes",1),di("Light Bulbs","household",1,"boxes",1),
  di("Salt","spices",1,"count",1),di("Black Pepper","spices",1,"count",1),di("Garlic Powder","spices",1,"count",1),
  di("Onion Powder","spices",1,"count",1),di("Paprika","spices",1,"count",1),di("Smoked Paprika","spices",1,"count",1),
  di("Cumin","spices",1,"count",1),di("Chili Powder","spices",1,"count",1),di("Cayenne Pepper","spices",1,"count",1),
  di("Red Pepper Flakes","spices",1,"count",1),di("Oregano","spices",1,"count",1),di("Basil","spices",1,"count",1),
  di("Thyme","spices",1,"count",1),di("Rosemary","spices",1,"count",1),di("Bay Leaves","spices",1,"count",1),
  di("Cinnamon","spices",1,"count",1),di("Nutmeg","spices",1,"count",1),di("Turmeric","spices",1,"count",1),
  di("Curry Powder","spices",1,"count",1),di("Italian Seasoning","spices",1,"count",1),di("Taco Seasoning","spices",2,"count",1),
  di("Everything Bagel","spices",1,"count",1),di("Dill","spices",1,"count",1),di("Parsley","spices",1,"count",1),
  di("Coriander","spices",1,"count",1),di("Ginger Powder","spices",1,"count",1),di("Allspice","spices",1,"count",1),di("Cloves","spices",1,"count",1),
  di("All-Purpose Flour","baking",1,"lbs",1),di("Bread Flour","baking",1,"lbs",1),di("Sugar","baking",1,"lbs",1),
  di("Brown Sugar","baking",1,"lbs",1),di("Powdered Sugar","baking",1,"lbs",1),di("Baking Soda","baking",1,"count",1),
  di("Baking Powder","baking",1,"count",1),di("Yeast","baking",1,"count",1),di("Cornstarch","baking",1,"count",1),
  di("Vanilla Extract","baking",1,"count",1),di("Cocoa Powder","baking",1,"count",1),di("Chocolate Chips","baking",1,"bags",1),
  di("Sprinkles","baking",1,"count",1),di("Food Coloring","baking",1,"count",1),di("Cream of Tartar","baking",1,"count",1),
  di("Gelatin","baking",1,"boxes",1),di("Sweetened Condensed","baking",2,"cans",1),di("Evaporated Milk","baking",2,"cans",1),
  di("Molasses","baking",1,"count",1),di("Corn Syrup","baking",1,"count",1),
  di("Potato Chips","snacks",2,"bags",1),di("Tortilla Chips","snacks",2,"bags",1),di("Pretzels","snacks",1,"bags",1),
  di("Popcorn","snacks",2,"bags",1),di("Mixed Nuts","snacks",1,"count",1),di("Almonds","snacks",1,"bags",1),
  di("Cashews","snacks",1,"bags",1),di("Trail Mix","snacks",1,"bags",1),di("Granola Bars","snacks",1,"boxes",1),
  di("Rice Cakes","snacks",1,"bags",1),di("Fruit Snacks","snacks",2,"boxes",1),di("Applesauce Pouches","snacks",6,"count",3),
  di("Peanut Butter Cups","snacks",1,"bags",1),di("Chocolate Bar","snacks",2,"count",1),di("Cookies","snacks",1,"bags",1),
  di("Animal Crackers","snacks",1,"count",1),di("Cheese Crackers","snacks",2,"boxes",1),di("Cereal","snacks",2,"boxes",1),
  di("Dried Mango","snacks",1,"bags",1),di("Raisins","snacks",1,"bags",1),
  di("Coffee","beverages",1,"bags",1),di("Tea Bags","beverages",1,"boxes",1),di("Sparkling Water","beverages",12,"count",6),
  di("Soda","beverages",12,"count",6),di("Sports Drink","beverages",6,"count",3),di("Coconut Water","beverages",4,"count",2),
  di("Protein Powder","beverages",1,"count",1),di("Hot Cocoa Mix","beverages",1,"boxes",1),di("Lemonade Mix","beverages",1,"count",1),
  di("Wine","beverages",2,"count",1),di("Beer","beverages",6,"count",3),
];

const TREND_COLORS    = ["#C8956C","#7BAFC4","#9BC4CB","#B5935A","#A07850","#6B9E8A","#C4826E","#8BAFC0","#B8956A","#7A9E88"];
const CATEGORY_COLORS = ["#C8956C","#7BAFC4","#9BC4CB","#B5935A","#A07850","#6B9E8A","#C4826E","#5B8DB8","#8E7BB5","#6BAA8A"];

const STORAGE_KEY_CATS   = "hp_categories";
const STORAGE_KEY_ITEMS  = "hp_items";
const STORAGE_KEY_LOG    = "hp_consumption_log";
const STORAGE_KEY_FAVS   = "hp_favorites";
const STORAGE_KEY_CUSTOM = "hp_custom_recipes";

function loadCategories() {
  try { const s = localStorage.getItem(STORAGE_KEY_CATS); if (s) return JSON.parse(s); } catch {}
  return { pantry:{label:"Pantry",iconKey:"Package",color:"#C8956C"}, fridge:{label:"Fridge",iconKey:"Thermometer",color:"#7BAFC4"}, freezer:{label:"Freezer",iconKey:"Wind",color:"#9BC4CB"}, household:{label:"Household",iconKey:"Home",color:"#B5935A"} };
}
function saveCategories(c) { try { localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(c)); } catch {} }
function loadItems() { try { const s = localStorage.getItem(STORAGE_KEY_ITEMS); return s ? JSON.parse(s) : INITIAL_ITEMS; } catch { return INITIAL_ITEMS; } }
function saveItems(i) { try { localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(i)); } catch {} }
function loadLog() { try { const s = localStorage.getItem(STORAGE_KEY_LOG); return s ? JSON.parse(s) : []; } catch { return []; } }
function saveLog(l) { try { localStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(l)); } catch {} }
function loadFavorites() { try { const s = localStorage.getItem(STORAGE_KEY_FAVS); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); } }
function saveFavorites(f) { try { localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify([...f])); } catch {} }
function loadCustomRecipes() { try { const s = localStorage.getItem(STORAGE_KEY_CUSTOM); return s ? JSON.parse(s) : []; } catch { return []; } }
function saveCustomRecipes(r) { try { localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(r)); } catch {} }

function monthKey(date) { const d = date ? new Date(date) : new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function monthLabel(key) { const [y,m] = key.split("-"); return new Date(+y,+m-1,1).toLocaleDateString("en-US",{month:"short",year:"numeric"}); }

// ── Parse pasted recipe text ──────────────────────────────────────
function parseRecipeText(text) {
  const rawLines = text.split("\n").map(l => l.trim());

  // ── Noise filter: skip junk lines from recipe websites ────────────
  const isNoiseLine = (l) => {
    if (!l) return true;
    // Serving multipliers like "1/2x", "1x", "2x", "Original recipe (1X) yields..."
    if (/^[\d./]+x$/i.test(l)) return true;
    if (/^original recipe/i.test(l)) return true;
    // "Local Offers", zip codes, "Buy all X ingredients", "Add to cart"
    if (/^local offer/i.test(l)) return true;
    if (/^\d{5}$/.test(l)) return true;
    if (/^__.*__$/.test(l)) return true;
    if (/^[A-Za-z\s]+,\s*[A-Z]{2}$/.test(l)) return true; // city, STATE
    if (/^buy all/i.test(l)) return true;
    if (/^add to ?cart/i.test(l)) return true;
    // Nutrition labels, ratings, review counts
    if (/^nutrition facts/i.test(l)) return true;
    if (/^(calories|protein|fat|carb|sodium|fiber|sugar):/i.test(l)) return true;
    if (/^\d+ (rating|review|star)/i.test(l)) return true;
    // Ad / social noise
    if (/^(share|print|pin|save|jump to)/i.test(l)) return true;
    if (/^(advertisement|sponsored)/i.test(l)) return true;
    // Very short lines that aren't measurements (likely UI chrome)
    if (l.length < 3) return true;
    return false;
  };

  const lines = rawLines.filter(l => !isNoiseLine(l));

  // ── Section header detection ──────────────────────────────────────
  const isIngHeader  = (l) => /^(ingredient|what you|you'll need)/i.test(l);
  const isStepHeader = (l) => /^(instruction|direction|method|how to|preparation|step|to make|for the)/i.test(l);
  // Sub-section headers within ingredients like "Brownies:", "Frosting:", "For the sauce:"
  const isSubSection = (l) => /^[A-Z][^:]{1,30}:$/.test(l) || /^(for the|for |to make )/i.test(l);

  // ── Ingredient line detection ────────────────────────────────────
  // Starts with a fraction, number, or bullet, followed by a unit or ingredient word
  const FRACTIONS = "½⅓⅔¼¾⅛⅜⅝⅞";
  const looksLikeIngredient = (l) => {
    const stripped = l.replace(/^[-•*]\s*/, "");
    // Starts with a number or fraction character
    if (/^[\d½⅓⅔¼¾⅛⅜⅝⅞]/.test(stripped)) return true;
    // Starts with a bullet
    if (/^[-•*]/.test(l)) return true;
    return false;
  };

  // ── Step line detection ──────────────────────────────────────────
  const looksLikeStep = (l) => {
    // Numbered step: "1.", "1)", "Step 1"
    if (/^\d+[.)\s]/.test(l)) return true;
    if (/^step\s+\d+/i.test(l)) return true;
    // Long sentence starting with a verb (bake, mix, stir, heat, etc.)
    if (l.length > 40 && /^(preheat|heat|melt|mix|stir|combine|add|place|bake|cook|pour|spread|let|remove|bring|chop|dice|slice|whisk|fold|season|drain|rinse|prepare|grease|line|roll|cut|serve|transfer|allow|set|make|beat|cream|sift)/i.test(l)) return true;
    return false;
  };

  // ── Find recipe name ─────────────────────────────────────────────
  // Rules (checked in order of confidence):
  // 1. A line that looks like a proper title: Title Case or ALL CAPS, 3-60 chars,
  //    not a section header, not an ingredient, not a step
  // 2. Falls back to the first clean non-noise line

  const looksLikeTitle = (l) => {
    if (l.length < 3 || l.length > 80) return false;
    if (isIngHeader(l) || isStepHeader(l) || isSubSection(l)) return false;
    if (looksLikeIngredient(l) || looksLikeStep(l)) return false;
    // Should not be a sentence (no period mid-line) or a URL
    if (l.includes("http") || l.includes("www.")) return false;
    if (/[.!?]/.test(l) && l.length > 40) return false;
    // Should not be all lowercase (descriptions tend to be)
    const words = l.split(/\s+/);
    const capitalised = words.filter(w => w[0] && w[0] === w[0].toUpperCase()).length;
    // At least half the words start with a capital, or it's short (≤4 words)
    return capitalised / words.length >= 0.5 || words.length <= 4;
  };

  let name = "My Recipe";

  // First pass: prefer a proper-looking title
  for (const l of lines) {
    if (looksLikeTitle(l)) {
      name = l.replace(/^#+\s*/, "").trim();
      break;
    }
  }

  // Second pass fallback: first clean non-noise, non-header, non-ingredient line
  if (name === "My Recipe") {
    for (const l of lines) {
      if (!isIngHeader(l) && !isStepHeader(l) && !isSubSection(l) && !looksLikeIngredient(l) && !looksLikeStep(l) && l.length > 2) {
        name = l.replace(/^#+\s*/, "").trim();
        break;
      }
    }
  }

  // ── Parse ingredients and steps in order ─────────────────────────
  const ingredients = [];
  const steps = [];
  let mode = null;

  for (const l of lines) {
    if (l === name) continue;

    if (isIngHeader(l))  { mode = "ing";  continue; }
    if (isStepHeader(l)) { mode = "step"; continue; }
    if (isSubSection(l)) {
      // Sub-section headers within ingredients — stay in ing mode, skip line
      if (mode === "ing" || (!mode && ingredients.length > 0)) continue;
      // Sub-section under steps — stay in step mode
      if (mode === "step") continue;
      continue;
    }

    const isIng  = looksLikeIngredient(l);
    const isStep = looksLikeStep(l);

    if (mode === "ing") {
      if (isStep && !isIng) { mode = "step"; }
      else {
        // Clean bullet prefix
        const clean = l.replace(/^[-•*]\s*/, "").trim();
        if (clean) ingredients.push(clean);
        continue;
      }
    }

    if (mode === "step") {
      // Clean numbered prefix
      const clean = l.replace(/^\d+[.)\s]+/, "").trim();
      if (clean) steps.push(clean);
      continue;
    }

    // No mode yet — infer from content
    if (isIng && !isStep) {
      mode = "ing";
      const clean = l.replace(/^[-•*]\s*/, "").trim();
      if (clean) ingredients.push(clean);
    } else if (isStep) {
      mode = "step";
      const clean = l.replace(/^\d+[.)\s]+/, "").trim();
      if (clean) steps.push(clean);
    }
  }

  return {
    id: "custom_" + Date.now(),
    name,
    time: "30 min",
    cuisine: "Custom",
    description: "My custom recipe.",
    servings: 4,
    isCustom: true,
    ingredients: ingredients.map(l => l.toLowerCase()),
    ingredientsWithQty: ingredients.map(l => ({ name: l, qty: "" })),
    steps,
  };
}

const FONT      = `'Lora', serif`;
const FONT_BODY = `'Source Sans 3', sans-serif`;

// ── CSS ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #FDF6EE; font-family: ${FONT_BODY}; color: #3D2B1F; min-height: 100vh; }
  .app { display: flex; min-height: 100vh; background: #FDF6EE; }

  .sidebar { display: none; width: 240px; min-width: 240px; background: #3D2B1F; min-height: 100vh; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 200; }
  .sidebar-logo { padding: 28px 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .sidebar-logo h1 { font-family: ${FONT}; font-size: 20px; color: #F5E6D3; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .sidebar-logo h1 span { color: #C8956C; font-style: italic; }
  .sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
  .sidebar-nav-btn { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; border: none; background: transparent; color: #9E8070; cursor: pointer; font-size: 14px; font-weight: 500; font-family: ${FONT_BODY}; transition: all 0.18s; text-align: left; width: 100%; }
  .sidebar-nav-btn:hover { background: rgba(255,255,255,0.06); color: #F5E6D3; }
  .sidebar-nav-btn.active { background: rgba(200,149,108,0.25); color: #F5E6D3; border-left: 3px solid #C8956C; }
  .sidebar-badge { background: #E07B39; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; margin-left: auto; }
  .sidebar-footer { padding: 16px 10px 28px; border-top: 1px solid rgba(255,255,255,0.08); }
  .sidebar-sync { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9E8070; padding: 8px 14px; }

  .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow-x: hidden; }
  .desktop-header { display: none; }
  .header { background: #3D2B1F; padding: 16px 20px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(61,43,31,0.18); }
  .header-top { display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-family: ${FONT}; font-size: 22px; color: #F5E6D3; font-weight: 700; letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px; }
  .header h1 span { color: #C8956C; font-style: italic; }
  .low-badge { display: flex; align-items: center; gap: 5px; background: #E07B39; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; font-family: ${FONT_BODY}; cursor: pointer; transition: background 0.18s; }
  .low-badge:hover { background: #C85E20; }

  .content { padding: 16px; padding-bottom: 120px; }
  .category-section { margin-bottom: 20px; }
  .inv-grid { display: grid; grid-template-columns: 1fr; gap: 0; }

  @media (min-width: 640px) {
    .content { padding: 20px 24px 120px; }
    .inv-grid { grid-template-columns: 1fr 1fr; gap: 0 16px; align-items: start; }
    .inv-grid .category-section { margin-bottom: 16px; }
    .bottom-nav { max-width: 100%; }
    .nav-label { font-size: 10px; }
  }
  @media (min-width: 1024px) {
    .sidebar { display: flex; }
    .main-area { margin-left: 240px; }
    .header { display: none; }
    .desktop-header { display: flex; align-items: center; justify-content: space-between; padding: 28px 36px 12px; flex-shrink: 0; }
    .desktop-header-title { font-family: ${FONT}; font-size: 28px; font-weight: 700; color: #3D2B1F; }
    .bottom-nav { display: none; }
    .content { padding: 16px 36px 48px; max-width: 1200px; }
    .inv-grid { grid-template-columns: 1fr 1fr 1fr; gap: 0 16px; }
    .add-fab { right: 36px; bottom: 36px; }
    .modal-overlay { align-items: center; }
    .modal { border-radius: 20px; max-width: 500px; margin: 0 auto; }
    .recipe-modal { border-radius: 20px; max-width: 640px; max-height: 85vh; margin: 0 auto; }
    .confirm-box { border-radius: 20px; }
  }

  .category-header { display: flex; flex-direction: column; cursor: pointer; user-select: none; padding: 10px 14px; background: #fff; border-radius: 14px; box-shadow: 0 1px 4px rgba(61,43,31,0.07); transition: background 0.18s; margin-bottom: 0; }
  .category-header:hover { background: #FAF2EA; }
  .category-header.open { border-radius: 14px 14px 0 0; }
  .category-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cat-header-top { display: flex; align-items: center; gap: 8px; width: 100%; }
  .category-header h2 { font-family: ${FONT}; font-size: 16px; font-weight: 600; color: #3D2B1F; }
  .cat-count { font-size: 11px; color: #9E8070; font-family: ${FONT_BODY}; margin-left: auto; margin-right: 6px; }
  .cat-chevron { color: #C4A98A; transition: transform 0.25s ease; flex-shrink: 0; }
  .cat-chevron.open { transform: rotate(180deg); }
  .cat-health { margin-top: 8px; }
  .cat-health-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .cat-health-label { font-size: 10px; color: #9E8070; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; font-family: ${FONT_BODY}; }
  .cat-health-pct { font-size: 10px; font-weight: 700; font-family: ${FONT_BODY}; }
  .cat-health-track { height: 5px; background: #F0E8DF; border-radius: 10px; overflow: hidden; }
  .cat-health-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
  .cat-health-info { display: inline-flex; align-items: center; gap: 4px; position: relative; cursor: help; }
  .cat-health-info svg { color: #C4A98A; flex-shrink: 0; }
  .cat-health-tooltip { display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: #3D2B1F; color: #F5E6D3; font-size: 11px; line-height: 1.4; padding: 7px 10px; border-radius: 8px; white-space: nowrap; z-index: 50; font-family: ${FONT_BODY}; font-weight: 400; pointer-events: none; box-shadow: 0 2px 8px rgba(61,43,31,0.2); }
  .cat-health-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #3D2B1F; }
  .cat-health-info:hover .cat-health-tooltip { display: block; }
  .category-items { background: #fff; border-radius: 0 0 14px 14px; overflow: hidden; transition: max-height 0.32s ease, opacity 0.25s ease, padding 0.25s ease; box-shadow: 0 2px 6px rgba(61,43,31,0.06); }
  .category-items.open { padding: 6px 10px 20px; }
  .category-items.closed { max-height: 0 !important; opacity: 0; padding: 0 10px; pointer-events: none; }

  .item-card { background: #fff; border-radius: 14px; padding: 12px 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(61,43,31,0.07); border: 1.5px solid transparent; transition: border-color 0.2s; min-height: 68px; }
  .item-card.low { border-color: #E07B39; background: #FFF8F3; }
  .item-card.item-highlight { animation: highlightPulse 1.4s ease; }
  @keyframes highlightPulse { 0% { box-shadow: 0 0 0 0 rgba(200,149,108,0.5); } 40% { box-shadow: 0 0 0 6px rgba(200,149,108,0.25); } 100% { box-shadow: 0 0 0 0 rgba(200,149,108,0); } }
  .item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .item-name { font-size: 14px; font-weight: 500; color: #3D2B1F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item-meta { font-size: 12px; color: #9E8070; margin-top: 3px; display: flex; align-items: center; gap: 4px; }
  .item-meta.low-text { color: #E07B39; font-weight: 500; }
  .qty-controls { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .qty-btn.minus { background: #F0E8DF; color: #7A5C45; }
  .qty-btn.minus:hover { background: #E5D5C6; }
  .qty-btn.plus  { background: #C8956C; color: #fff; }
  .qty-btn.plus:hover { background: #B5804F; }
  .qty-num { font-size: 15px; font-weight: 600; color: #3D2B1F; min-width: 20px; text-align: center; }
  .unit-label { font-size: 11px; color: #9E8070; min-width: 36px; text-align: left; flex-shrink: 0; }
  .delete-btn { background: none; border: none; cursor: pointer; color: #C4A98A; padding: 2px 4px; transition: color 0.15s; display: flex; align-items: center; }
  .delete-btn:hover { color: #C0392B; }

  .add-fab { position: fixed; bottom: 88px; right: 16px; width: 52px; height: 52px; border-radius: 50%; background: #3D2B1F; color: #F5E6D3; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(61,43,31,0.3); display: flex; align-items: center; justify-content: center; transition: transform 0.2s, background 0.2s; z-index: 50; }
  .add-fab:hover { transform: scale(1.08); background: #5A3E2B; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(61,43,31,0.45); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  .modal { background: #FDF6EE; border-radius: 24px 24px 0 0; padding: 24px 20px 40px; width: 100%; max-width: 430px; animation: slideUp 0.28s ease; }
  @media (min-width: 640px) { .modal { border-radius: 20px; max-width: 480px; animation: fadeIn 0.22s ease; } .modal-overlay { align-items: center; } }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes fadeIn  { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
  .modal-screen      { animation: modalScreenIn   0.25s cubic-bezier(0.4,0,0.2,1) both; }
  .modal-screen-back { animation: modalScreenBack 0.25s cubic-bezier(0.4,0,0.2,1) both; }
  @keyframes modalScreenIn   { from { opacity:0; transform:translateX(28px);  } to { opacity:1; transform:translateX(0); } }
  @keyframes modalScreenBack { from { opacity:0; transform:translateX(-28px); } to { opacity:1; transform:translateX(0); } }
  .modal-screen-title { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
  .modal-back-btn { background:none; border:none; cursor:pointer; color:#C4A98A; padding:2px; display:flex; align-items:center; transition:color 0.15s; }
  .modal-back-btn:hover { color:#3D2B1F; }
  .dup-item-card { background:#FFF3EA; border:1.5px solid #F5B87A; border-radius:14px; padding:14px; margin-bottom:16px; }
  .dup-item-card-name { font-family:${FONT}; font-size:17px; font-weight:600; color:#3D2B1F; margin-bottom:4px; }
  .dup-item-card-meta { font-size:13px; color:#7A5C45; display:flex; align-items:center; gap:6px; }
  .dup-qty-row { display:flex; align-items:center; gap:12px; background:#fff; border-radius:12px; padding:12px 14px; margin-bottom:16px; border:1.5px solid #E5D5C6; }
  .dup-qty-label { flex:1; font-size:14px; color:#3D2B1F; }
  .dup-qty-result { font-family:${FONT}; font-size:20px; font-weight:700; color:#3D2B1F; }
  .dup-qty-unit { font-size:12px; color:#9E8070; }
  .modal h3 { font-family: ${FONT}; font-size: 20px; color: #3D2B1F; margin-bottom: 18px; font-weight: 700; }
  .form-row { margin-bottom: 14px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; color: #7A5C45; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input, .form-select { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid #E5D5C6; background: #fff; font-size: 15px; color: #3D2B1F; font-family: ${FONT_BODY}; outline: none; transition: border-color 0.2s; }
  .form-input:focus, .form-select:focus { border-color: #C8956C; }
  .form-textarea { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid #E5D5C6; background: #fff; font-size: 14px; color: #3D2B1F; font-family: ${FONT_BODY}; outline: none; transition: border-color 0.2s; resize: vertical; min-height: 120px; line-height: 1.5; }
  .form-textarea:focus { border-color: #C8956C; }
  .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .btn-row { display: flex; gap: 10px; margin-top: 20px; }
  .btn { flex: 1; padding: 13px; border-radius: 12px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; font-family: ${FONT_BODY}; transition: all 0.18s; }
  .btn-primary { background: #3D2B1F; color: #F5E6D3; }
  .btn-primary:hover { background: #5A3E2B; }
  .btn-secondary { background: #F0E8DF; color: #7A5C45; }
  .btn-secondary:hover { background: #E5D5C6; }

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
  .empty-state { text-align: center; padding: 40px 20px; color: #9E8070; }
  .empty-icon { width: 64px; height: 64px; border-radius: 50%; background: #F0E8DF; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: #C8956C; }
  .empty-state p { font-size: 15px; line-height: 1.5; }
  .clear-btn { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #E5D5C6; background: transparent; color: #9E8070; font-size: 14px; font-weight: 500; cursor: pointer; font-family: ${FONT_BODY}; margin-top: 8px; transition: all 0.18s; }
  .clear-btn:hover { background: #F0E8DF; color: #7A5C45; }

  /* Meals */
  .meal-intro { background: linear-gradient(135deg, #3D2B1F 0%, #6B4226 100%); border-radius: 18px; padding: 18px; margin-bottom: 18px; color: #F5E6D3; }
  .meal-intro-header { font-family: ${FONT}; font-size: 17px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
  .meal-card { background: #fff; border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 6px rgba(61,43,31,0.09); animation: cardIn 0.3s ease both; cursor: pointer; }
  .meal-card:hover { box-shadow: 0 3px 12px rgba(61,43,31,0.13); }
  @keyframes cardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .meal-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
  .meal-name { font-family: ${FONT}; font-size: 17px; font-weight: 600; color: #3D2B1F; line-height: 1.3; flex: 1; }
  .meal-time { display: flex; align-items: center; gap: 4px; background: #F0E8DF; color: #7A5C45; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .meal-desc { font-size: 13px; color: #7A5C45; line-height: 1.5; margin-bottom: 10px; }
  .meal-ingredients { display: flex; flex-wrap: wrap; gap: 5px; }
  .ingredient-tag { background: #FDF6EE; border: 1px solid #E5D5C6; color: #7A5C45; font-size: 11px; padding: 3px 8px; border-radius: 20px; font-weight: 500; }
  .ingredient-missing { background: #FEE2D5; border-color: #F5B8A0; color: #C0392B; }

  /* Favorites */
  .fav-btn { background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0; transition: transform 0.15s; }
  .fav-btn:hover { transform: scale(1.2); }
  .fav-btn svg { transition: fill 0.2s, color 0.2s; }
  .fav-btn.active svg { fill: #E07B39; color: #E07B39; }
  .fav-badge { background: #E07B3922; color: #E07B39; border: 1px solid #E07B3944; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; display: inline-flex; align-items: center; gap: 3px; }
  .custom-badge { background: #6B9E8A22; color: #6B9E8A; border: 1px solid #6B9E8A44; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; display: inline-flex; align-items: center; gap: 3px; }

  /* Meal sub-tabs */
  .meal-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
  .meal-tab { flex: 1; padding: 9px 6px; border-radius: 10px; border: 1.5px solid #E5D5C6; background: #fff; font-size: 11px; font-weight: 600; color: #7A5C45; cursor: pointer; font-family: ${FONT_BODY}; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .meal-tab.active { background: #3D2B1F; color: #F5E6D3; border-color: #3D2B1F; }

  /* Custom recipe entry */
  .recipe-entry-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
  .recipe-entry-tab { flex: 1; padding: 8px; border-radius: 10px; border: 1.5px solid #E5D5C6; background: #fff; font-size: 12px; font-weight: 600; color: #7A5C45; cursor: pointer; font-family: ${FONT_BODY}; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .recipe-entry-tab.active { background: #C8956C; color: #fff; border-color: #C8956C; }
  .dynamic-list-item { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
  .dynamic-list-item input { flex: 1; }
  .remove-line-btn { background: none; border: none; cursor: pointer; color: #C4A98A; padding: 4px; display: flex; align-items: center; flex-shrink: 0; }
  .remove-line-btn:hover { color: #C0392B; }
  .add-line-btn { background: none; border: 1.5px dashed #C8956C; border-radius: 8px; color: #C8956C; cursor: pointer; font-size: 12px; font-weight: 600; font-family: ${FONT_BODY}; padding: 7px 12px; width: 100%; transition: background 0.18s; }
  .add-line-btn:hover { background: #FFF3EA; }

  /* Recipe detail modal */
  .recipe-modal { background: #FDF6EE; border-radius: 24px 24px 0 0; padding: 0; width: 100%; max-width: 430px; animation: slideUp 0.28s ease; max-height: 88vh; display: flex; flex-direction: column; }
  @media (min-width: 640px) { .recipe-modal { border-radius: 20px; max-width: 560px; max-height: 80vh; animation: fadeIn 0.22s ease; } }
  @media (min-width: 1024px) { .recipe-modal { max-width: 640px; } }
  .recipe-modal-header { padding: 20px 20px 0; flex-shrink: 0; }
  .recipe-modal-scroll { overflow-y: auto; padding: 0 20px 40px; flex: 1; }
  .recipe-modal-title { font-family: ${FONT}; font-size: 22px; font-weight: 700; color: #3D2B1F; margin-bottom: 6px; line-height: 1.2; }
  .recipe-modal-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .recipe-modal-tag { display: flex; align-items: center; gap: 4px; background: #F0E8DF; color: #7A5C45; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
  .recipe-section-title { font-family: ${FONT}; font-size: 15px; font-weight: 600; color: #3D2B1F; margin: 18px 0 10px; display: flex; align-items: center; gap: 7px; }
  .recipe-ingredient-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #F0E8DF; }
  .recipe-ingredient-row:last-child { border-bottom: none; }
  .recipe-ingredient-name { font-size: 14px; color: #3D2B1F; font-weight: 500; }
  .recipe-ingredient-qty { font-size: 13px; color: #9E8070; }
  .recipe-step { display: flex; gap: 12px; margin-bottom: 14px; }
  .recipe-step-num { width: 26px; height: 26px; border-radius: 50%; background: #3D2B1F; color: #F5E6D3; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .recipe-step-text { font-size: 14px; color: #3D2B1F; line-height: 1.55; flex: 1; }
  .recipe-close-btn { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: #F0E8DF; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #7A5C45; transition: background 0.18s; }
  .recipe-close-btn:hover { background: #E5D5C6; }
  .recipe-modal-divider { height: 1px; background: #EDE0D4; margin: 4px 0 16px; }
  .recipe-fav-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1.5px solid #E5D5C6; border-radius: 20px; padding: 5px 12px; cursor: pointer; font-size: 12px; font-weight: 600; color: #7A5C45; font-family: ${FONT_BODY}; transition: all 0.18s; }
  .recipe-fav-btn:hover { border-color: #E07B39; color: #E07B39; }
  .recipe-fav-btn.active { background: #FEF3EA; border-color: #E07B39; color: #E07B39; }
  .recipe-fav-btn.active svg { fill: #E07B39; }

  @keyframes pulse { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.2); } }

  .alerts-banner { background: linear-gradient(135deg, #E07B39, #C85E20); border-radius: 14px; padding: 14px 16px; margin-bottom: 16px; color: #fff; }
  .alerts-banner-header { display: flex; align-items: center; gap: 7px; font-family: ${FONT}; font-size: 15px; font-weight: 600; margin-bottom: 8px; }
  .alert-items { display: flex; flex-wrap: wrap; gap: 5px; }
  .alert-tag { background: rgba(255,255,255,0.2); font-size: 12px; padding: 3px 9px; border-radius: 20px; font-weight: 500; }
  .alert-tag-btn { cursor: pointer; transition: background 0.18s; display: inline-flex; align-items: center; gap: 4px; }
  .alert-tag-btn::after { content: '→'; font-size: 11px; opacity: 0.8; }
  .alert-tag-btn:hover { background: rgba(255,255,255,0.35); }
  .alert-overflow { background: rgba(255,255,255,0.12); font-size: 12px; padding: 3px 9px; border-radius: 20px; font-weight: 600; font-style: italic; }
  .search-bar { background: #F0E8DF; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: #B5935A; }
  .search-bar input { flex: 1; background: none; border: none; outline: none; font-size: 15px; color: #3D2B1F; font-family: ${FONT_BODY}; }
  .search-bar input::placeholder { color: #B5935A; }
  .search-clear { background: none; border: none; cursor: pointer; color: #B5935A; display: flex; align-items: center; }

  .trends-header-card { background: linear-gradient(135deg, #3D2B1F 0%, #6B4226 100%); border-radius: 18px; padding: 18px; margin-bottom: 16px; color: #F5E6D3; }
  .trends-header-card h2 { font-family: ${FONT}; font-size: 18px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
  .trends-header-card p { font-size: 13px; opacity: 0.75; line-height: 1.5; }
  .trend-section { margin-bottom: 22px; }
  .trend-section-title { font-family: ${FONT}; font-size: 15px; font-weight: 600; color: #3D2B1F; margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
  .item-pill-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .item-pill { padding: 5px 12px; border-radius: 20px; border: 1.5px solid #E5D5C6; background: #fff; font-size: 12px; font-weight: 500; color: #7A5C45; cursor: pointer; transition: all 0.18s; font-family: ${FONT_BODY}; }
  .item-pill.active { color: #fff; border-color: transparent; }
  .item-pill:hover { border-color: #C8956C; }
  .stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .stat-card { background: #fff; border-radius: 14px; padding: 14px; box-shadow: 0 1px 4px rgba(61,43,31,0.07); }
  .stat-label { font-size: 11px; color: #9E8070; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
  .stat-value { font-family: ${FONT}; font-size: 22px; font-weight: 700; color: #3D2B1F; line-height: 1.1; }
  .stat-sub { font-size: 11px; color: #9E8070; margin-top: 3px; }
  .bar-chart { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 1px 4px rgba(61,43,31,0.07); margin-bottom: 14px; }
  .bar-chart-title { font-size: 12px; font-weight: 600; color: #7A5C45; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
  .bars-wrap { display: flex; align-items: flex-end; gap: 6px; height: 100px; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .bar-fill { width: 100%; border-radius: 5px 5px 0 0; transition: height 0.4s ease; min-height: 2px; position: relative; }
  .bar-fill:hover .bar-tooltip { display: block; }
  .bar-tooltip { display: none; position: absolute; top: -28px; left: 50%; transform: translateX(-50%); background: #3D2B1F; color: #F5E6D3; font-size: 10px; padding: 3px 6px; border-radius: 5px; white-space: nowrap; z-index: 10; font-family: ${FONT_BODY}; }
  .bar-label { font-size: 9px; color: #9E8070; text-align: center; white-space: nowrap; overflow: hidden; width: 100%; text-overflow: ellipsis; }
  .line-chart-wrap { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 1px 4px rgba(61,43,31,0.07); margin-bottom: 14px; overflow: hidden; }
  .line-chart-title { font-size: 12px; font-weight: 600; color: #7A5C45; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
  .chart-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #7A5C45; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .runout-item { background: #fff; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(61,43,31,0.06); }
  .runout-info { flex: 1; }
  .runout-name { font-size: 14px; font-weight: 500; color: #3D2B1F; }
  .runout-date { font-size: 12px; color: #9E8070; margin-top: 2px; }
  .runout-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
  .runout-badge.urgent { background: #FEE2D5; color: #C0392B; }
  .runout-badge.soon   { background: #FEF3C7; color: #B7791F; }
  .runout-badge.ok     { background: #D1FAE5; color: #065F46; }
  .range-row { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
  .range-btn { padding: 5px 12px; border-radius: 20px; border: 1.5px solid #E5D5C6; background: #fff; font-size: 11px; font-weight: 600; color: #7A5C45; cursor: pointer; transition: all 0.18s; font-family: ${FONT_BODY}; }
  .range-btn.active { background: #3D2B1F; color: #F5E6D3; border-color: #3D2B1F; }

  .add-cat-btn { width: 100%; padding: 12px; border-radius: 14px; border: 1.5px dashed #C8956C; background: transparent; color: #C8956C; font-size: 14px; font-weight: 600; cursor: pointer; font-family: ${FONT_BODY}; margin-top: 4px; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .add-cat-btn:hover { background: #FFF3EA; }
  .cat-delete-btn { background: none; border: none; cursor: pointer; color: #C4A98A; padding: 2px 4px; transition: color 0.15s; display: flex; align-items: center; margin-left: 4px; }
  .cat-delete-btn:hover { color: #C0392B; }
  .cat-add-btn { background: none; border: none; cursor: pointer; color: #C4A98A; padding: 3px 5px; transition: all 0.15s; display: flex; align-items: center; border-radius: 6px; margin-right: 2px; }
  .cat-add-btn:hover { color: #C8956C; background: rgba(200,149,108,0.12); }
  .icon-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 8px; }
  .icon-opt { width: 100%; aspect-ratio: 1; border-radius: 10px; border: 1.5px solid #E5D5C6; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s; color: #7A5C45; }
  .icon-opt.selected { border-color: #C8956C; background: #FFF3EA; color: #C8956C; }
  .color-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .color-swatch { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2.5px solid transparent; transition: all 0.18s; }
  .color-swatch.selected { border-color: #3D2B1F; transform: scale(1.15); }

  .settings-section { margin-bottom: 24px; }
  .settings-section-title { font-family: ${FONT}; font-size: 15px; font-weight: 600; color: #3D2B1F; margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
  .settings-card { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 1px 4px rgba(61,43,31,0.07); margin-bottom: 10px; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .settings-row-info { flex: 1; }
  .settings-row-label { font-size: 15px; font-weight: 500; color: #3D2B1F; }
  .settings-row-sub { font-size: 12px; color: #9E8070; margin-top: 2px; }
  .settings-btn { padding: 9px 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; font-family: ${FONT_BODY}; transition: all 0.18s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .settings-btn-danger { background: #FEE2D5; color: #C0392B; }
  .settings-btn-danger:hover { background: #FECDB8; }
  .settings-btn-primary { background: #3D2B1F; color: #F5E6D3; }
  .settings-btn-primary:hover { background: #5A3E2B; }
  .confirm-overlay { position: fixed; inset: 0; background: rgba(61,43,31,0.5); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .confirm-box { background: #FDF6EE; border-radius: 20px; padding: 24px; width: 100%; max-width: 340px; text-align: center; }
  .confirm-box h3 { font-family: ${FONT}; font-size: 19px; font-weight: 700; color: #3D2B1F; margin-bottom: 8px; }
  .confirm-box p { font-size: 14px; color: #7A5C45; line-height: 1.5; margin-bottom: 20px; }
  .confirm-btns { display: flex; gap: 10px; }

  .content-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .tab-viewport { position: relative; overflow: hidden; }
  .tab-panel { animation-duration: 0.28s; animation-timing-function: cubic-bezier(0.4,0,0.2,1); animation-fill-mode: both; }
  .tab-panel.slide-in-right { animation-name: slideInRight; }
  .tab-panel.slide-in-left  { animation-name: slideInLeft;  }
  .tab-panel.slide-in-up    { animation-name: slideInUp;    }
  @keyframes slideInRight { from { opacity:0; transform:translateX(32px);  } to { opacity:1; transform:translateX(0); } }
  @keyframes slideInLeft  { from { opacity:0; transform:translateX(-32px); } to { opacity:1; transform:translateX(0); } }
  @keyframes slideInUp    { from { opacity:0; transform:translateY(16px);  } to { opacity:1; transform:translateY(0); } }

  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1.5px solid #EDE0D4; display: flex; padding: 8px 0 16px; z-index: 100; justify-content: space-around; }
  .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; border: none; background: none; cursor: pointer; padding: 6px 2px; transition: all 0.18s; color: #C4A98A; }
  .nav-btn.active { color: #3D2B1F; }
  .nav-btn.active svg { transform: scale(1.12); }
  .nav-label { font-size: 9px; font-weight: 600; letter-spacing: 0.2px; text-transform: uppercase; font-family: ${FONT_BODY}; }
`;

// ── Add Custom Recipe Modal ───────────────────────────────────────
function AddCustomRecipeModal({ onClose, onSave }) {
  const [mode, setMode]         = useState("form");
  const [pasteText, setPaste]   = useState("");
  const [parsed, setParsed]     = useState(false);
  const [name, setName]         = useState("");
  const [time, setTime]         = useState("30");
  const [cuisine, setCuisine]   = useState("Custom");
  const [servings, setServings] = useState("4");
  const [desc, setDesc]         = useState("");
  const [ings, setIngs]         = useState([""]);
  const [steps, setSteps]       = useState([""]);

  const handleParse = () => {
    const r = parseRecipeText(pasteText);
    setName(r.name);
    setIngs(r.ingredientsWithQty.map(i => i.name).filter(Boolean).length ? r.ingredientsWithQty.map(i => i.name).filter(Boolean) : [""]);
    setSteps(r.steps.filter(Boolean).length ? r.steps.filter(Boolean) : [""]);
    setParsed(true);
  };

  const handleSave = () => {
    const recipe = {
      id: "custom_" + Date.now(),
      name: name.trim() || "My Recipe",
      time: time + " min",
      cuisine: cuisine || "Custom",
      description: desc.trim(),
      servings: Number(servings) || 4,
      isCustom: true,
      ingredients: ings.filter(i => i.trim()).map(i => i.trim().toLowerCase()),
      ingredientsWithQty: ings.filter(i => i.trim()).map(i => ({ name: i.trim(), qty: "" })),
      steps: steps.filter(s => s.trim()),
    };
    onSave(recipe);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxHeight:"90vh",overflowY:"auto"}}>
        <h3>Add Custom Recipe</h3>
        <div className="recipe-entry-tabs">
          <button className={`recipe-entry-tab ${mode==="form"?"active":""}`} onClick={()=>setMode("form")}><ClipboardList size={13}/>Form</button>
          <button className={`recipe-entry-tab ${mode==="paste"?"active":""}`} onClick={()=>setMode("paste")}><PenLine size={13}/>Paste Text</button>
        </div>

        {mode === "paste" && !parsed && (
          <>
            <div className="form-row">
              <label className="form-label">Paste recipe text</label>
              <textarea className="form-textarea"
                placeholder={"Grandma's Chicken Soup\n\nIngredients:\n- 1 whole chicken\n- 3 carrots\n\nInstructions:\n1. Boil the chicken...\n2. Add vegetables..."}
                value={pasteText} onChange={e => setPaste(e.target.value)}/>
            </div>
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleParse} disabled={!pasteText.trim()}>Parse Recipe</button>
            </div>
          </>
        )}

        {(mode === "form" || parsed) && (
          <>
            {parsed && (
              <div style={{background:"#D1FAE5",border:"1px solid #6B9E8A",borderRadius:10,padding:"8px 12px",marginBottom:14,fontSize:13,color:"#065F46",display:"flex",alignItems:"center",gap:6}}>
                <CheckCircle2 size={14}/>Parsed! Review and edit below.
              </div>
            )}
            <div className="form-row">
              <label className="form-label">Recipe Name</label>
              <input className="form-input" placeholder="e.g. Grandma's Chicken Soup" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
            <div className="form-row-2">
              <div className="form-row" style={{marginBottom:0}}>
                <label className="form-label">Cook Time (min)</label>
                <input className="form-input" type="number" min="1" value={time} onChange={e=>setTime(e.target.value)}/>
              </div>
              <div className="form-row" style={{marginBottom:0}}>
                <label className="form-label">Servings</label>
                <input className="form-input" type="number" min="1" value={servings} onChange={e=>setServings(e.target.value)}/>
              </div>
            </div>
            <div className="form-row" style={{marginTop:14}}>
              <label className="form-label">Cuisine</label>
              <input className="form-input" placeholder="e.g. American, Italian…" value={cuisine} onChange={e=>setCuisine(e.target.value)}/>
            </div>
            <div className="form-row">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" placeholder="A short tagline…" value={desc} onChange={e=>setDesc(e.target.value)}/>
            </div>
            <div className="form-row">
              <label className="form-label">Ingredients</label>
              {ings.map((ing, i) => (
                <div className="dynamic-list-item" key={i}>
                  <input className="form-input" placeholder={`Ingredient ${i+1}`} value={ing} onChange={e=>{const n=[...ings];n[i]=e.target.value;setIngs(n);}}/>
                  {ings.length > 1 && <button className="remove-line-btn" onClick={()=>setIngs(ings.filter((_,j)=>j!==i))}><X size={14}/></button>}
                </div>
              ))}
              <button className="add-line-btn" onClick={()=>setIngs([...ings,""])}>+ Add ingredient</button>
            </div>
            <div className="form-row">
              <label className="form-label">Instructions</label>
              {steps.map((step, i) => (
                <div className="dynamic-list-item" key={i}>
                  <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:"#3D2B1F",color:"#F5E6D3",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                    <input className="form-input" placeholder={`Step ${i+1}`} value={step} onChange={e=>{const n=[...steps];n[i]=e.target.value;setSteps(n);}} style={{flex:1}}/>
                  </div>
                  {steps.length > 1 && <button className="remove-line-btn" onClick={()=>setSteps(steps.filter((_,j)=>j!==i))}><X size={14}/></button>}
                </div>
              ))}
              <button className="add-line-btn" onClick={()=>setSteps([...steps,""])}>+ Add step</button>
            </div>
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>Save Recipe</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Meal Suggestions ──────────────────────────────────────────────
function MealSuggestions({ items, onSelect, favorites, onToggleFav, customRecipes, onSaveCustom, onOpenAddCustom }) {
  const [mealTab, setMealTab]       = useState("all");
  const [search, setSearch]         = useState("");
  const [cuisine, setCuisine]       = useState("All");
  const [maxTime, setMaxTime]       = useState(30);
  const [showAll, setShowAll]       = useState(false);

  const allRecipes = useMemo(() => [...(RECIPES_DATA || []), ...customRecipes], [customRecipes]);

  const inventoryNames = useMemo(() =>
    items.filter(i => i.category !== "household").map(i => i.name.toLowerCase()),
    [items]
  );

  function fuzzyMatch(ing, names) {
    const ingL = ing.toLowerCase().replace(/s$/, "");
    return names.some(n => { const nL = n.replace(/s$/,""); return nL.includes(ingL) || ingL.includes(nL); });
  }
  const hasIngredient = ing => fuzzyMatch(ing, inventoryNames);

  const matched = useMemo(() => {
    const names = items.filter(i => i.category !== "household").map(i => i.name.toLowerCase());
    if (!allRecipes.length || !names.length) return [];
    return allRecipes.filter(r => {
      if (parseInt(r.time) > maxTime) return false;
      if (cuisine !== "All" && r.cuisine !== cuisine) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return r.ingredients.every(ing => fuzzyMatch(ing, names));
    });
  }, [items, cuisine, maxTime, search, allRecipes]); // eslint-disable-line react-hooks/exhaustive-deps

  const nearMisses = useMemo(() => {
    const names = items.filter(i => i.category !== "household").map(i => i.name.toLowerCase());
    if (!allRecipes.length || !names.length) return [];
    return allRecipes
      .filter(r => parseInt(r.time) <= maxTime && (cuisine === "All" || r.cuisine === cuisine))
      .map(r => ({ recipe:r, matchCount:r.ingredients.filter(ing=>fuzzyMatch(ing,names)).length, total:r.ingredients.length }))
      .filter(m => m.matchCount < m.total)
      .sort((a,b) => (b.matchCount/b.total) - (a.matchCount/a.total))
      .slice(0,6);
  }, [items, allRecipes, maxTime, cuisine]); // eslint-disable-line react-hooks/exhaustive-deps

  // Favorites float to top
  const sortedMatched = useMemo(() =>
    [...matched].sort((a,b) => (favorites.has(String(b.id))?1:0) - (favorites.has(String(a.id))?1:0)),
    [matched, favorites]
  );

  const favMatched    = sortedMatched.filter(r => favorites.has(String(r.id)));
  const displayList   = mealTab==="favorites" ? favMatched : mealTab==="custom" ? customRecipes : sortedMatched;
  const visible       = showAll ? displayList : displayList.slice(0,12);
  const cuisines      = ["All", ...Array.from(new Set(allRecipes.map(r => r.cuisine))).sort()];

  const RecipeCard = ({ r, i }) => (
    <div className="meal-card" style={{animationDelay:`${Math.min(i,6)*0.05}s`}} onClick={()=>onSelect(r)}>
      <div className="meal-card-header">
        <div className="meal-name">{r.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          {r.time && <div className="meal-time"><Clock size={11}/>{r.time}</div>}
          <button className={`fav-btn ${favorites.has(String(r.id))?"active":""}`}
            onClick={e=>{e.stopPropagation();onToggleFav(String(r.id));}}>
            <Heart size={16}/>
          </button>
        </div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#9E8070",background:"#F0E8DF",padding:"2px 8px",borderRadius:20,fontWeight:500}}>{r.cuisine}</span>
        {r.isCustom && <span className="custom-badge"><PenLine size={9}/>Custom</span>}
        {favorites.has(String(r.id)) && <span className="fav-badge"><Heart size={9}/>Favorited</span>}
      </div>
      {r.description && <div className="meal-desc">{r.description}</div>}
      <div className="meal-ingredients">
        {(r.ingredients||[]).map((ing,j)=>(
          <span className={`ingredient-tag ${hasIngredient(ing)?"":"ingredient-missing"}`} key={j}>{ing}</span>
        ))}
      </div>
      <div style={{marginTop:10,fontSize:12,color:"#C8956C",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
        <BookOpen size={12}/> View recipe
      </div>
    </div>
  );

  return (
    <div>
      <div className="meal-intro">
        <div className="meal-intro-header"><ChefHat size={20}/>What's for dinner?</div>
        <p>Matching against {allRecipes.length} recipes using {inventoryNames.length} ingredients in your inventory.</p>
        <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
          <span style={{background:"rgba(255,255,255,0.15)",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>
            {matched.length} match{matched.length!==1?"es":""}
          </span>
          {favMatched.length>0 && (
            <span style={{background:"rgba(224,123,57,0.35)",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
              <Heart size={11}/>{favMatched.length} favorited
            </span>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="meal-tabs">
        <button className={`meal-tab ${mealTab==="all"?"active":""}`} onClick={()=>setMealTab("all")}><ChefHat size={12}/>All ({matched.length})</button>
        <button className={`meal-tab ${mealTab==="favorites"?"active":""}`} onClick={()=>setMealTab("favorites")}><Heart size={12}/>Saved ({favMatched.length})</button>
        <button className={`meal-tab ${mealTab==="custom"?"active":""}`} onClick={()=>setMealTab("custom")}><PenLine size={12}/>Custom ({customRecipes.length})</button>
      </div>

      {/* Filters on All tab */}
      {mealTab==="all" && (
        <div style={{marginBottom:14}}>
          <div className="search-bar" style={{marginBottom:10}}>
            <Search size={16}/>
            <input placeholder="Search recipes…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button className="search-clear" onClick={()=>setSearch("")}><X size={16}/></button>}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            {cuisines.map(c=><button key={c} className={`range-btn ${cuisine===c?"active":""}`} onClick={()=>setCuisine(c)}>{c}</button>)}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Clock size={14} color="#9E8070"/>
            <span style={{fontSize:12,color:"#9E8070",minWidth:80}}>Under {maxTime} min</span>
            <input type="range" min={10} max={30} step={5} value={maxTime} onChange={e=>setMaxTime(Number(e.target.value))} style={{flex:1,accentColor:"#C8956C"}}/>
          </div>
        </div>
      )}

      {/* Add custom button on custom tab */}
      {mealTab==="custom" && (
        <button className="add-cat-btn" style={{marginBottom:16}} onClick={onOpenAddCustom}>
          <Plus size={16}/> Add Custom Recipe
        </button>
      )}

      {/* Empty states */}
      {mealTab==="all" && matched.length===0 && inventoryNames.length===0 && (
        <div className="empty-state"><div className="empty-icon"><ChefHat size={28}/></div><p>Add food items to your inventory to see recipe matches.</p></div>
      )}
      {mealTab==="all" && matched.length===0 && inventoryNames.length>0 && (
        <>
          <div className="empty-state" style={{paddingBottom:0}}>
            <div className="empty-icon"><ChefHat size={28}/></div>
            <p style={{marginBottom:8}}>No exact matches yet — red tags below are missing ingredients.</p>
          </div>
          {nearMisses.map((m,i)=>(
            <div className="meal-card" key={m.recipe.id} style={{animationDelay:`${i*0.05}s`}} onClick={()=>onSelect(m.recipe)}>
              <div className="meal-card-header"><div className="meal-name">{m.recipe.name}</div><div className="meal-time"><Clock size={11}/>{m.recipe.time}</div></div>
              <div style={{fontSize:12,color:"#9E8070",marginBottom:8}}>{m.matchCount}/{m.total} ingredients matched</div>
              <div className="meal-ingredients">
                {m.recipe.ingredients.map((ing,j)=>(
                  <span className={`ingredient-tag ${hasIngredient(ing)?"":"ingredient-missing"}`} key={j}>{ing}</span>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
      {mealTab==="favorites" && favMatched.length===0 && (
        <div className="empty-state"><div className="empty-icon"><Heart size={28}/></div><p>No favorited recipes yet. Tap the ♡ on any recipe card to save it here.</p></div>
      )}
      {mealTab==="custom" && customRecipes.length===0 && (
        <div className="empty-state"><div className="empty-icon"><PenLine size={28}/></div><p>No custom recipes yet. Add your own using the button above.</p></div>
      )}

      {/* Recipe cards */}
      {visible.map((r,i) => <RecipeCard key={r.id} r={r} i={i}/>)}

      {displayList.length > 12 && !showAll && (
        <button className="clear-btn" style={{marginTop:4}} onClick={()=>setShowAll(true)}>Show all {displayList.length} matches</button>
      )}

    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────
function BarChart({ data, color, title, icon }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      <div className="bar-chart-title">{icon}{title}</div>
      <div className="bars-wrap">
        {data.map((d,i)=>(
          <div className="bar-col" key={i}>
            <div className="bar-fill" style={{height:`${Math.max(4,(d.value/max)*90)}px`,background:color||"#C8956C"}}>
              <div className="bar-tooltip">{d.value} {d.unit}</div>
            </div>
            <div className="bar-label">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Multi-Line Chart ──────────────────────────────────────────────
function MultiLineChart({ seriesData, months }) {
  if (!months.length || !seriesData.length) return null;
  const W=358,H=110,PAD={t:10,r:10,b:24,l:28};
  const cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  const max=Math.max(...seriesData.flatMap(s=>s.values),1);
  return (
    <div className="line-chart-wrap">
      <div className="line-chart-title"><BarChart2 size={13}/>Monthly usage comparison</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        {[0,0.5,1].map((t,i)=><line key={i} x1={PAD.l} y1={PAD.t+cH*(1-t)} x2={PAD.l+cW} y2={PAD.t+cH*(1-t)} stroke="#EDE0D4" strokeWidth="1"/>)}
        {[0,Math.round(max/2),max].map((v,i)=><text key={i} x={PAD.l-4} y={PAD.t+cH*(1-v/max)+4} textAnchor="end" fontSize="8" fill="#9E8070">{v}</text>)}
        {seriesData.map((s,si)=>{
          const pts=s.values.map((v,xi)=>[PAD.l+xi*(months.length>1?cW/(months.length-1):0),PAD.t+cH*(1-v/max)]);
          const d=pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
          return <g key={si}><path d={d} fill="none" stroke={TREND_COLORS[si%TREND_COLORS.length]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>{pts.map((p,xi)=><circle key={xi} cx={p[0]} cy={p[1]} r="3" fill={TREND_COLORS[si%TREND_COLORS.length]} stroke="#fff" strokeWidth="1.5"/>)}</g>;
        })}
        {months.map((m,i)=><text key={i} x={PAD.l+i*(months.length>1?cW/(months.length-1):0)} y={H-4} textAnchor="middle" fontSize="8" fill="#9E8070">{monthLabel(m).split(" ")[0]}</text>)}
      </svg>
      <div className="chart-legend">{seriesData.map((s,i)=><div className="legend-item" key={i}><div className="legend-dot" style={{background:TREND_COLORS[i%TREND_COLORS.length]}}/>{s.name}</div>)}</div>
    </div>
  );
}

// ── Trends Tab ────────────────────────────────────────────────────
function TrendsTab({ items, log }) {
  const RANGES=["3M","6M","1Y","2Y","5Y","All"];
  const [range,setRange]=useState("6M");
  const [selectedItems,setSelected]=useState([]);
  const loggedNames=[...new Set(log.map(e=>e.name))].sort();
  const toggleItem=name=>setSelected(prev=>prev.includes(name)?prev.filter(n=>n!==name):[...prev,name]);
  const rangeMs={"3M":90,"6M":180,"1Y":365,"2Y":730,"5Y":1825,"All":99999};
  const cutoff=Date.now()-rangeMs[range]*86400000;
  const filteredLog=log.filter(e=>new Date(e.date).getTime()>=cutoff);
  function monthlyTotals(name){const entries=filteredLog.filter(e=>e.name===name);const map={};entries.forEach(e=>{const k=monthKey(e.date);map[k]=(map[k]||0)+e.qty;});return map;}
  const allMonths=[...new Set(filteredLog.map(e=>monthKey(e.date)))].sort();
  function burnRate(name){const vals=Object.values(monthlyTotals(name));if(!vals.length)return null;return vals.reduce((a,b)=>a+b,0)/vals.length;}
  function projectedRunout(name){const item=items.find(i=>i.name===name);if(!item)return null;const rate=burnRate(name);if(!rate)return null;const months=item.qty/rate;if(months<0.5)return{label:"< 2 weeks",tier:"urgent"};if(months<1)return{label:"~"+Math.round(months*30)+" days",tier:"soon"};return{label:months<2?"~1 month":"~"+Math.round(months)+" months",tier:"ok"};}
  const runoutItems=loggedNames.map(name=>({name,runout:projectedRunout(name)})).filter(x=>x.runout).sort((a,b)=>({urgent:0,soon:1,ok:2})[a.runout.tier]-({urgent:0,soon:1,ok:2})[b.runout.tier]);
  const focusName=selectedItems[0]||loggedNames[0];
  const focusMonthly=focusName?monthlyTotals(focusName):{};
  const focusItem=items.find(i=>i.name===focusName);
  const focusBarData=allMonths.map(m=>({label:monthLabel(m).split(" ")[0],value:focusMonthly[m]||0,unit:focusItem?.unit||""}));
  const compItems=selectedItems.length?selectedItems:loggedNames.slice(0,3);
  const seriesData=compItems.map(name=>({name,values:allMonths.map(m=>monthlyTotals(name)[m]||0)}));
  if(!log.length)return(<div><div className="trends-header-card"><h2><TrendingDown size={20}/>Consumption Trends</h2><p>Tap − on any item to start tracking usage.</p></div><div className="empty-state" style={{marginTop:20}}><div className="empty-icon"><BarChart2 size={28}/></div><p>No consumption data yet.</p></div></div>);
  return(
    <div>
      <div className="trends-header-card"><h2><TrendingDown size={20}/>Consumption Trends</h2><p>Every − tap is logged here. Trends build automatically over time.</p></div>
      <div className="range-row">{RANGES.map(r=><button key={r} className={`range-btn ${range===r?"active":""}`} onClick={()=>setRange(r)}>{r}</button>)}</div>
      <div className="stat-row">
        <div className="stat-card"><div className="stat-label"><TrendingDown size={12}/>Total uses</div><div className="stat-value">{filteredLog.length}</div><div className="stat-sub">in this period</div></div>
        <div className="stat-card"><div className="stat-label"><Package size={12}/>Items tracked</div><div className="stat-value">{loggedNames.length}</div><div className="stat-sub">unique items</div></div>
      </div>
      {runoutItems.length>0&&(<div className="trend-section"><div className="trend-section-title"><Calendar size={15}/>Projected Run-Out</div>{runoutItems.map(({name,runout})=>(<div className="runout-item" key={name}><div className="runout-info"><div className="runout-name">{name}</div><div className="runout-date">At current rate: {runout.label}</div></div><div className={`runout-badge ${runout.tier}`}>{runout.tier==="urgent"?"Soon!":runout.tier==="soon"?"Watch":"OK"}</div></div>))}</div>)}
      <div className="trend-section">
        <div className="trend-section-title"><Filter size={15}/>Compare Items</div>
        <div className="item-pill-row">{loggedNames.map((name,i)=>(<button key={name} className={`item-pill ${selectedItems.includes(name)?"active":""}`} style={selectedItems.includes(name)?{background:TREND_COLORS[selectedItems.indexOf(name)%TREND_COLORS.length]}:{}} onClick={()=>toggleItem(name)}>{name}</button>))}</div>
        {allMonths.length>0&&<MultiLineChart seriesData={seriesData} months={allMonths}/>}
      </div>
      {focusName&&focusBarData.length>0&&(<div className="trend-section"><div className="trend-section-title"><BarChart2 size={15}/>Monthly usage — {focusName}</div><BarChart data={focusBarData} color={TREND_COLORS[0]} title={`${focusName} used per month`} icon={null}/>{burnRate(focusName)&&(<div className="stat-card" style={{marginTop:8}}><div className="stat-label">Average burn rate</div><div className="stat-value" style={{fontSize:18}}>{burnRate(focusName).toFixed(1)} <span style={{fontSize:13,fontWeight:400,color:"#9E8070"}}>{focusItem?.unit||"units"} / month</span></div></div>)}</div>)}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────
function SettingsTab({ onReset, onLoadDemo, itemCount, logCount }) {
  const [confirm,setConfirm]=useState(null);
  return(
    <div>
      <div className="trends-header-card" style={{marginBottom:16}}>
        <div style={{fontFamily:"'Lora',serif",fontSize:18,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:8}}><Settings size={20}/>Settings</div>
        <p style={{fontSize:13,opacity:0.75,lineHeight:1.5}}>Manage your inventory data and preferences.</p>
      </div>
      <div className="settings-section">
        <div className="settings-section-title"><BarChart2 size={15}/>Your Data</div>
        <div className="settings-card">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{textAlign:"center",padding:"10px 0"}}><div style={{fontFamily:"'Lora',serif",fontSize:28,fontWeight:700,color:"#3D2B1F"}}>{itemCount}</div><div style={{fontSize:12,color:"#9E8070",marginTop:2}}>items tracked</div></div>
            <div style={{textAlign:"center",padding:"10px 0"}}><div style={{fontFamily:"'Lora',serif",fontSize:28,fontWeight:700,color:"#3D2B1F"}}>{logCount}</div><div style={{fontSize:12,color:"#9E8070",marginTop:2}}>consumption logs</div></div>
          </div>
        </div>
      </div>
      <div className="settings-section">
        <div className="settings-section-title"><Zap size={15}/>Demo Mode</div>
        <div className="settings-card">
          <div className="settings-row"><div className="settings-row-info"><div className="settings-row-label">Load demo inventory</div><div className="settings-row-sub">Populates 250+ items across 8 categories.</div></div></div>
          <button className="settings-btn settings-btn-primary" style={{marginTop:12,width:"100%",justifyContent:"center"}} onClick={()=>setConfirm("demo")}><Zap size={14}/>Load demo inventory</button>
        </div>
      </div>
      <div className="settings-section">
        <div className="settings-section-title"><AlertOctagon size={15}/>Danger Zone</div>
        <div className="settings-card">
          <div className="settings-row"><div className="settings-row-info"><div className="settings-row-label">Reset everything</div><div className="settings-row-sub">Deletes all items, categories, and history.</div></div></div>
          <button className="settings-btn settings-btn-danger" style={{marginTop:12,width:"100%",justifyContent:"center"}} onClick={()=>setConfirm("reset")}><RotateCcw size={14}/>Reset all data</button>
        </div>
      </div>
      {confirm&&(
        <div className="confirm-overlay" onClick={()=>setConfirm(null)}>
          <div className="confirm-box" onClick={e=>e.stopPropagation()}>
            {confirm==="reset"?(<><h3>Reset everything?</h3><p>All items, categories, and history will be permanently deleted.</p><div className="confirm-btns"><button className="btn btn-secondary" style={{flex:1}} onClick={()=>setConfirm(null)}>Cancel</button><button className="btn btn-primary" style={{flex:1,background:"#C0392B"}} onClick={()=>{onReset();setConfirm(null);}}>Yes, reset</button></div></>):(<><h3>Load demo inventory?</h3><p>This will replace your current items with 250+ demo items.</p><div className="confirm-btns"><button className="btn btn-secondary" style={{flex:1}} onClick={()=>setConfirm(null)}>Cancel</button><button className="btn btn-primary" style={{flex:1}} onClick={()=>{onLoadDemo();setConfirm(null);}}>Yes, load demo</button></div></>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]                     = useState("inventory");
  const [selectedRecipe,setSelectedRecipe] = useState(null);
  const [userId,setUserId]               = useState(null);
  const [syncing,setSyncing]             = useState(true);
  const [animClass,setAnimClass]         = useState("slide-in-up");
  const prevTabRef                       = useRef("inventory");
  const TAB_ORDER                        = ["inventory","shopping","meals","trends","settings"];

  // ── Favorites ────────────────────────────────────────────────
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavorites(next);
      if (userId) setDoc(doc(db,"users",userId,"data","favorites"),{ids:[...next]}).catch(console.warn);
      return next;
    });
  };

  // ── Custom recipes ───────────────────────────────────────────
  const [customRecipes, setCustomRecipes] = useState(() => loadCustomRecipes());
  const addCustomRecipe = (recipe) => {
    setCustomRecipes(prev => {
      const next = [...prev, recipe];
      saveCustomRecipes(next);
      if (userId) setDoc(doc(db,"users",userId,"data","customRecipes"),{recipes:next}).catch(console.warn);
      return next;
    });
  };

  const switchTab = (newTab) => {
    if (newTab===tab) return;
    const oldIdx=TAB_ORDER.indexOf(tab), newIdx=TAB_ORDER.indexOf(newTab);
    setAnimClass(newIdx>oldIdx?"slide-in-right":"slide-in-left");
    prevTabRef.current=tab; setTab(newTab);
  };

  const [categories,setCategories] = useState(()=>loadCategories());
  const [showAddCat,setShowAddCat] = useState(false);
  const [newCat,setNewCat]         = useState({label:"",iconKey:"Package",color:"#C8956C"});
  const [items,setItems]           = useState(()=>loadItems());
  const [log,setLog]               = useState(()=>loadLog());
  const [showAdd,setShowAdd]       = useState(false);
  const [showAddCustom,setShowAddCustom] = useState(false);
  const [search,setSearch]         = useState("");
  const [shopChecked,setShopChecked] = useState({});
  const [newItem,setNewItem]       = useState({name:"",category:"pantry",qty:1,unit:"count",low:1});
  const [duplicateItem,setDuplicateItem] = useState(null);

  const [collapsed,setCollapsed] = useState(()=>{ try{return JSON.parse(localStorage.getItem("hp_collapsed")||"{}");}catch{return{};} });
  const toggleCollapsed = (cat) => {
    setCollapsed(prev=>{const next={...prev,[cat]:!prev[cat]};try{localStorage.setItem("hp_collapsed",JSON.stringify(next));}catch{}return next;});
  };
  const itemRefs = useRef({});
  const scrollToItem = (itemId) => {
    const item=items.find(i=>i.id===itemId); if(!item)return;
    setCollapsed(prev=>{if(prev[item.category]){const next={...prev,[item.category]:false};try{localStorage.setItem("hp_collapsed",JSON.stringify(next));}catch{}return next;}return prev;});
    setTimeout(()=>{const el=itemRefs.current[itemId];if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("item-highlight");setTimeout(()=>el.classList.remove("item-highlight"),1400);}},320);
  };

  // ── Firebase ─────────────────────────────────────────────────
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async user=>{
      if(user){
        setUserId(user.uid);
        try{
          const snap=await getDoc(doc(db,"users",user.uid,"data","items"));
          if(snap.exists()){const d=snap.data();if(d.items){setItems(d.items);saveItems(d.items);}if(d.categories){setCategories(d.categories);saveCategories(d.categories);}}
          const logSnap=await getDoc(doc(db,"users",user.uid,"data","log"));
          if(logSnap.exists()&&logSnap.data().entries){const e=logSnap.data().entries;setLog(e);saveLog(e);}
          const favSnap=await getDoc(doc(db,"users",user.uid,"data","favorites"));
          if(favSnap.exists()&&favSnap.data().ids){const f=new Set(favSnap.data().ids);setFavorites(f);saveFavorites(f);}
          const custSnap=await getDoc(doc(db,"users",user.uid,"data","customRecipes"));
          if(custSnap.exists()&&custSnap.data().recipes){const r=custSnap.data().recipes;setCustomRecipes(r);saveCustomRecipes(r);}
        }catch(e){console.warn("Firestore load error",e);}
        setSyncing(false);
      }else{signInAnonymously(auth).catch(e=>{console.warn("Auth error",e);setSyncing(false);});}
    });
    return()=>unsub();
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{saveItems(items);if(!userId)return;setDoc(doc(db,"users",userId,"data","items"),{items,categories}).catch(console.warn);},[items,categories,userId]);
  useEffect(()=>{saveLog(log);if(!userId)return;setDoc(doc(db,"users",userId,"data","log"),{entries:log}).catch(console.warn);},[log,userId]);
  useEffect(()=>{saveCategories(categories);},[categories]);

  const addCategory=()=>{if(!newCat.label.trim())return;const key=newCat.label.toLowerCase().replace(/[^a-z0-9]/g,"_")+"_"+Date.now();setCategories(p=>({...p,[key]:{label:newCat.label.trim(),iconKey:newCat.iconKey,color:newCat.color}}));setNewCat({label:"",iconKey:"Package",color:"#C8956C"});setShowAddCat(false);};
  const deleteCategory=key=>setCategories(p=>{const n={...p};delete n[key];return n;});

  const handleReset=()=>{const dc={pantry:{label:"Pantry",iconKey:"Package",color:"#C8956C"},fridge:{label:"Fridge",iconKey:"Thermometer",color:"#7BAFC4"},freezer:{label:"Freezer",iconKey:"Wind",color:"#9BC4CB"},household:{label:"Household",iconKey:"Home",color:"#B5935A"}};setItems([]);setLog([]);setCategories(dc);if(userId){setDoc(doc(db,"users",userId,"data","items"),{items:[],categories:dc}).catch(console.warn);setDoc(doc(db,"users",userId,"data","log"),{entries:[]}).catch(console.warn);}};
  const handleLoadDemo=()=>{setItems(DEMO_ITEMS);setCategories(DEMO_CATEGORIES);if(userId)setDoc(doc(db,"users",userId,"data","items"),{items:DEMO_ITEMS,categories:DEMO_CATEGORIES}).catch(console.warn);};

  const lowItems=items.filter(i=>i.qty<=i.low);
  const updateQty=(id,delta)=>{if(delta<0){const item=items.find(i=>i.id===id);if(item&&item.qty>0)setLog(p=>[...p,{id:Date.now(),name:item.name,qty:1,unit:item.unit,date:new Date().toISOString()}]);}setItems(p=>p.map(i=>i.id===id?{...i,qty:Math.max(0,i.qty+delta)}:i));};
  const deleteItem=id=>setItems(p=>p.filter(i=>i.id!==id));
  const toggleShop=id=>setShopChecked(p=>({...p,[id]:!p[id]}));
  const clearChecked=()=>setShopChecked({});

  const addItem=()=>{
    if(!newItem.name.trim())return;
    const existing=items.find(i=>i.name.toLowerCase()===newItem.name.trim().toLowerCase());
    if(existing&&!duplicateItem){setDuplicateItem(existing);return;}
    if(existing&&duplicateItem){setItems(p=>p.map(i=>i.id===existing.id?{...i,qty:i.qty+Number(newItem.qty)}:i));}
    else{setItems(p=>[...p,{...newItem,id:Date.now(),qty:Number(newItem.qty),low:Number(newItem.low)}]);}
    setNewItem({name:"",category:"pantry",qty:1,unit:"count",low:1});setDuplicateItem(null);setShowAdd(false);
  };
  const addItemAsNew=()=>{setItems(p=>[...p,{...newItem,id:Date.now(),qty:Number(newItem.qty),low:Number(newItem.low)}]);setNewItem({name:"",category:"pantry",qty:1,unit:"count",low:1});setDuplicateItem(null);setShowAdd(false);};

  const filteredItems=items.filter(i=>i.name.toLowerCase().includes(search.toLowerCase()));
  const grouped=Object.keys(categories).reduce((acc,cat)=>{acc[cat]=filteredItems.filter(i=>i.category===cat).sort((a,b)=>a.name.localeCompare(b.name));return acc;},{});

  const NAV=[
    {key:"inventory",Icon:Package,      label:"Inventory"},
    {key:"shopping", Icon:ShoppingCart,  label:"Shopping" },
    {key:"meals",    Icon:UtensilsCrossed,label:"Meals"   },
    {key:"trends",   Icon:TrendingDown,  label:"Trends"   },
    {key:"settings", Icon:Settings,      label:"Settings" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-logo"><h1><Home size={18} color="#C8956C"/>Home <span>Pantry</span></h1></div>
          <div className="sidebar-nav">
            {NAV.map(({key,Icon,label})=>(
              <button key={key} className={`sidebar-nav-btn ${tab===key?"active":""}`} onClick={()=>switchTab(key)}>
                <Icon size={18}/>{label}
                {key==="inventory"&&lowItems.length>0&&<span className="sidebar-badge">{lowItems.length}</span>}
              </button>
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-sync">
              {syncing?<><div style={{width:6,height:6,borderRadius:"50%",background:"#C8956C",animation:"pulse 1.2s infinite"}}/> Syncing...</>:<><div style={{width:6,height:6,borderRadius:"50%",background:"#6B9E8A"}}/> Synced</>}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="main-area">
        <div className="content-wrapper">

          {/* Desktop header */}
          <div className="desktop-header">
            <div className="desktop-header-title">{tab==="inventory"?"Inventory":tab==="shopping"?"Shopping List":tab==="meals"?"What's for Dinner?":tab==="trends"?"Trends":"Settings"}</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {syncing&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C8956C",animation:"pulse 1.2s infinite"}}/>}
              {lowItems.length>0&&<div className="low-badge" onClick={()=>switchTab("inventory")}><AlertTriangle size={12}/>{lowItems.length} running low</div>}
            </div>
          </div>

          {/* Mobile header */}
          <div className="header">
            <div className="header-top" style={{marginBottom:0}}>
              <h1><Home size={20} color="#C8956C"/>Home <span>Pantry</span></h1>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {syncing&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C8956C",animation:"pulse 1.2s infinite"}}/>}
                {lowItems.length>0&&<div className="low-badge" onClick={()=>switchTab("inventory")}><AlertTriangle size={12}/>{lowItems.length} running low</div>}
              </div>
            </div>
          </div>

          <div className="content tab-viewport">
          <div key={tab} className={`tab-panel ${animClass}`}>

            {/* INVENTORY */}
            {tab==="inventory"&&(
              <>
                {lowItems.length>0&&(
                  <div className="alerts-banner">
                    <div className="alerts-banner-header"><Bell size={16}/>Running low</div>
                    <div className="alert-items">
                      {lowItems.slice(0,7).map(i=><span className="alert-tag alert-tag-btn" key={i.id} onClick={()=>scrollToItem(i.id)}>{i.name}</span>)}
                      {lowItems.length>7&&<span className="alert-overflow">+{lowItems.length-7} more</span>}
                    </div>
                  </div>
                )}
                <div className="search-bar">
                  <Search size={16}/>
                  <input placeholder="Search items…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  {search&&<button className="search-clear" onClick={()=>setSearch("")}><X size={16}/></button>}
                </div>
                <div className="inv-grid">
                {Object.entries(categories).map(([catKey,cat])=>{
                  const CatIcon=iconFromKey(cat.iconKey);
                  const catItems=grouped[catKey]||[];
                  const isOpen=!collapsed[catKey];
                  const estimatedHeight=catItems.length*90+60;
                  const isEmpty=catItems.length===0;
                  return(
                    <div className="category-section" key={catKey}>
                      <div className={`category-header ${isOpen&&!isEmpty?"open":""}`} onClick={()=>!isEmpty&&toggleCollapsed(catKey)} style={isEmpty?{cursor:"default"}:{}}>
                        <div className="cat-header-top">
                          <div className="category-icon" style={{background:cat.color+"22"}}><CatIcon size={16} color={cat.color}/></div>
                          <h2>{cat.label}</h2>
                          <span className="cat-count">{catItems.length} items</span>
                          <button className="cat-add-btn" title={`Add item to ${cat.label}`}
                            onClick={e=>{e.stopPropagation();setNewItem(p=>({...p,category:catKey}));setDuplicateItem(null);setShowAdd(true);}}>
                            <Plus size={14}/>
                          </button>
                          {isEmpty
                            ?<button className="cat-delete-btn" onClick={e=>{e.stopPropagation();deleteCategory(catKey);}}><Trash2 size={15}/></button>
                            :<ChevronDown size={16} className={`cat-chevron ${isOpen?"open":""}`}/>
                          }
                        </div>
                        {!isEmpty&&(()=>{
                          const wellStocked=catItems.filter(i=>i.qty>i.low).length;
                          const pct=Math.round((wellStocked/catItems.length)*100);
                          const barColor=pct>=80?"#6B9E8A":pct>=50?"#C8956C":"#C0392B";
                          return(
                            <div className="cat-health">
                              <div className="cat-health-row">
                                <span className="cat-health-info">
                                  <span className="cat-health-label">Above minimum</span>
                                  <Info size={11}/>
                                  <span className="cat-health-tooltip">% of items with quantity above their low stock threshold</span>
                                </span>
                                <span className="cat-health-pct" style={{color:barColor}}>{pct}%</span>
                              </div>
                              <div className="cat-health-track"><div className="cat-health-fill" style={{width:pct+"%",background:barColor}}/></div>
                            </div>
                          );
                        })()}
                      </div>
                      <div className={`category-items ${isOpen&&!isEmpty?"open":"closed"}`} style={isOpen&&!isEmpty?{maxHeight:estimatedHeight+"px",opacity:1}:{}}>
                        {catItems.map(item=>{
                          const isLow=item.qty<=item.low;
                          return(
                            <div className={`item-card ${isLow?"low":""}`} key={item.id} ref={el=>itemRefs.current[item.id]=el}>
                              <div className="item-info">
                                <div className="item-name">{item.name}</div>
                                <div className={`item-meta ${isLow?"low-text":""}`}>{isLow?<><AlertTriangle size={11}/>Running low</>:`Min: ${item.low} ${item.unit}`}</div>
                              </div>
                              <div className="qty-controls">
                                <button className="qty-btn minus" onClick={()=>updateQty(item.id,-1)}><Minus size={14}/></button>
                                <span className="qty-num">{item.qty}</span>
                                <button className="qty-btn plus" onClick={()=>updateQty(item.id,+1)}><Plus size={14}/></button>
                              </div>
                              <span className="unit-label">{item.unit}</span>
                              <button className="delete-btn" onClick={()=>deleteItem(item.id)}><Trash2 size={15}/></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </div>
                <button className="add-cat-btn" onClick={()=>setShowAddCat(true)}><FolderPlus size={16}/> New Category</button>
              </>
            )}

            {/* SHOPPING */}
            {tab==="shopping"&&(
              <>
                <div className="section-title">Shopping List</div>
                <div className="section-sub">{lowItems.length>0?`${lowItems.length} items running low — auto-generated from your inventory`:"Your pantry is well stocked!"}</div>
                {lowItems.length===0&&<div className="empty-state"><div className="empty-icon"><PartyPopper size={28}/></div><p>Nothing to buy right now.</p></div>}
                {lowItems.map(item=>{const shopCat=categories[item.category]||{label:item.category,iconKey:"Package",color:"#C8956C"};const CatIcon2=iconFromKey(shopCat.iconKey);const checked=shopChecked[item.id];return(<div key={item.id} className={`shop-item ${checked?"checked":""}`} onClick={()=>toggleShop(item.id)}><div className="shop-check">{checked&&<CheckCircle2 size={14}/>}</div><div className="shop-item-info"><div className="shop-item-name">{item.name}</div><div className="shop-item-cat"><CatIcon2 size={12} color={shopCat.color}/>{shopCat.label} · {item.qty} {item.unit} left</div></div><ShoppingBag size={16} color="#C4A98A"/></div>);})}
                {Object.values(shopChecked).some(Boolean)&&<button className="clear-btn" onClick={clearChecked}>Clear checked items</button>}
              </>
            )}

            {/* MEALS */}
            {tab==="meals"&&(
              <MealSuggestions
                items={items}
                onSelect={setSelectedRecipe}
                favorites={favorites}
                onToggleFav={toggleFavorite}
                customRecipes={customRecipes}
                onSaveCustom={addCustomRecipe}
                onOpenAddCustom={()=>setShowAddCustom(true)}
              />
            )}

            {/* TRENDS */}
            {tab==="trends"&&<TrendsTab items={items} log={log}/>}

            {/* SETTINGS */}
            {tab==="settings"&&<SettingsTab onReset={handleReset} onLoadDemo={handleLoadDemo} itemCount={items.length} logCount={log.length}/>}

          </div>
          </div>

          {/* FAB */}
          {tab==="inventory"&&<button className="add-fab" onClick={()=>setShowAdd(true)}><Plus size={24}/></button>}

          {/* Add Item Modal */}
          {showAdd&&(
            <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowAdd(false),setDuplicateItem(null))}>
              <div className="modal" style={{overflow:"hidden"}}>
                {!duplicateItem&&(
                  <div className="modal-screen-back" key="form">
                    <h3>Add Item</h3>
                    <div className="form-row">
                      <label className="form-label">Item Name</label>
                      <input className="form-input" placeholder="e.g. Olive Oil" value={newItem.name} onChange={e=>{setDuplicateItem(null);setNewItem(p=>({...p,name:e.target.value}));}}/>
                    </div>
                    <div className="form-row">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))}>
                        {Object.entries(categories).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="form-row-2">
                      <div className="form-row" style={{marginBottom:0}}>
                        <label className="form-label">Quantity</label>
                        <input className="form-input" type="number" min="0" value={newItem.qty} onChange={e=>setNewItem(p=>({...p,qty:e.target.value}))}/>
                      </div>
                      <div className="form-row" style={{marginBottom:0}}>
                        <label className="form-label">Unit</label>
                        <select className="form-select" value={newItem.unit} onChange={e=>setNewItem(p=>({...p,unit:e.target.value}))}>
                          {UNITS.map(u=><option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-row" style={{marginTop:14}}>
                      <label className="form-label">Low Stock Alert When Below</label>
                      <input className="form-input" type="number" min="0" value={newItem.low} onChange={e=>setNewItem(p=>({...p,low:e.target.value}))}/>
                    </div>
                    <div className="btn-row">
                      <button className="btn btn-secondary" onClick={()=>{setDuplicateItem(null);setShowAdd(false);}}>Cancel</button>
                      <button className="btn btn-primary" onClick={addItem}>Add Item</button>
                    </div>
                  </div>
                )}
                {duplicateItem&&(
                  <div className="modal-screen" key="dup">
                    <div className="modal-screen-title">
                      <button className="modal-back-btn" onClick={()=>setDuplicateItem(null)}><ChevronDown size={20} style={{transform:"rotate(90deg)"}}/></button>
                      <span style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:700,color:"#3D2B1F"}}>Already exists</span>
                    </div>
                    <div className="dup-item-card">
                      <div className="dup-item-card-name">{duplicateItem.name}</div>
                      <div className="dup-item-card-meta">
                        <span style={{background:categories[duplicateItem.category]?.color+"22",color:categories[duplicateItem.category]?.color,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20}}>
                          {(categories[duplicateItem.category]||{label:duplicateItem.category}).label}
                        </span>
                        Currently: <strong>{duplicateItem.qty} {duplicateItem.unit}</strong>
                      </div>
                    </div>
                    <div className="dup-qty-row">
                      <div className="dup-qty-label">Adding <strong>{newItem.qty} {newItem.unit}</strong> will bring total to</div>
                      <div><span className="dup-qty-result">{duplicateItem.qty+Number(newItem.qty)}</span><span className="dup-qty-unit"> {newItem.unit}</span></div>
                    </div>
                    <div className="btn-row">
                      <button className="btn btn-secondary" onClick={addItemAsNew}>Add as New</button>
                      <button className="btn btn-primary" onClick={addItem}>Merge +{newItem.qty}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Category Modal */}
          {showAddCat&&(
            <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddCat(false)}>
              <div className="modal">
                <h3>New Category</h3>
                <div className="form-row"><label className="form-label">Category Name</label><input className="form-input" placeholder="e.g. Spice Rack" value={newCat.label} onChange={e=>setNewCat(p=>({...p,label:e.target.value}))}/></div>
                <div className="form-row"><label className="form-label">Icon</label><div className="icon-grid">{ICON_OPTIONS.map(({key,Icon:Ic})=>(<button key={key} className={`icon-opt ${newCat.iconKey===key?"selected":""}`} onClick={()=>setNewCat(p=>({...p,iconKey:key}))}><Ic size={18}/></button>))}</div></div>
                <div className="form-row"><label className="form-label">Color</label><div className="color-grid">{CATEGORY_COLORS.map(c=>(<div key={c} className={`color-swatch ${newCat.color===c?"selected":""}`} style={{background:c}} onClick={()=>setNewCat(p=>({...p,color:c}))}/>))}</div></div>
                <div className="btn-row"><button className="btn btn-secondary" onClick={()=>setShowAddCat(false)}>Cancel</button><button className="btn btn-primary" onClick={addCategory}>Create</button></div>
              </div>
            </div>
          )}

          {/* Add Custom Recipe Modal */}
          {showAddCustom && (
            <AddCustomRecipeModal
              onClose={()=>setShowAddCustom(false)}
              onSave={r=>{addCustomRecipe(r);setShowAddCustom(false);}}
            />
          )}

          {/* Recipe Detail Modal */}
          {selectedRecipe&&(
            <div className="modal-overlay" onClick={()=>setSelectedRecipe(null)}>
              <div className="recipe-modal" onClick={e=>e.stopPropagation()}>
                <div className="recipe-modal-header" style={{position:"relative"}}>
                  <button className="recipe-close-btn" onClick={()=>setSelectedRecipe(null)}><X size={16}/></button>
                  <div className="recipe-modal-title">{selectedRecipe.name}</div>
                  <div className="recipe-modal-meta">
                    {selectedRecipe.time&&<div className="recipe-modal-tag"><Clock size={12}/>{selectedRecipe.time}</div>}
                    <div className="recipe-modal-tag">{selectedRecipe.cuisine}</div>
                    {selectedRecipe.servings&&<div className="recipe-modal-tag"><Users size={12}/>Serves {selectedRecipe.servings}</div>}
                    {selectedRecipe.isCustom&&<span className="custom-badge"><PenLine size={9}/>Custom</span>}
                    <button className={`recipe-fav-btn ${favorites.has(String(selectedRecipe.id))?"active":""}`}
                      onClick={()=>toggleFavorite(String(selectedRecipe.id))}>
                      <Heart size={13}/>{favorites.has(String(selectedRecipe.id))?"Favorited":"Favorite"}
                    </button>
                  </div>
                  <div className="recipe-modal-divider"/>
                </div>
                <div className="recipe-modal-scroll">
                  <div className="recipe-section-title"><BookOpen size={15}/>Ingredients</div>
                  {(selectedRecipe.ingredientsWithQty||selectedRecipe.ingredients.map(i=>({name:i,qty:""}))).map((ing,i)=>(
                    <div className="recipe-ingredient-row" key={i}>
                      <span className="recipe-ingredient-name">{ing.name}</span>
                      <span className="recipe-ingredient-qty">{ing.qty}</span>
                    </div>
                  ))}
                  {selectedRecipe.steps&&selectedRecipe.steps.length>0&&(
                    <>
                      <div className="recipe-section-title" style={{marginTop:24}}><ChefHat size={15}/>Instructions</div>
                      {selectedRecipe.steps.map((step,i)=>(
                        <div className="recipe-step" key={i}>
                          <div className="recipe-step-num">{i+1}</div>
                          <div className="recipe-step-text">{step}</div>
                        </div>
                      ))}
                    </>
                  )}
                  {selectedRecipe.isCustom&&(
                    <button className="clear-btn" style={{marginTop:16,color:"#C0392B",borderColor:"#F5B8A0"}}
                      onClick={()=>{
                        setCustomRecipes(prev=>{const n=prev.filter(r=>r.id!==selectedRecipe.id);saveCustomRecipes(n);if(userId)setDoc(doc(db,"users",userId,"data","customRecipes"),{recipes:n}).catch(console.warn);return n;});
                        setSelectedRecipe(null);
                      }}>
                      Delete this recipe
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>{/* end content-wrapper */}

        {/* Bottom Nav */}
        <div className="bottom-nav">
          {NAV.map(({key,Icon,label})=>(
            <button key={key} className={`nav-btn ${tab===key?"active":""}`} onClick={()=>switchTab(key)}>
              <Icon size={21}/><span className="nav-label">{label}</span>
            </button>
          ))}
        </div>

        </div>{/* end main-area */}
      </div>{/* end app */}
      <Analytics />
    </>
  );
}
