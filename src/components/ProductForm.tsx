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
    const [brand, setBrand] = useState('');
    const [image, setImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [hasThreshold, setHasThreshold] = useState(false);
    const [threshold, setThreshold] = useState(() => {
        const saved = localStorage.getItem('pantry_default_threshold');
        return saved ? parseInt(saved, 10) : 1;
    });
    const [category, setCategory] = useState('Other');
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
                setBrand(existing.brand || '');
                setImage(existing.image || '');
                setCategory(existing.category || 'Other');
                setQuantity(existing.quantity + 1); // bump qty if exists
                setHasThreshold(existing.hasThreshold);
                setThreshold(existing.threshold);
                setIsLoading(false);
                return;
            }

            // If not local, check UPCItemDB Trial API via CORS proxy to bypass browser restrictions
            let foundInUpcItemDb = false;
            try {
                const apiUrl = encodeURIComponent(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
                const res = await fetch(`https://api.allorigins.win/raw?url=${apiUrl}`);
                const data = await res.json();

                if (data.code === 'OK' && data.items && data.items.length > 0) {
                    const item = data.items[0];
                    setName(item.title || '');
                    setBrand(item.brand || '');
                    if (item.category && typeof item.category === 'string') {
                        // try to map UPCItemDB category string
                        const lowerCat = item.category.toLowerCase();
                        if (lowerCat.includes('beverage') || lowerCat.includes('drink')) setCategory('Beverages');
                        else if (lowerCat.includes('can') || lowerCat.includes('soup')) setCategory('Canned Goods');
                        else if (lowerCat.includes('snack') || lowerCat.includes('candy') || lowerCat.includes('chip')) setCategory('Snacks');
                        else if (lowerCat.includes('spice') || lowerCat.includes('seasoning')) setCategory('Spices');
                        else if (lowerCat.includes('bak')) setCategory('Baking');
                    }
                    if (item.images && item.images.length > 0) {
                        setImage(item.images[0]);
                    }
                    foundInUpcItemDb = true;
                }
            } catch (upcErr) {
                console.error("UPCItemDB failed", upcErr);
            }

            // Fallback to Open Food Facts
            if (!foundInUpcItemDb) {
                const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
                const offData = await offRes.json();

                if (offData.status === 1 && offData.product) {
                    setName(offData.product.product_name || offData.product.generic_name || '');
                    if (offData.product.brands) {
                        setBrand(offData.product.brands.split(',')[0]);
                    }
                    if (offData.product.image_url) {
                        setImage(offData.product.image_url);
                    }
                } else {
                    setError('Product not found in any database. Please enter details manually.');
                }
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
                    brand,
                    image,
                    category,
                    quantity,
                    hasThreshold,
                    threshold,
                    lastUpdated: Date.now()
                });
            } else {
                await db.inventory.add({
                    upc,
                    name,
                    brand,
                    image,
                    category,
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

                    {image && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                            <img src={image} alt="Product" style={{ height: 120, objectFit: 'contain', borderRadius: 8 }} />
                        </div>
                    )}

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

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>Brand (Optional)</label>
                        <input
                            type="text"
                            className="input"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="e.g. Campbell's"
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>Category</label>
                        <select
                            className="input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="Baking">Baking</option>
                            <option value="Beverages">Beverages</option>
                            <option value="Canned Goods">Canned Goods</option>
                            <option value="Dairy">Dairy</option>
                            <option value="Produce">Produce</option>
                            <option value="Snacks">Snacks</option>
                            <option value="Spices">Spices</option>
                            <option value="Other">Other</option>
                        </select>
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
