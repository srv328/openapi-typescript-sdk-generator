/**
 * Example usage of generated React hooks
 */

import React, { useState } from 'react';
import { 
  useGetUsers, 
  useCreateUser, 
  useGetUserById, 
  useUpdateUser, 
  useDeleteUser 
} from '../hooks';

// Example component for working with list of users
export function UsersList() {
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  
  // Use hook for GET request
  const { data, loading, error, refetch } = useGetUsers({
    query: {
      limit,
      offset
    },
    enabled: true // automatically loads data when mounted
  });

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handlePreviousPage = () => {
    setOffset(prev => Math.max(0, prev - limit));
  };

  const handleNextPage = () => {
    setOffset(prev => prev + limit);
  };

  return (
    <div>
      <h2>List of users</h2>
      <div>
        <button onClick={handlePreviousPage} disabled={offset === 0}>Previous page</button>
        <button onClick={refetch}>Refresh</button>
        <button onClick={handleNextPage}>Next page</button>
      </div>
      {data?.users && (
        <ul>
          {data.users.map(user => (
            <li key={user.id}>
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      )}
      {data && (
        <p>Total: {data.total}, Showing: {offset + 1} - {offset + (data.users?.length || 0)}</p>
      )}
    </div>
  );
}

// Example component for creating a user
export function CreateUserForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);

  // Use hook for POST request (mutation)
  const { mutate, data, loading, error } = useCreateUser({
    body: {
      email,
      name,
      age
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  return (
    <div>
      <h2>Create user</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Email:
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </label>
        </div>
        <div>
          <label>
            Name:
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </label>
        </div>
        <div>
          <label>
            Age:
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(parseInt(e.target.value))} 
              min="0" 
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Создание...' : 'Создать'}
        </button>
      </form>
      
      {error && <div style={{ color: 'red' }}>Ошибка: {error.message}</div>}
      {data && (
        <div style={{ color: 'green' }}>
          User created: {data.name} ({data.email})
        </div>
      )}
    </div>
  );
}

// Example component for viewing and editing a user
export function UserDetails({ userId }: { userId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Hook for GET request
  const { data: user, loading, error, refetch } = useGetUserById({
    path: { userId }
  });

  // Hook for PUT request
  const { mutate: updateUser, loading: updating } = useUpdateUser({
    path: { userId },
    body: {
      name,
      email
    }
  });

  // Hook for DELETE request
  const { mutate: deleteUser, loading: deleting } = useDeleteUser({
    path: { userId }
  });

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!user) return null;

  const handleUpdate = () => {
    updateUser();
    setIsEditing(false);
    setTimeout(refetch, 1000); // Update data after update
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser();
    }
  };

  return (
    <div>
      <h2>User details</h2>
      {isEditing ? (
        <div>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Name" 
          />
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            type="email"
          />
          <button onClick={handleUpdate} disabled={updating}>
            {updating ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Age:</strong> {user.age || 'Not specified'}</p>
          <p><strong>Active:</strong> {user.isActive ? 'Yes' : 'No'}</p>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}

// Example main application component
export function App() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div>
      <h1>Example usage of API</h1>
      <UsersList />
      <hr />
      <CreateUserForm />
      <hr />
      {selectedUserId && (
        <UserDetails userId={selectedUserId} />
      )}
    </div>
  );
}


