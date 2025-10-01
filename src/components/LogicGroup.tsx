import React from 'react';
import FilterCondition from './FilterCondition';

interface FilterField {
  field_name: string;
  display_name: string;
  data_type: string;
  ui_type: string;
  description: string;
  required: boolean;
  min_value?: number;
  max_value?: number;
  options?: Array<{value: any, label: string}>;
  default_value?: any;
  group?: string;
  searchable: boolean;
  sortable: boolean;
}

interface FilterSchema {
  fields: Record<string, FilterField>;
  groups: Record<string, string[]>;
  searchable_fields: string[];
  sortable_fields: string[];
}

interface QueryCondition {
  field: string;
  operator: string;
  value: any;
}

interface QueryGroup {
  operator: 'and' | 'or' | 'not';
  conditions: Array<QueryCondition | QueryGroup>;
}

interface LogicGroupProps {
  group: QueryGroup;
  schema: FilterSchema;
  onUpdate: (group: QueryGroup) => void;
  onRemoveCondition: (index: number) => void;
  onUpdateCondition: (index: number, condition: QueryCondition) => void;
  level?: number;
}

const LogicGroup: React.FC<LogicGroupProps> = ({
  group,
  schema,
  onUpdate,
  onRemoveCondition,
  onUpdateCondition,
  level = 0
}) => {
  const getLogicColor = (operator: string) => {
    switch (operator) {
      case 'and': return '#10B981';
      case 'or': return '#F59E0B';
      case 'not': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getLogicIcon = (operator: string) => {
    switch (operator) {
      case 'and': return '&';
      case 'or': return '|';
      case 'not': return '!';
      default: return '?';
    }
  };

  const addCondition = () => {
    const newCondition: QueryCondition = {
      field: 'play_type',
      operator: 'equals',
      value: 'Pass'
    };

    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition]
    });
  };

  const addGroup = () => {
    const newGroup: QueryGroup = {
      operator: 'and',
      conditions: []
    };

    onUpdate({
      ...group,
      conditions: [...group.conditions, newGroup]
    });
  };

  const updateCondition = (index: number, condition: QueryCondition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = condition;
    onUpdate({
      ...group,
      conditions: newConditions
    });
  };

  const removeCondition = (index: number) => {
    onUpdate({
      ...group,
      conditions: group.conditions.filter((_, i) => i !== index)
    });
  };

  const updateNestedGroup = (index: number, nestedGroup: QueryGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = nestedGroup;
    onUpdate({
      ...group,
      conditions: newConditions
    });
  };

  const changeOperator = (newOperator: 'and' | 'or' | 'not') => {
    onUpdate({
      ...group,
      operator: newOperator
    });
  };

  const borderColor = getLogicColor(group.operator);
  const indentLevel = level * 20;

  return (
    <div
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        backgroundColor: level === 0 ? '#1E293B' : '#374151',
        marginLeft: `${indentLevel}px`,
        overflow: 'hidden'
      }}
    >
      {/* Group Header */}
      <div
        style={{
          backgroundColor: borderColor,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'monospace'
            }}
          >
            {getLogicIcon(group.operator)} {group.operator.toUpperCase()}
          </span>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['and', 'or', 'not'] as const).map(op => (
              <button
                key={op}
                onClick={() => changeOperator(op)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: group.operator === op ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={addCondition}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + Condition
          </button>
          {level < 2 && (
            <button
              onClick={addGroup}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              + Group
            </button>
          )}
        </div>
      </div>

      {/* Group Content */}
      <div style={{ padding: '16px' }}>
        {group.conditions.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#94A3B8',
              border: '2px dashed #475569',
              borderRadius: '8px',
              backgroundColor: '#0F172A'
            }}
          >
            <p style={{ margin: '0 0 12px 0' }}>
              No conditions in this {group.operator.toUpperCase()} group
            </p>
            <button
              onClick={addCondition}
              style={{
                padding: '8px 16px',
                backgroundColor: borderColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add First Condition
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {group.conditions.map((condition, index) => (
              <div key={index}>
                {/* Logic Operator Label (except for first item) */}
                {index > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '8px 0'
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: borderColor,
                        color: '#FFFFFF',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}
                    >
                      {group.operator}
                    </span>
                  </div>
                )}

                {/* Render Condition or Nested Group */}
                {typeof condition === 'object' && 'field' in condition ? (
                  <FilterCondition
                    condition={condition}
                    schema={schema}
                    onUpdate={(updatedCondition) => updateCondition(index, updatedCondition)}
                    onRemove={() => removeCondition(index)}
                  />
                ) : (
                  <LogicGroup
                    group={condition as QueryGroup}
                    schema={schema}
                    onUpdate={(updatedGroup) => updateNestedGroup(index, updatedGroup)}
                    onRemoveCondition={() => removeCondition(index)}
                    onUpdateCondition={(_, updatedCondition) => updateCondition(index, updatedCondition)}
                    level={level + 1}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Group Summary */}
        {group.conditions.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#0F172A',
              borderRadius: '8px',
              border: '1px solid #475569'
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#94A3B8',
                marginBottom: '8px'
              }}
            >
              This {group.operator.toUpperCase()} group contains:
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              {group.conditions.map((condition, index) => (
                <span
                  key={index}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#374151',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                >
                  {typeof condition === 'object' && 'field' in condition
                    ? `${schema.fields[condition.field]?.display_name || condition.field} ${condition.operator} ${condition.value}`
                    : `Nested ${(condition as QueryGroup).operator.toUpperCase()} group`
                  }
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogicGroup;