// Database helper utilities

import type { Env, User, Workflow, Variable, ApiSettings, Session, Analysis } from './types';

// User queries
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare(
    'SELECT id, email, created_at FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();
  return result as User | null;
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare(
    'SELECT id, email, created_at FROM users WHERE id = ?'
  ).bind(id).first();
  return result as User | null;
}

export async function getUserWithPassword(db: D1Database, email: string): Promise<{
  id: string;
  email: string;
  password_hash: string;
  salt: string;
} | null> {
  const result = await db.prepare(
    'SELECT id, email, password_hash, salt FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();
  return result as { id: string; email: string; password_hash: string; salt: string } | null;
}

export async function createUser(
  db: D1Database,
  id: string,
  email: string,
  passwordHash: string,
  salt: string
): Promise<void> {
  await db.prepare(
    'INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)'
  ).bind(id, email.toLowerCase(), passwordHash, salt).run();
}

// Session queries
export async function createSession(
  db: D1Database,
  id: string,
  userId: string,
  tokenHash: string,
  expiresAt: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await db.prepare(
    'INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, tokenHash, expiresAt, ipAddress || null, userAgent || null).run();
}

export async function getSessionByToken(db: D1Database, tokenHash: string): Promise<{
  session: Session;
  user: User;
} | null> {
  const result = await db.prepare(`
    SELECT s.id, s.user_id, s.token_hash, s.expires_at, s.created_at,
           u.id as u_id, u.email as u_email, u.created_at as u_created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
  `).bind(tokenHash).first();

  if (!result) return null;

  return {
    session: {
      id: result.id as string,
      user_id: result.user_id as string,
      token_hash: result.token_hash as string,
      expires_at: result.expires_at as string,
      created_at: result.created_at as string,
    },
    user: {
      id: result.u_id as string,
      email: result.u_email as string,
      created_at: result.u_created_at as string,
    }
  };
}

export async function deleteSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function deleteUserSessions(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

// Workflow queries
export async function getWorkflowsByUser(db: D1Database, userId: string): Promise<Workflow[]> {
  const result = await db.prepare(
    'SELECT * FROM workflows WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all();
  return (result.results || []) as Workflow[];
}

export async function getWorkflowById(db: D1Database, id: string, userId: string): Promise<Workflow | null> {
  const result = await db.prepare(
    'SELECT * FROM workflows WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();
  return result as Workflow | null;
}

export async function createWorkflow(
  db: D1Database,
  id: string,
  userId: string,
  name: string,
  description?: string
): Promise<void> {
  await db.prepare(
    'INSERT INTO workflows (id, user_id, name, description) VALUES (?, ?, ?, ?)'
  ).bind(id, userId, name, description || null).run();
}

export async function updateWorkflow(
  db: D1Database,
  id: string,
  userId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    sets.push('description = ?');
    values.push(updates.description);
  }
  sets.push("updated_at = datetime('now')");

  values.push(id, userId);

  await db.prepare(
    `UPDATE workflows SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();
}

export async function deleteWorkflow(db: D1Database, id: string, userId: string): Promise<void> {
  await db.prepare('DELETE FROM workflows WHERE id = ? AND user_id = ?').bind(id, userId).run();
}

// Variable queries
export async function getVariablesByWorkflow(db: D1Database, workflowId: string): Promise<Variable[]> {
  const result = await db.prepare(
    'SELECT * FROM variables WHERE workflow_id = ? ORDER BY sort_order ASC'
  ).bind(workflowId).all();
  return (result.results || []) as Variable[];
}

export async function createVariable(
  db: D1Database,
  id: string,
  workflowId: string,
  name: string,
  type: string,
  description?: string,
  defaultValue?: string,
  required: boolean = false,
  sortOrder: number = 0
): Promise<void> {
  await db.prepare(
    'INSERT INTO variables (id, workflow_id, name, type, description, default_value, required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, workflowId, name, type, description || null, defaultValue || null, required ? 1 : 0, sortOrder).run();
}

export async function updateVariable(
  db: D1Database,
  id: string,
  updates: Partial<Variable>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.type !== undefined) {
    sets.push('type = ?');
    values.push(updates.type);
  }
  if (updates.description !== undefined) {
    sets.push('description = ?');
    values.push(updates.description);
  }
  if (updates.default_value !== undefined) {
    sets.push('default_value = ?');
    values.push(updates.default_value);
  }
  if (updates.required !== undefined) {
    sets.push('required = ?');
    values.push(updates.required);
  }
  if (updates.sort_order !== undefined) {
    sets.push('sort_order = ?');
    values.push(updates.sort_order);
  }

  if (sets.length === 0) return;

  values.push(id);

  await db.prepare(
    `UPDATE variables SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...values).run();
}

export async function deleteVariable(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM variables WHERE id = ?').bind(id).run();
}

export async function deleteVariablesByWorkflow(db: D1Database, workflowId: string): Promise<void> {
  await db.prepare('DELETE FROM variables WHERE workflow_id = ?').bind(workflowId).run();
}

// API Settings queries
export async function getApiSettings(db: D1Database, userId: string): Promise<ApiSettings | null> {
  const result = await db.prepare(
    'SELECT * FROM api_settings WHERE user_id = ?'
  ).bind(userId).first();
  return result as ApiSettings | null;
}

export async function upsertApiSettings(
  db: D1Database,
  userId: string,
  settings: {
    gemini_api_key_encrypted?: string | null;
    gemini_api_key_iv?: string | null;
    model?: string;
    max_tokens?: number;
    temperature?: number;
  }
): Promise<void> {
  const existing = await getApiSettings(db, userId);

  if (existing) {
    const sets: string[] = ["updated_at = datetime('now')"];
    const values: (string | number | null)[] = [];

    if (settings.gemini_api_key_encrypted !== undefined) {
      sets.push('gemini_api_key_encrypted = ?');
      values.push(settings.gemini_api_key_encrypted);
    }
    if (settings.gemini_api_key_iv !== undefined) {
      sets.push('gemini_api_key_iv = ?');
      values.push(settings.gemini_api_key_iv);
    }
    if (settings.model !== undefined) {
      sets.push('model = ?');
      values.push(settings.model);
    }
    if (settings.max_tokens !== undefined) {
      sets.push('max_tokens = ?');
      values.push(settings.max_tokens);
    }
    if (settings.temperature !== undefined) {
      sets.push('temperature = ?');
      values.push(settings.temperature);
    }

    values.push(userId);

    await db.prepare(
      `UPDATE api_settings SET ${sets.join(', ')} WHERE user_id = ?`
    ).bind(...values).run();
  } else {
    await db.prepare(
      'INSERT INTO api_settings (user_id, gemini_api_key_encrypted, gemini_api_key_iv, model, max_tokens, temperature) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      userId,
      settings.gemini_api_key_encrypted || null,
      settings.gemini_api_key_iv || null,
      settings.model || 'gemini-1.5-flash',
      settings.max_tokens || 2000,
      settings.temperature || 0.4
    ).run();
  }
}

// Analysis queries
export async function getAnalysesByUser(
  db: D1Database,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Analysis[]> {
  const result = await db.prepare(
    'SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(userId, limit, offset).all();
  return (result.results || []) as Analysis[];
}

export async function getAnalysisById(
  db: D1Database,
  id: string,
  userId: string
): Promise<Analysis | null> {
  const result = await db.prepare(
    'SELECT * FROM analyses WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();
  return result as Analysis | null;
}

export async function createAnalysis(
  db: D1Database,
  id: string,
  userId: string,
  workflowId: string | null,
  workflowName: string,
  title: string,
  resultData: string,
  thumbnailBase64?: string | null,
  localImageId?: string | null
): Promise<void> {
  await db.prepare(
    'INSERT INTO analyses (id, user_id, workflow_id, workflow_name, title, result_data, thumbnail_base64, local_image_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    userId,
    workflowId,
    workflowName,
    title,
    resultData,
    thumbnailBase64 || null,
    localImageId || null
  ).run();
}

export async function deleteAnalysis(
  db: D1Database,
  id: string,
  userId: string
): Promise<void> {
  await db.prepare('DELETE FROM analyses WHERE id = ? AND user_id = ?').bind(id, userId).run();
}

export async function getAnalysesCount(db: D1Database, userId: string): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM analyses WHERE user_id = ?'
  ).bind(userId).first();
  return (result?.count as number) || 0;
}
