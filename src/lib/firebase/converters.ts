import {
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    DocumentData
} from 'firebase/firestore';

export const genericConverter = <T extends { id: string }>(): FirestoreDataConverter<T> => ({
    toFirestore(modelObject: T): DocumentData {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...data } = modelObject;
        return data;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): T {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data
        } as T;
    }
});
