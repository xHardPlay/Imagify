// GET /api/workflows - List user workflows
// POST /api/workflows - Create new workflow

import { generateId } from '../../../lib/auth';
import { authenticateRequest, unauthorizedResponse } from '../../../lib/authHelper';
import { getWorkflowsByUser, getVariablesByWorkflow, createWorkflow, createVariable, deleteVariablesByWorkflow } from '../../../lib/db';
import type { Env } from '../../../lib/types';

interface CreateWorkflowRequest {
  name: string;
  description?: string;
  variables?: Array<{
    name: string;
    type: 'text' | 'number' | 'color' | 'boolean' | 'list';
    description?: string;
    defaultValue?: string;
    required?: boolean;
  }>;
}

// GET - List workflows
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const workflows = await getWorkflowsByUser(context.env.DB, user.id);

    // Get variables for each workflow
    const workflowsWithVariables = await Promise.all(
      workflows.map(async (workflow) => {
        const variables = await getVariablesByWorkflow(context.env.DB, workflow.id);
        return {
          ...workflow,
          variables: variables.map(v => ({
            id: v.id,
            name: v.name,
            type: v.type,
            description: v.description,
            defaultValue: v.default_value,
            required: v.required === 1,
          })),
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      data: workflowsWithVariables,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get workflows error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch workflows',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST - Create workflow
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const body: CreateWorkflowRequest = await request.json();
    const { name, description, variables } = body;

    // Validate name
    if (!name || name.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Workflow name is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create workflow
    const workflowId = generateId();
    await createWorkflow(env.DB, workflowId, user.id, name.trim(), description?.trim());

    // Create variables if provided
    const createdVariables: Array<{
      id: string;
      name: string;
      type: string;
      description: string | null;
      defaultValue: string | null;
      required: boolean;
    }> = [];

    if (variables && variables.length > 0) {
      for (let i = 0; i < variables.length; i++) {
        const v = variables[i];
        const variableId = generateId();
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
        createdVariables.push({
          id: variableId,
          name: v.name,
          type: v.type,
          description: v.description || null,
          defaultValue: v.defaultValue || null,
          required: v.required || false,
        });
      }
    }

    const now = new Date().toISOString();

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: workflowId,
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        variables: createdVariables,
        created_at: now,
        updated_at: now,
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create workflow error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create workflow',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
