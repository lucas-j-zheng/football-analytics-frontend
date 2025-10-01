import React, { useState, useRef, useCallback } from 'react';
import { gameService } from '../services/game';
import { GameUploadData } from '../types/game';

interface GameUploadProps {
  onUploadSuccess: () => void;
  onCancel: () => void;
}

const GameUpload: React.FC<GameUploadProps> = ({ onUploadSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Partial<GameUploadData>>({
    week: 1,
    opponent: '',
    location: 'Home',
    analytics_focus_notes: '',
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!csvFile) {
      setError('Please upload a CSV file');
      return;
    }

    if (!formData.opponent?.trim()) {
      setError('Please enter opponent name');
      return;
    }

    setUploading(true);

    try {
      const uploadData: GameUploadData = {
        week: formData.week!,
        opponent: formData.opponent!,
        location: formData.location!,
        analytics_focus_notes: formData.analytics_focus_notes,
        csv_file: csvFile,
      };

      await gameService.uploadGame(uploadData);
      onUploadSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setCsvFile(file);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setCsvFile(null);
    setError('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.6)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        width: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px 16px 32px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Upload Game Data
            </h2>
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px 32px 32px' }}>
          {error && (
            <div style={{ 
              color: '#dc2626', 
              marginBottom: '20px', 
              padding: '12px 16px', 
              backgroundColor: '#fef2f2', 
              borderRadius: '8px',
              border: '1px solid #fecaca',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Form Fields Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Week
                </label>
                <input
                  type="number"
                  min="1"
                  max="17"
                  value={formData.week}
                  onChange={(e) => setFormData({ ...formData, week: parseInt(e.target.value) })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Opponent
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dallas Cowboys"
                  value={formData.opponent}
                  onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Location
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value as 'Home' | 'Away' })}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Home">🏠 Home</option>
                  <option value="Away">✈️ Away</option>
                </select>
              </div>
            </div>

            {/* File Upload Area */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Game Data (CSV File)
              </label>
              
              {!csvFile ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={openFileDialog}
                  style={{
                    border: `2px dashed ${isDragOver ? '#3b82f6' : '#d1d5db'}`,
                    borderRadius: '12px',
                    padding: '32px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragOver ? '#f8fafc' : '#fafafa',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', color: '#6b7280' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      {isDragOver ? 'Drop your CSV file here' : 'Drop your CSV file here, or '}
                    </span>
                    {!isDragOver && (
                      <span style={{ 
                        color: '#3b82f6', 
                        fontWeight: '500',
                        textDecoration: 'underline'
                      }}>
                        browse
                      </span>
                    )}
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    Required columns: Play ID, Down, Distance, Yard Line, Formation, Play Type, Play Name, Result of Play, Yards Gained, Points Scored
                  </p>
                </div>
              ) : (
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#16a34a' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '2px'
                        }}>
                          {csvFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {formatFileSize(csvFile.size)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        fontSize: '18px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.color = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Notes Field */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Analytics Focus Notes <span style={{ color: '#6b7280', fontWeight: '400' }}>(Optional)</span>
              </label>
              <textarea
                value={formData.analytics_focus_notes}
                onChange={(e) => setFormData({ ...formData, analytics_focus_notes: e.target.value })}
                placeholder="What specific insights are you looking for? e.g., red zone efficiency, third down conversions..."
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '80px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  padding: '10px 24px',
                  backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                {uploading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload Game'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default GameUpload;