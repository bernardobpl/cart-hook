import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: { amount: stockAmount }} = await api.get<Stock>(`/stock/${productId}`)
      const productFound = cart.find(product => product.id === productId)
      if(productFound){

        if(productFound.amount + 1 <= stockAmount){
          const updatedCart = cart.map(product => product.id === productId
            ? ({...product, amount: product.amount +1}) 
            : product
          )
          setCart(updatedCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }

      } else {
        const { data: newProduct } = await api.get<Product>(`/products/${productId}`)

        if(stockAmount > 0){
          const updatedCart = [...cart, {...newProduct, amount: 1}]
          setCart(updatedCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(cart.find(prd => prd.id === productId)){
        const updatedCart = cart.filter(product => product.id !== productId)
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw new Error()
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
      if(amount <= 0) return

      const product = cart.find(prd => prd.id === productId)

      if(product){
        if(amount > product.amount){
          const { data: { amount: stockAmount }} = await api.get<Stock>(`/stock/${productId}`)
          if(amount <= stockAmount){
            const updatedCart = cart.map(prd => prd.id === productId 
              ? ({...prd, amount})
              : prd  
            )
            setCart(updatedCart)
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        }

        if(amount < product.amount){
          const updatedCart = cart.map(prd => prd.id === productId 
            ? ({...prd, amount})
            : prd  
          )
          setCart(updatedCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
        }
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
