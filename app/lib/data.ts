export const categories = [
  { id: "all", name: "Todos" },
  { id: "burgers", name: "Burgers" },
  { id: "combos", name: "Combos" },
  { id: "sushi", name: "Sushi" },
  { id: "drinks", name: "Bebidas" },
];

export const products = [
  { id: 1, cat: "burgers", name: "The King Truffle", desc: "200g Carne Angus, mayonesa de trufa negra, queso brie fundido.", price: 14.50, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", hot: true },
  { id: 2, cat: "burgers", name: "Classic Smash", desc: "Doble carne aplastada, queso americano, cebolla caramelizada.", price: 9.99, img: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800", hot: false },
  { id: 3, cat: "sushi", name: "Volcano Roll", desc: "Langostino tempura, topping de kani picante.", price: 12.00, img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop", hot: false },
  { id: 4, cat: "combos", name: "Date Night", desc: "2 Burgers + 2 Fries + 2 Drinks.", price: 22.00, img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800", hot: true },
];

export const modifiers = [
  { id: "fries", name: "Papas Fritas", price: 2.50 },
  { id: "bacon", name: "Extra Bacon", price: 1.50 },
  { id: "soda", name: "Coca Cola", price: 1.50 }
];

// Tipos para TypeScript
export type Product = typeof products[0];
export type Modifier = typeof modifiers[0];