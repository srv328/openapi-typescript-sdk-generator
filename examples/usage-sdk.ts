/**
 * Example usage of generated TypeScript SDK
 */

import axios from 'axios';
import { getUsers, createUser, getUserById, updateUser, deleteUser } from '../sdk';

// Setup axios (if needed for base authorization or other settings)
axios.defaults.baseURL = 'https://api.example.com/v1';
axios.defaults.headers.common['Authorization'] = 'Bearer YOUR_TOKEN_HERE';

async function exampleUsage() {
  try {
    // Example 1: Get list of users with pagination
    console.log('Getting list of users...');
    const usersList = await getUsers({
      query: {
        limit: 10,
        offset: 0
      }
    });
    console.log('Users:', usersList);

    // Example 2: Create new user
    console.log('\nCreating new user...');
    const newUser = await createUser({
      body: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        age: 30
      }
    });
    console.log('Created user:', newUser);

    // Example 3: Get user by ID
    console.log('\nGetting user by ID...');
    const user = await getUserById({
      path: {
        userId: newUser.id
      }
    });
    console.log('User:', user);

    // Example 4: Update user
    console.log('\nUpdating user...');
    const updatedUser = await updateUser({
      path: {
        userId: newUser.id
      },
      body: {
        name: 'John Updated',
        isActive: true
      }
    });
    console.log('Updated user:', updatedUser);

    // Example 5: Delete user
    console.log('\nDeleting user...');
    await deleteUser({
      path: {
        userId: newUser.id
      }
    });
    console.log('User deleted');

  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run example
if (require.main === module) {
  exampleUsage();
}


