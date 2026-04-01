const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Admin = require('../models/Admin');

const enrichMembers = async (members) => {
  return Promise.all((members || []).map(async (m) => {
    const mPlain = m.toObject ? m.toObject() : { ...m };
    let userDoc = null;
    try {
      if (mPlain.userModel === 'User') userDoc = await User.findById(mPlain.userId).select('firstName lastName email').lean();
      else if (mPlain.userModel === 'Manager') userDoc = await Manager.findById(mPlain.userId).select('name email').lean();
      else if (mPlain.userModel === 'Admin') userDoc = await Admin.findById(mPlain.userId).select('name email').lean();
    } catch (e) { /* ignore individual lookup errors */ }
    const name = userDoc
      ? (userDoc.name || `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim())
      : mPlain.name || 'Unknown';
    const email = userDoc?.email || mPlain.email || '';
    return { ...mPlain, name, email };
  }));
};

const getUserId = (req) => String(req.user._id || req.user.id);
const getUserRole = (req) => req.user.role;
const getUserName = (req) => req.user.name || `${req.user.firstName} ${req.user.lastName}`;

const getModelName = (role) => {
  if (role === 'admin') return 'Admin';
  if (role === 'hr') return 'Hr';
  if (role === 'manager') return 'Manager';
  return 'User';
};

const isProjectMember = (project, userId) => {
  if (!project) return false;
  if (project.createdBy === userId) return true;
  if (project.projectManager === userId) return true;
  return project.members.some(m => m.userId === userId);
};

const isProjectAdminOrManager = (project, userId, role) => {
  if (role === 'admin') return true;
  if (project.createdBy === userId) return true;
  if (project.projectManager === userId) return true;
  return false;
};

exports.createProject = async (req, res) => {
  try {
    const role = getUserRole(req);
    if (!['admin', 'manager'].includes(role)) {
      return res.status(403).json({ message: 'Only Admin or Manager can create projects' });
    }

    const userId = getUserId(req);
    const { title, description, status, priority, startDate, endDate, projectManager, projectManagerModel, members, milestones, tags, department } = req.body;

    const project = new Project({
      title,
      description,
      status: status || 'planning',
      priority: priority || 'medium',
      startDate,
      endDate,
      createdBy: userId,
      createdByModel: getModelName(role),
      projectManager: projectManager || userId,
      projectManagerModel: projectManagerModel || getModelName(role),
      members: members || [],
      milestones: milestones || [],
      tags: tags || [],
      department
    });

    if (!project.members.some(m => m.userId === userId)) {
      project.members.push({ userId, userModel: getModelName(role), role: 'lead' });
    }

    await project.save();
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project', error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const role = getUserRole(req);
    const userId = getUserId(req);
    let filter = {};

    if (role === 'admin' || role === 'hr') {
      filter = {};
    } else {
      filter = {
        $or: [
          { createdBy: userId },
          { projectManager: userId },
          { 'members.userId': userId }
        ]
      };
      console.log(`[getAllProjects] role=${role} userId=${userId}`);
    }

    const { status, priority, department, search } = req.query;
    const extraFilters = {};
    if (status) extraFilters.status = status;
    if (priority) extraFilters.priority = priority;
    if (department) extraFilters.department = department;
    if (search) extraFilters.title = { $regex: search, $options: 'i' };

    const finalFilter = Object.keys(extraFilters).length
      ? { $and: [filter, extraFilters] }
      : filter;

    const projects = await Project.find(finalFilter).sort({ updatedAt: -1 });

    const projectsWithStats = await Promise.all(projects.map(async (p) => {
      const taskStats = await Task.aggregate([
        { $match: { projectId: p._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const stats = { total: 0, todo: 0, in_progress: 0, in_review: 0, done: 0, blocked: 0 };
      taskStats.forEach(s => { stats[s._id] = s.count; stats.total += s.count; });
      return { ...p.toObject(), taskStats: stats };
    }));

    res.json(projectsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects', error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const role = getUserRole(req);
    const userId = getUserId(req);
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (role !== 'admin' && role !== 'hr' && !isProjectMember(project, userId)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const tasks = await Task.find({ projectId: project._id }).sort({ createdAt: -1 });
    const enrichedMembers = await enrichMembers(project.members || []);
    const projectObj = { ...project.toObject(), members: enrichedMembers };
    res.json({ project: projectObj, tasks });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project', error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const role = getUserRole(req);
    const userId = getUserId(req);
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdminOrManager(project, userId, role)) {
      return res.status(403).json({ message: 'Access denied: Only the project creator or admin can update this project' });
    }

    const allowed = ['title', 'description', 'status', 'priority', 'startDate', 'endDate', 'projectManager', 'projectManagerModel', 'milestones', 'tags', 'department'];
    allowed.forEach(field => { if (req.body[field] !== undefined) project[field] = req.body[field]; });

    if (Array.isArray(req.body.members)) {
      project.members = req.body.members;
    }

    await project.save();
    res.json({ message: 'Project updated successfully', project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project', error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const role = getUserRole(req);
    if (role !== 'admin') return res.status(403).json({ message: 'Only Admin can delete projects' });

    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await Task.deleteMany({ projectId: req.params.id });
    await TimeLog.deleteMany({ projectId: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project', error: err.message });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const role = getUserRole(req);
    const userId = getUserId(req);
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdminOrManager(project, userId, role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { members } = req.body;
    if (!Array.isArray(members)) return res.status(400).json({ message: 'members must be an array' });

    members.forEach(m => {
      const exists = project.members.some(pm => pm.userId === m.userId);
      if (!exists) project.members.push(m);
    });

    await project.save();
    res.json({ message: 'Members added', project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add members', error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const role = getUserRole(req);
    const userId = getUserId(req);
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdminOrManager(project, userId, role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { memberId } = req.params;
    project.members = project.members.filter(m => m.userId !== memberId);
    await project.save();
    res.json({ message: 'Member removed', project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove member', error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const role = getUserRole(req);
    if (!['admin', 'hr', 'manager'].includes(role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = getUserId(req);
    let projectFilter = {};
    if (role === 'manager') {
      projectFilter = { $or: [{ createdBy: userId }, { projectManager: userId }, { 'members.userId': userId }] };
    }

    const [totalProjects, projectsByStatus, totalTasks, tasksByStatus, overdueTasks] = await Promise.all([
      Project.countDocuments(projectFilter),
      Project.aggregate([{ $match: projectFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $nin: ['done'] } })
    ]);

    const recentProjects = await Project.find(projectFilter).sort({ createdAt: -1 }).limit(5).select('title status priority createdAt');

    res.json({
      totalProjects,
      projectsByStatus,
      totalTasks,
      tasksByStatus,
      overdueTasks,
      recentProjects
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
};
