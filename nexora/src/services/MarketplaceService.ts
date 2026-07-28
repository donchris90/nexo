import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  limit,
  onSnapshot,
  increment,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { ShoppingProduct, DigitalProduct, CreatorService } from '../types';

class MarketplaceService {
  private shoppingCollection = 'shopping_products';
  private digitalCollection = 'digital_products';
  private servicesCollection = 'creator_services';

  public subscribeToShoppingProducts(callback: (products: ShoppingProduct[]) => void, itemLimit = 100) {
    const q = query(collection(db, this.shoppingCollection), limit(itemLimit));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const products: ShoppingProduct[] = [];
        snapshot.forEach((docSnap) => products.push({ id: docSnap.id, ...docSnap.data() } as ShoppingProduct));
        callback(products);
      },
      (err: FirestoreError) => console.warn('Shopping products subscription warning:', err)
    );
  }

  public subscribeToDigitalProducts(callback: (products: DigitalProduct[]) => void, itemLimit = 100) {
    const q = query(collection(db, this.digitalCollection), limit(itemLimit));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const products: DigitalProduct[] = [];
        snapshot.forEach((docSnap) => products.push({ id: docSnap.id, ...docSnap.data() } as DigitalProduct));
        callback(products);
      },
      (err: FirestoreError) => console.warn('Digital products subscription warning:', err)
    );
  }

  public subscribeToCreatorServices(callback: (services: CreatorService[]) => void, itemLimit = 100) {
    const q = query(collection(db, this.servicesCollection), limit(itemLimit));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const services: CreatorService[] = [];
        snapshot.forEach((docSnap) => services.push({ id: docSnap.id, ...docSnap.data() } as CreatorService));
        callback(services);
      },
      (err: FirestoreError) => console.warn('Creator services subscription warning:', err)
    );
  }

  public async purchaseShoppingProduct(productId: string): Promise<void> {
    await updateDoc(doc(db, this.shoppingCollection, productId), {
      stock: increment(-1),
      salesCount: increment(1)
    });
  }

  public async purchaseDigitalProduct(productId: string): Promise<void> {
    await updateDoc(doc(db, this.digitalCollection, productId), {
      downloadsCount: increment(1)
    });
  }

  public async createShoppingProduct(product: Omit<ShoppingProduct, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.shoppingCollection), product);
    return docRef.id;
  }

  public async createDigitalProduct(product: Omit<DigitalProduct, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.digitalCollection), product);
    return docRef.id;
  }

  public async createCreatorService(service: Omit<CreatorService, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.servicesCollection), service);
    return docRef.id;
  }
}

export const marketplaceService = new MarketplaceService();
