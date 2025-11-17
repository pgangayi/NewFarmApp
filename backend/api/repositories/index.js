// Repository System Index - Phase 5 Enhanced Exports
// Centralized export hub for all repository classes
// Provides clean imports for API endpoints and other components

// Import existing repositories from the original file
import { FarmRepository, CropRepository } from "../_repositories.js";

// Import enhanced AnimalRepository
import { AnimalRepository } from "./animal-repository.js";

// Import UserRepository
import { UserRepository } from "./user-repository.js";

// Import Phase 4 repositories
import { FinanceRepository } from "./finance-repository.js";
import { InventoryRepository } from "./inventory-repository.js";
import { FieldRepository } from "./field-repository.js";

// Import Phase 5 repositories
import { TaskRepository } from "./task-repository.js";

// Import crop specialized repositories
import { CropPlanRepository } from "./crop-plan-repository.js";
import { CropActivityRepository } from "./crop-activity-repository.js";
import { CropObservationRepository } from "./crop-observation-repository.js";

// Import Phase 6 repositories
import { AnalyticsRepository } from "./analytics-repository.js";

// Import Phase 7 repositories
import { NotificationRepository } from "./notification-repository.js";
import { SearchRepository } from "./search-repository.js";
import { WebhookRepository } from "./webhook-repository.js";

/**
 * Repository Factory Class
 * Provides centralized repository instantiation with dependency injection
 */
class RepositoryFactory {
  constructor(dbOperations) {
    this.db = dbOperations;
    this.repositories = new Map();
  }

  /**
   * Get a repository instance (singleton pattern)
   */
  getRepository(type) {
    if (!this.repositories.has(type)) {
      switch (type) {
        case "farm":
          this.repositories.set(type, new FarmRepository(this.db));
          break;
        case "animal":
          this.repositories.set(type, new AnimalRepository(this.db));
          break;
        case "crop":
          this.repositories.set(type, new CropRepository(this.db));
          break;
        case "finance":
          this.repositories.set(type, new FinanceRepository(this.db));
          break;
        case "inventory":
          this.repositories.set(type, new InventoryRepository(this.db));
          break;
        case "field":
          this.repositories.set(type, new FieldRepository(this.db));
          break;
        case "task":
          this.repositories.set(type, new TaskRepository(this.db));
          break;
        case "analytics":
          this.repositories.set(type, new AnalyticsRepository(this.db));
          break;
        case "notification":
          this.repositories.set(type, new NotificationRepository(this.db));
          break;
        case "search":
          this.repositories.set(type, new SearchRepository(this.db));
          break;
        case "webhook":
          this.repositories.set(type, new WebhookRepository(this.db));
          break;
        default:
          throw new Error(`Unknown repository type: ${type}`);
      }
    }

    return this.repositories.get(type);
  }

  /**
   * Get multiple repositories for batch operations
   */
  getRepositories(types) {
    const repositories = {};
    types.forEach((type) => {
      repositories[type] = this.getRepository(type);
    });
    return repositories;
  }

  /**
   * Clear repository cache (useful for testing)
   */
  clearCache() {
    this.repositories.clear();
  }
}

/**
 * Repository Container for dependency injection
 * Provides easy access to all repositories with proper initialization
 */
class RepositoryContainer {
  constructor(dbOperations) {
    this.db = dbOperations;
    this.field = new FieldRepository(dbOperations);
    this.farm = new FarmRepository(dbOperations);
    this.animal = new AnimalRepository(dbOperations);
    this.crop = new CropRepository(dbOperations);
    this.finance = new FinanceRepository(dbOperations);
    this.inventory = new InventoryRepository(dbOperations);
    this.task = new TaskRepository(dbOperations);
    this.analytics = new AnalyticsRepository(dbOperations);
    this.notification = new NotificationRepository(dbOperations);
    this.search = new SearchRepository(dbOperations);
    this.webhook = new WebhookRepository(dbOperations);
  }

  /**
   * Get repository by name
   */
  get(name) {
    if (!this[name]) {
      throw new Error(`Repository "${name}" not found in container`);
    }
    return this[name];
  }

  /**
   * Get all available repositories
   */
  getAll() {
    return {
      farm: this.farm,
      field: this.field,
      animal: this.animal,
      crop: this.crop,
      finance: this.finance,
      inventory: this.inventory,
      task: this.task,
      analytics: this.analytics,
      notification: this.notification,
      search: this.search,
      webhook: this.webhook,
    };
  }

  /**
   * Check if repository exists
   */
  has(name) {
    return !!this[name];
  }

  /**
   * Get repository names
   */
  keys() {
    return Object.keys(this).filter(
      (key) => key !== "db" && typeof this[key] === "object"
    );
  }
}

/**
 * Repository Helper Functions
 * Utility functions for common repository operations
 */
class RepositoryHelpers {
  /**
   * Execute operations across multiple repositories in a transaction
   */
  static async executeTransaction(db, operations) {
    const results = [];

    for (const operation of operations) {
      const { repository, method, args } = operation;
      const result = await repository[method](...args);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate repository dependencies
   */
  static validateDependencies(repositories) {
    const required = ["farm", "finance", "inventory", "task"];
    const missing = required.filter((name) => !repositories.has(name));

    if (missing.length > 0) {
      throw new Error(`Missing required repositories: ${missing.join(", ")}`);
    }

    return true;
  }

  /**
   * Create batch operation for multiple repositories
   */
  static createBatchOperation(operations) {
    return {
      operations,
      async execute(db) {
        const results = [];
        for (const operation of operations) {
          const { repository, method, args } = operation;
          const result = await repository[method](...args);
          results.push({ success: true, result, operation });
        }
        return results;
      },
    };
  }
}

// Named exports
export {
  FarmRepository,
  AnimalRepository,
  CropRepository,
  CropPlanRepository,
  CropActivityRepository,
  CropObservationRepository,
  UserRepository,
  FieldRepository,
  FinanceRepository,
  InventoryRepository,
  TaskRepository,
  AnalyticsRepository,
  NotificationRepository,
  SearchRepository,
  WebhookRepository,
};

export { RepositoryFactory, RepositoryContainer, RepositoryHelpers };

// Default export for convenience
export default {
  FarmRepository,
  AnimalRepository,
  CropRepository,
  CropPlanRepository,
  CropActivityRepository,
  CropObservationRepository,
  UserRepository,
  FinanceRepository,
  InventoryRepository,
  TaskRepository,
  AnalyticsRepository,
  NotificationRepository,
  SearchRepository,
  WebhookRepository,
  RepositoryFactory,
  RepositoryContainer,
  RepositoryHelpers,
};
