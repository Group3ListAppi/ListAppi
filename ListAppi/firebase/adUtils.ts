import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './config';

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  actionUrl?: string;
  startDate: Date;
  endDate: Date;
  enabled: boolean;
}

export const getActiveAds = async (): Promise<Ad[]> => {
  try {
    const now = new Date();
    
    const q = query(
      collection(db, 'ads'),
      where('enabled', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    const activeAds = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const startDate = data.startDate instanceof Timestamp 
          ? data.startDate.toDate() 
          : new Date(data.startDate);
        const endDate = data.endDate instanceof Timestamp 
          ? data.endDate.toDate() 
          : new Date(data.endDate);
        
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          actionUrl: data.actionUrl,
          startDate,
          endDate,
          enabled: data.enabled,
        };
      })
      .filter(ad => ad.startDate <= now && ad.endDate >= now);
    
    return activeAds;
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
};
