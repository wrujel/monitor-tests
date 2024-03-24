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

export const generateProduct = () => {
  const product = `p${new Date()
    .toISOString()
    .split("T")[0]
    .replaceAll("-", "")}${Math.floor(Math.random() * 100)}`;
  return {
    name: product,
    price: Math.floor(Math.random() * 1000).toString(),
    description: "description",
  };
};
