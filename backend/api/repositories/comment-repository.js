import { BaseRepository } from "../_database.js";

export class CommentRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "task_comments");
  }

  async findByTaskId(taskId) {
    const query = `
      SELECT 
        tc.*,
        u.name as user_name,
        u.email as user_email
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at DESC
    `;
    return this.db.queryAll(query, [taskId]);
  }
}
