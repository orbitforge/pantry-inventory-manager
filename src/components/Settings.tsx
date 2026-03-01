import { useState } from 'react';
import { Download } from 'lucide-react';
import db from '../db';

export default function Settings() {
    const [message, setMessage] = useState('');
    const [defaultThreshold, setDefaultThreshold] = useState(() => {
        const saved = localStorage.getItem('pantry_default_threshold');
        return saved ? parseInt(saved, 10) : 1;
    });

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10) || 0;
        setDefaultThreshold(val);
        localStorage.setItem('pantry_default_threshold', val.toString());
        setMessage('Settings saved!');
        setTimeout(() => setMessage(''), 3000);
    };

    const exportData = async () => {
        try {
            const inventory = await db.inventory.toArray();
            const groceryList = await db.groceryList.toArray();
            const data = { inventory, groceryList };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pantry-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage('Export successful!');
        } catch (err) {
            console.error(err);
            setMessage('Failed to export data.');
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1>Settings</h1>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
                <h3>Data Management</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
                    Export your inventory to safeguard your progress. Import is coming soon.
                </p>
                <button className="btn-primary" onClick={exportData} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Download size={20} />
                    Export JSON
                </button>
                {message && <p style={{ marginTop: 12, color: 'var(--success-color)', fontSize: 14 }}>{message}</p>}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
                <h3>Global Preferences</h3>
                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>Default Low Stock Alert Threshold</label>
                    <input
                        type="number"
                        className="input"
                        value={defaultThreshold}
                        onChange={handleThresholdChange}
                        min="0"
                        style={{ maxWidth: 100 }}
                    />
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        New items added to your pantry will use this threshold amount by default.
                    </p>
                </div>
            </div>
        </div>
    );
}
