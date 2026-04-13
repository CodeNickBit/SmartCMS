// Tests for Requirement 11.1 and 11.2 bug fixes in projectController.js

jest.mock('../models/Project');
jest.mock('../models/Task');
jest.mock('../models/TimeLog');
jest.mock('../models/User');
jest.mock('../models/Manager');
jest.mock('../models/Admin');

const Project = require('../models/Project');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Admin = require('../models/Admin');

const { createProject, updateProject } = require('../controllers/projectController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (body = {}, user = {}, params = {}) => ({
  body,
  user: { _id: 'user123', role: 'manager', name: 'Test Manager', email: 'manager@test.com', ...user },
  params,
  query: {}
});

beforeEach(() => {
  jest.clearAllMocks();

  const chainMock = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) };

  User.findById = jest.fn().mockReturnValue(chainMock);
  Manager.findById = jest.fn().mockReturnValue(chainMock);
  Admin.findById = jest.fn().mockReturnValue(chainMock);
  User.findOne = jest.fn().mockReturnValue(chainMock);
  Manager.findOne = jest.fn().mockReturnValue(chainMock);
  Admin.findOne = jest.fn().mockReturnValue(chainMock);

  User.modelName = 'User';
  Manager.modelName = 'Manager';
  Admin.modelName = 'Admin';
});

describe('Requirement 11.1 - createProject destructures req.body correctly', () => {
  let savedProject;

  beforeEach(() => {
    savedProject = {
      _id: 'proj1',
      title: 'Test Project',
      members: [],
      toObject: jest.fn().mockReturnValue({ _id: 'proj1', title: 'Test Project', members: [] }),
      save: jest.fn().mockResolvedValue(true)
    };
    Project.mockImplementation(() => savedProject);
  });

  it('does NOT throw ReferenceError on title when called with a valid req.body', async () => {
    const req = mockReq({ title: 'Test Project', description: 'A project' });
    const res = mockRes();

    await createProject(req, res);

    const calls = res.json.mock.calls;
    const errorCall = calls.find(c => c[0] && c[0].error && c[0].error.includes('ReferenceError'));
    expect(errorCall).toBeUndefined();
  });

  it('creates a project using the title from req.body without ReferenceError', async () => {
    const req = mockReq({
      title: 'My Project',
      description: 'desc',
      status: 'planning',
      priority: 'high',
      members: [],
      milestones: [],
      tags: [],
      department: 'Engineering'
    });
    const res = mockRes();

    await createProject(req, res);

    const allJsonCalls = res.json.mock.calls.map(c => c[0]);
    const errorCall = allJsonCalls.find(arg => arg && arg.error && /ReferenceError/.test(arg.error));
    expect(errorCall).toBeUndefined();

    const successCall = allJsonCalls.find(arg => arg && arg.message === 'Project created successfully');
    expect(successCall).toBeDefined();
  });
});

describe('Requirement 11.2 - updateProject has models in scope', () => {
  it('does NOT throw ReferenceError on models when updateProject is called', async () => {
    const projectDoc = {
      _id: 'proj1',
      title: 'Existing Project',
      createdBy: 'user123',
      projectManager: 'user123',
      projectManagerModel: 'Manager',
      projectManagerEmail: 'manager@test.com',
      members: [],
      toObject: jest.fn().mockReturnValue({ _id: 'proj1', title: 'Existing Project', members: [] }),
      save: jest.fn().mockResolvedValue(true)
    };

    Project.findById = jest.fn().mockResolvedValue(projectDoc);

    const req = mockReq({ title: 'Updated Title' }, {}, { id: 'proj1' });
    const res = mockRes();

    await expect(updateProject(req, res)).resolves.not.toThrow();

    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it('successfully updates a project without models-related ReferenceError', async () => {
    const projectDoc = {
      _id: 'proj1',
      title: 'Old Title',
      createdBy: 'user123',
      projectManager: 'user123',
      projectManagerModel: 'Manager',
      projectManagerEmail: 'manager@test.com',
      members: [],
      toObject: jest.fn().mockReturnValue({ _id: 'proj1', title: 'New Title', members: [] }),
      save: jest.fn().mockResolvedValue(true)
    };

    Project.findById = jest.fn().mockResolvedValue(projectDoc);

    const req = mockReq({ title: 'New Title', status: 'active' }, {}, { id: 'proj1' });
    const res = mockRes();

    await updateProject(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Project updated successfully' }));
  });
});
