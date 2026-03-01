import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';
import ProductForm from './ProductForm';

export default function Scanner() {
    const [scannedUpc, setScannedUpc] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = () => {
        setError('');
        setIsScanning(true);
        setScannedUpc(null);

        setTimeout(async () => {
            try {
                scannerRef.current = new Html5Qrcode('reader');
                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 150 } },
                    (decodedText) => {
                        stopScanner();
                        setScannedUpc(decodedText);
                    },
                    (_errorMessage) => {
                        // ignore scan errors, they happen continuously until a barcode is found
                    }
                );
            } catch (err) {
                console.error(err);
                setError('Could not access camera. Please ensure permissions are granted.');
                setIsScanning(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.error('Error stopping scanner', err);
            }
        }
        setIsScanning(false);
    };

    const resetScan = () => {
        setScannedUpc(null);
    };

    if (scannedUpc) {
        return (
            <div className="container">
                <ProductForm initialUpc={scannedUpc} onComplete={() => setScannedUpc(null)} />
                <button onClick={resetScan} className="btn-primary" style={{ marginTop: 16, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                    Cancel & Scan Again
                </button>
            </div>
        );
    }

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Scan Barcode</h1>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>

                {isScanning ? (
                    <div style={{ width: '100%', maxWidth: 400 }}>
                        <div id="reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
                        <button onClick={stopScanner} className="btn-primary" style={{ marginTop: 16, backgroundColor: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <X size={20} /> Stop Scanning
                        </button>
                    </div>
                ) : (
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, textAlign: 'center', width: '100%' }}>
                        <Camera size={64} style={{ color: 'var(--accent-color)', marginBottom: 24 }} />
                        <h2 style={{ marginBottom: 8 }}>Add to Pantry</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Scan a product's barcode to instantly look up its details and add it to your inventory.
                        </p>
                        <button onClick={startScanner} className="btn-primary" style={{ fontSize: 18, padding: 16 }}>
                            Start Camera
                        </button>

                        {error && <p style={{ color: 'var(--danger-color)', marginTop: 16 }}>{error}</p>}

                        <div style={{ marginTop: 32, width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14 }}>Or enter manually:</p>
                            <button
                                onClick={() => setScannedUpc('')}
                                style={{ width: '100%', padding: 12, backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>
                                Manual Entry
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
