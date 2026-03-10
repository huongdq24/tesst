'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { memoizedObjects } from '@/firebase/provider';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null | undefined; // Document data with ID, or null if not found, undefined if loading.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>)  | null | undefined,
): UseCollectionResult<T> {
  type StateDataType = WithId<T>[] | null | undefined;

  const [data, setData] = useState<StateDataType>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  // Sync state when query changes to avoid stale data during render cycles
  const [currentQuery, setCurrentQuery] = useState(memoizedTargetRefOrQuery);
  if (memoizedTargetRefOrQuery !== currentQuery) {
    setCurrentQuery(memoizedTargetRefOrQuery);
    setIsLoading(!!memoizedTargetRefOrQuery);
    setData(undefined);
    setError(null);
  }

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (firestoreError: FirestoreError) => {
        // Chỉ xử lý lỗi phân quyền thông qua emitter toàn cục
        if (firestoreError.code === 'permission-denied') {
          const path: string =
            memoizedTargetRefOrQuery.type === 'collection'
              ? (memoizedTargetRefOrQuery as CollectionReference).path
              : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
          });

          setError(contextualError);
          errorEmitter.emit('permission-error', contextualError);
        } else {
          // Đối với các lỗi khác (như failed-precondition do thiếu index), 
          // log lỗi thật ra console để người dùng lấy link tạo Index.
          if (firestoreError.code === 'failed-precondition') {
            console.error("Firestore Index Error:", firestoreError.message);
          }
          setError(firestoreError);
        }
        
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  if (memoizedTargetRefOrQuery && !memoizedObjects.has(memoizedTargetRefOrQuery)) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error };
}
