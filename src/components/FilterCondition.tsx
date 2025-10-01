import React from 'react';

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

interface FilterConditionProps {
  condition: QueryCondition;
  schema: FilterSchema;
  onUpdate: (condition: QueryCondition) => void;
  onRemove: () => void;
}

const FilterCondition: React.FC<FilterConditionProps> = ({
  condition,
  schema,
  onUpdate,
  onRemove
}) => {
  const field = schema.fields[condition.field];
  
  const getOperatorOptions = (dataType: string) => {
    const baseOptions = [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'not equals' }
    ];

    if (dataType === 'integer' || dataType === 'float') {
      return [
        ...baseOptions,
        { value: 'greater_than', label: '>' },
        { value: 'greater_than_or_equal', label: '>=' },
        { value: 'less_than', label: '<' },
        { value: 'less_than_or_equal', label: '<=' },
        { value: 'between', label: 'between' }
      ];
    }

    if (dataType === 'string') {
      return [
        ...baseOptions,
        { value: 'contains', label: 'contains' },
        { value: 'starts_with', label: 'starts with' },
        { value: 'ends_with', label: 'ends with' }
      ];
    }

    if (dataType === 'enum') {
      return [
        ...baseOptions,
        { value: 'in', label: 'is one of' },
        { value: 'not_in', label: 'is not one of' }
      ];
    }

    return baseOptions;
  };

  const renderValueInput = () => {
    if (!field) return null;

    const commonInputStyle = {
      padding: '8px 12px',
      backgroundColor: '#0F172A',
      color: '#FFFFFF',
      border: '1px solid #475569',
      borderRadius: '6px',
      fontSize: '14px'
    };

    // Handle BETWEEN operator
    if (condition.operator === 'between') {
      const value = Array.isArray(condition.value) ? condition.value : [field.min_value || 0, field.max_value || 100];
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            value={value[0]}
            onChange={(e) => onUpdate({
              ...condition,
              value: [Number(e.target.value), value[1]]
            })}
            style={{ ...commonInputStyle, width: '80px' }}
            min={field.min_value}
            max={field.max_value}
          />
          <span style={{ color: '#94A3B8' }}>and</span>
          <input
            type="number"
            value={value[1]}
            onChange={(e) => onUpdate({
              ...condition,
              value: [value[0], Number(e.target.value)]
            })}
            style={{ ...commonInputStyle, width: '80px' }}
            min={field.min_value}
            max={field.max_value}
          />
        </div>
      );
    }

    // Handle IN/NOT_IN operators
    if (condition.operator === 'in' || condition.operator === 'not_in') {
      if (field.options) {
        const selectedValues = Array.isArray(condition.value) ? condition.value : [];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {field.options.map(option => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: selectedValues.includes(option.value) ? '#3B82F6' : '#374151',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#FFFFFF'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    onUpdate({
                      ...condition,
                      value: newValues
                    });
                  }}
                  style={{ margin: 0, width: '12px', height: '12px' }}
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      }
    }

    // Handle range slider for numeric fields
    if (field.ui_type === 'range_slider' && (field.data_type === 'integer' || field.data_type === 'float')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="range"
            min={field.min_value}
            max={field.max_value}
            value={condition.value}
            onChange={(e) => onUpdate({
              ...condition,
              value: Number(e.target.value)
            })}
            style={{ flex: 1 }}
          />
          <span style={{ 
            color: '#FFFFFF', 
            minWidth: '40px',
            textAlign: 'center',
            backgroundColor: '#374151',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {condition.value}
          </span>
        </div>
      );
    }

    // Handle dropdown/select
    if (field.ui_type === 'dropdown' && field.options) {
      return (
        <select
          value={condition.value}
          onChange={(e) => onUpdate({
            ...condition,
            value: e.target.value
          })}
          style={{
            ...commonInputStyle,
            minWidth: '120px'
          }}
        >
          {field.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    // Handle multi-select
    if (field.ui_type === 'multi_select' && field.options) {
      const selectedValues = Array.isArray(condition.value) ? condition.value : [condition.value];
      return (
        <div style={{
          ...commonInputStyle,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          minHeight: '38px',
          alignItems: 'flex-start'
        }}>
          {field.options.map(option => (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                backgroundColor: selectedValues.includes(option.value) ? '#3B82F6' : '#6B7280',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#FFFFFF'
              }}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={(e) => {
                  let newValues;
                  if (e.target.checked) {
                    newValues = [...selectedValues, option.value];
                  } else {
                    newValues = selectedValues.filter(v => v !== option.value);
                  }
                  onUpdate({
                    ...condition,
                    value: newValues.length === 1 ? newValues[0] : newValues
                  });
                }}
                style={{ margin: 0, width: '10px', height: '10px' }}
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    }

    // Handle number input
    if (field.data_type === 'integer' || field.data_type === 'float') {
      return (
        <input
          type="number"
          value={condition.value}
          onChange={(e) => onUpdate({
            ...condition,
            value: field.data_type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value)
          })}
          style={{
            ...commonInputStyle,
            width: '120px'
          }}
          min={field.min_value}
          max={field.max_value}
        />
      );
    }

    // Handle text input (default)
    return (
      <input
        type="text"
        value={condition.value}
        onChange={(e) => onUpdate({
          ...condition,
          value: e.target.value
        })}
        style={{
          ...commonInputStyle,
          minWidth: '120px'
        }}
        placeholder={`Enter ${field.display_name.toLowerCase()}...`}
      />
    );
  };

  if (!field) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#FEE2E2',
        border: '1px solid #FECACA',
        borderRadius: '8px',
        color: '#DC2626'
      }}>
        Unknown field: {condition.field}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#374151',
      borderRadius: '8px',
      border: '1px solid #4B5563'
    }}>
      {/* Field Selection */}
      <select
        value={condition.field}
        onChange={(e) => onUpdate({
          field: e.target.value,
          operator: 'equals',
          value: schema.fields[e.target.value]?.default_value || ''
        })}
        style={{
          padding: '8px 12px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          border: '1px solid #475569',
          borderRadius: '6px',
          fontSize: '14px',
          minWidth: '140px'
        }}
      >
        {Object.entries(schema.fields).map(([fieldName, fieldConfig]) => (
          <option key={fieldName} value={fieldName}>
            {fieldConfig.display_name}
          </option>
        ))}
      </select>

      {/* Operator Selection */}
      <select
        value={condition.operator}
        onChange={(e) => onUpdate({
          ...condition,
          operator: e.target.value,
          value: e.target.value === 'between' ? [field.min_value || 0, field.max_value || 100] :
                e.target.value === 'in' || e.target.value === 'not_in' ? [] :
                field.default_value || ''
        })}
        style={{
          padding: '8px 12px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          border: '1px solid #475569',
          borderRadius: '6px',
          fontSize: '14px',
          minWidth: '100px'
        }}
      >
        {getOperatorOptions(field.data_type).map(op => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value Input */}
      <div style={{ flex: 1 }}>
        {renderValueInput()}
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        style={{
          padding: '8px',
          backgroundColor: '#EF4444',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Remove condition"
      >
        ✕
      </button>
    </div>
  );
};

export default FilterCondition;