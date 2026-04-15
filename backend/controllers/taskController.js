const Task = require('../models/Task');
const Project = require('../models/Project');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Admin = require('../models/Admin');

const enrichUser = async (userId, userModel) => {
  if (!userId) return null;
  const models = { User, Manager, Admin, Hr: User };
  
  // Try the specified model first, then fall back to others
  const searchOrder = [userModel, 'User', 'Manager', 'Admin'].filter(Boolean);
  const visited = new Set();

  for (const modelName of searchOrder) {
    if (visited.has(modelName)) continue;
    visited.add(modelName);
    const m = models[modelName];
    if (!m) continue;
    try {
      const doc = await m.findById(userId).select('firstName lastName name email role').lean();
      if (doc) {
        return {
          name: doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.email,
          email: doc.email,
          role: doc.role
        };
      }
    } catch (e) { /* continue */ }
  }
  return null;
};

const enrichMembers = async (members) => {
  return Promise.all((members || []).map(async (m) => {
    const mPlain = m.toObject ? m.toObject() : { ...m };
    const details = await enrichUser(mPlain.userId, mPlain.userModel);
    return {
      userId: mPlain.userId,
      userModel: mPlain.userModel,
      role: mPlain.role,
      name: details?.name || mPlain.name || 'Unknown',
      email: details?.email || mPlain.email || ''
    };
  }));
};

const getUserId = (req) => String(req.user._id || req.user.id);
const getUserRole = (req) => req.user.role?.toLowerCase();
const getUserName = (req) => req.user.name || `${req.user.firstName} ${req.user.lastName}`;

const getAllIdentities = async (req) => {
  const userId = getUserId(req);
  const email = req.user?.email || req.user?.emailAddress;
  let allowedIds = [userId];
  if (email) {
    const [u, m, a] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }).select('_id').lean(),
      Manager.findOne({ email: email.toLowerCase() }).select('_id').lean(),
      Admin.findOne({ email: email.toLowerCase() }).select('_id').lean()
    ]);
    if (u) allowedIds.push(String(u._id));
    if (m) allowedIds.push(String(m._id));
    if (a) allowedIds.push(String(a._id));
  }
  return [...new Set(allowedIds)];
};

const canModifyTask = async (task, req) => {
  const role = getUserRole(req);
  if (role === 'admin') return true;
  if (role === 'manager') return true;
  const allowedIds = await getAllIdentities(req);
  if (allowedIds.includes(String(task.assignedTo))) return true;
  return false;
};

exports.createTask = async (req, res) => {
  try {
    const role = getUserRole(req);
    if (!['admin', 'manager'].includes(role)) {
      return res.status(403).json({ message: 'Only Admin or Manager can create tasks' });
    }

    const project = await Project.findById(req.params.pid);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userId = getUserId(req);
    const userName = getUserName(req);

    const { title, description, status, priority, assignedTo, assignedToName, assignedToModel, dueDate, estimatedHours, milestoneId, parentTask } = req.body;

    const task = new Task({
      projectId: project._id,
      milestoneId,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo ? String(assignedTo) : undefined,
      assignedToName,
      assignedToModel,
      assignedBy: userId,
      assignedByName: userName,
      dueDate,
      estimatedHours: estimatedHours || 0,
      parentTask,
      activityLog: [{ action: 'Task created', performedBy: userId, performedByName: userName, at: new Date() }]
    });

    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
};

exports.getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.pid);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(req);
    const userId = getUserId(req);
    const userEmail = req.user?.email;

    const isMember = String(project.createdBy) === String(userId) || 
      String(project.projectManager) === String(userId) || 
      (userEmail && project.projectManagerEmail && project.projectManagerEmail.toLowerCase() === userEmail.toLowerCase()) ||
      project.members.some(m => String(m.userId) === String(userId) || (userEmail && m.email && m.email.toLowerCase() === userEmail.toLowerCase()));

    if (!['admin', 'hr'].includes(role) && !isMember) {
      return res.status(403).json({ message: 'Access denied: Not a project member' });
    }

    const { status, priority, assignedTo, parentTask } = req.query;
    const filter = { projectId: project._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (parentTask === 'null') filter.parentTask = null;
    else if (parentTask) filter.parentTask = parentTask;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const allowedIds = await getAllIdentities(req);
    const { status, priority } = req.query;
    const filter = { assignedTo: { $in: allowedIds } };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ dueDate: 1 });
    const now = new Date();

    const tasksWithProject = await Promise.all(tasks.map(async (t) => {
      const project = await Project.findById(t.projectId).select('title status');
      const plain = t.toObject();
      plain.isOverdue = !!(plain.dueDate && new Date(plain.dueDate) < now && plain.status !== 'done');
      return { ...plain, project };
    }));

    res.json(tasksWithProject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your tasks', error: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = getUserRole(req);
    const userId = getUserId(req);
    const userEmail = req.user?.email;

    if (!['admin', 'hr'].includes(role)) {
      const allowedIds = await getAllIdentities(req);
      const project = await Project.findById(task.projectId);
      const isProjectManager = project && ((userEmail && project.projectManagerEmail && project.projectManagerEmail.toLowerCase() === userEmail.toLowerCase()) || allowedIds.includes(String(project.projectManager)));
      const isMember = project && (allowedIds.includes(String(project.createdBy)) || isProjectManager || project.members.some(m => allowedIds.includes(String(m.userId)) || (userEmail && m.email && m.email.toLowerCase() === userEmail.toLowerCase())));
      const isAssigned = allowedIds.includes(String(task.assignedTo));
      if (!isMember && !isAssigned) return res.status(403).json({ message: 'Access denied' });
    }

    const timeLogs = await TimeLog.find({ taskId: task._id }).sort({ date: -1 });
    const subtasks = await Task.find({ parentTask: task._id });
    const project = await Project.findById(task.projectId).select('title members projectManager createdBy');
    const enrichedMembers = await enrichMembers(project?.members || []);
    res.json({ task, timeLogs, subtasks, projectMembers: enrichedMembers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task', error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = getUserRole(req);
    const userId = getUserId(req);
    const userName = getUserName(req);

    if (!(await canModifyTask(task, req))) {
      return res.status(403).json({ message: 'Access denied: You cannot modify this task' });
    }

    const previousStatus = task.status;
    const allowed = ['title', 'description', 'status', 'priority', 'assignedTo', 'assignedToName', 'assignedToModel', 'dueDate', 'estimatedHours', 'milestoneId'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = field === 'assignedTo' ? String(req.body[field]) : req.body[field];
      }
    });

    if (req.body.status === 'done') {
      task.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'done') {
      task.completedAt = null;
    }

    const logEntry = { performedBy: userId, performedByName: userName, at: new Date() };
    if (req.body.status && req.body.status !== previousStatus) {
      logEntry.action = `Status changed from "${previousStatus}" to "${req.body.status}"`;
    } else {
      logEntry.action = 'Task updated';
    }
    task.activityLog.push(logEntry);

    await task.save();
    res.json({ message: 'Task updated successfully', task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const role = getUserRole(req);
    const userId = getUserId(req);
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!['admin', 'manager'].includes(role) && task.assignedBy !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.deleteMany({ parentTask: task._id });
    await TimeLog.deleteMany({ taskId: task._id });
    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const userId = getUserId(req);
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' });

    task.comments.push({
      authorId: userId,
      authorName: getUserName(req),
      authorRole: getUserRole(req),
      text: text.trim()
    });

    task.activityLog.push({ action: 'Comment added', performedBy: userId, performedByName: getUserName(req), at: new Date() });
    await task.save();
    res.status(201).json({ message: 'Comment added', comments: task.comments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
};

exports.logTime = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const userId = getUserId(req);
    const role = getUserRole(req);

    if (role === 'hr' || (role === 'employee' && String(task.assignedTo) !== String(userId))) {
      return res.status(403).json({ message: 'Access denied: You can only log time on your own tasks' });
    }

    const { hours, date, description } = req.body;
    if (hours < 0.25 || hours > 24) return res.status(400).json({ message: 'Hours must be between 0.25 and 24' });

    const log = new TimeLog({
      taskId: task._id,
      projectId: task.projectId,
      employeeId: userId,
      employeeName: getUserName(req),
      date: date || new Date(),
      hours,
      description
    });

    await log.save();

    const totalLogged = await TimeLog.aggregate([
      { $match: { taskId: task._id } },
      { $group: { _id: null, total: { $sum: '$hours' } } }
    ]);
    task.loggedHours = totalLogged.length ? totalLogged[0].total : 0;
    task.activityLog.push({ action: `Logged ${hours}h`, performedBy: userId, performedByName: getUserName(req), at: new Date() });
    await task.save();

    res.status(201).json({ message: 'Time logged', log, loggedHours: task.loggedHours });
  } catch (err) {
    res.status(500).json({ message: 'Failed to log time', error: err.message });
  }
};

exports.getSubtasks = async (req, res) => {
  try {
    const subtasks = await Task.find({ parentTask: req.params.id });
    res.json(subtasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subtasks', error: err.message });
  }
};

exports.getTimeLogs = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = getUserRole(req);
    const allowedIds = await getAllIdentities(req);
    const canView = ['admin', 'manager'].includes(role) || allowedIds.includes(String(task.assignedTo));
    if (!canView) return res.status(403).json({ message: 'Access denied' });

    const logs = await TimeLog.find({ taskId: task._id }).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch time logs', error: err.message });
  }
};
