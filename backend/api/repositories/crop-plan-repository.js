/**
 * Crop Plan Repository - Handles crop planning operations
 */

import { BaseRepository } from "../_database.js";

export class CropPlanRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "crop_plans");
  }

  /**
   * Find plans by farm
   */
  async findByFarm(farmId, options = {}) {
    return await this.findMany({ farm_id: farmId }, options);
  }

  /**
   * Create crop plan
   */
  async createPlan(planData, options = {}) {
    return await this.create(planData, options);
  }
}
