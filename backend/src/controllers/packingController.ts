import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { socketService } from '../services/socketService.js';

// Get all packing items for a trip
export const getPackingItems = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    // Verify user has access to this trip
    const tripCheck = await pool.query(
      `SELECT id FROM trips WHERE id = $1 AND (owner_id = $2 OR is_public = true)`,
      [tripId, userId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }

    const result = await pool.query(
      `SELECT pi.*, pl.trip_id
       FROM packing_items pi
       JOIN packing_lists pl ON pi.packing_list_id = pl.id
       WHERE pl.trip_id = $1
       ORDER BY pi.category, pi.created_at`,
      [tripId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching packing items:', error);
    res.status(500).json({ error: 'Failed to fetch packing items' });
  }
};

// Add a packing item
export const addPackingItem = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { name, category, notes, quantity = 1 } = req.body;
    const userId = req.user?.userId;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    // Verify user can edit this trip (owner or editor)
    const permissionCheck = await pool.query(
      'SELECT user_can_edit_trip($1, $2) as can_edit',
      [userId, tripId]
    );

    if (!permissionCheck.rows[0].can_edit) {
      return res.status(403).json({ error: 'You do not have permission to add packing items to this trip' });
    }

    // Get or create packing list for this trip
    let packingListResult = await pool.query(
      'SELECT id FROM packing_lists WHERE trip_id = $1 LIMIT 1',
      [tripId]
    );

    let packingListId;
    if (packingListResult.rows.length === 0) {
      // Create default packing list
      const newListResult = await pool.query(
        `INSERT INTO packing_lists (trip_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [tripId, 'Default Packing List', 'Automatically created packing list']
      );
      packingListId = newListResult.rows[0].id;
    } else {
      packingListId = packingListResult.rows[0].id;
    }

    // Insert the packing item
    const result = await pool.query(
      `INSERT INTO packing_items (packing_list_id, name, category, notes, quantity, is_packed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [packingListId, name, category, notes || null, quantity, false]
    );

    const newItem = result.rows[0];

    // Emit socket event for real-time sync
    socketService.emitPackingListUpdate(tripId, {
      action: 'added',
      item: newItem,
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding packing item:', error);
    res.status(500).json({ error: 'Failed to add packing item' });
  }
};

// Update a packing item (toggle checked status or edit)
export const updatePackingItem = async (req: Request, res: Response) => {
  try {
    const { tripId, itemId } = req.params;
    const { is_packed, name, category, notes, quantity } = req.body;
    const userId = req.user?.userId;

    // Verify user can edit this trip (owner or editor)
    const permissionCheck = await pool.query(
      'SELECT user_can_edit_trip($1, $2) as can_edit',
      [userId, tripId]
    );

    if (!permissionCheck.rows[0].can_edit) {
      return res.status(403).json({ error: 'You do not have permission to update packing items in this trip' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (is_packed !== undefined) {
      updates.push(`is_packed = $${paramCount++}`);
      values.push(is_packed);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(quantity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(itemId);
    values.push(tripId);

    const result = await pool.query(
      `UPDATE packing_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       AND packing_list_id IN (SELECT id FROM packing_lists WHERE trip_id = $${paramCount + 1})
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Packing item not found' });
    }

    const updatedItem = result.rows[0];

    // Emit socket event for real-time sync
    socketService.emitPackingListUpdate(tripId, {
      action: 'updated',
      item: updatedItem,
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating packing item:', error);
    res.status(500).json({ error: 'Failed to update packing item' });
  }
};

// Delete a packing item
export const deletePackingItem = async (req: Request, res: Response) => {
  try {
    const { tripId, itemId } = req.params;
    const userId = req.user?.userId;

    // Verify user can edit this trip (owner or editor)
    const permissionCheck = await pool.query(
      'SELECT user_can_edit_trip($1, $2) as can_edit',
      [userId, tripId]
    );

    if (!permissionCheck.rows[0].can_edit) {
      return res.status(403).json({ error: 'You do not have permission to delete packing items from this trip' });
    }

    const result = await pool.query(
      `DELETE FROM packing_items 
       WHERE id = $1 
       AND packing_list_id IN (SELECT id FROM packing_lists WHERE trip_id = $2)
       RETURNING *`,
      [itemId, tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Packing item not found' });
    }

    // Emit socket event for real-time sync
    socketService.emitPackingListUpdate(tripId, {
      action: 'deleted',
      itemId,
    });

    res.json({ message: 'Packing item deleted successfully' });
  } catch (error) {
    console.error('Error deleting packing item:', error);
    res.status(500).json({ error: 'Failed to delete packing item' });
  }
};

// Get packing list progress
export const getPackingProgress = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    // Verify user has access to this trip
    const tripCheck = await pool.query(
      `SELECT id FROM trips WHERE id = $1 AND (owner_id = $2 OR is_public = true)`,
      [tripId, userId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }

    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_items,
         COUNT(*) FILTER (WHERE is_packed = true) as checked_items,
         category,
         COUNT(*) FILTER (WHERE is_packed = true AND category = pi.category) as category_checked,
         COUNT(*) FILTER (WHERE category = pi.category) as category_total
       FROM packing_items pi
       JOIN packing_lists pl ON pi.packing_list_id = pl.id
       WHERE pl.trip_id = $1
       GROUP BY category`,
      [tripId]
    );

    const totalResult = await pool.query(
      `SELECT 
         COUNT(*) as total_items,
         COUNT(*) FILTER (WHERE is_packed = true) as checked_items
       FROM packing_items pi
       JOIN packing_lists pl ON pi.packing_list_id = pl.id
       WHERE pl.trip_id = $1`,
      [tripId]
    );

    const total = parseInt(totalResult.rows[0]?.total_items || '0');
    const checked = parseInt(totalResult.rows[0]?.checked_items || '0');
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    const by_category: any = {};
    result.rows.forEach((row) => {
      by_category[row.category] = {
        total: parseInt(row.category_total),
        checked: parseInt(row.category_checked),
      };
    });

    res.json({
      total_items: total,
      checked_items: checked,
      percentage,
      by_category,
    });
  } catch (error) {
    console.error('Error fetching packing progress:', error);
    res.status(500).json({ error: 'Failed to fetch packing progress' });
  }
};

// Generate packing suggestions for a trip
export const generatePackingSuggestions = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    // Verify user has access to this trip
    const tripResult = await pool.query(
      `SELECT t.*, 
        (t.end_date - t.start_date) + 1 as duration_days
       FROM trips t
       WHERE t.id = $1 AND (t.owner_id = $2 OR t.is_public = true)`,
      [tripId, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }

    const trip = tripResult.rows[0];

    // Get places to analyze activities
    const placesResult = await pool.query(
      `SELECT p.name, p.notes, p.place_type
       FROM places p
       JOIN trip_days td ON p.trip_day_id = td.id
       WHERE td.trip_id = $1`,
      [tripId]
    );

    // Extract activities from place names and notes
    const activities: string[] = [];
    placesResult.rows.forEach((place: any) => {
      if (place.name) activities.push(place.name);
      if (place.notes) activities.push(place.notes);
    });

    // Parse weather data if available
    let weather;
    if (trip.weather_data) {
      const weatherData = typeof trip.weather_data === 'string' 
        ? JSON.parse(trip.weather_data) 
        : trip.weather_data;
      
      if (weatherData && weatherData.forecast) {
        const temps = weatherData.forecast.map((f: any) => f.temp);
        weather = {
          maxTemp: Math.max(...temps),
          minTemp: Math.min(...temps),
          condition: weatherData.forecast[0]?.condition,
        };
      }
    }

    // Generate suggestions
    const { PackingSuggestionService } = await import('../services/packingSuggestionService.js');
    const suggestions = await PackingSuggestionService.generateSuggestions({
      destination: trip.destination,
      tripDurationDays: parseInt(trip.duration_days),
      weather,
      activities,
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Error generating packing suggestions:', error);
    res.status(500).json({ error: 'Failed to generate packing suggestions' });
  }
};

// Apply packing suggestions to a trip
export const applyPackingSuggestions = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    // Verify user can edit this trip (owner or editor)
    const permissionCheck = await pool.query(
      'SELECT user_can_edit_trip($1, $2) as can_edit',
      [userId, tripId]
    );

    if (!permissionCheck.rows[0].can_edit) {
      return res.status(403).json({ error: 'You do not have permission to apply packing suggestions to this trip' });
    }

    // Generate suggestions
    const { PackingSuggestionService } = await import('../services/packingSuggestionService.js');
    
    // Get trip details for suggestions
    const tripResult = await pool.query(
      `SELECT t.*, 
        (t.end_date - t.start_date) + 1 as duration_days
       FROM trips t
       WHERE t.id = $1`,
      [tripId]
    );

    const trip = tripResult.rows[0];

    // Get places to analyze activities
    const placesResult = await pool.query(
      `SELECT p.name, p.notes
       FROM places p
       JOIN trip_days td ON p.trip_day_id = td.id
       WHERE td.trip_id = $1`,
      [tripId]
    );

    const activities: string[] = [];
    placesResult.rows.forEach((place: any) => {
      if (place.name) activities.push(place.name);
      if (place.notes) activities.push(place.notes);
    });

    let weather;
    if (trip.weather_data) {
      const weatherData = typeof trip.weather_data === 'string' 
        ? JSON.parse(trip.weather_data) 
        : trip.weather_data;
      
      if (weatherData && weatherData.forecast) {
        const temps = weatherData.forecast.map((f: any) => f.temp);
        weather = {
          maxTemp: Math.max(...temps),
          minTemp: Math.min(...temps),
          condition: weatherData.forecast[0]?.condition,
        };
      }
    }

    const suggestions = await PackingSuggestionService.generateSuggestions({
      destination: trip.destination,
      tripDurationDays: parseInt(trip.duration_days),
      weather,
      activities,
    });

    // Get or create packing list for this trip
    let packingListResult = await pool.query(
      'SELECT id FROM packing_lists WHERE trip_id = $1 LIMIT 1',
      [tripId]
    );

    let packingListId;
    if (packingListResult.rows.length === 0) {
      const newListResult = await pool.query(
        `INSERT INTO packing_lists (trip_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [tripId, 'Default Packing List', 'Automatically created packing list']
      );
      packingListId = newListResult.rows[0].id;
    } else {
      packingListId = packingListResult.rows[0].id;
    }

    // Get existing items to avoid duplicates
    const existingItemsResult = await pool.query(
      `SELECT LOWER(name) as name FROM packing_items WHERE packing_list_id = $1`,
      [packingListId]
    );
    const existingItems = new Set(existingItemsResult.rows.map(row => row.name));

    // Insert suggestions as packing items
    const insertedItems = [];
    for (const suggestion of suggestions) {
      try {
        // Skip if item already exists (case-insensitive)
        if (existingItems.has(suggestion.item.toLowerCase())) {
          continue;
        }

        const result = await pool.query(
          `INSERT INTO packing_items (packing_list_id, name, category, quantity, is_packed)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [packingListId, suggestion.item, suggestion.category, 1, false]
        );
        if (result.rows.length > 0) {
          insertedItems.push(result.rows[0]);
          // Emit socket event for real-time sync
          socketService.emitPackingListUpdate(tripId, {
            action: 'added',
            item: result.rows[0],
          });
        }
      } catch (error) {
        console.error('Error inserting suggestion:', error);
      }
    }

    res.json({
      message: `Added ${insertedItems.length} suggested items`,
      items: insertedItems,
    });
  } catch (error) {
    console.error('Error applying packing suggestions:', error);
    res.status(500).json({ error: 'Failed to apply packing suggestions' });
  }
};
