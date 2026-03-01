import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Minus, Trash2, AlertCircle, Package } from 'lucide-react';
import db from '../db';
import { Link } from 'react-router-dom';

export default function InventoryList() {
    const items = useLiveQuery(() => db.inventory.toArray()) || [];

    const updateQuantity = async (id: number, delta: number) => {
        const item = await db.inventory.get(id);
        if (!item) return;

        const newQty = Math.max(0, item.quantity + delta);
        await db.inventory.update(id, { quantity: newQty, lastUpdated: Date.now() });
    };

    const removeItem = async (id: number) => {
        if (confirm('Are you sure you want to remove this item?')) {
            await db.inventory.delete(id);
        }
    };

    return (
        <div className="container">
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>My Pantry ({items.length})</h1>
            </div>

            <div style={{ marginTop: 16 }}>
                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <p>Your pantry is empty!</p>
                        <Link to="/scanner" style={{ display: 'inline-block', marginTop: 16 }}>
                            <button className="btn-primary">Scan an Item</button>
                        </Link>
                    </div>
                ) : (
                    items.map((item: any) => (
                        <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button style={{ padding: 6 }} onClick={() => removeItem(item.id!)} className="btn-danger">
                                        <Trash2 size={16} />
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

                            {item.hasThreshold && (
                                <div style={{ fontSize: 12, color: item.quantity <= item.threshold ? 'var(--warning-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {item.quantity <= item.threshold && <AlertCircle size={14} />}
                                    Low stock alert at: {item.threshold} {item.quantity <= item.threshold ? '(Added to Grocery List)' : ''}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
