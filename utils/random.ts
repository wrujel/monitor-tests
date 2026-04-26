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

let _productSeq = 0;

export const generateProduct = () => {
  // Use millisecond timestamp + sequential counter so names are unique across
  // runs AND within the same run. This prevents leftover DB products from a
  // previous failed run creating substring collisions in dropdown selectors.
  const product = `p${Date.now()}${++_productSeq}`;
  return {
    name: product,
    price: Math.floor(Math.random() * 1000).toString(),
    description: "description",
  };
};
