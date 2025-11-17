/**
 * Crop Observation Repository - Handles crop observation operations
 */

import { BaseRepository } from "../_database.js";

export class CropObservationRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "crop_observations");
  }

  /**
   * Find observations by crop
   */
  async findByCrop(cropId, options = {}) {
    return await this.findMany({ crop_id: cropId }, options);
  }

  /**
   * Create observation
   */
  async createObservation(observationData, options = {}) {
    return await this.create(observationData, options);
  }
}
