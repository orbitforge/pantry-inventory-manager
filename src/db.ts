import Dexie, { type EntityTable } from 'dexie';

export interface InventoryItem {
  id?: number;
  upc: string;
  name: string;
  quantity: number;
  threshold: number;
  hasThreshold: boolean;
  image?: string;
  lastUpdated: number;
}

export interface GroceryListItem {
  id?: number;
  name: string;
  quantity: number;
  inventoryId?: number; // link back to inventory if generated automatically
}

const db = new Dexie('PantryInventoryManagerDB') as Dexie & {
  inventory: EntityTable<
    InventoryItem,
    'id'
  >;
  groceryList: EntityTable<
    GroceryListItem,
    'id'
  >;
};

db.version(1).stores({
  inventory: '++id, upc, name',
  groceryList: '++id, name, inventoryId'
});

export default db;
