const express = require('express');
const redis = require('./redis');

const app = express();
const PORT = 5000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    redis: redis.status,
    timestamp: new Date().toISOString()
  });
});

// Create or update a user
app.post('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = req.body;

    // Validate input
    if (!userData.name || !userData.email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      });
    }

    // Store user data as JSON string
    const userKey = `user:${userId}`;
    await redis.set(userKey, JSON.stringify(userData));

    res.status(201).json({ 
      message: 'User created successfully',
      userId: userId,
      data: userData
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get a user by ID
app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userKey = `user:${userId}`;

    const userData = await redis.get(userKey);

    if (!userData) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({ 
      userId: userId,
      data: JSON.parse(userData)
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Update a user
app.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userKey = `user:${userId}`;

    // Check if user exists
    const exists = await redis.exists(userKey);
    if (!exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userData = req.body;
    await redis.set(userKey, JSON.stringify(userData));

    res.json({ 
      message: 'User updated successfully',
      userId: userId,
      data: userData
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Delete a user
app.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userKey = `user:${userId}`;

    const deleted = await redis.del(userKey);

    if (!deleted) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({ 
      message: 'User deleted successfully',
      userId: userId
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// List all users
app.get('/users', async (req, res) => {
  try {
    // Get all user keys
    const keys = await redis.keys('user:*');

    if (keys.length === 0) {
      return res.json({ users: [] });
    }

    // Fetch all user data
    const users = await Promise.all(
      keys.map(async (key) => {
        const userData = await redis.get(key);
        const userId = key.split(':')[1];
        return {
          userId,
          data: JSON.parse(userData)
        };
      })
    );

    res.json({ 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
});
