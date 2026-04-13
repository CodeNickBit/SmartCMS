/**
 * Feature: project-management
 * Property 5: completedAt lifecycle invariant
 * Validates: Requirements 2.3, 2.4
 *
 * Property 11: Overdue flag is set correctly
 * Validates: Requirements 3.5
 */

jest.mock('../models/Task');
jest.mock('../models/Project');
jest.mock('../models/TimeLog');
jest.mock('../models/User');
jest.mock('../models/Manager');
jest.mock('../models/Admin');

const fc = require('fast-check');
const Task = require('../models/Task');
const { updateTask } = require('../controllers/taskController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (body = {}, params = {}) => ({
  body,
  params,
  user: { _id: 'user123', role: 'manager', name: 'Test Manager' },
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

const VALID_STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];

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

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Property 5: completedAt lifecycle invariant
 *
 * For any sequence of status transitions:
 * - After transitioning TO 'done': completedAt must be a non-null Date
 * - After transitioning FROM 'done' to anything else: completedAt must be null/undefined
 *
 * Validates: Requirements 2.3, 2.4
 */
describe('Property 5: completedAt lifecycle invariant', () => {
  it('holds across arbitrary status transition sequences', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom(...VALID_STATUSES), { minLength: 1, maxLength: 20 }),
        async (statusSequence) => {
          let currentStatus = 'todo';
          let currentCompletedAt = null;

          for (const nextStatus of statusSequence) {
            const task = makeTask({
              status: currentStatus,
              completedAt: currentCompletedAt,
            });

            Task.findById = jest.fn().mockResolvedValue(task);
            const req = mockReq({ status: nextStatus }, { id: 'task1' });
            const res = mockRes();

            await updateTask(req, res);

            if (nextStatus === 'done') {
              if (!(task.completedAt instanceof Date) || task.completedAt === null) {
                return false;
              }
            } else {
              if (task.completedAt !== null && task.completedAt !== undefined) {
                return false;
              }
            }

            currentStatus = nextStatus;
            currentCompletedAt = task.completedAt;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 11: Overdue flag is set correctly
 *
 * For any task where dueDate is strictly before the current date and status is not 'done',
 * isOverdue must be true. For any task where dueDate is in the future, null/undefined,
 * or status is 'done', isOverdue must be false.
 *
 * Feature: project-management, Property 11: Overdue flag is set correctly
 * Validates: Requirements 3.5
 */
describe('Property 11: Overdue flag is set correctly', () => {
  beforeEach(() => {
    Project.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'proj1', title: 'Test Project', status: 'active' })
    });
  });

  it('holds for arbitrary dueDate and status combinations', async () => {
    const now = new Date();
    const pastDate = fc.date({ min: new Date(2000, 0, 1), max: new Date(now.getTime() - 1) });
    const futureDate = fc.date({ min: new Date(now.getTime() + 1), max: new Date(2100, 0, 1) });
    const dueDateArb = fc.oneof(
      pastDate,
      futureDate,
      fc.constant(null),
      fc.constant(undefined)
    );

    await fc.assert(
      fc.asyncProperty(
        dueDateArb,
        fc.constantFrom(...VALID_STATUSES),
        async (dueDate, status) => {
          Task.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([makeTaskDoc({ dueDate: dueDate ?? null, status })])
          });

          const req = mockReqWithQuery();
          const res = mockRes();

          await getMyTasks(req, res);

          const result = res.json.mock.calls[0][0];
          const isOverdue = result[0].isOverdue;

          const checkNow = new Date();
          const expectedOverdue = !!(dueDate && dueDate < checkNow && status !== 'done');

          return isOverdue === expectedOverdue;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: project-management, Property 12: loggedHours equals sum of all time log entries
 * Validates: Requirements 4.1
 */
describe('Property 12: loggedHours equals sum of all time log entries', () => {
  const TimeLog = require('../models/TimeLog');
  const { logTime } = require('../controllers/taskController');

  it('holds for N arbitrary valid time log entries', async () => {
    const validHours = fc.float({ min: 0.25, max: 24, noNaN: true }).map(h => Math.round(h * 100) / 100);

    await fc.assert(
      fc.asyncProperty(
        fc.array(validHours, { minLength: 1, maxLength: 10 }),
        async (hoursEntries) => {
          const accumulatedLogs = [];

          for (const hours of hoursEntries) {
            const task = makeTask({ loggedHours: 0 });
            Task.findById = jest.fn().mockResolvedValue(task);

            accumulatedLogs.push({ hours });

            const aggregateTotal = accumulatedLogs.reduce((sum, l) => sum + l.hours, 0);

            TimeLog.prototype.save = jest.fn().mockResolvedValue(true);
            TimeLog.aggregate = jest.fn().mockResolvedValue([{ _id: null, total: aggregateTotal }]);

            const req = {
              body: { hours, date: new Date(), description: 'test' },
              params: { id: 'task1' },
              user: { _id: 'user123', role: 'manager', name: 'Test Manager' }
            };
            const res = mockRes();

            await logTime(req, res);

            const call = res.json.mock.calls[0];
            if (!call) return false;
            const returned = call[0];
            if (Math.abs(returned.loggedHours - aggregateTotal) > 0.0001) return false;
            if (Math.abs(task.loggedHours - aggregateTotal) > 0.0001) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
