import { useState, useEffect } from 'react';
import { Package, Plus, Minus, AlertTriangle, Save } from 'lucide-react';
import db from '../db';
import { useNavigate } from 'react-router-dom';

interface ProductFormProps {
    initialUpc?: string;
    onComplete?: () => void;
}

export default function ProductForm({ initialUpc = '', onComplete }: ProductFormProps) {
    const navigate = useNavigate();
    const [upc, setUpc] = useState(initialUpc);
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [hasThreshold, setHasThreshold] = useState(false);
    const [threshold, setThreshold] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Extract lookup into an async function
    const lookupUpc = async (barcode: string) => {
        setIsLoading(true);
        setError('');
        try {
            // Check local DB first
            const existing = await db.inventory.where('upc').equals(barcode).first();
            if (existing) {
                setName(existing.name);
                setQuantity(existing.quantity + 1); // bump qty if exists
                setHasThreshold(existing.hasThreshold);
                setThreshold(existing.threshold);
                setIsLoading(false);
                return;
            }

            // If not local, check Open Food Facts
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const data = await res.json();

            if (data.status === 1 && data.product) {
                setName(data.product.product_name || data.product.generic_name || '');
            } else {
                setError('Product not found in database. Please enter details manually.');
            }
        } catch (err) {
            setError('Error looking up product. Please enter manually.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialUpc) {
            lookupUpc(initialUpc);
        }
    }, [initialUpc]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Product name is required.');
            return;
        }

        try {
            const existing = upc ? await db.inventory.where('upc').equals(upc).first() : null;

            if (existing && existing.id) {
                await db.inventory.update(existing.id, {
                    name,
                    quantity,
                    hasThreshold,
                    threshold,
                    lastUpdated: Date.now()
                });
            } else {
                await db.inventory.add({
                    upc,
                    name,
                    quantity,
                    hasThreshold,
                    threshold,
                    lastUpdated: Date.now()
                });
            }

            if (onComplete) {
                onComplete();
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save to database.');
        }
    };

    return (
        <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package /> Product Details
            </h2>

            {isLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading product info...
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {error && <div style={{ backgroundColor: 'rgba(248, 81, 73, 0.1)', color: 'var(--danger-color)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>UPC / Barcode (Optional)</label>
                        <input
                            type="text"
                            className="input"
                            value={upc}
                            onChange={(e) => setUpc(e.target.value)}
                            placeholder="e.g. 0123456789"
                        />
                        {upc && !initialUpc && (
                            <button type="button" onClick={() => lookupUpc(upc)} style={{ fontSize: 12, padding: '4px 8px' }}>
                                Look Up UPC
                            </button>
                        )}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>Product Name *</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Tomato Soup"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>Quantity</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button type="button" onClick={() => setQuantity(Math.max(0, quantity - 1))} style={{ padding: 12, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Minus size={20} />
                            </button>
                            <span style={{ fontSize: 24, fontWeight: 'bold', minWidth: 40, textAlign: 'center' }}>{quantity}</span>
                            <button type="button" onClick={() => setQuantity(quantity + 1)} style={{ padding: 12, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-color)', color: 'white' }}>
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: 24, padding: 16, backgroundColor: 'var(--bg-color)', borderRadius: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: hasThreshold ? 16 : 0 }}>
                            <input
                                type="checkbox"
                                checked={hasThreshold}
                                onChange={(e) => setHasThreshold(e.target.checked)}
                                style={{ width: 20, height: 20, accentColor: 'var(--accent-color)' }}
                            />
                            <span style={{ fontWeight: 500 }}>Low Stock Alert</span>
                        </label>

                        {hasThreshold && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                                <AlertTriangle size={20} color="var(--warning-color)" />
                                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Alert when qty reaches:</span>
                                <input
                                    type="number"
                                    className="input"
                                    value={threshold}
                                    onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
                                    min="0"
                                    style={{ width: 80, marginBottom: 0, padding: 8 }}
                                />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 18, padding: 16 }}>
                        <Save size={20} />
                        Save to Pantry
                    </button>
                </form>
            )}
        </div>
    );
}
