import { BaseRepository } from "../_database.js";

export class TimeLogRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "task_time_logs");
  }

  async findByTaskId(taskId) {
    const query = `
      SELECT 
        ttl.*,
        u.name as user_name,
        u.email as user_email
      FROM task_time_logs ttl
      JOIN users u ON ttl.user_id = u.id
      WHERE ttl.task_id = ?
      ORDER BY ttl.start_time DESC
    `;
    return this.db.queryAll(query, [taskId]);
  }

  async getTotalHours(taskId) {
    const query = `
      SELECT COALESCE(SUM(total_hours), 0) as total
      FROM task_time_logs
      WHERE task_id = ?
    `;
    const result = await this.db.queryOne(query, [taskId]);
    return result ? result.total : 0;
  }
}
