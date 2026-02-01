// GET /api/workflows/:id - Get workflow by ID
// PUT /api/workflows/:id - Update workflow
// DELETE /api/workflows/:id - Delete workflow

import { generateId } from '../../../lib/auth';
import { authenticateRequest, unauthorizedResponse } from '../../../lib/authHelper';
import {
  getWorkflowById,
  getVariablesByWorkflow,
  updateWorkflow,
  deleteWorkflow,
  deleteVariablesByWorkflow,
  createVariable,
} from '../../../lib/db';
import type { Env } from '../../../lib/types';

interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  variables?: Array<{
    id?: string;
    name: string;
    type: 'text' | 'number' | 'color' | 'boolean' | 'list';
    description?: string;
    defaultValue?: string;
    required?: boolean;
  }>;
}

// GET - Get workflow by ID
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);
  const workflowId = context.params.id as string;

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const workflow = await getWorkflowById(context.env.DB, workflowId, user.id);

    if (!workflow) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Workflow not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const variables = await getVariablesByWorkflow(context.env.DB, workflowId);

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...workflow,
        variables: variables.map(v => ({
          id: v.id,
          name: v.name,
          type: v.type,
          description: v.description,
          defaultValue: v.default_value,
          required: v.required === 1,
        })),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get workflow error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch workflow',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT - Update workflow
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);
  const workflowId = context.params.id as string;

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    // Check if workflow exists and belongs to user
    const workflow = await getWorkflowById(env.DB, workflowId, user.id);

    if (!workflow) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Workflow not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: UpdateWorkflowRequest = await request.json();
    const { name, description, variables } = body;

    // Update workflow fields
    const updates: { name?: string; description?: string } = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || '';

    if (Object.keys(updates).length > 0) {
      await updateWorkflow(env.DB, workflowId, user.id, updates);
    }

    // Update variables if provided
    const updatedVariables: Array<{
      id: string;
      name: string;
      type: string;
      description: string | null;
      defaultValue: string | null;
      required: boolean;
    }> = [];

    if (variables !== undefined) {
      // Delete existing variables and recreate
      await deleteVariablesByWorkflow(env.DB, workflowId);

      for (let i = 0; i < variables.length; i++) {
        const v = variables[i];
        const variableId = v.id || generateId();
        await createVariable(
          env.DB,
          variableId,
          workflowId,
          v.name,
          v.type,
          v.description,
          v.defaultValue,
          v.required || false,
          i
        );
        updatedVariables.push({
          id: variableId,
          name: v.name,
          type: v.type,
          description: v.description || null,
          defaultValue: v.defaultValue || null,
          required: v.required || false,
        });
      }
    } else {
      // Get existing variables
      const existingVars = await getVariablesByWorkflow(env.DB, workflowId);
      existingVars.forEach(v => {
        updatedVariables.push({
          id: v.id,
          name: v.name,
          type: v.type,
          description: v.description,
          defaultValue: v.default_value,
          required: v.required === 1,
        });
      });
    }

    const now = new Date().toISOString();

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: workflowId,
        user_id: user.id,
        name: name?.trim() || workflow.name,
        description: description?.trim() ?? workflow.description,
        variables: updatedVariables,
        created_at: workflow.created_at,
        updated_at: now,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Update workflow error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update workflow',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Delete workflow
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);
  const workflowId = context.params.id as string;

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    // Check if workflow exists and belongs to user
    const workflow = await getWorkflowById(env.DB, workflowId, user.id);

    if (!workflow) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Workflow not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete workflow (variables will be cascade deleted)
    await deleteWorkflow(env.DB, workflowId, user.id);

    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Workflow deleted successfully' },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Delete workflow error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete workflow',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
