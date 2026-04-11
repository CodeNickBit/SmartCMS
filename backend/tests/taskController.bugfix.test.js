jest.mock('../models/Task');
jest.mock('../models/Project');
jest.mock('../models/TimeLog');
jest.mock('../models/User');
jest.mock('../models/Manager');
jest.mock('../models/Admin');

const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');

const { logTime, updateTask } = require('../controllers/taskController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (body = {}, params = {}, user = {}) => ({
  body,
  params,
  user: { _id: 'user123', role: 'manager', name: 'Test Manager', ...user },
  query: {}
});

const makeTask = (overrides = {}) => ({
  _id: 'task1',
  projectId: 'proj1',
  assignedTo: 'user123',
  status: 'todo',
  activityLog: [],
  loggedHours: 0,
  completedAt: null,
  save: jest.fn().mockResolvedValue(true),
  ...overrides
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Requirement 4.2 - logTime hours validation', () => {
  beforeEach(() => {
    TimeLog.aggregate = jest.fn().mockResolvedValue([{ total: 1 }]);
    TimeLog.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(true) }));
  });

  it('returns 400 when hours is 0.24 (below minimum)', async () => {
    Task.findById = jest.fn().mockResolvedValue(makeTask());
    const req = mockReq({ hours: 0.24, date: new Date(), description: 'work' }, { id: 'task1' });
    const res = mockRes();

    await logTime(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Hours must be between 0.25 and 24' });
  });

  it('returns 201 when hours is 0.25 (minimum valid)', async () => {
    const task = makeTask();
    Task.findById = jest.fn().mockResolvedValue(task);
    const req = mockReq({ hours: 0.25, date: new Date(), description: 'work' }, { id: 'task1' });
    const res = mockRes();

    await logTime(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 201 when hours is 24 (maximum valid)', async () => {
    const task = makeTask();
    Task.findById = jest.fn().mockResolvedValue(task);
    const req = mockReq({ hours: 24, date: new Date(), description: 'work' }, { id: 'task1' });
    const res = mockRes();

    await logTime(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 when hours is 24.01 (above maximum)', async () => {
    Task.findById = jest.fn().mockResolvedValue(makeTask());
    const req = mockReq({ hours: 24.01, date: new Date(), description: 'work' }, { id: 'task1' });
    const res = mockRes();

    await logTime(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Hours must be between 0.25 and 24' });
  });
});

describe('Requirement 2.3 / 2.4 - updateTask completedAt lifecycle', () => {
  it('sets completedAt to a Date when status is set to done', async () => {
    const task = makeTask({ status: 'in_progress' });
    Task.findById = jest.fn().mockResolvedValue(task);
    const req = mockReq({ status: 'done' }, { id: 'task1' });
    const res = mockRes();

    await updateTask(req, res);

    expect(task.completedAt).toBeInstanceOf(Date);
    expect(task.completedAt).not.toBeNull();
  });

  it('clears completedAt when status changes from done to in_progress', async () => {
    const task = makeTask({ status: 'done', completedAt: new Date() });
    Task.findById = jest.fn().mockResolvedValue(task);
    const req = mockReq({ status: 'in_progress' }, { id: 'task1' });
    const res = mockRes();

    await updateTask(req, res);

    expect(task.completedAt).toBeNull();
  });
});

const Project = require('../models/Project');
const { getMyTasks } = require('../controllers/taskController');

const mockReqWithQuery = (query = {}, user = {}) => ({
  body: {},
  params: {},
  user: { _id: 'user123', role: 'employee', name: 'Test User', ...user },
  query
});

const makeTaskDoc = (overrides = {}) => {
  const plain = {
    _id: 'task1',
    projectId: 'proj1',
    assignedTo: 'user123',
    status: 'todo',
    dueDate: null,
    activityLog: [],
    ...overrides
  };
  return { ...plain, toObject: () => ({ ...plain }) };
};

describe('Requirement 3.5 - getMyTasks isOverdue flag', () => {
  beforeEach(() => {
    Project.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'proj1', title: 'Test Project', status: 'active' })
    });
  });

  it('sets isOverdue=true when dueDate is in the past and status is not done', async () => {
    const pastDate = new Date(Date.now() - 86400000);
    Task.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([makeTaskDoc({ dueDate: pastDate, status: 'in_progress' })]) });
    const req = mockReqWithQuery();
    const res = mockRes();

    await getMyTasks(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result[0].isOverdue).toBe(true);
  });

  it('sets isOverdue=false when dueDate is in the past but status is done', async () => {
    const pastDate = new Date(Date.now() - 86400000);
    Task.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([makeTaskDoc({ dueDate: pastDate, status: 'done' })]) });
    const req = mockReqWithQuery();
    const res = mockRes();

    await getMyTasks(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result[0].isOverdue).toBe(false);
  });

  it('sets isOverdue=false when dueDate is in the future', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    Task.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([makeTaskDoc({ dueDate: futureDate, status: 'in_progress' })]) });
    const req = mockReqWithQuery();
    const res = mockRes();

    await getMyTasks(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result[0].isOverdue).toBe(false);
  });

  it('sets isOverdue=false when dueDate is not set', async () => {
    Task.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([makeTaskDoc({ dueDate: null, status: 'todo' })]) });
    const req = mockReqWithQuery();
    const res = mockRes();

    await getMyTasks(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result[0].isOverdue).toBe(false);
  });
});
