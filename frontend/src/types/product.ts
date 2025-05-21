export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured?: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
}
