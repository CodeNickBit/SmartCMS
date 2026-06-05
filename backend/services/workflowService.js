const Task = require('../models/Task');
const WorkflowTemplate = require('../models/WorkflowTemplate');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Hr = require('../models/Hr');

const resolveAssignee = async (templateTask, relatedUserId) => {
  if (templateTask.assignedToRole === 'Reporting_Manager') {
    const user = await User.findById(relatedUserId);
    if (user && user.reportingManager) {
      // Find what model the reporting manager belongs to
      // They could be Manager, Hr, or Admin
      let manager = await Manager.findById(user.reportingManager);
      if (manager) return { assignedTo: manager._id, assignedToModel: 'Manager' };
      
      manager = await Hr.findById(user.reportingManager);
      if (manager) return { assignedTo: manager._id, assignedToModel: 'Hr' };
      
      manager = await Admin.findById(user.reportingManager);
      if (manager) return { assignedTo: manager._id, assignedToModel: 'Admin' };
    }
  }

  let candidates = [];
  
  if (templateTask.assignedToRole === 'Admin') {
    candidates = await Admin.find({ isActive: true });
    if (candidates.length > 0) return { assignedTo: candidates[0]._id, assignedToModel: 'Admin' };
  } else if (templateTask.assignedToRole === 'Hr') {
    let query = { isActive: true };
    if (templateTask.department) query.department = templateTask.department;
    candidates = await Hr.find(query);
    if (candidates.length === 0 && templateTask.department) {
      candidates = await Hr.find({ isActive: true });
    }
    if (candidates.length > 0) return { assignedTo: candidates[0]._id, assignedToModel: 'Hr' };
  } else if (templateTask.assignedToRole === 'Manager') {
    let query = { isActive: true };
    if (templateTask.department) query.department = templateTask.department;
    candidates = await Manager.find(query);
    if (candidates.length === 0 && templateTask.department) {
      candidates = await Manager.find({ isActive: true });
    }
    if (candidates.length > 0) return { assignedTo: candidates[0]._id, assignedToModel: 'Manager' };
  }

  // Fallback to first active Admin if no specific role matched
  const adminFallback = await Admin.findOne({ isActive: true });
  if (adminFallback) {
    return { assignedTo: adminFallback._id, assignedToModel: 'Admin' };
  }
  
  return { assignedTo: null, assignedToModel: null };
};

exports.triggerWorkflow = async (user, type) => {
  try {
    const templates = await WorkflowTemplate.find({ type, isActive: true });
    if (!templates || templates.length === 0) return; 

    // Use the first active template for this type
    const template = templates[0];
    
    for (const tTask of template.tasks) {
      const assignee = await resolveAssignee(tTask, user._id);
      
      const newTask = new Task({
        title: tTask.title,
        description: tTask.description,
        taskType: type,
        relatedUserId: user._id,
        workflowTemplateId: template._id,
        status: 'todo',
        priority: 'high',
        assignedTo: assignee.assignedTo,
        assignedToModel: assignee.assignedToModel,
        assignedBy: 'System',
        assignedByName: 'System',
        estimatedHours: tTask.estimatedHours
      });
      
      await newTask.save();
    }
    console.log(`Successfully triggered ${type} workflow for user ${user._id}`);
  } catch (error) {
    console.error(`Error triggering ${type} workflow:`, error);
  }
};

exports.triggerOnboarding = (user) => this.triggerWorkflow(user, 'onboarding');
exports.triggerOffboarding = (user) => this.triggerWorkflow(user, 'offboarding');
