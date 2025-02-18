import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import {
  sendGroupInvitation,
  sendGoalShared,
  sendGoalAchievement,
  sendGoalProgress
} from './emailService.js';
const { Pool } = pg;

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // List of allowed origins
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'health_tracker',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432
});

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/register', async (req, res) => {
  const { username, email, password, height, weight } = req.body;

  try {
    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, height, weight)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email`,
      [username, email, hashedPassword, height, weight]
    );

    // Create and send JWT token
    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create and send JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Profile routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, height, weight FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  const { username, email, height, weight } = req.body;
  const userId = req.user.id;

  try {
    // Validate email format
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username or email is already taken by another user
    if (username || email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
        [username, email, userId]
      );

      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: 'Username or email is already taken' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }
    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (height !== undefined) {
      updates.push(`height = $${paramCount}`);
      values.push(height);
      paramCount++;
    }
    if (weight !== undefined) {
      updates.push(`weight = $${paramCount}`);
      values.push(weight);
      paramCount++;
    }

    // Add user ID as the last parameter
    values.push(userId);

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount}
       RETURNING id, username, email, height, weight`,
      values
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Activities routes
app.post('/api/activities', authenticateToken, async (req, res) => {
  const { type, activityType, name, duration, calories, protein, notes } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO activities 
       (user_id, type, activity_type, name, duration, calories, protein, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, type, activityType, name, duration, calories, protein, notes]
    );

    res.status(201).json({ activity: result.rows[0] });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Error creating activity' });
  }
});

app.get('/api/activities', authenticateToken, async (req, res) => {
  const { start, end } = req.query;

  try {
    let query = 'SELECT * FROM activities WHERE user_id = $1';
    const params = [req.user.id];

    if (start && end) {
      query += ' AND performed_at BETWEEN $2 AND $3';
      params.push(start, end);
    }

    query += ' ORDER BY performed_at DESC';

    const result = await pool.query(query, params);
    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ error: 'Error fetching activities' });
  }
});

app.put('/api/activities/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const allowedUpdates = [
    'type',
    'activity_type',
    'name',
    'duration',
    'calories',
    'protein',
    'notes'
  ];

  const updateFields = Object.keys(updates)
    .filter((key) => allowedUpdates.includes(key))
    .map((key, index) => `${key} = $${index + 1}`);

  const updateValues = Object.keys(updates)
    .filter((key) => allowedUpdates.includes(key))
    .map((key) => updates[key]);

  try {
    const result = await pool.query(
      `UPDATE activities 
       SET ${updateFields.join(', ')}
       WHERE id = $${updateValues.length + 1} AND user_id = $${
        updateValues.length + 2
      }
       RETURNING *`,
      [...updateValues, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ activity: result.rows[0] });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Error updating activity' });
  }
});

app.delete('/api/activities/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Error deleting activity' });
  }
});

// Goals routes
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ goals: result.rows });
  } catch (error) {
    console.error('Fetch goals error:', error);
    res.status(500).json({ error: 'Error fetching goals' });
  }
});

app.post('/api/goals/initial-value', authenticateToken, async (req, res) => {
  const { type, period } = req.body;

  try {
    let startValue = 0;

    // Get the date range based on period
    const { startDate, endDate } = getDateRangeForPeriod(period);

    switch (type) {
      case 'weight': {
        // For weight goals, use the user's current weight
        const userResult = await pool.query(
          'SELECT weight FROM users WHERE id = $1',
          [req.user.id]
        );
        startValue = userResult.rows[0]?.weight || 0;
        break;
      }

      case 'calories_burned': {
        // Sum calories from exercise activities in the period
        const result = await pool.query(
          `SELECT COALESCE(SUM(calories), 0) as total
           FROM activities 
           WHERE user_id = $1 
           AND type = 'exercise'
           AND performed_at BETWEEN $2 AND $3`,
          [req.user.id, startDate, endDate]
        );
        startValue = parseFloat(result.rows[0].total);
        break;
      }

      case 'calories_consumed': {
        // Sum calories from meal activities in the period
        const result = await pool.query(
          `SELECT COALESCE(SUM(calories), 0) as total
           FROM activities 
           WHERE user_id = $1 
           AND type = 'meal'
           AND performed_at BETWEEN $2 AND $3`,
          [req.user.id, startDate, endDate]
        );
        startValue = parseFloat(result.rows[0].total);
        break;
      }

      case 'protein': {
        // Sum protein from meal activities in the period
        const result = await pool.query(
          `SELECT COALESCE(SUM(protein), 0) as total
           FROM activities 
           WHERE user_id = $1 
           AND type = 'meal'
           AND performed_at BETWEEN $2 AND $3`,
          [req.user.id, startDate, endDate]
        );
        startValue = parseFloat(result.rows[0].total);
        break;
      }
    }

    // Create the goal with the calculated start value
    const result = await pool.query(
      `INSERT INTO goals 
       (user_id, title, description, target_value, current_value, unit, type, period, start_value, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        req.body.title,
        req.body.description,
        req.body.target_value,
        startValue, // Set current_value to start_value initially
        req.body.unit,
        type,
        period,
        startValue,
        req.body.end_date
      ]
    );

    res.status(201).json({ goal: result.rows[0] });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Error creating goal' });
  }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
  const { title, description, target_value, unit, end_date } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO goals (user_id, title, description, target_value, unit, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title, description, target_value, unit, end_date]
    );

    res.status(201).json({ goal: result.rows[0] });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Error creating goal' });
  }
});

app.get('/api/goals/:id/progress', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Get the goal
    const goalResult = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalResult.rows[0];
    let progress = 0;

    // Get the date range based on period
    const { startDate, endDate } = getDateRangeForPeriod(goal.period);

    // Calculate progress based on goal type
    switch (goal.type) {
      case 'weight': {
        // For weight goals, use the user's current weight
        const userResult = await pool.query(
          'SELECT weight FROM users WHERE id = $1',
          [req.user.id]
        );
        progress = userResult.rows[0]?.weight || 0;
        break;
      }

      case 'calories_burned': {
        // Sum calories from exercise activities in the period
        const result = await pool.query(
          `SELECT COALESCE(SUM(calories), 0) as total
           FROM activities 
           WHERE user_id = $1 
           AND type = 'exercise'
           AND performed_at BETWEEN $2 AND $3`,
          [req.user.id, startDate, endDate]
        );
        progress = parseFloat(result.rows[0].total);
        break;
      }

      case 'calories_consumed': {
        // Sum calories from meal activities in the period
        const result = await pool.query(
          `SELECT COALESCE(SUM(calories), 0) as total
           FROM activities 
           WHERE user_id = $1 
           AND type = 'meal'
           AND performed_at BETWEEN $2 AND $3`,
          [req.user.id, startDate, endDate]
        );
        progress = parseFloat(result.rows[0].total);
        break;
      }

      case 'protein': {
        // Sum protein from meal activities in the period
        const result = await pool.query(
          `SELECT COALESCE(SUM(protein), 0) as total
           FROM activities 
           WHERE user_id = $1 
           AND type = 'meal'
           AND performed_at BETWEEN $2 AND $3`,
          [req.user.id, startDate, endDate]
        );
        progress = parseFloat(result.rows[0].total);
        break;
      }

      default:
        progress = goal.current_value;
    }

    // Update goal progress in database
    await pool.query(
      `UPDATE goals 
       SET current_value = $1,
           status = CASE 
             WHEN $1 >= target_value THEN 'completed'::goal_status
             WHEN end_date < CURRENT_DATE THEN 'failed'::goal_status
             ELSE 'in_progress'::goal_status
           END
       WHERE id = $2`,
      [progress, goal.id]
    );

    res.json({ progress });
  } catch (error) {
    console.error('Goal progress error:', error);
    res.status(500).json({ error: 'Error calculating goal progress' });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Get current goal state
    const currentGoal = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (currentGoal.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = currentGoal.rows[0];

    // Update goal
    const result = await pool.query(
      `UPDATE goals 
       SET ${Object.keys(updates)
         .map((key, i) => `${key} = $${i + 1}`)
         .join(', ')}
       WHERE id = $${Object.keys(updates).length + 1} AND user_id = $${
        Object.keys(updates).length + 2
      }
       RETURNING *`,
      [...Object.values(updates), id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updatedGoal = result.rows[0];

    // Check if goal is shared with any groups
    const groupsResult = await pool.query(
      `SELECT DISTINCT g.id, g.name
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1`,
      [req.user.id]
    );

    // Send notifications for significant progress or completion
    for (const group of groupsResult.rows) {
      // Get group members
      const membersResult = await pool.query(
        `SELECT u.email 
         FROM group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = $1 AND gm.user_id != $2`,
        [group.id, req.user.id]
      );

      // Calculate progress percentage
      const progressPercentage =
        (updatedGoal.current_value / updatedGoal.target_value) * 100;

      // Send achievement notification if goal is completed
      if (updatedGoal.status === 'completed' && goal.status !== 'completed') {
        for (const member of membersResult.rows) {
          await sendGoalAchievement(member.email, updatedGoal.title, group.name);
        }
      }
      // Send progress notification for significant progress (every 25%)
      else if (
        Math.floor(progressPercentage / 25) >
        Math.floor(
          (goal.current_value / goal.target_value) * 100 / 25
        )
      ) {
        for (const member of membersResult.rows) {
          await sendGoalProgress(
            member.email,
            updatedGoal.title,
            group.name,
            updatedGoal.current_value,
            updatedGoal.target_value,
            updatedGoal.unit
          );
        }
      }
    }

    res.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Error updating goal' });
  }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Error deleting goal' });
  }
});

// Groups routes
app.post(
  '/api/groups/:id/goals/:goalId/share',
  authenticateToken,
  async (req, res) => {
    const { id: groupId, goalId } = req.params;

    try {
      // Check if user is group member
      const memberResult = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, req.user.id]
      );

      if (memberResult.rows.length === 0) {
        return res
          .status(403)
          .json({ error: 'Not a member of this group' });
      }

      // Get goal details
      const goalResult = await pool.query(
        'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
        [goalId, req.user.id]
      );

      if (goalResult.rows.length === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const goal = goalResult.rows[0];

      // Generate sharing code
      let sharingCode;
      do {
        sharingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      } while (
        (await pool.query(
          'SELECT 1 FROM shared_goals WHERE code = $1',
          [sharingCode]
        )).rows.length > 0
      );

      // Save shared goal
      await pool.query(
        `INSERT INTO shared_goals 
       (goal_id, group_id, code, expires_at, shared_by)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4)`,
        [goalId, groupId, sharingCode, req.user.id]
      );

      // Get group members
      const membersResult = await pool.query(
        `SELECT u.email 
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1 AND gm.user_id != $2`,
        [groupId, req.user.id]
      );

      // Get group name
      const groupResult = await pool.query(
        'SELECT name FROM groups WHERE id = $1',
        [groupId]
      );

      // Send emails to all group members
      const groupName = groupResult.rows[0].name;
      for (const member of membersResult.rows) {
        await sendGoalShared(member.email, goal.title, groupName, sharingCode);
      }

      res.json({ message: 'Goal shared successfully' });
    } catch (error) {
      console.error('Share goal error:', error);
      res.status(500).json({ error: 'Error sharing goal' });
    }
  }
);

app.post('/api/goals/accept', authenticateToken, async (req, res) => {
  const { code } = req.body;

  try {
    // Find shared goal
    const sharedGoalResult = await pool.query(
      `SELECT sg.*, g.* 
       FROM shared_goals sg
       JOIN goals g ON sg.goal_id = g.id
       WHERE sg.code = $1 
       AND sg.expires_at > NOW()`,
      [code]
    );

    if (sharedGoalResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: 'Invalid or expired sharing code' });
    }

    const sharedGoal = sharedGoalResult.rows[0];

    // Create new goal for current user
    const result = await pool.query(
      `INSERT INTO goals 
       (user_id, title, description, target_value, current_value, unit, type, period, start_value, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        sharedGoal.title,
        sharedGoal.description,
        sharedGoal.target_value,
        0, // Start from 0
        sharedGoal.unit,
        sharedGoal.type,
        sharedGoal.period,
        0, // Start from 0
        sharedGoal.end_date
      ]
    );

    // Delete used sharing code
    await pool.query('DELETE FROM shared_goals WHERE code = $1', [code]);

    res.json({ goal: result.rows[0] });
  } catch (error) {
    console.error('Accept goal error:', error);
    res.status(500).json({ error: 'Error accepting goal' });
  }
});

app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    // Get groups where user is either creator or member
    const result = await pool.query(
      `SELECT g.*, 
        COUNT(DISTINCT gm.user_id) as member_count,
        EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = $1) as is_member,
        g.created_by = $1 as is_creator
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.created_by = $1 
       OR EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = $1)
       GROUP BY g.id`,
      [req.user.id]
    );

    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Fetch groups error:', error);
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
  const { name, description } = req.body;

  try {
    // Create group
    const groupResult = await pool.query(
      `INSERT INTO groups (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, req.user.id]
    );

    // Add creator as first member
    await pool.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)`,
      [groupResult.rows[0].id, req.user.id]
    );

    // Return group with member count and flags
    const result = await pool.query(
      `SELECT g.*, 
        COUNT(DISTINCT gm.user_id) as member_count,
        true as is_member,
        true as is_creator
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.id = $1
       GROUP BY g.id`,
      [groupResult.rows[0].id]
    );

    res.status(201).json({ group: result.rows[0] });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Error creating group' });
  }
});

app.post('/api/groups/:id/invite', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    // Check if user is group creator
    const groupResult = await pool.query(
      'SELECT * FROM groups WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );

    if (groupResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: 'Not authorized to invite to this group' });
    }

    // Generate invitation code
    let invitationCode;
    do {
      invitationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    } while (
      (await pool.query(
        'SELECT 1 FROM group_invites WHERE code = $1',
        [invitationCode]
      )).rows.length > 0
    );

    // Save invitation to database
    await pool.query(
      `INSERT INTO group_invites (group_id, email, code, expires_at, created_by)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4)`,
      [id, email, invitationCode, req.user.id]
    );

    // Send invitation email
    await sendGroupInvitation(email, groupResult.rows[0].name, invitationCode);

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Group invite error:', error);
    res.status(500).json({ error: 'Error sending invitation' });
  }
});

app.post('/api/groups/join', authenticateToken, async (req, res) => {
  const { code } = req.body;

  try {
    // Find invitation
    const inviteResult = await pool.query(
      `SELECT gi.*, g.* 
       FROM group_invites gi
       JOIN groups g ON gi.group_id = g.id
       WHERE gi.code = $1 
       AND gi.expires_at > NOW()`,
      [code]
    );

    if (inviteResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: 'Invalid or expired invitation code' });
    }

    const invite = inviteResult.rows[0];

    // Check if user is already a member
    const memberResult = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [invite.group_id, req.user.id]
    );

    if (memberResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'Already a member of this group' });
    }

    // Add user to group
    await pool.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)`,
      [invite.group_id, req.user.id]
    );

    // Delete used invitation
    await pool.query('DELETE FROM group_invites WHERE code = $1', [code]);

    // Return group with member count and flags
    const result = await pool.query(
      `SELECT g.*, 
        COUNT(DISTINCT gm.user_id) as member_count,
        true as is_member,
        g.created_by = $1 as is_creator
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.id = $2
       GROUP BY g.id`,
      [req.user.id, invite.group_id]
    );

    res.json({ group: result.rows[0] });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Error joining group' });
  }
});

app.post('/api/groups/:id/leave', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user is a member
    const memberResult = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (memberResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: 'Not a member of this group' });
    }

    // Check if user is the creator
    const groupResult = await pool.query(
      'SELECT created_by FROM groups WHERE id = $1',
      [id]
    );

    if (groupResult.rows[0].created_by === req.user.id) {
      return res
        .status(400)
        .json({ error: 'Group creator cannot leave the group' });
    }

    // Remove user from group
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Error leaving group' });
  }
});

// Helper function to get date range for a period
function getDateRangeForPeriod(period) {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    default: // 'total'
      startDate = new Date(0); // Beginning of time
      endDate = new Date(now.setHours(23, 59, 59, 999));
  }

  return { startDate, endDate };
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
