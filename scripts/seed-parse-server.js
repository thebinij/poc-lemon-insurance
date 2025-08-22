#!/usr/bin/env node

/**
 * Parse Server Seed Script
 * Populates the database with initial data for development
 */

require('dotenv').config();
const Parse = require('parse/node');

// Initialize Parse with server configuration
Parse.initialize(
  process.env.PARSE_APP_ID || 'lemon-insurance-app-id',
  process.env.PARSE_JS_KEY || 'lemon-insurance-js-key',
  process.env.PARSE_MASTER_KEY || 'lemon-insurance-master-key'
);

Parse.serverURL = process.env.PARSE_SERVER_URL || 'http://localhost:1337/parse';

console.log('🌱 Starting Parse Server seeding...');
console.log(`🔗 Connecting to: ${Parse.serverURL}`);

async function seedParseServer() {
  try {
    // 1. Create sample users
    console.log('\n👥 Creating sample users...');
    const users = await createSampleUsers();
    
    // 2. Create sample sessions
    console.log('\n🔐 Creating sample sessions...');
    const sessions = await createSampleSessions(users);
    
    // 3. Create sample auth events
    console.log('\n📝 Creating sample auth events...');
    const authEvents = await createSampleAuthEvents(users, sessions);
    
    // 4. Create sample workflows
    console.log('\n⚙️ Creating sample workflows...');
    const workflows = await createSampleWorkflows(users, authEvents);
    
    // 5. Create sample custom collections
    console.log('\n📊 Creating sample custom collections...');
    await createSampleCustomCollections(users, sessions);
    
    console.log('\n🎉 Parse Server seeding completed successfully!');
    console.log(`📊 Created ${users.length} users, ${sessions.length} sessions, ${authEvents.length} auth events, ${workflows.length} workflows`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

async function createSampleUsers() {
  const User = Parse.Object.extend('User');
  const users = [];
  
  const sampleUsers = [
    {
      email: 'admin@lemon-insurance.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/vHhHh6i', // 'admin123'
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      role: 'admin'
    },
    {
      email: 'john.doe@lemon-insurance.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/vHhHh6i', // 'admin123'
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
      role: 'user'
    },
    {
      email: 'jane.smith@lemon-insurance.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/vHhHh6i', // 'admin123'
      firstName: 'Jane',
      lastName: 'Smith',
      status: 'active',
      role: 'user'
    }
  ];
  
  for (const userData of sampleUsers) {
    try {
      // Check if user already exists
      const query = new Parse.Query(User);
      query.equalTo('email', userData.email);
      const existingUser = await query.first({ useMasterKey: true });
      
      if (existingUser) {
        console.log(`   ⚠️ User ${userData.email} already exists, skipping...`);
        users.push(existingUser);
        continue;
      }
      
      const user = new User();
      user.set('email', userData.email);
      user.set('password', userData.password);
      user.set('firstName', userData.firstName);
      user.set('lastName', userData.lastName);
      user.set('status', userData.status);
      user.set('role', userData.role);
      user.set('metadata', {
        createdAt: new Date(),
        source: 'seed-script'
      });
      
      const savedUser = await user.save(null, { useMasterKey: true });
      console.log(`   ✅ Created user: ${savedUser.get('email')} (${savedUser.id})`);
      users.push(savedUser);
      
    } catch (error) {
      console.error(`   ❌ Failed to create user ${userData.email}:`, error.message);
    }
  }
  
  return users;
}

async function createSampleSessions(users) {
  const Session = Parse.Object.extend('Session');
  const sessions = [];
  
  const sampleSessions = [
    {
      email: users[0].get('email'),
      action: 'admin_login',
      status: 'active'
    },
    {
      email: users[1].get('email'),
      action: 'user_login',
      status: 'active'
    },
    {
      email: users[2].get('email'),
      action: 'user_signup',
      status: 'completed'
    }
  ];
  
  for (const sessionData of sampleSessions) {
    try {
      const session = new Session();
      session.set('email', sessionData.email);
      session.set('action', sessionData.action);
      session.set('status', sessionData.status);
      session.set('timestamp', new Date());
      session.set('metadata', {
        source: 'seed-script',
        createdAt: new Date()
      });
      
      const savedSession = await session.save(null, { useMasterKey: true });
      console.log(`   ✅ Created session: ${sessionData.action} for ${sessionData.email} (${savedSession.id})`);
      sessions.push(savedSession);
      
    } catch (error) {
      console.error(`   ❌ Failed to create session for ${sessionData.email}:`, error.message);
    }
  }
  
  return sessions;
}

async function createSampleAuthEvents(users, sessions) {
  const AuthEvent = Parse.Object.extend('AuthEvent');
  const authEvents = [];
  
  const sampleEvents = [
    {
      eventType: 'USER_SIGNUP',
      userId: users[2].id,
      email: users[2].get('email'),
      status: 'done',
      timestamp: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      eventType: 'USER_LOGIN',
      userId: users[0].id,
      email: users[0].get('email'),
      status: 'done',
      timestamp: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      eventType: 'USER_LOGIN',
      userId: users[1].id,
      email: users[1].get('email'),
      status: 'work',
      timestamp: new Date()
    }
  ];
  
  for (const eventData of sampleEvents) {
    try {
      const event = new AuthEvent();
      event.set('eventType', eventData.eventType);
      event.set('userId', eventData.userId);
      event.set('email', eventData.email);
      event.set('timestamp', eventData.timestamp);
      event.set('status', eventData.status);
      event.set('metadata', {
        source: 'seed-script',
        createdAt: new Date()
      });
      
      const savedEvent = await event.save(null, { useMasterKey: true });
      console.log(`   ✅ Created auth event: ${eventData.eventType} for ${eventData.email} (${savedEvent.id})`);
      authEvents.push(savedEvent);
      
    } catch (error) {
      console.error(`   ❌ Failed to create auth event for ${eventData.email}:`, error.message);
    }
  }
  
  return authEvents;
}

async function createSampleWorkflows(users, authEvents) {
  const Workflow = Parse.Object.extend('Workflow');
  const workflows = [];
  
  const sampleWorkflows = [
    {
      name: 'User Onboarding',
      status: 'completed',
      userId: users[2].id,
      data: {
        eventType: 'USER_SIGNUP',
        steps: ['account_created', 'email_verified', 'profile_completed'],
        currentStep: 'profile_completed'
      }
    },
    {
      name: 'Admin Authentication',
      status: 'completed',
      userId: users[0].id,
      data: {
        eventType: 'USER_LOGIN',
        steps: ['login_attempt', 'mfa_verified', 'session_created'],
        currentStep: 'session_created'
      }
    }
  ];
  
  for (const workflowData of sampleWorkflows) {
    try {
      const workflow = new Workflow();
      workflow.set('name', workflowData.name);
      workflow.set('status', workflowData.status);
      workflow.set('userId', workflowData.userId);
      workflow.set('data', workflowData.data);
      workflow.set('createdAt', new Date());
      workflow.set('updatedAt', new Date());
      
      const savedWorkflow = await workflow.save(null, { useMasterKey: true });
      console.log(`   ✅ Created workflow: ${workflowData.name} for user ${workflowData.userId} (${savedWorkflow.id})`);
      workflows.push(savedWorkflow);
      
    } catch (error) {
      console.error(`   ❌ Failed to create workflow ${workflowData.name}:`, error.message);
    }
  }
  
  return workflows;
}

async function createSampleCustomCollections(users, sessions) {
  // Create UserOnboarding records
  const UserOnboarding = Parse.Object.extend('UserOnboarding');
  
  try {
    const onboarding = new UserOnboarding();
    onboarding.set('userId', users[2].id);
    onboarding.set('email', users[2].get('email'));
    onboarding.set('firstName', users[2].get('firstName'));
    onboarding.set('lastName', users[2].get('lastName'));
    onboarding.set('status', 'completed');
    onboarding.set('step', 'profile_completed');
    onboarding.set('metadata', {
      source: 'seed-script',
      createdAt: new Date()
    });
    
    await onboarding.save(null, { useMasterKey: true });
    console.log(`   ✅ Created UserOnboarding record for ${users[2].get('email')}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to create UserOnboarding record:`, error.message);
  }
  
  // Create UserActivity records
  const UserActivity = Parse.Object.extend('UserActivity');
  
  try {
    const activity = new UserActivity();
    activity.set('userId', users[0].id);
    activity.set('email', users[0].get('email'));
    activity.set('activityType', 'login');
    activity.set('timestamp', new Date());
    activity.set('metadata', {
      source: 'seed-script',
      createdAt: new Date()
    });
    
    await activity.save(null, { useMasterKey: true });
    console.log(`   ✅ Created UserActivity record for ${users[0].get('email')}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to create UserActivity record:`, error.message);
  }
}

// Run the seeding
seedParseServer().then(() => {
  console.log('\n🚀 Seeding completed! You can now test the API endpoints.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Seeding failed:', error);
  process.exit(1);
});
