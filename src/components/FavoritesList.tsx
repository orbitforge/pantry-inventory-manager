import { useLiveQuery } from 'dexie-react-hooks';
import { Minus, Plus, Trash2, Package, Star, ShoppingCart } from 'lucide-react';
import db from '../db';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ProductForm from './ProductForm';

export default function FavoritesList() {
    const items = useLiveQuery(() => db.inventory.filter(item => !!item.isFavorite).toArray()) || [];
    const [editingItem, setEditingItem] = useState<any>(null);

    const updateQuantity = async (id: number, delta: number) => {
        const item = await db.inventory.get(id);
        if (item) {
            const newQuantity = Math.max(0, item.quantity + delta);
            await db.inventory.update(id, { quantity: newQuantity, lastUpdated: Date.now() });
        }
    };

    const toggleFavorite = async (id: number, currentFav: boolean) => {
        await db.inventory.update(id, { isFavorite: !currentFav, lastUpdated: Date.now() });
    };

    const addToGrocery = async (item: any) => {
        const existing = await db.groceryList.where('name').equals(item.name).first();
        if (existing) {
            await db.groceryList.update(existing.id!, { quantity: existing.quantity + 1 });
        } else {
            await db.groceryList.add({
                name: item.name,
                quantity: 1,
                inventoryId: item.id
            });
        }
    };

    const removeItem = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            await db.inventory.delete(id);
        }
    };

    if (editingItem) {
        return (
            <div className="container">
                <ProductForm initialItem={editingItem} onComplete={() => setEditingItem(null)} />
                <button onClick={() => setEditingItem(null)} className="btn-primary" style={{ marginTop: 16, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                    Cancel Editing
                </button>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Favorites</h1>
            </div>

            <div style={{ marginTop: 16 }}>
                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <Star size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p>You haven't starred any items yet.</p>
                        <p style={{ fontSize: 14 }}>Tap the star icon on any pantry item to add it here.</p>
                        <Link to="/" style={{ display: 'inline-block', marginTop: 16 }}>
                            <button className="btn-primary">View Pantry</button>
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {items.sort((a, b) => a.name.localeCompare(b.name)).map((item: any) => (
                            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div
                                        onClick={() => setEditingItem(item)}
                                        style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, backgroundColor: 'white' }} />
                                        ) : (
                                            <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Package size={24} color="var(--text-secondary)" />
                                            </div>
                                        )}
                                        <div>
                                            {item.brand && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.brand}</div>}
                                            <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.2 }}>{item.name}</h3>
                                            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>UPC: {item.upc}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button style={{ padding: 6, background: 'none' }} onClick={() => toggleFavorite(item.id!, !!item.isFavorite)} title="Toggle Favorite">
                                            <Star size={20} color={item.isFavorite ? 'gold' : 'var(--text-secondary)'} fill={item.isFavorite ? 'gold' : 'none'} />
                                        </button>
                                        <button style={{ padding: 6, background: 'none' }} onClick={() => addToGrocery(item)} title="Add to Grocery List">
                                            <ShoppingCart size={20} color="var(--accent-color)" />
                                        </button>
                                        <button style={{ padding: 6, background: 'none' }} onClick={() => removeItem(item.id!)} className="btn-danger" title="Delete from Pantry">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-color)', padding: 8, borderRadius: 8 }}>
                                    <span style={{ fontWeight: 500 }}>Quantity</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <button onClick={() => updateQuantity(item.id!, -1)} style={{ padding: 8, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Minus size={16} />
                                        </button>
                                        <span style={{ fontSize: 18, fontWeight: 'bold', minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id!, 1)} style={{ padding: 8, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-color)', color: 'white' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
