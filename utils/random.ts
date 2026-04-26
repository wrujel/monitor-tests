export const generateCredentials = () => {
  const user = `user${new Date()
    .toISOString()
    .split("T")[0]
    .replaceAll("-", "")}${Math.floor(Math.random() * 10000)}`;
  return {
    username: user,
    email: `${user}@example.com`,
  };
};

const ADJECTIVES = [
  "Premium", "Portable", "Wireless", "Smart", "Pro", "Compact",
  "Ultra", "Classic", "Deluxe", "Modern", "Eco", "Advanced",
];

const PRODUCT_TYPES = [
  "Headphones", "Keyboard", "Monitor", "Mouse", "Speaker",
  "Laptop", "Tablet", "Camera", "Charger", "Webcam",
  "Microphone", "Controller", "Hub", "Stand", "Backpack",
];

const DESCRIPTIONS = [
  "High-quality build with exceptional performance and durability.",
  "Designed for everyday use with a sleek, modern aesthetic.",
  "Engineered for professionals who demand the best.",
  "Lightweight and portable without compromising on features.",
  "Delivers outstanding value for home and office use.",
  "Built to last with premium materials and precise craftsmanship.",
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Base-36 run ID keeps names short while ensuring cross-run uniqueness,
// preventing leftover DB products from causing dropdown selector collisions.
const RUN_ID = Date.now().toString(36);
let _productSeq = 0;

export const generateProduct = () => {
  const seq = ++_productSeq;
  return {
    name: `${pick(ADJECTIVES)} ${pick(PRODUCT_TYPES)} ${RUN_ID}${seq}`,
    price: Math.floor(Math.random() * 1000).toString(),
    description: pick(DESCRIPTIONS),
  };
};
