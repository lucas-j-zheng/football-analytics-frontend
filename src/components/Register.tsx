import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [consultantName, setConsultantName] = useState('');
  const [userType, setUserType] = useState<'team' | 'consultant'>('team');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = userType === 'team'
        ? {
            email,
            password,
            team_name: teamName,
            sport: 'football',
            contact_person: teamName
          }
        : {
            email,
            password,
            first_name: consultantName.split(' ')[0] || consultantName,
            last_name: consultantName.split(' ')[1] || '',
            specializations: ['football'],
            experience_years: 0
          };

      await register(data, userType);
      navigate(userType === 'team' ? '/team/dashboard' : '/consultant/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Register</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="radio"
            value="team"
            checked={userType === 'team'}
            onChange={(e) => setUserType(e.target.value as 'team')}
          />
          Team/Coach
        </label>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="radio"
            value="consultant"
            checked={userType === 'consultant'}
            onChange={(e) => setUserType(e.target.value as 'consultant')}
          />
          Consultant
        </label>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {userType === 'team' ? (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Full Name"
              value={consultantName}
              onChange={(e) => setConsultantName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register;