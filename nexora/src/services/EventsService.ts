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
import { TicketedEvent } from '../types';

class EventsService {
  private eventsCollection = 'ticketed_events';

  /**
   * Subscribe to real-time list of ticketed events
   */
  public subscribeToEvents(callback: (events: TicketedEvent[]) => void, eventLimit = 50) {
    const q = query(collection(db, this.eventsCollection), limit(eventLimit));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const events: TicketedEvent[] = [];
        snapshot.forEach((docSnap) => {
          events.push({ id: docSnap.id, ...docSnap.data() } as TicketedEvent);
        });
        callback(events);
      },
      (err: FirestoreError) => console.warn('Events subscription warning:', err)
    );
  }

  public async createEvent(event: Omit<TicketedEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.eventsCollection), event);
    return docRef.id;
  }

  /**
   * Purchase a ticket: increments ticketsSold for the event
   */
  public async purchaseTicket(eventId: string): Promise<void> {
    await updateDoc(doc(db, this.eventsCollection, eventId), {
      ticketsSold: increment(1)
    });
  }
}

export const eventsService = new EventsService();
