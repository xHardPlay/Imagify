import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Type, Hash, Palette, ToggleLeft, List } from 'lucide-react';
import { Workflow, Variable } from '../../types';

interface VariableManagerProps {
  workflow: Workflow | null;
  onUpdateWorkflow: (updates: Partial<Workflow>) => void;
}

const VariableManager: React.FC<VariableManagerProps> = ({ workflow, onUpdateWorkflow }) => {
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const defaultVariable: Omit<Variable, 'id'> = {
    name: '',
    type: 'text',
    description: '',
    defaultValue: '',
    required: true,
  };

  const [variableForm, setVariableForm] = useState(defaultVariable);

  const variableTypeIcons = {
    text: Type,
    number: Hash,
    color: Palette,
    boolean: ToggleLeft,
    list: List,
  };

  const variableTypeLabels = {
    text: 'Text',
    number: 'Number',
    color: 'Color',
    boolean: 'Yes/No',
    list: 'List',
  };

  const handleEditVariable = (variable: Variable) => {
    setEditingVariable(variable);
    setVariableForm({ ...variable });
    setIsCreating(false);
  };

  const handleCreateVariable = () => {
    setEditingVariable(null);
    setVariableForm(defaultVariable);
    setIsCreating(true);
  };

  const handleSaveVariable = () => {
    if (!workflow) return;

    const newVariable: Variable = {
      ...variableForm,
      id: editingVariable?.id || Date.now().toString(),
    };

    let updatedVariables;
    if (editingVariable) {
      updatedVariables = workflow.variables.map(v => 
        v.id === editingVariable.id ? newVariable : v
      );
    } else {
      updatedVariables = [...workflow.variables, newVariable];
    }

    onUpdateWorkflow({ variables: updatedVariables });
    handleCancelEdit();
  };

  const handleDeleteVariable = (variableId: string) => {
    if (!workflow) return;
    const updatedVariables = workflow.variables.filter(v => v.id !== variableId);
    onUpdateWorkflow({ variables: updatedVariables });
  };

  const handleCancelEdit = () => {
    setEditingVariable(null);
    setIsCreating(false);
    setVariableForm(defaultVariable);
  };

  const updateVariableForm = (field: keyof Variable, value: any) => {
    setVariableForm(prev => ({ ...prev, [field]: value }));
  };

  const updateWorkflowInfo = (field: 'name' | 'description', value: string) => {
    if (!workflow) return;
    setSaveStatus('saving');
    onUpdateWorkflow({ [field]: value });
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1000);
    }, 300);
  };

  if (!workflow) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <div className="relative mb-8">
              <Type className="h-20 w-20 text-purple-300 mx-auto animate-pulse" />
              <div className="absolute inset-0 h-20 w-20 mx-auto bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <h3 className="text-2xl font-bold gradient-text mb-4">
              🚀 No Workflow Selected
            </h3>
            <p className="text-purple-600/70 text-lg leading-relaxed">
              ✨ Create a new workflow or select an existing one to manage variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Info */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title">🛠️ Workflow Configuration</h2>
              <p className="card-description">
                ✨ Configure your workflow name, description, and variables
              </p>
            </div>
            {saveStatus !== 'idle' && (
              <div className="flex items-center space-x-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <div className="h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-purple-600">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600">Saved</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="card-content space-y-4">
          <div>
            <label htmlFor="workflowName" className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name
            </label>
            <input
              id="workflowName"
              type="text"
              value={workflow.name}
              onChange={(e) => updateWorkflowInfo('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter workflow name..."
            />
          </div>
          <div>
            <label htmlFor="workflowDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="workflowDescription"
              value={workflow.description || ''}
              onChange={(e) => updateWorkflowInfo('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe what this workflow analyzes..."
            />
          </div>
        </div>
      </div>

      {/* Variables List */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="card-title">📊 Variables</h2>
              <p className="card-description">
                🎯 Define what information to extract from images
              </p>
            </div>
            <button
              onClick={handleCreateVariable}
              className="btn btn-primary btn-sm group"
              disabled={isCreating || editingVariable !== null}
            >
              <Plus className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              ✨ Add Variable
            </button>
          </div>
        </div>
        <div className="card-content">
          {workflow.variables.length === 0 && !isCreating ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <Type className="h-16 w-16 text-purple-300 mx-auto animate-pulse" />
                <div className="absolute inset-0 h-16 w-16 mx-auto bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <h3 className="text-xl font-bold gradient-text mb-3">
                🎯 No Variables Defined
              </h3>
              <p className="text-purple-600/70 mb-6 leading-relaxed">
                ✨ Add variables to define what information to extract from images.
              </p>
              <button
                onClick={handleCreateVariable}
                className="btn btn-primary btn-md group"
              >
                <Plus className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                🚀 Add Your First Variable
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workflow.variables.map((variable) => {
                const Icon = variableTypeIcons[variable.type];
                return (
                  <div
                    key={variable.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      editingVariable?.id === variable.id ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <Icon className="h-5 w-5 text-gray-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium text-gray-900">{variable.name}</h4>
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {variableTypeLabels[variable.type]}
                          </span>
                          {variable.required && (
                            <span className="ml-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        {variable.description && (
                          <p className="text-sm text-gray-500 mt-1">{variable.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditVariable(variable)}
                        className="btn btn-ghost btn-sm"
                        disabled={isCreating || editingVariable !== null}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVariable(variable.id)}
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                        disabled={isCreating || editingVariable !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Variable Form */}
          {(isCreating || editingVariable) && (
            <div className="mt-6 p-4 border border-primary-300 rounded-lg bg-primary-50">
              <h3 className="font-medium text-gray-900 mb-4">
                {editingVariable ? 'Edit Variable' : 'Create New Variable'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variable Name *
                    </label>
                    <input
                      type="text"
                      value={variableForm.name}
                      onChange={(e) => updateVariableForm('name', e.target.value)}
                      placeholder="e.g., color palette, number of people"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={variableForm.type}
                      onChange={(e) => updateVariableForm('type', e.target.value as Variable['type'])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Object.entries(variableTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={variableForm.description || ''}
                    onChange={(e) => updateVariableForm('description', e.target.value)}
                    placeholder="Describe what this variable should extract..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required"
                    checked={variableForm.required || false}
                    onChange={(e) => updateVariableForm('required', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                    Required variable
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-outline btn-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVariable}
                    disabled={!variableForm.name.trim()}
                    className="btn btn-primary btn-sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingVariable ? 'Save Changes' : 'Create Variable'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariableManager;
