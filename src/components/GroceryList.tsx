import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, ShoppingCart } from 'lucide-react';
import db from '../db';

export default function GroceryList() {
    // Get all items manually added
    const manualItems = useLiveQuery(() => db.groceryList.toArray()) || [];

    // Get pantry items that are below threshold
    const lowStockItems = useLiveQuery(() =>
        db.inventory.filter(item => item.hasThreshold && item.quantity <= item.threshold).toArray()
    ) || [];

    const handleRemoveManualItem = async (id?: number) => {
        if (id) await db.groceryList.delete(id);
    };

    const hasItems = manualItems.length > 0 || lowStockItems.length > 0;

    return (
        <div className="container">
            <div className="header">
                <h1>Grocery List</h1>
            </div>

            <div style={{ marginTop: 16 }}>
                {!hasItems && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p>Your grocery list is empty.</p>
                        <p style={{ fontSize: 14 }}>Items will automatically appear here when pantry stock falls below your set threshold.</p>
                    </div>
                )}

                {lowStockItems.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 12, color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--warning-color)' }}></span>
                            Low Stock Alert
                        </h3>
                        {lowStockItems.map((item: any) => (
                            <div key={`inv-${item.id}`} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{item.name}</h4>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                                        Have: {item.quantity} · Threshold: {item.threshold}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {manualItems.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Added Manually</h3>
                        {manualItems.map((item: any) => (
                            <div key={`man-${item.id}`} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{item.name}</h4>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Qty: {item.quantity}</p>
                                </div>
                                <button
                                    onClick={() => handleRemoveManualItem(item.id)}
                                    style={{ background: 'transparent', color: 'var(--danger-color)', padding: 8 }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
