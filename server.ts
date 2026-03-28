import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import axios from 'axios';
import { Server } from "socket.io";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const emitLog = (message: string, type: 'info' | 'error' | 'warning' = 'info') => {
    io.emit('log', { message, type, timestamp: new Date().toISOString() });
  };

  const PORT = 3000;

  const dbPath = path.join(__dirname, 'db.json');
  let dbCache: any = null;

  // Firebase initialization for persistence
  let firebaseApp: any = null;
  let firestore: any = null;
  
  const initFirebase = async () => {
    try {
      const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
      if (fs.existsSync(firebaseConfigPath)) {
        const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
        const { initializeApp } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');
        
        firebaseApp = initializeApp(firebaseConfig);
        firestore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
        console.log('Firebase initialized for server-side persistence');
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize Firebase on server:', error);
    }
    return false;
  };

  const syncToFirestore = async (data: any) => {
    if (!firestore) return;
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestore, 'backups', 'db'), data);
      console.log('Database synced to Firestore');
    } catch (error) {
      console.error('Failed to sync to Firestore:', error);
    }
  };

  const restoreFromFirestore = async () => {
    if (!firestore) return null;
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(firestore, 'backups', 'db'));
      if (docSnap.exists()) {
        console.log('Database restored from Firestore');
        return docSnap.data();
      }
    } catch (error) {
      console.error('Failed to restore from Firestore:', error);
    }
    return null;
  };

  const writeDb = (data: any) => {
    dbCache = data;
    try {
      // Use a temporary file for atomic write to prevent corruption
      const tempPath = `${dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      fs.renameSync(tempPath, dbPath);
      
      // Sync to Firestore in background for permanent persistence
      syncToFirestore(data);
    } catch (error) {
      console.error('Error writing database:', error);
    }
  };

  const readDb = () => {
    if (dbCache) return dbCache;
    try {
      if (!fs.existsSync(dbPath)) {
        const initialDb = { 
          servers: [], 
          users: [], 
          admins: [
            {
              id: 'default',
              username: '709580',
              password: '709580',
              companyName: 'General Panel',
              approvedAppName: 'General Panel',
              isApproved: true,
              status: 'active',
              createdAt: new Date().toISOString(),
              isMainAdmin: true,
              isStaffAdmin: false
            }
          ], 
          appRequests: [], 
          agents: [], 
          meetings: [], 
          streamingApps: [], 
          tools: [],
          agentRequests: [],
          systemConfig: {},
          transactions: [],
          loanRequests: [],
          chatMessages: [],
          notifications: [],
          adminNotifications: [],
          recurringPayments: [],
          tasks: [],
          repaymentRequests: [],
          aiPublishRequests: [],
          deletedItems: []
        };
        fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
        dbCache = initialDb;
        return initialDb;
      }
      const dbData = fs.readFileSync(dbPath, 'utf-8');
      dbCache = JSON.parse(dbData);
      
      // Ensure default admin exists if admins is empty
      if (dbCache.admins.length === 0) {
        dbCache.admins.push({
          id: 'default',
          username: '709580',
          password: '709580',
          companyName: 'General Panel',
          approvedAppName: 'General Panel',
          isApproved: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          isMainAdmin: true,
          isStaffAdmin: false
        });
        fs.writeFileSync(dbPath, JSON.stringify(dbCache, null, 2));
      }
      
      // Ensure all collections exist
      const collections = [
        'servers', 'users', 'admins', 'appRequests', 'agents', 'meetings', 
        'streamingApps', 'tools', 'agentRequests', 'systemConfig', 'transactions',
        'loanRequests', 'chatMessages', 'notifications', 'adminNotifications', 'recurringPayments', 'tasks', 'repaymentRequests', 'aiPublishRequests', 'deletedItems'
      ];
      let updated = false;
      collections.forEach(c => {
        if (!dbCache[c]) {
          dbCache[c] = c === 'systemConfig' ? {} : [];
          updated = true;
        }
      });
      if (updated) writeDb(dbCache);
      return dbCache;
    } catch (error) {
      console.error('Error reading database:', error);
      return { users: [], admins: [], agents: [] }; // Minimal fallback
    }
  };

  // Initialize Firebase and restore if needed
  await initFirebase();
  if (!fs.existsSync(dbPath)) {
    const remoteDb = await restoreFromFirestore();
    if (remoteDb) {
      writeDb(remoteDb);
    }
  }

  // Periodic background sync to Firestore for "unlimited years" persistence
  setInterval(() => {
    const db = readDb();
    syncToFirestore(db);
  }, 300000); // Every 5 minutes

  app.use(express.json({ limit: '50mb' }));

  // Socket.io Signaling for WebRTC
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Store userId on socket for signaling
    socket.on("join-room", (roomId, userId, userName) => {
      socket.join(roomId);
      socket.join(userId); // Join a room with their own User ID
      (socket as any).userId = userId; // Store for later use
      socket.to(roomId).emit("user-connected", userId, userName);

      socket.on("disconnect", () => {
        socket.to(roomId).emit("user-disconnected", userId);
      });
    });

    socket.on("offer", (offer, targetUserId) => {
      const senderId = (socket as any).userId;
      socket.to(targetUserId).emit("offer", offer, senderId);
    });

    socket.on("answer", (answer, targetUserId) => {
      const senderId = (socket as any).userId;
      socket.to(targetUserId).emit("answer", answer, senderId);
    });

    socket.on("ice-candidate", (candidate, targetUserId) => {
      const senderId = (socket as any).userId;
      socket.to(targetUserId).emit("ice-candidate", candidate, senderId);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    emitLog('Health check requested', 'info');
    res.json({ status: "ok", message: "AI Server Control Panel Server is running" });
  });

  // System Config Routes
  app.get('/api/system-config', (req, res) => {
    emitLog('System config requested', 'info');
    const db = readDb();
    res.json(db.systemConfig);
  });

  app.post('/api/system-config', (req, res) => {
    emitLog('System config updated', 'warning');
    const db = readDb();
    db.systemConfig = { ...db.systemConfig, ...req.body };
    writeDb(db);
    res.json(db.systemConfig);
  });

  // Agent Request Routes
  app.get('/api/agent-requests', (req, res) => {
    const db = readDb();
    res.json(db.agentRequests);
  });

  app.post('/api/agent-requests', (req, res) => {
    const db = readDb();
    const newRequest = { ...req.body };
    if (!newRequest.id) newRequest.id = Date.now().toString();
    if (!newRequest.createdAt) newRequest.createdAt = new Date().toISOString();
    db.agentRequests.push(newRequest);
    writeDb(db);
    res.status(201).json(newRequest);
  });

  app.put('/api/agent-requests/:id', (req, res) => {
    const db = readDb();
    const requestId = req.params.id;
    const index = db.agentRequests.findIndex((r: any) => r.id === requestId || r.id.toString() === requestId);
    if (index !== -1) {
      db.agentRequests[index] = { ...db.agentRequests[index], ...req.body };
      writeDb(db);
      res.json(db.agentRequests[index]);
    } else {
      res.status(404).json({ message: 'Agent request not found' });
    }
  });

  app.delete('/api/agent-requests/:id', (req, res) => {
    const db = readDb();
    const requestId = req.params.id;
    const itemToDelete = db.agentRequests.find((r: any) => r.id === requestId || r.id.toString() === requestId);
    if (itemToDelete) {
      if (!db.deletedItems) db.deletedItems = [];
      db.deletedItems.push({ ...itemToDelete, originalCollection: 'agentRequests', deletedAt: new Date().toISOString() });
    }
    db.agentRequests = db.agentRequests.filter((r: any) => r.id !== requestId && r.id.toString() !== requestId);
    writeDb(db);
    res.status(204).send();
  });

  // Admin routes
  app.get('/api/admins', (req, res) => {
    const db = readDb();
    res.json(db.admins);
  });

  app.get('/api/admins/:id', (req, res) => {
    const db = readDb();
    const adminId = req.params.id;
    const admin = db.admins.find((a: any) => a.id === adminId || a.id.toString() === adminId);
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  });

  app.post('/api/admins', (req, res) => {
    const db = readDb();
    const newAdmin = { ...req.body };
    if (!newAdmin.id) newAdmin.id = Date.now().toString();
    if (!newAdmin.createdAt) newAdmin.createdAt = new Date().toISOString();
    db.admins.push(newAdmin);
    writeDb(db);
    res.status(201).json(newAdmin);
  });

  app.put('/api/admins/:id', (req, res) => {
    const db = readDb();
    const adminId = req.params.id;
    const index = db.admins.findIndex((a: any) => a.id === adminId || a.id.toString() === adminId);
    if (index !== -1) {
      db.admins[index] = { ...db.admins[index], ...req.body };
      writeDb(db);
      res.json(db.admins[index]);
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  });

  app.delete('/api/admins/:id', (req, res) => {
    const db = readDb();
    const adminId = req.params.id;
    const itemToDelete = db.admins.find((a: any) => a.id === adminId || a.id.toString() === adminId);
    if (itemToDelete) {
      if (!db.deletedItems) db.deletedItems = [];
      db.deletedItems.push({ ...itemToDelete, originalCollection: 'admins', deletedAt: new Date().toISOString() });
    }
    db.admins = db.admins.filter((a: any) => a.id !== adminId && a.id.toString() !== adminId);
    writeDb(db);
    res.status(204).send();
  });

  // Transaction routes
  app.get('/api/transactions', (req, res) => {
    const db = readDb();
    const { userId } = req.query;
    if (userId) {
      return res.json(db.transactions.filter((t: any) => t.userId === userId));
    }
    res.json(db.transactions);
  });

  app.post('/api/transactions', (req, res) => {
    const db = readDb();
    const newTransaction = { ...req.body };
    if (!newTransaction.id) newTransaction.id = Date.now().toString();
    if (!newTransaction.date) newTransaction.date = new Date().toISOString();
    db.transactions.push(newTransaction);
    writeDb(db);
    res.status(201).json(newTransaction);
  });

  app.get('/api/repayment-requests', (req, res) => {
    const db = readDb();
    const { userId, adminId } = req.query;
    let requests = db.repaymentRequests || [];
    if (userId) {
      requests = requests.filter((r: any) => r.userId === userId);
    }
    if (adminId) {
      requests = requests.filter((r: any) => r.adminId === adminId);
    }
    res.json(requests);
  });

  app.post('/api/repayment-requests', (req, res) => {
    const db = readDb();
    const newRequest = { ...req.body };
    if (!newRequest.id) newRequest.id = Date.now().toString();
    if (!newRequest.date) newRequest.date = new Date().toISOString();
    if (!db.repaymentRequests) db.repaymentRequests = [];
    db.repaymentRequests.push(newRequest);
    writeDb(db);
    res.status(201).json(newRequest);
  });

  app.put('/api/repayment-requests/:id', (req, res) => {
    const db = readDb();
    const requestId = req.params.id;
    if (!db.repaymentRequests) db.repaymentRequests = [];
    const index = db.repaymentRequests.findIndex((r: any) => r.id === requestId || r.id.toString() === requestId);
    if (index !== -1) {
      const oldStatus = db.repaymentRequests[index].status;
      const newStatus = req.body.status;
      
      db.repaymentRequests[index] = { ...db.repaymentRequests[index], ...req.body };
      
      // If repayment is being approved, update user balance
      if (oldStatus !== 'approved' && newStatus === 'approved') {
        const userId = db.repaymentRequests[index].userId;
        const amount = db.repaymentRequests[index].amount;
        const userIndex = db.users.findIndex((u: any) => u.id === userId || u.id.toString() === userId);
        
        if (userIndex !== -1) {
          db.users[userIndex].balance = (db.users[userIndex].balance || 0) - amount;
          
          // Add a transaction record
          const newTransaction = {
            id: Date.now().toString(),
            userId: userId,
            type: 'payment',
            title: 'Loan Repayment Approved',
            amount: -amount,
            date: new Date().toISOString(),
            status: 'completed'
          };
          db.transactions.push(newTransaction);

          // Add a notification for the user
          const newNotification = {
            id: Math.random().toString(36).substr(2, 9),
            userId: userId,
            title: 'Repayment Approved',
            message: `Your loan repayment of K ${amount} has been approved and deducted from your balance.`,
            isRead: false,
            type: 'payment',
            date: new Date().toISOString()
          };
          if (!db.notifications) db.notifications = [];
          db.notifications.push(newNotification);
        }
      }
      
      writeDb(db);
      res.json(db.repaymentRequests[index]);
    } else {
      res.status(404).json({ message: 'Repayment request not found' });
    }
  });

  // App Request routes
  app.get('/api/app-requests', (req, res) => {
    const db = readDb();
    res.json(db.appRequests);
  });

  app.post('/api/app-requests', (req, res) => {
    const db = readDb();
    const newRequest = { ...req.body };
    if (!newRequest.id) newRequest.id = Date.now().toString();
    if (!newRequest.createdAt) newRequest.createdAt = new Date().toISOString();
    db.appRequests.push(newRequest);
    writeDb(db);
    res.status(201).json(newRequest);
  });

  app.put('/api/app-requests/:id', (req, res) => {
    const db = readDb();
    const requestId = req.params.id;
    const index = db.appRequests.findIndex((r: any) => r.id === requestId || r.id.toString() === requestId);
    if (index !== -1) {
      db.appRequests[index] = { ...db.appRequests[index], ...req.body };
      writeDb(db);
      res.json(db.appRequests[index]);
    } else {
      res.status(404).json({ message: 'Request not found' });
    }
  });

  // Agent routes
  app.get('/api/agents', (req, res) => {
    const db = readDb();
    const { adminId } = req.query;
    if (adminId) {
      return res.json(db.agents.filter((a: any) => a.adminId === adminId));
    }
    res.json(db.agents);
  });

  app.get('/api/agents/:id', (req, res) => {
    const db = readDb();
    const agentId = req.params.id;
    const agent = db.agents.find((a: any) => a.id === agentId || a.id.toString() === agentId);
    if (agent) {
      res.json(agent);
    } else {
      res.status(404).json({ message: 'Agent not found' });
    }
  });

  app.post('/api/agents', (req, res) => {
    const db = readDb();
    const newAgent = { ...req.body };
    if (!newAgent.id) newAgent.id = Date.now().toString();
    db.agents.push(newAgent);
    writeDb(db);
    res.status(201).json(newAgent);
  });

  app.put('/api/agents/:id', (req, res) => {
    const db = readDb();
    const agentId = req.params.id;
    const index = db.agents.findIndex((a: any) => a.id === agentId || a.id.toString() === agentId);
    if (index !== -1) {
      db.agents[index] = { ...db.agents[index], ...req.body };
      writeDb(db);
      res.json(db.agents[index]);
    } else {
      res.status(404).json({ message: 'Agent not found' });
    }
  });

  app.delete('/api/agents/:id', (req, res) => {
    const db = readDb();
    const agentId = req.params.id;
    const itemToDelete = db.agents.find((a: any) => a.id === agentId || a.id.toString() === agentId);
    if (itemToDelete) {
      if (!db.deletedItems) db.deletedItems = [];
      db.deletedItems.push({ ...itemToDelete, originalCollection: 'agents', deletedAt: new Date().toISOString() });
    }
    db.agents = db.agents.filter((a: any) => a.id !== agentId && a.id.toString() !== agentId);
    writeDb(db);
    res.status(204).send();
  });

  // Meeting routes
  app.get('/api/meetings', (req, res) => {
    const db = readDb();
    res.json(db.meetings);
  });

  app.post('/api/meetings', (req, res) => {
    const db = readDb();
    const newMeeting = { ...req.body };
    if (!newMeeting.id) newMeeting.id = Date.now().toString();
    db.meetings.push(newMeeting);
    writeDb(db);
    res.status(201).json(newMeeting);
  });

  app.put('/api/meetings/:id', (req, res) => {
    const db = readDb();
    const meetingId = req.params.id;
    const index = db.meetings.findIndex((m: any) => m.id === meetingId || m.id.toString() === meetingId);
    if (index !== -1) {
      db.meetings[index] = { ...db.meetings[index], ...req.body };
      writeDb(db);
      res.json(db.meetings[index]);
    } else {
      res.status(404).json({ message: 'Meeting not found' });
    }
  });

  // Streaming App routes
  app.get('/api/streaming-apps', (req, res) => {
    const db = readDb();
    const { category } = req.query;
    if (category) {
      return res.json(db.streamingApps.filter((a: any) => a.category === category));
    }
    res.json(db.streamingApps);
  });

  app.post('/api/streaming-apps', (req, res) => {
    const db = readDb();
    const newApp = { ...req.body };
    if (!newApp.id) newApp.id = Date.now().toString();
    db.streamingApps.push(newApp);
    writeDb(db);
    res.status(201).json(newApp);
  });

  // Tool routes
  app.get('/api/tools', (req, res) => {
    const db = readDb();
    res.json(db.tools);
  });

  app.post('/api/tools', (req, res) => {
    const db = readDb();
    const newTool = { ...req.body };
    if (!newTool.id) newTool.id = Date.now().toString();
    db.tools.push(newTool);
    writeDb(db);
    res.status(201).json(newTool);
  });

  // Server routes
  app.get('/api/servers', (req, res) => {
    const db = readDb();
    res.json(db.servers);
  });

  app.post('/api/servers', (req, res) => {
    const db = readDb();
    const newServer = { ...req.body };
    if (!newServer.id) newServer.id = Date.now().toString();
    db.servers.push(newServer);
    writeDb(db);
    res.status(201).json(newServer);
  });

  app.delete('/api/servers/:id', (req, res) => {
    const db = readDb();
    const serverId = req.params.id;
    db.servers = db.servers.filter((server: any) => server.id !== serverId && server.id.toString() !== serverId);
    writeDb(db);
    res.status(204).send();
  });

  app.put('/api/servers/:id', (req, res) => {
    const db = readDb();
    const serverId = req.params.id;
    const index = db.servers.findIndex((s: any) => s.id === serverId || s.id.toString() === serverId);
    if (index !== -1) {
      db.servers[index] = { ...db.servers[index], ...req.body };
      writeDb(db);
      res.json(db.servers[index]);
    } else {
      res.status(404).json({ message: 'Server not found' });
    }
  });

  // User routes
  app.get('/api/users', (req, res) => {
    const db = readDb();
    const { adminId } = req.query;
    if (adminId) {
      return res.json(db.users.filter((u: any) => u.adminId === adminId));
    }
    res.json(db.users);
  });

  app.get('/api/users/:id', (req, res) => {
    const db = readDb();
    const userId = req.params.id;
    const user = db.users.find((u: any) => u.id === userId || u.id.toString() === userId);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });

  app.post('/api/users', (req, res) => {
    console.log('Received registration request for user:', req.body.phone);
    const db = readDb();
    const newUser = { ...req.body };
    
    // Check for unique NRC and Phone
    const existingUser = db.users.find((u: any) => u.nrc === newUser.nrc || u.phone === newUser.phone);
    if (existingUser) {
      console.log('Registration failed: User already exists');
      return res.status(400).json({ 
        message: existingUser.nrc === newUser.nrc 
          ? 'NRC number already registered' 
          : 'Phone number already registered' 
      });
    }

    if (!newUser.id) newUser.id = Date.now().toString();
    db.users.push(newUser);
    writeDb(db);
    console.log('Registration successful for user:', newUser.id);
    res.status(201).json(newUser);
  });

  app.post('/api/login', (req, res) => {
    const { phone, password } = req.body;
    const db = readDb();
    const user = db.users.find((u: any) => u.phone === phone && u.password === password);
    
    if (user) {
      if (user.isFrozen) {
        return res.status(403).json({ message: 'Account is frozen. Please contact support.' });
      }
      res.json({ success: true, user });
    } else {
      res.status(401).json({ message: 'Invalid phone number or password' });
    }
  });

  app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;
    const db = readDb();
    
    const admin = db.admins.find((a: any) => a.username === username && a.password === password);

    if (admin) {
      if (admin.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Account suspended' });
      }
      if (!admin.isApproved) {
        return res.status(403).json({ success: false, message: 'Account pending approval' });
      }
      res.json({ success: true, admin });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    console.log(`[PUT] User update requested for ID: ${userId}`);
    
    const db = readDb();
    
    // Check in users collection
    let index = db.users.findIndex((u: any) => u.id === userId || u.id.toString() === userId);
    
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...req.body };
      writeDb(db);
      console.log(`User ${userId} updated successfully in users collection`);
      return res.json(db.users[index]);
    } 
    
    // Fallback: Check in agents collection (in case an agent is using the location tracker)
    index = db.agents.findIndex((a: any) => a.id === userId || a.id.toString() === userId);
    if (index !== -1) {
      db.agents[index] = { ...db.agents[index], ...req.body };
      writeDb(db);
      console.log(`Agent ${userId} updated successfully in agents collection`);
      return res.json(db.agents[index]);
    }

    console.log(`User/Agent ${userId} not found in any collection`);
    res.status(404).json({ message: 'User or Agent not found' });
  });

  app.delete('/api/users/:id', (req, res) => {
    const db = readDb();
    const userId = req.params.id;
    const itemToDelete = db.users.find((user: any) => user.id === userId || user.id.toString() === userId);
    if (itemToDelete) {
      if (!db.deletedItems) db.deletedItems = [];
      db.deletedItems.push({ ...itemToDelete, originalCollection: 'users', deletedAt: new Date().toISOString() });
    }
    db.users = db.users.filter((user: any) => user.id !== userId && user.id.toString() !== userId);
    writeDb(db);
    res.status(204).send();
  });

  // Loan Request routes
  app.get('/api/loan-requests', (req, res) => {
    const db = readDb();
    const { userId, adminId } = req.query;
    let requests = db.loanRequests;
    if (userId) {
      requests = requests.filter((r: any) => r.userId === userId);
    }
    if (adminId) {
      requests = requests.filter((r: any) => r.adminId === adminId);
    }
    res.json(requests);
  });

  app.post('/api/loan-requests', (req, res) => {
    const db = readDb();
    const newRequest = { ...req.body };
    if (!newRequest.id) newRequest.id = Date.now().toString();
    if (!newRequest.date) newRequest.date = new Date().toISOString();
    db.loanRequests.push(newRequest);
    writeDb(db);
    res.status(201).json(newRequest);
  });


  app.delete('/api/loan-requests/:id', (req, res) => {
    const db = readDb();
    const requestId = req.params.id;
    const itemToDelete = db.loanRequests.find((r: any) => r.id === requestId || r.id.toString() === requestId);
    if (itemToDelete) {
      if (!db.deletedItems) db.deletedItems = [];
      db.deletedItems.push({ ...itemToDelete, originalCollection: 'loanRequests', deletedAt: new Date().toISOString() });
    }
    db.loanRequests = db.loanRequests.filter((r: any) => r.id !== requestId && r.id.toString() !== requestId);
    writeDb(db);
    res.status(204).send();
  });

  app.post('/api/repay-loan', (req, res) => {
    const db = readDb();
    const { userId, loanId, amount } = req.body;
    
    const userIndex = db.users.findIndex((u: any) => u.id === userId || u.id.toString() === userId);
    const loanIndex = db.loanRequests.findIndex((l: any) => l.id === loanId || l.id.toString() === loanId);
    
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
    if (loanIndex === -1) return res.status(404).json({ message: 'Loan not found' });
    
    const user = db.users[userIndex];
    if ((user.balance || 0) < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Deduct balance
    db.users[userIndex].balance = (user.balance || 0) - amount;
    
    // Create transaction
    const newTransaction = {
      id: Date.now().toString(),
      userId: userId,
      type: 'repayment',
      title: 'Loan Repayment',
      amount: amount,
      date: new Date().toISOString(),
      status: 'completed'
    };
    if (!db.transactions) db.transactions = [];
    db.transactions.push(newTransaction);
    
    // Update loan (e.g., reduce remaining amount)
    db.loanRequests[loanIndex].remainingAmount = (db.loanRequests[loanIndex].remainingAmount || db.loanRequests[loanIndex].amount) - amount;
    if (db.loanRequests[loanIndex].remainingAmount <= 0) {
      db.loanRequests[loanIndex].status = 'repaid';
    }
    
    writeDb(db);
    res.json({ success: true, newBalance: db.users[userIndex].balance });
  });

  app.put('/api/loan-requests/:id', (req, res) => {
    const db = readDb();
    const requestId = req.params.id;
    const index = db.loanRequests.findIndex((r: any) => r.id === requestId || r.id.toString() === requestId);
    if (index !== -1) {
      const oldStatus = db.loanRequests[index].status;
      const newStatus = req.body.status;
      
      db.loanRequests[index] = { ...db.loanRequests[index], ...req.body };
      
      // If loan is being approved, update user balance
      if (oldStatus !== 'approved' && newStatus === 'approved') {
        const userId = db.loanRequests[index].userId;
        const amount = db.loanRequests[index].amount;
        const userIndex = db.users.findIndex((u: any) => u.id === userId || u.id.toString() === userId);
        
        if (userIndex !== -1) {
          db.users[userIndex].balance = (db.users[userIndex].balance || 0) + amount;
          
          // Add a transaction record
          const newTransaction = {
            id: Date.now().toString(),
            userId: userId,
            type: 'loan',
            title: 'Loan Disbursement',
            amount: amount,
            date: new Date().toISOString(),
            status: 'completed'
          };
          if (!db.transactions) db.transactions = [];
          db.transactions.push(newTransaction);

          // Add a notification for the user
          const newNotification = {
            id: Math.random().toString(36).substr(2, 9),
            userId: userId,
            title: 'Loan Approved',
            message: `Your loan of K ${amount} has been approved and added to your balance.`,
            date: new Date().toLocaleString(),
            isRead: false,
            type: 'loan'
          };
          if (!db.notifications) db.notifications = [];
          db.notifications.push(newNotification);
        }
      }
      
      writeDb(db);
      res.json(db.loanRequests[index]);
    } else {
      res.status(404).json({ message: 'Loan request not found' });
    }
  });

  // AI Publish Request routes
  app.get('/api/ai-publish-requests', (req, res) => {
    const db = readDb();
    const { role, requesterId } = req.query;
    let requests = db.aiPublishRequests || [];
    if (role && role !== 'developer') {
      requests = requests.filter((r: any) => r.requesterRole === role);
    }
    if (requesterId) {
      requests = requests.filter((r: any) => r.requesterId === requesterId);
    }
    res.json(requests);
  });

  app.post('/api/ai-publish-requests', (req, res) => {
    const db = readDb();
    const newRequest = { ...req.body };
    if (!newRequest.id) newRequest.id = Date.now().toString();
    if (!newRequest.createdAt) newRequest.createdAt = new Date().toISOString();
    if (!db.aiPublishRequests) db.aiPublishRequests = [];
    db.aiPublishRequests.push(newRequest);
    writeDb(db);
    res.status(201).json(newRequest);
  });

  app.put('/api/ai-publish-requests/:id', (req, res) => {
    const db = readDb();
    const requestId = req.params.id;
    if (!db.aiPublishRequests) db.aiPublishRequests = [];
    const index = db.aiPublishRequests.findIndex((r: any) => r.id === requestId || r.id.toString() === requestId);
    if (index !== -1) {
      db.aiPublishRequests[index] = { ...db.aiPublishRequests[index], ...req.body };
      writeDb(db);
      res.json(db.aiPublishRequests[index]);
    } else {
      res.status(404).json({ message: 'AI publish request not found' });
    }
  });

  app.delete('/api/ai-publish-requests/:id', (req, res) => {
    const db = readDb();
    const requestId = req.params.id;
    if (!db.aiPublishRequests) db.aiPublishRequests = [];
    db.aiPublishRequests = db.aiPublishRequests.filter((r: any) => r.id !== requestId && r.id.toString() !== requestId);
    writeDb(db);
    res.status(204).send();
  });

  // Chat Messages routes
  app.get('/api/chat-messages', (req, res) => {
    console.log('Chat messages requested:', req.query);
    const db = readDb();
    const { userId, adminId, chatId } = req.query;
    let messages = db.chatMessages;
    if (chatId) {
      messages = messages.filter((m: any) => m.senderId === chatId || m.receiverId === chatId || m.chatId === chatId);
    } else if (userId) {
      messages = messages.filter((m: any) => m.senderId === userId || m.receiverId === userId);
    }
    if (adminId) {
      messages = messages.filter((m: any) => m.senderId === adminId || m.receiverId === adminId);
    }
    res.json(messages);
  });

  app.post('/api/chat-messages', (req, res) => {
    const db = readDb();
    const newMessage = { ...req.body };
    if (!newMessage.id) newMessage.id = Date.now().toString();
    if (!newMessage.timestamp) newMessage.timestamp = new Date().toISOString();
    db.chatMessages.push(newMessage);
    writeDb(db);
    res.status(201).json(newMessage);
  });

  // Backup and Restore routes
  app.get('/api/backup', (req, res) => {
    const db = readDb();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=db-backup.json');
    res.send(JSON.stringify(db, null, 2));
  });

  app.post('/api/restore', (req, res) => {
    try {
      const data = req.body;
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ message: 'Invalid backup data' });
      }
      
      // Basic validation: check if essential collections exist
      const requiredCollections = ['users', 'admins', 'transactions'];
      const missing = requiredCollections.filter(c => !data[c]);
      if (missing.length > 0) {
        return res.status(400).json({ message: `Missing required collections: ${missing.join(', ')}` });
      }

      writeDb(data);
      res.json({ success: true, message: 'Database restored successfully' });
    } catch (error) {
      console.error('Restore error:', error);
      res.status(500).json({ message: 'Internal server error during restoration' });
    }
  });

  // Deleted Items routes
  app.get('/api/deleted-items', (req, res) => {
    const db = readDb();
    res.json(db.deletedItems || []);
  });

  app.delete('/api/deleted-items/:id', (req, res) => {
    const db = readDb();
    const id = req.params.id;
    db.deletedItems = (db.deletedItems || []).filter((item: any) => item.id !== id && item.id.toString() !== id);
    writeDb(db);
    res.status(204).send();
  });

  app.post('/api/deleted-items/restore/:id', (req, res) => {
    const db = readDb();
    const id = req.params.id;
    const itemIndex = (db.deletedItems || []).findIndex((item: any) => item.id === id || item.id.toString() === id);
    
    if (itemIndex !== -1) {
      const item = db.deletedItems[itemIndex];
      const collection = item.originalCollection;
      
      if (db[collection]) {
        const { originalCollection, deletedAt, ...rest } = item;
        db[collection].push(rest);
        db.deletedItems.splice(itemIndex, 1);
        writeDb(db);
        res.json({ success: true, item: rest });
      } else {
        res.status(400).json({ message: 'Invalid original collection' });
      }
    } else {
      res.status(404).json({ message: 'Deleted item not found' });
    }
  });

  // Notifications routes
  app.get('/api/notifications', (req, res) => {
    const db = readDb();
    const { userId } = req.query;
    let notifications = db.notifications;
    if (userId) {
      notifications = notifications.filter((n: any) => n.userId === userId);
    }
    res.json(notifications);
  });

  app.post('/api/notifications', (req, res) => {
    const db = readDb();
    const newNotification = { ...req.body };
    if (!newNotification.id) newNotification.id = Date.now().toString();
    if (!newNotification.date) newNotification.date = new Date().toISOString();
    db.notifications.push(newNotification);
    writeDb(db);
    res.status(201).json(newNotification);
  });

  app.put('/api/notifications/:id', (req, res) => {
    const db = readDb();
    const notificationId = req.params.id;
    const index = db.notifications.findIndex((n: any) => n.id === notificationId || n.id.toString() === notificationId);
    if (index !== -1) {
      db.notifications[index] = { ...db.notifications[index], ...req.body };
      writeDb(db);
      res.json(db.notifications[index]);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  });

  // Admin Notifications routes
  app.get('/api/admin-notifications', (req, res) => {
    const db = readDb();
    res.json(db.adminNotifications);
  });

  app.post('/api/admin-notifications', (req, res) => {
    const db = readDb();
    const newNotification = { ...req.body };
    if (!newNotification.id) newNotification.id = Date.now().toString();
    if (!newNotification.time) newNotification.time = new Date().toLocaleString();
    db.adminNotifications.push(newNotification);
    writeDb(db);
    res.status(201).json(newNotification);
  });

  app.put('/api/admin-notifications/:id', (req, res) => {
    const db = readDb();
    const notificationId = req.params.id;
    const index = db.adminNotifications.findIndex((n: any) => n.id === notificationId || n.id.toString() === notificationId);
    if (index !== -1) {
      db.adminNotifications[index] = { ...db.adminNotifications[index], ...req.body };
      writeDb(db);
      res.json(db.adminNotifications[index]);
    } else {
      res.status(404).json({ message: 'Admin notification not found' });
    }
  });

  // Tasks routes
  app.get('/api/tasks', (req, res) => {
    const db = readDb();
    res.json(db.tasks || []);
  });

  app.post('/api/tasks', (req, res) => {
    const db = readDb();
    const newTask = { ...req.body };
    if (!newTask.id) newTask.id = Date.now().toString();
    if (!db.tasks) db.tasks = [];
    db.tasks.push(newTask);
    writeDb(db);
    res.status(201).json(newTask);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const db = readDb();
    const taskId = req.params.id;
    if (!db.tasks) db.tasks = [];
    const index = db.tasks.findIndex((t: any) => t.id === taskId || t.id.toString() === taskId);
    if (index !== -1) {
      db.tasks[index] = { ...db.tasks[index], ...req.body };
      writeDb(db);
      res.json(db.tasks[index]);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const db = readDb();
    const taskId = req.params.id;
    if (!db.tasks) db.tasks = [];
    const itemToDelete = db.tasks.find((t: any) => t.id === taskId || t.id.toString() === taskId);
    if (itemToDelete) {
      if (!db.deletedItems) db.deletedItems = [];
      db.deletedItems.push({ ...itemToDelete, originalCollection: 'tasks', deletedAt: new Date().toISOString() });
    }
    db.tasks = db.tasks.filter((t: any) => t.id !== taskId && t.id.toString() !== taskId);
    writeDb(db);
    res.status(204).send();
  });

  // Recurring Payments routes
  app.get('/api/recurring-payments', (req, res) => {
    const db = readDb();
    const { userId } = req.query;
    let payments = db.recurringPayments;
    if (userId) {
      payments = payments.filter((p: any) => p.userId === userId);
    }
    res.json(payments);
  });

  app.post('/api/recurring-payments', (req, res) => {
    const db = readDb();
    const newPayment = { ...req.body };
    if (!newPayment.id) newPayment.id = Date.now().toString();
    db.recurringPayments.push(newPayment);
    writeDb(db);
    res.status(201).json(newPayment);
  });

  app.put('/api/recurring-payments/:id', (req, res) => {
    const db = readDb();
    const paymentId = req.params.id;
    const index = db.recurringPayments.findIndex((p: any) => p.id === paymentId || p.id.toString() === paymentId);
    if (index !== -1) {
      db.recurringPayments[index] = { ...db.recurringPayments[index], ...req.body };
      writeDb(db);
      res.json(db.recurringPayments[index]);
    } else {
      res.status(404).json({ message: 'Recurring payment not found' });
    }
  });

  app.delete('/api/recurring-payments/:id', (req, res) => {
    const db = readDb();
    const paymentId = req.params.id;
    const itemToDelete = db.recurringPayments.find((p: any) => p.id === paymentId || p.id.toString() === paymentId);
    if (itemToDelete) {
      if (!db.deletedItems) db.deletedItems = [];
      db.deletedItems.push({ ...itemToDelete, originalCollection: 'recurringPayments', deletedAt: new Date().toISOString() });
    }
    db.recurringPayments = db.recurringPayments.filter((p: any) => p.id !== paymentId && p.id.toString() !== paymentId);
    writeDb(db);
    res.status(204).send();
  });

  app.post('/api/health-check', async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      await axios.get(url, { timeout: 5000 });
      res.json({ status: 'online' });
    } catch (error) {
      res.json({ status: 'offline' });
    }
  });

  // Mock API for developer panel data if needed
  app.get("/api/system/status", (req, res) => {
    res.json({
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: httpServer
        },
        watch: {
          ignored: ['**/db.json']
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode");
    const distPath = path.join(__dirname, "dist");
    console.log(`Serving static files from: ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      console.error("CRITICAL ERROR: dist folder not found!");
    } else {
      console.log("dist folder exists.");
      if (fs.existsSync(path.join(distPath, "index.html"))) {
        console.log("index.html found in dist.");
      } else {
        console.error("CRITICAL ERROR: index.html not found in dist!");
      }
    }

    // Serve static files in production
    app.use(express.static(distPath));
    
    // Explicit root route
    app.get("/", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      console.log(`Serving root index.html from: ${indexPath}`);
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send("Server Error: index.html not found");
      }
    });

    app.get("*all", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      console.log(`Serving catch-all index.html from: ${indexPath} for path: ${req.path}`);
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Page not found");
      }
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
