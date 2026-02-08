import { useCallback, useRef } from 'react';

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface OptimisticOperation {
  id: string;
  type: string;
  resourceType: string;
  resourceId: string;
  data: any;
  execute: () => Promise<void>;
  rollback: () => void;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: Error;
}

export function useOptimisticUpdateManager() {
  const operationsRef = useRef<Map<string, OptimisticOperation>>(new Map());
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  const queueOperation = useCallback(
    async (operation: Omit<OptimisticOperation, 'id' | 'status'>): Promise<string> => {
      const id = generateUUID();
      const op: OptimisticOperation = {
        ...operation,
        id,
        status: 'pending',
      };

      operationsRef.current.set(id, op);
      queueRef.current.push(id);

      // Start processing queue if not already processing
      if (!processingRef.current) {
        processQueue();
      }

      return id;
    },
    []
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    if (queueRef.current.length === 0) return;

    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const operationId = queueRef.current[0];
      const operation = operationsRef.current.get(operationId);

      if (!operation) {
        queueRef.current.shift();
        continue;
      }

      operation.status = 'processing';

      try {
        await operation.execute();
        operation.status = 'success';
        queueRef.current.shift();
      } catch (error) {
        console.error('Operation failed:', error);
        operation.status = 'failed';
        operation.error = error instanceof Error ? error : new Error('Unknown error');
        
        // Rollback the operation
        try {
          operation.rollback();
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }

        queueRef.current.shift();
      }
    }

    processingRef.current = false;
  }, []);

  const waitForOperation = useCallback(
    async (operationId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const checkStatus = () => {
          const operation = operationsRef.current.get(operationId);
          
          if (!operation) {
            reject(new Error('Operation not found'));
            return;
          }

          if (operation.status === 'success') {
            resolve();
            return;
          }

          if (operation.status === 'failed') {
            reject(operation.error || new Error('Operation failed'));
            return;
          }

          // Check again in 100ms
          setTimeout(checkStatus, 100);
        };

        checkStatus();
      });
    },
    []
  );

  const getOperation = useCallback((operationId: string): OptimisticOperation | undefined => {
    return operationsRef.current.get(operationId);
  }, []);

  const clearOperation = useCallback((operationId: string): void => {
    operationsRef.current.delete(operationId);
  }, []);

  const getPendingOperations = useCallback((): OptimisticOperation[] => {
    return Array.from(operationsRef.current.values()).filter(
      (op) => op.status === 'pending' || op.status === 'processing'
    );
  }, []);

  return {
    queueOperation,
    waitForOperation,
    getOperation,
    clearOperation,
    getPendingOperations,
  };
}
