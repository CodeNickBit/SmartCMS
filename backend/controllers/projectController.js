const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Admin = require('../models/Admin');

const enrichUser = async (userId, userModel, emailFallback = null) => {
  if (!userId && !emailFallback) return null;
  
  const models = {
    'User': User,
    'Manager': Manager,
    'Admin': Admin,
    'Hr': User
  };

  const searchSequence = [
    { name: userModel, model: models[userModel] },
    { name: 'User', model: User },
    { name: 'Manager', model: Manager },
    { name: 'Admin', model: Admin }
  ].filter(s => s.model);

  // Use a Set to track visited models to avoid redundant lookups if userModel is one of the defaults
  const visitedModels = new Set();

  for (const item of searchSequence) {
    if (visitedModels.has(item.model.modelName)) continue;
    visitedModels.add(item.model.modelName);

    try {
      let doc = null;
      
      // 1. Try by ID if valid format
      const isObjectIdModel = item.model.modelName === 'Manager' || item.model.modelName === 'Admin';
      if (userId && (!isObjectIdModel || (typeof userId === 'string' && userId.length === 24))) {
        doc = await item.model.findById(userId).select('firstName lastName name email role').lean();
      }

      // 2. Fallback: Try by email if we have one (from the project record)
      if (!doc && emailFallback) {
        doc = await item.model.findOne({ email: emailFallback.toLowerCase() }).select('firstName lastName name email role').lean();
      }

      if (doc) {
        return {
          name: doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.email,
          email: doc.email,
          role: doc.role
        };
      }
    } catch (e) { /* Continue */ }
  }
  
  return null;
};

const enrichMembers = async (members) => {
  return Promise.all((members || []).map(async (m) => {
    const mPlain = m.toObject ? m.toObject() : { ...m };
    const details = await enrichUser(mPlain.userId, mPlain.userModel, mPlain.email);
    return {
      ...mPlain,
      name: details?.name || mPlain.name || 'Unknown',
      email: details?.email || mPlain.email || '',
      role: mPlain.role || 'member'
    };
  }));
};

const getUserId = (req) => String(req.user._id || req.user.id);
const getUserRole = (req) => req.user.role?.toLowerCase();
const getUserName = (req) => req.user.name || `${req.user.firstName} ${req.user.lastName}`;

const getModelName = (role) => {
  if (!role) return 'User';
  const r = role.toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'hr') return 'User'; // Hr is a role in User model
  if (r === 'manager') return 'Manager';
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
    // Helper to find email from models
    const findEmail = async (uid, modelName) => {
      if (!uid) return null;
      const m = models[modelName] || User;
      const d = await m.findById(uid).select('email').lean();
      return d?.email || null;
    };

    const pmEmail = projectManagerEmail || await findEmail(projectManager || userId, projectManagerModel || getModelName(role));

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
      projectManagerEmail: pmEmail,
      members: members || [],
      milestones: milestones || [],
      tags: tags || [],
      department
    });

    // Enriched members with email
    if (project.members && project.members.length > 0) {
      project.members = await Promise.all(project.members.map(async m => ({
        ...m.toObject ? m.toObject() : m,
        email: m.email || await findEmail(m.userId, m.userModel)
      })));
    }

    // Add creator as member if not present (check both ID and Email)
    const creatorEmail = await findEmail(userId, getModelName(role));
    if (!project.members.some(m => String(m.userId) === String(userId) || (m.email && m.email === creatorEmail))) {
      project.members.push({ 
        userId, 
        userModel: getModelName(role), 
        role: 'lead',
        email: creatorEmail
      });
    }

    // Ensure project manager is also in the members list (check both ID and Email)
    if (projectManager && !project.members.some(m => String(m.userId) === String(projectManager) || (m.email && m.email === pmEmail))) {
      project.members.push({ 
        userId: projectManager, 
        userModel: projectManagerModel || 'Manager', 
        role: 'lead',
        email: pmEmail
      });
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

    const userEmail = req.user.email;
    if (role === 'admin' || role === 'hr') {
      filter = {};
    } else {
      filter = {
        $or: [
          { createdBy: userId },
          { projectManager: userId },
          { projectManagerEmail: userEmail },
          { 'members.userId': userId },
          { 'members.email': userEmail }
        ]
      }
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
      const [pmDetails, taskStats] = await Promise.all([
        enrichUser(p.projectManager, p.projectManagerModel || 'Manager', p.projectManagerEmail),
        Task.aggregate([
          { $match: { projectId: p._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
      ]);
      
      const stats = { total: 0, todo: 0, in_progress: 0, in_review: 0, done: 0, blocked: 0 };
      taskStats.forEach(s => { stats[s._id] = s.count; stats.total += s.count; });
      
      return { 
        ...p.toObject(), 
        taskStats: stats,
        projectManagerName: pmDetails?.name || 'Unknown',
        projectManagerEmail: pmDetails?.email || ''
      };
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
    const [enrichedMembers, pmDetails] = await Promise.all([
      enrichMembers(project.members || []),
      enrichUser(project.projectManager, project.projectManagerModel || 'Manager', project.projectManagerEmail)
    ]);
    
    const projectObj = { 
      ...project.toObject(), 
      members: enrichedMembers,
      projectManagerName: pmDetails?.name || 'Unknown',
      projectManagerEmail: pmDetails?.email || ''
    };
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

    // Helper to find email from models
    const findEmail = async (uid, modelName) => {
      if (!uid) return null;
      const m = models[modelName] || User;
      const d = await m.findById(uid).select('email').lean();
      return d?.email || null;
    };

    const allowed = ['title', 'description', 'status', 'priority', 'startDate', 'endDate', 'projectManager', 'projectManagerModel', 'milestones', 'tags', 'department'];
    allowed.forEach(field => { if (req.body[field] !== undefined) project[field] = req.body[field]; });

    // Update PM Email if PM changed
    if (req.body.projectManager || req.body.projectManagerEmail) {
      project.projectManagerEmail = req.body.projectManagerEmail || await findEmail(project.projectManager, project.projectManagerModel || 'Manager');
    }

    if (Array.isArray(req.body.members)) {
      // Enriched members with email
      project.members = await Promise.all(req.body.members.map(async m => ({
        ...m,
        email: m.email || await findEmail(m.userId, m.userModel)
      })));
    }

    // Ensure project manager is in the members list after update (check both ID and Email)
    const finalPM = project.projectManager;
    const finalPMModel = project.projectManagerModel || 'Manager';
    const finalPMEmail = project.projectManagerEmail;
    if (finalPM && !project.members.some(m => String(m.userId) === String(finalPM) || (finalPMEmail && m.email === finalPMEmail))) {
      project.members.push({ userId: finalPM, userModel: finalPMModel, role: 'lead', email: finalPMEmail });
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
