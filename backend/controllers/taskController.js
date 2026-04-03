const Task = require('../models/Task');
const Project = require('../models/Project');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Admin = require('../models/Admin');

const enrichUser = async (userId, userModel) => {
  if (!userId || !userModel) return null;
  let userDoc = null;
  try {
    if (userModel === 'User') userDoc = await User.findById(userId).select('firstName lastName name email').lean();
    else if (userModel === 'Manager') userDoc = await Manager.findById(userId).select('name email').lean();
    else if (userModel === 'Admin') userDoc = await Admin.findById(userId).select('name email').lean();
  } catch (e) { return null; }
  
  if (!userDoc) return null;
  
  return {
    name: userDoc.name || `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() || userDoc.email,
    email: userDoc.email
  };
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

const canModifyTask = (task, userId, role) => {
  if (role === 'admin') return true;
  if (role === 'manager') return true;
  if (task.assignedTo === userId) return true;
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
      assignedTo,
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
    const isMember = project.createdBy === userId || project.projectManager === userId || project.members.some(m => m.userId === userId);

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
    const userId = getUserId(req);
    const { status, priority } = req.query;
    const filter = { assignedTo: userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ dueDate: 1 });

    const tasksWithProject = await Promise.all(tasks.map(async (t) => {
      const project = await Project.findById(t.projectId).select('title status');
      return { ...t.toObject(), project };
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

    if (!['admin', 'hr'].includes(role)) {
      const project = await Project.findById(task.projectId);
      const isMember = project && (project.createdBy === userId || project.projectManager === userId || project.members.some(m => m.userId === userId));
      if (!isMember) return res.status(403).json({ message: 'Access denied' });
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

    if (!canModifyTask(task, userId, role)) {
      return res.status(403).json({ message: 'Access denied: You cannot modify this task' });
    }

    const previousStatus = task.status;
    const allowed = ['title', 'description', 'status', 'priority', 'assignedTo', 'assignedToName', 'assignedToModel', 'dueDate', 'estimatedHours', 'milestoneId'];
    allowed.forEach(field => { if (req.body[field] !== undefined) task[field] = req.body[field]; });

    if (req.body.status === 'done' && !task.completedAt) {
      task.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'done') {
      task.completedAt = undefined;
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

    if (role === 'hr' || (role === 'employee' && task.assignedTo !== userId)) {
      return res.status(403).json({ message: 'Access denied: You can only log time on your own tasks' });
    }

    const { hours, date, description } = req.body;
    if (!hours || hours <= 0) return res.status(400).json({ message: 'Valid hours required' });

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

exports.getTimeLogs = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const userId = getUserId(req);
    const role = getUserRole(req);
    const canView = ['admin', 'manager'].includes(role) || task.assignedTo === userId;
    if (!canView) return res.status(403).json({ message: 'Access denied' });

    const logs = await TimeLog.find({ taskId: task._id }).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch time logs', error: err.message });
  }
};
