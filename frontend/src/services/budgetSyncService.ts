import { socketService } from './socketService';
import { offlineStorage } from './offlineStorage';
import { budgetService } from './budgetService';
import {
  BudgetConfig,
  ExpenseEntry,
  BudgetUpdateEvent,
} from '../types/expense';

/**
 * Sync queue item for offline operations
 */
interface BudgetSyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  resourceType: 'budget_config' | 'expense';
  resourceId: string;
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  errorMessage?: string;
}

/**
 * BudgetSyncService
 * Handles real-time synchronization of budget data via WebSocket
 * and manages offline queue for when network is unavailable
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 12.4, 12.5
 */
class BudgetSyncService {
  private listeners: Map<string, Set<(event: BudgetUpdateEvent) => void>> = new Map();
  private syncInProgress = false;
  private maxRetries = 5;
  private baseRetryDelay = 1000; // 1 second
  private maxRetryDelay = 30000; // 30 seconds

  constructor() {
    this.setupSocketListeners();
    this.setupNetworkListeners();
  }

  /**
   * Setup WebSocket event listeners for budget updates
   * Validates: Requirements 9.2
   */
  private setupSocketListeners() {
    socketService.on({
      onConnect: () => {
        console.log('[BudgetSync] Socket connected, processing sync queue');
        this.processSyncQueue();
      },
      onDisconnect: () => {
        console.log('[BudgetSync] Socket disconnected');
      },
    });

    // Listen for budget-specific events from the socket
    // These will be emitted by the backend when budget data changes
    if (socketService['socket']) {
      const socket = socketService['socket'];
      
      socket.on('budget:config_updated', (data: any) => {
        this.handleBudgetConfigUpdate(data);
      });

      socket.on('budget:expense_added', (data: any) => {
        this.handleExpenseAdded(data);
      });

      socket.on('budget:expense_updated', (data: any) => {
        this.handleExpenseUpdated(data);
      });

      socket.on('budget:expense_deleted', (data: any) => {
        this.handleExpenseDeleted(data);
      });
    }
  }

  /**
   * Setup network status listeners
   * Validates: Requirements 9.4, 12.5
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[BudgetSync] Network restored, processing sync queue');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[BudgetSync] Network lost, queuing changes for later sync');
    });
  }

  /**
   * Handle budget config update event from WebSocket
   */
  private handleBudgetConfigUpdate(data: any) {
    const event: BudgetUpdateEvent = {
      type: 'budget_config_updated',
      tripId: data.tripId,
      userId: data.userId,
      timestamp: data.timestamp || new Date().toISOString(),
      data: data.config,
    };
    this.notifyListeners(data.tripId, event);
  }

  /**
   * Handle expense added event from WebSocket
   */
  private handleExpenseAdded(data: any) {
    const event: BudgetUpdateEvent = {
      type: 'expense_added',
      tripId: data.tripId,
      userId: data.userId,
      timestamp: data.timestamp || new Date().toISOString(),
      data: data.expense,
    };
    this.notifyListeners(data.tripId, event);
  }

  /**
   * Handle expense updated event from WebSocket
   */
  private handleExpenseUpdated(data: any) {
    const event: BudgetUpdateEvent = {
      type: 'expense_updated',
      tripId: data.tripId,
      userId: data.userId,
      timestamp: data.timestamp || new Date().toISOString(),
      data: data.expense,
    };
    this.notifyListeners(data.tripId, event);
  }

  /**
   * Handle expense deleted event from WebSocket
   */
  private handleExpenseDeleted(data: any) {
    const event: BudgetUpdateEvent = {
      type: 'expense_deleted',
      tripId: data.tripId,
      userId: data.userId,
      timestamp: data.timestamp || new Date().toISOString(),
      data: { expenseId: data.expenseId },
    };
    this.notifyListeners(data.tripId, event);
  }

  /**
   * Notify all listeners for a specific trip
   */
  private notifyListeners(tripId: string, event: BudgetUpdateEvent) {
    const tripListeners = this.listeners.get(tripId);
    if (tripListeners) {
      tripListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[BudgetSync] Error in listener callback:', error);
        }
      });
    }
  }

  /**
   * Subscribe to budget updates for a specific trip
   * Returns an unsubscribe function
   * Validates: Requirements 9.2
   */
  subscribeToTripBudget(
    tripId: string,
    callback: (event: BudgetUpdateEvent) => void
  ): () => void {
    // Ensure we're in the trip room
    if (socketService.isConnected()) {
      socketService.joinTrip(tripId);
    }

    // Add listener
    if (!this.listeners.has(tripId)) {
      this.listeners.set(tripId, new Set());
    }
    this.listeners.get(tripId)!.add(callback);

    console.log(`[BudgetSync] Subscribed to budget updates for trip ${tripId}`);

    // Return unsubscribe function
    return () => {
      const tripListeners = this.listeners.get(tripId);
      if (tripListeners) {
        tripListeners.delete(callback);
        if (tripListeners.size === 0) {
          this.listeners.delete(tripId);
          // Leave trip room if no more listeners
          if (socketService.isConnected()) {
            socketService.leaveTrip(tripId);
          }
        }
      }
      console.log(`[BudgetSync] Unsubscribed from budget updates for trip ${tripId}`);
    };
  }

  /**
   * Sync budget configuration to backend
   * If offline, queues for later sync
   * Validates: Requirements 9.1, 9.3, 9.4
   */
  async syncBudgetConfig(config: BudgetConfig): Promise<void> {
    // Save to local storage immediately
    await this.saveBudgetConfigOffline(config);

    // If online, sync to backend
    if (navigator.onLine && socketService.isConnected()) {
      try {
        // Update via API
        await budgetService.updateBudgetConfig(
          config.tripId,
          config.id,
          {
            totalBudget: config.totalBudget,
            homeCurrency: config.homeCurrency,
            tripCurrency: config.tripCurrency,
            categoryAllocations: config.categoryAllocations,
          }
        );
        console.log('[BudgetSync] Budget config synced successfully');
      } catch (error) {
        console.error('[BudgetSync] Failed to sync budget config:', error);
        // Queue for retry
        await this.queueBudgetConfigUpdate(config);
        throw error;
      }
    } else {
      // Queue for later sync
      console.log('[BudgetSync] Offline, queuing budget config update');
      await this.queueBudgetConfigUpdate(config);
    }
  }

  /**
   * Sync expense to backend
   * If offline, queues for later sync
   * Validates: Requirements 9.1, 9.3, 9.4
   */
  async syncExpense(expense: ExpenseEntry): Promise<void> {
    // Save to local storage immediately
    await this.saveExpenseOffline(expense);

    // If online, sync to backend
    if (navigator.onLine && socketService.isConnected()) {
      try {
        // Determine if this is a create or update based on syncStatus
        if (expense.syncStatus === 'pending' && !expense.id.startsWith('temp_')) {
          // Update existing expense
          await budgetService.updateExpense(
            expense.tripId,
            expense.id,
            {
              amount: expense.amount,
              currency: expense.currency,
              category: expense.category,
              date: expense.date,
              note: expense.note,
              paidBy: expense.paidBy,
              splitWith: expense.splitWith,
              splitType: expense.splitType,
              customSplits: expense.customSplits,
              isSettled: expense.isSettled,
              linkedItemId: expense.linkedItemId,
              linkedItemType: expense.linkedItemType,
              syncStatus: 'synced',
            }
          );
        } else if (expense.id.startsWith('temp_')) {
          // Create new expense
          const created = await budgetService.createExpense({
            tripId: expense.tripId,
            amount: expense.amount,
            currency: expense.currency,
            category: expense.category,
            date: expense.date,
            note: expense.note,
            paidBy: expense.paidBy,
            splitWith: expense.splitWith,
            splitType: expense.splitType,
            customSplits: expense.customSplits,
            linkedItemId: expense.linkedItemId,
            linkedItemType: expense.linkedItemType,
          });
          
          // Update local storage with real ID
          await this.replaceExpenseId(expense.id, created);
        }
        
        console.log('[BudgetSync] Expense synced successfully');
      } catch (error) {
        console.error('[BudgetSync] Failed to sync expense:', error);
        // Queue for retry
        await this.queueExpenseUpdate(expense);
        throw error;
      }
    } else {
      // Queue for later sync
      console.log('[BudgetSync] Offline, queuing expense update');
      await this.queueExpenseUpdate(expense);
    }
  }

  /**
   * Sync expense deletion to backend
   * If offline, queues for later sync
   * Validates: Requirements 9.1, 9.3, 9.4
   */
  async syncDeleteExpense(tripId: string, expenseId: string): Promise<void> {
    // Remove from local storage immediately
    await this.deleteExpenseOffline(expenseId);

    // If online, sync to backend
    if (navigator.onLine && socketService.isConnected()) {
      try {
        await budgetService.deleteExpense(tripId, expenseId);
        console.log('[BudgetSync] Expense deletion synced successfully');
      } catch (error) {
        console.error('[BudgetSync] Failed to sync expense deletion:', error);
        // Queue for retry
        await this.queueExpenseDelete(tripId, expenseId);
        throw error;
      }
    } else {
      // Queue for later sync
      console.log('[BudgetSync] Offline, queuing expense deletion');
      await this.queueExpenseDelete(tripId, expenseId);
    }
  }

  /**
   * Queue budget config update for offline sync
   * Validates: Requirements 9.3, 9.4, 12.4
   */
  async queueBudgetConfigUpdate(config: BudgetConfig): Promise<void> {
    const queueItem: BudgetSyncQueueItem = {
      id: `budget_config_${config.id}_${Date.now()}`,
      operation: 'update',
      resourceType: 'budget_config',
      resourceId: config.id,
      data: config,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    await offlineStorage.setItem(`sync_queue_${queueItem.id}`, queueItem);
    console.log('[BudgetSync] Queued budget config update:', queueItem.id);
  }

  /**
   * Queue expense update for offline sync
   * Validates: Requirements 9.3, 9.4, 12.4
   */
  async queueExpenseUpdate(expense: ExpenseEntry): Promise<void> {
    const operation = expense.id.startsWith('temp_') ? 'create' : 'update';
    
    const queueItem: BudgetSyncQueueItem = {
      id: `expense_${expense.id}_${Date.now()}`,
      operation,
      resourceType: 'expense',
      resourceId: expense.id,
      data: expense,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    await offlineStorage.setItem(`sync_queue_${queueItem.id}`, queueItem);
    console.log('[BudgetSync] Queued expense update:', queueItem.id);
  }

  /**
   * Queue expense deletion for offline sync
   * Validates: Requirements 9.3, 9.4, 12.4
   */
  async queueExpenseDelete(tripId: string, expenseId: string): Promise<void> {
    const queueItem: BudgetSyncQueueItem = {
      id: `expense_delete_${expenseId}_${Date.now()}`,
      operation: 'delete',
      resourceType: 'expense',
      resourceId: expenseId,
      data: { tripId, expenseId },
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    await offlineStorage.setItem(`sync_queue_${queueItem.id}`, queueItem);
    console.log('[BudgetSync] Queued expense deletion:', queueItem.id);
  }

  /**
   * Process sync queue with exponential backoff
   * Validates: Requirements 9.4, 12.5
   */
  async processSyncQueue(): Promise<void> {
    // Prevent concurrent sync operations
    if (this.syncInProgress) {
      console.log('[BudgetSync] Sync already in progress, skipping');
      return;
    }

    // Check if online
    if (!navigator.onLine || !socketService.isConnected()) {
      console.log('[BudgetSync] Offline, cannot process sync queue');
      return;
    }

    this.syncInProgress = true;

    try {
      // Get all sync queue items
      const queueItems = await this.getSyncQueueItems();
      
      if (queueItems.length === 0) {
        console.log('[BudgetSync] Sync queue is empty');
        return;
      }

      console.log(`[BudgetSync] Processing ${queueItems.length} queued items`);

      // Process each item
      for (const item of queueItems) {
        try {
          await this.processSyncQueueItem(item);
          // Remove from queue on success
          await offlineStorage.removeItem(`sync_queue_${item.id}`);
        } catch (error) {
          console.error(`[BudgetSync] Failed to process queue item ${item.id}:`, error);
          
          // Update retry count and status
          item.retryCount++;
          item.status = 'failed';
          item.errorMessage = error instanceof Error ? error.message : 'Unknown error';

          if (item.retryCount >= this.maxRetries) {
            console.error(`[BudgetSync] Max retries reached for item ${item.id}, removing from queue`);
            await offlineStorage.removeItem(`sync_queue_${item.id}`);
          } else {
            // Save updated item with retry count
            await offlineStorage.setItem(`sync_queue_${item.id}`, item);
            
            // Schedule retry with exponential backoff
            const delay = Math.min(
              this.baseRetryDelay * Math.pow(2, item.retryCount),
              this.maxRetryDelay
            );
            console.log(`[BudgetSync] Scheduling retry for item ${item.id} in ${delay}ms`);
            setTimeout(() => this.processSyncQueue(), delay);
          }
        }
      }

      console.log('[BudgetSync] Sync queue processing complete');
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process a single sync queue item
   */
  private async processSyncQueueItem(item: BudgetSyncQueueItem): Promise<void> {
    console.log(`[BudgetSync] Processing queue item: ${item.operation} ${item.resourceType} ${item.resourceId}`);

    if (item.resourceType === 'budget_config') {
      const config = item.data as BudgetConfig;
      
      // Check for conflicts using timestamp comparison
      const serverConfig = await budgetService.getBudgetConfig(config.tripId);
      if (serverConfig && this.hasConflict(serverConfig, config)) {
        console.warn('[BudgetSync] Conflict detected, using most recent version');
        // Use the most recent version based on updatedAt timestamp
        if (new Date(serverConfig.updatedAt) > new Date(config.updatedAt)) {
          // Server version is newer, skip this update
          console.log('[BudgetSync] Server version is newer, skipping update');
          return;
        }
      }

      // Sync to server
      await budgetService.updateBudgetConfig(
        config.tripId,
        config.id,
        {
          totalBudget: config.totalBudget,
          homeCurrency: config.homeCurrency,
          tripCurrency: config.tripCurrency,
          categoryAllocations: config.categoryAllocations,
        }
      );
    } else if (item.resourceType === 'expense') {
      const expense = item.data as ExpenseEntry;

      if (item.operation === 'create') {
        // Create new expense
        const created = await budgetService.createExpense({
          tripId: expense.tripId,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          date: expense.date,
          note: expense.note,
          paidBy: expense.paidBy,
          splitWith: expense.splitWith,
          splitType: expense.splitType,
          customSplits: expense.customSplits,
          linkedItemId: expense.linkedItemId,
          linkedItemType: expense.linkedItemType,
        });
        
        // Update local storage with real ID
        await this.replaceExpenseId(expense.id, created);
      } else if (item.operation === 'update') {
        // Check for conflicts
        const serverExpenses = await budgetService.getExpenses(expense.tripId);
        const serverExpense = serverExpenses.find(e => e.id === expense.id);
        
        if (serverExpense && this.hasConflict(serverExpense, expense)) {
          console.warn('[BudgetSync] Conflict detected, using most recent version');
          // Use the most recent version based on updatedAt timestamp
          if (new Date(serverExpense.updatedAt) > new Date(expense.updatedAt)) {
            // Server version is newer, update local storage
            console.log('[BudgetSync] Server version is newer, updating local storage');
            await this.saveExpenseOffline(serverExpense);
            return;
          }
        }

        // Update expense
        await budgetService.updateExpense(
          expense.tripId,
          expense.id,
          {
            amount: expense.amount,
            currency: expense.currency,
            category: expense.category,
            date: expense.date,
            note: expense.note,
            paidBy: expense.paidBy,
            splitWith: expense.splitWith,
            splitType: expense.splitType,
            customSplits: expense.customSplits,
            isSettled: expense.isSettled,
            linkedItemId: expense.linkedItemId,
            linkedItemType: expense.linkedItemType,
            syncStatus: 'synced',
          }
        );
      } else if (item.operation === 'delete') {
        // Delete expense
        const { tripId, expenseId } = item.data;
        await budgetService.deleteExpense(tripId, expenseId);
      }
    }
  }

  /**
   * Check if there's a conflict between two versions
   * Validates: Requirements 9.5
   */
  private hasConflict(
    serverVersion: BudgetConfig | ExpenseEntry,
    localVersion: BudgetConfig | ExpenseEntry
  ): boolean {
    // Simple conflict detection: different updatedAt timestamps
    return serverVersion.updatedAt !== localVersion.updatedAt;
  }

  /**
   * Get all sync queue items from local storage
   */
  private async getSyncQueueItems(): Promise<BudgetSyncQueueItem[]> {
    const items: BudgetSyncQueueItem[] = [];
    
    // Get all keys that start with 'sync_queue_'
    const keys = await this.getAllKeys();
    const queueKeys = keys.filter(key => key.startsWith('sync_queue_'));
    
    for (const key of queueKeys) {
      const item = await offlineStorage.getItem<BudgetSyncQueueItem>(key);
      if (item && (item.status === 'pending' || item.status === 'failed')) {
        items.push(item);
      }
    }

    // Sort by timestamp (oldest first)
    return items.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get all keys from local storage
   */
  private async getAllKeys(): Promise<string[]> {
    // This is a workaround since localforage doesn't expose keys directly
    // We'll use the metadata store to track sync queue keys
    const keys = await offlineStorage.getItem<string[]>('sync_queue_keys') || [];
    return keys;
  }

  /**
   * Save budget config to local storage
   */
  private async saveBudgetConfigOffline(config: BudgetConfig): Promise<void> {
    await offlineStorage.setItem(`budget_config_${config.tripId}`, config);
  }

  /**
   * Save expense to local storage
   */
  private async saveExpenseOffline(expense: ExpenseEntry): Promise<void> {
    await offlineStorage.setItem(`expense_${expense.id}`, expense);
    
    // Also maintain a list of expense IDs for the trip
    const expenseIds = await offlineStorage.getItem<string[]>(`expense_ids_${expense.tripId}`) || [];
    if (!expenseIds.includes(expense.id)) {
      expenseIds.push(expense.id);
      await offlineStorage.setItem(`expense_ids_${expense.tripId}`, expenseIds);
    }
  }

  /**
   * Delete expense from local storage
   */
  private async deleteExpenseOffline(expenseId: string): Promise<void> {
    const expense = await offlineStorage.getItem<ExpenseEntry>(`expense_${expenseId}`);
    if (expense) {
      await offlineStorage.removeItem(`expense_${expenseId}`);
      
      // Remove from expense IDs list
      const expenseIds = await offlineStorage.getItem<string[]>(`expense_ids_${expense.tripId}`);
      if (Array.isArray(expenseIds)) {
        const updatedIds = expenseIds.filter(id => id !== expenseId);
        await offlineStorage.setItem(`expense_ids_${expense.tripId}`, updatedIds);
      }
    }
  }

  /**
   * Replace temporary expense ID with real ID from server
   */
  private async replaceExpenseId(tempId: string, newExpense: ExpenseEntry): Promise<void> {
    // Remove old temp expense
    const oldExpense = await offlineStorage.getItem<ExpenseEntry>(`expense_${tempId}`);
    if (oldExpense) {
      await offlineStorage.removeItem(`expense_${tempId}`);
      
      // Update expense IDs list
      const expenseIds = await offlineStorage.getItem<string[]>(`expense_ids_${oldExpense.tripId}`) || [];
      const updatedIds = expenseIds.filter(id => id !== tempId);
      updatedIds.push(newExpense.id);
      await offlineStorage.setItem(`expense_ids_${oldExpense.tripId}`, updatedIds);
    }
    
    // Save new expense
    await this.saveExpenseOffline(newExpense);
  }

  /**
   * Connect to WebSocket for real-time updates
   * Validates: Requirements 9.1
   */
  connect(): void {
    if (!socketService.isConnected()) {
      socketService.connect();
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    // Clear all listeners
    this.listeners.clear();
    
    // Note: We don't disconnect the socket service itself
    // as it may be used by other features
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): void {
    socketService.reconnect();
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'reconnecting' {
    return socketService.getConnectionState();
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }
}

// Export singleton instance
export const budgetSyncService = new BudgetSyncService();

