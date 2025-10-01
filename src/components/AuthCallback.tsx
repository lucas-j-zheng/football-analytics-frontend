import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          return;
        }

        if (data.session) {
          // User is authenticated, check if they need to complete profile
          const user = data.session.user;
          const userMetadata = user.user_metadata;

          // Check if user has completed their profile
          if (userMetadata.role === 'team') {
            const { data: teamProfile } = await supabase
              .from('teams')
              .select('*')
              .eq('id', user.id)
              .single();

            if (!teamProfile) {
              // Redirect to complete team profile
              navigate('/complete-profile?type=team');
              return;
            }
          } else if (userMetadata.role === 'consultant') {
            const { data: consultantProfile } = await supabase
              .from('consultants')
              .select('*')
              .eq('id', user.id)
              .single();

            if (!consultantProfile) {
              // Redirect to complete consultant profile
              navigate('/complete-profile?type=consultant');
              return;
            }
          }

          // Profile is complete, redirect to dashboard
          navigate('/dashboard');
        } else {
          // No session, redirect to login
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError(error.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div className="spinner"></div>
        </div>
        <p>Completing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    );
  }

  return null;
};

export default AuthCallback;