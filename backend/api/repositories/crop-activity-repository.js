/**
 * Crop Activity Repository - Handles crop activity operations
 */

import { BaseRepository } from "../_database.js";

export class CropActivityRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "crop_activities");
  }

  /**
   * Find activities by crop
   */
  async findByCrop(cropId, options = {}) {
    return await this.findMany({ crop_id: cropId }, options);
  }

  /**
   * Create activity
   */
  async createActivity(activityData, options = {}) {
    return await this.create(activityData, options);
  }
}
