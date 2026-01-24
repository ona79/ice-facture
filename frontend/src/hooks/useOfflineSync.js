import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "https://ta-facture.onrender.com";

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineQueue, setOfflineQueue] = useState(() => {
        const saved = localStorage.getItem('offlineQueue');
        return saved ? JSON.parse(saved) : [];
    });

    // 1. Écouter les changements d'état Réseau
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processQueue(); // Tenter de synchroniser au retour de la connexion
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 2. Sauvegarder la file d'attente quand elle change
    useEffect(() => {
        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
    }, [offlineQueue]);

    // 3. Ajouter une facture à la file d'attente
    const addToOfflineQueue = (invoiceData) => {
        setOfflineQueue(prev => [...prev, invoiceData]);
        toast("Facture sauvegardée HORS-LIGNE 💾", {
            icon: '📡',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
    };

    // 4. Traiter la file d'attente (Sync)
    const processQueue = async () => {
        const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        if (queue.length === 0) return;

        const toastId = toast.loading(`Synchronisation de ${queue.length} factures...`);

        // On copie la queue pour itérer
        const remainingQueue = [];
        let syncedCount = 0;

        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

        for (const invoice of queue) {
            try {
                await axios.post(`${API_URL}/api/invoices`, invoice, config);
                syncedCount++;
            } catch (err) {
                console.error("Échec sync facture :", err);
                // Si erreur serveur, on garde dans la file. Si erreur client (400), on jette ?
                // Pour l'instant on garde tout ce qui échoue pour réessayer plus tard
                remainingQueue.push(invoice);
            }
        }

        setOfflineQueue(remainingQueue);

        if (syncedCount > 0) {
            toast.success(`${syncedCount} factures synchronisées !`, { id: toastId });
        } else {
            toast.error("Échec de la synchronisation", { id: toastId });
        }
    };

    return { isOnline, offlineQueue, addToOfflineQueue, processQueue };
}
