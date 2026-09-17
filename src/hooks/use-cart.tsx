import { X } from "lucide-react"
import { toast } from "sonner"
import { create } from "zustand"
import { MAX_PER_LINE } from "@/lib/cart-limits"
import { persist, createJSONStorage } from "zustand/middleware"

export type CartItem = {
    photoId: number,
    name: string,
    imageUrl: string,
    size: string,
    price: number,
    attributes: {
        size: string,
        price: number,
    },
    quantity: number,
    /* Opcionales a proposito: los carritos ya guardados en `cart-storage` se
       escribieron antes de que existieran, y el carrito tiene que seguir
       renderizandolos. Sin `href` la linea muestra el titulo como texto plano
       en vez de enlazarlo a la obra. */
    href?: string,
    alt?: string,
}

interface CartStore {
    items: CartItem[],
    addItem: (data: CartItem) => void,
    removeItem: (photoId: number, size: string) => void,
    setQuantity: (photoId: number, size: string, quantity: number) => void,
    removeAll: () => void,
}

export const useCart = create(persist<CartStore>((set, get) => ({
    items: [],

    addItem: (data: CartItem) => {
        const currentItems = get().items
        const existingItem = currentItems.find(
            item => item.photoId === data.photoId && item.size === data.size,
        )

        if (existingItem) {
            /* En el tope no se suma en silencio: el boton dijo "Add to cart" y
               el carrito se quedaria igual sin explicar por que. */
            if (existingItem.quantity >= MAX_PER_LINE) {
                return toast(`${MAX_PER_LINE} copies is the maximum for one size`)
            }

            set({
                items: currentItems.map(item =>
                    item.photoId === data.photoId && item.size === data.size
                        /* El spread de `data` primero repone `href` y `alt` en las
                           lineas guardadas antes de que esos campos existieran. */
                        ? { ...item, ...data, quantity: item.quantity + 1 }
                        : item,
                ),
            })
            return toast("Quantity updated")
        }

        set({
            items: [...get().items, data]
        })
        toast("Added to cart", {
            action: {
                label: <X size={20} strokeWidth={2} />,
                onClick: () => get().removeItem(data.photoId, data.size)
            }
        })
    },

    removeItem: (photoId: number, size: string) => {
        const items = get().items
        const index = items.findIndex(item => item.photoId === photoId && item.size === size)
        if (index === -1) return
        const removedItem = items[index]

        set({ items: items.filter((_, position) => position !== index) })
        toast("Removed from cart", {
            action: {
                label: <X size={20} strokeWidth={2} />,
                /* Vuelve a SU lugar, no al final: deshacer que te reordene la
                   lista no es deshacer. */
                onClick: () => {
                    const current = get().items
                    set({ items: [...current.slice(0, index), removedItem, ...current.slice(index)] })
                }
            }
        })
    },

    /* Sin toast: esto se dispara en cada click del stepper y un aviso por click
       seria ruido. El carrito lo anuncia por una live region. */
    setQuantity: (photoId: number, size: string, quantity: number) => {
        /* Entre 1 y el tope. Un carrito viejo en `localStorage` puede traer un
           numero de antes de que existiera el limite, y esta pinza lo corrige
           en cuanto alguien toca el stepper. */
        const next = Math.min(MAX_PER_LINE, Math.max(1, Math.floor(quantity)))
        if (!Number.isFinite(next)) return

        set({
            items: get().items.map(item =>
                item.photoId === photoId && item.size === size
                    ? { ...item, quantity: next }
                    : item,
            ),
        })
    },

    removeAll: () => set({ items: [] }),
}), {
    name: "cart-storage",
    storage: createJSONStorage(() => localStorage),
}))


export default useCart
