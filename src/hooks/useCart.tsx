import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
   const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
    prevCartRef.current = cart;
  });

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if(cartPreviousValue !== cart){
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart));
    }
  },[cart,cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      const newOrder = [...cart];

      const productExists = newOrder.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
     
   
      const productAmount = productExists ? productExists.amount : 0;

      const orderAmount = productAmount + 1;

      if(orderAmount > stockAmount)
      {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if(productExists)
      {
        productExists.amount = orderAmount;
      } else {
        const product = await api.get(`/products/${productId}`);
            console.log(product.data)
        const newProduct = {
            ...product.data,
            amount: 1
        }
        newOrder.push(newProduct);
      }
      setCart(newOrder);

      

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
       const prodIndex = newCart.findIndex(p => p.id === productId);

       if(prodIndex >= 0 )
       {
        newCart.splice(prodIndex, 1);
        setCart(newCart);
       } else {
         throw Error();
       }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){ return; }

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if(amount > stockAmount)
      {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = [...cart];
      const productExists = newCart.find(product => product.id === productId);

      if(productExists)
      {
        productExists.amount = amount;
        setCart(newCart);
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
function userRef() {
  throw new Error('Function not implemented.');
}

