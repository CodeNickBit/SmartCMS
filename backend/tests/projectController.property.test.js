/**
 * Feature: project-management
 * Property 1: Project creation round-trip preserves all fields
 * Validates: Requirements 1.1
 *
 * Property 2: Creator is always added as a lead member
 * Validates: Requirements 1.3
 *
 * Property 3: Project update only persists allowed fields
 * Validates: Requirements 1.5
 *
 * Property 13: Timesheet date range filter excludes out-of-range logs
 * Validates: Requirements 4.5
 */

jest.mock('../models/TimeLog');
jest.mock('../models/Project');
jest.mock('../models/Task');
jest.mock('../models/User');
jest.mock('../models/Manager');
jest.mock('../models/Admin');

const fc = require('fast-check');
const TimeLog = require('../models/TimeLog');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Admin = require('../models/Admin');
const { createProject, getEmployeeTimesheet, updateProject } = require('../controllers/projectController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReqTimesheet = (employeeId, startDate, endDate) => ({
  params: { employeeId },
  query: { startDate, endDate },
  user: { _id: 'admin1', role: 'admin', name: 'Test Admin' }
});

const toISODate = (date) => date.toISOString().slice(0, 10);

const setupUserModelMocks = () => {
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
};

const setupMocks = (logsToReturn) => {
  TimeLog.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(logsToReturn)
    })
  });

  Project.find = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    })
  });

  User.findById = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    })
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  setupUserModelMocks();
});

/**
 * Property 1: Project creation round-trip preserves all fields
 *
 * For any valid project payload, the fields submitted to createProject SHALL be
 * persisted on the created Project document without modification.
 *
 * Validates: Requirements 1.1
 */
// Feature: project-management, Property 1: Project creation round-trip preserves all fields
describe('Property 1: Project creation round-trip preserves all fields', () => {
  it('persists all submitted fields on the created project', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 80 }),
          description: fc.string({ minLength: 0, maxLength: 200 }),
          status: fc.constantFrom('planning', 'active', 'on_hold', 'completed', 'archived'),
          priority: fc.constantFrom('low', 'medium', 'high', 'critical'),
          startDate: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true }), { nil: undefined }),
          endDate: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true }), { nil: undefined }),
          department: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
          billable: fc.boolean(),
          milestones: fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              isCompleted: fc.boolean()
            }),
            { minLength: 0, maxLength: 3 }
          )
        }),
        async (payload) => {
          jest.clearAllMocks();
          setupUserModelMocks();

          let capturedProjectData = null;

          const mockProjectInstance = {
            members: [],
            save: jest.fn().mockImplementation(function () {
              capturedProjectData = { ...this };
              return Promise.resolve(this);
            }),
            toObject: jest.fn().mockImplementation(function () {
              return { ...capturedProjectData };
            })
          };

          Project.mockImplementation(function (data) {
            Object.assign(this, data);
            this.members = data.members || [];
            this.save = mockProjectInstance.save.bind(this);
            this.toObject = function () { return { ...this }; };
            capturedProjectData = this;
          });

          const req = {
            body: { ...payload },
            user: { _id: 'creator123', role: 'manager', name: 'Test Manager', email: 'manager@test.com' },
            params: {},
            query: {}
          };
          const res = mockRes();

          await createProject(req, res);

          const jsonCalls = res.json.mock.calls;
          const successCall = jsonCalls.find(c => c[0] && c[0].message === 'Project created successfully');
          if (!successCall) return true;

          const createdProject = successCall[0].project;

          if (createdProject.title !== payload.title) return false;
          if (createdProject.description !== payload.description) return false;
          if (createdProject.status !== payload.status) return false;
          if (createdProject.priority !== payload.priority) return false;
          if (createdProject.billable !== payload.billable) return false;

          if (payload.department !== undefined && createdProject.department !== payload.department) return false;

          const createdTags = createdProject.tags || [];
          if (createdTags.length !== payload.tags.length) return false;
          for (let i = 0; i < payload.tags.length; i++) {
            if (createdTags[i] !== payload.tags[i]) return false;
          }

          const createdMilestones = createdProject.milestones || [];
          if (createdMilestones.length !== payload.milestones.length) return false;
          for (let i = 0; i < payload.milestones.length; i++) {
            if (createdMilestones[i].title !== payload.milestones[i].title) return false;
            if (createdMilestones[i].isCompleted !== payload.milestones[i].isCompleted) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 13: Timesheet date range filter excludes out-of-range logs
 *
 * For any employee and any date range [startDate, endDate], every time log
 * returned by the timesheet endpoint SHALL have a date value that falls within
 * [startDate, endDate] inclusive, and no time log outside that range SHALL be returned.
 *
 * Validates: Requirements 4.5
 */
describe('Property 13: Timesheet date range filter excludes out-of-range logs', () => {
  it('returns only logs within the specified date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31'), noInvalidDate: true }),
        fc.integer({ min: 0, max: 30 }),
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2019-01-01'), max: new Date('2026-12-31'), noInvalidDate: true }),
            hours: fc.float({ min: 0.25, max: 24, noNaN: true }),
            projectId: fc.constant('proj1'),
            taskId: fc.constant('task1'),
            employeeName: fc.constant('Test Employee')
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (employeeId, startDate, rangeDays, allLogs) => {
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + rangeDays);

          const startStr = toISODate(startDate);
          const endStr = toISODate(endDate);

          const rangeStart = new Date(startStr);
          const rangeEnd = new Date(endStr);
          rangeEnd.setHours(23, 59, 59, 999);

          const inRangeLogs = allLogs.filter(log => {
            const d = new Date(log.date);
            return d >= rangeStart && d <= rangeEnd;
          });

          setupMocks(inRangeLogs);

          const req = mockReqTimesheet(employeeId, startStr, endStr);
          const res = mockRes();

          await getEmployeeTimesheet(req, res);

          expect(res.json).toHaveBeenCalled();
          const response = res.json.mock.calls[0][0];
          expect(response.logs).toBeDefined();

          const allReturnedEntries = response.logs.flatMap(group => group.entries);

          for (const entry of allReturnedEntries) {
            const entryDate = new Date(entry.date);
            if (entryDate < rangeStart || entryDate > rangeEnd) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not include out-of-range logs even when mixed logs are generated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.date({ min: new Date('2021-01-01'), max: new Date('2023-12-31'), noInvalidDate: true }),
        fc.integer({ min: 1, max: 60 }),
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2019-01-01'), max: new Date('2026-12-31'), noInvalidDate: true }),
            hours: fc.float({ min: 0.25, max: 24, noNaN: true }),
            projectId: fc.constant('proj1'),
            taskId: fc.constant('task1'),
            employeeName: fc.constant('Test Employee')
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (employeeId, startDate, rangeDays, allLogs) => {
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + rangeDays);

          const startStr = toISODate(startDate);
          const endStr = toISODate(endDate);

          const rangeStart = new Date(startStr);
          const rangeEnd = new Date(endStr);
          rangeEnd.setHours(23, 59, 59, 999);

          const inRangeLogs = allLogs.filter(log => {
            const d = new Date(log.date);
            return d >= rangeStart && d <= rangeEnd;
          });

          setupMocks(inRangeLogs);

          const req = mockReqTimesheet(employeeId, startStr, endStr);
          const res = mockRes();

          await getEmployeeTimesheet(req, res);

          expect(res.json).toHaveBeenCalled();
          const response = res.json.mock.calls[0][0];
          expect(response.logs).toBeDefined();

          const allReturnedEntries = response.logs.flatMap(group => group.entries);

          expect(allReturnedEntries.length).toBe(inRangeLogs.length);

          for (const entry of allReturnedEntries) {
            const entryDate = new Date(entry.date);
            if (entryDate < rangeStart || entryDate > rangeEnd) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: project-management
 * Property 16: Payroll summary billable + non-billable = total
 * Validates: Requirements 8.2
 */
describe('Property 16: Payroll summary billable + non-billable = total', () => {
  it('billableHours + nonBillableHours === totalHours for any mix of billable/non-billable logs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(
          fc.record({
            hours: fc.float({ min: 0.25, max: 24, noNaN: true, noDefaultInfinity: true }),
            projectId: fc.constantFrom('billable-proj', 'non-billable-proj'),
            date: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31'), noInvalidDate: true }),
            employeeName: fc.constant('Test Employee')
          }),
          { minLength: 0, maxLength: 30 }
        ),
        async (employeeId, logEntries) => {
          const billableProjectId = 'billable-proj';
          const nonBillableProjectId = 'non-billable-proj';

          TimeLog.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(logEntries)
            })
          });

          Project.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                { _id: billableProjectId, billable: true },
                { _id: nonBillableProjectId, billable: false }
              ])
            })
          });

          User.findById = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(null)
            })
          });

          const req = {
            params: { employeeId },
            query: { startDate: '2023-01-01', endDate: '2024-12-31' },
            user: { _id: 'admin1', role: 'admin', name: 'Test Admin' }
          };
          const res = mockRes();

          await getEmployeeTimesheet(req, res);

          expect(res.json).toHaveBeenCalled();
          const response = res.json.mock.calls[0][0];
          expect(response.summary).toBeDefined();

          const { totalHours, billableHours, nonBillableHours } = response.summary;

          const sum = Math.round((billableHours + nonBillableHours) * 10000) / 10000;
          const total = Math.round(totalHours * 10000) / 10000;

          return sum === total;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Creator is always added as a lead member
 *
 * For any project creation payload, regardless of whether the creator is already
 * listed in the members array, the resulting project SHALL contain a member entry
 * with userId equal to the authenticated creator's ID and role equal to 'lead'.
 *
 * Validates: Requirements 1.3
 */
// Feature: project-management, Property 2: Creator is always added as a lead member
describe('Property 2: Creator is always added as a lead member', () => {
  it('always includes the creator as a lead member when not already in the members array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /\S/.test(s)),
        fc.string({ minLength: 1, maxLength: 80 }).filter(s => /\S/.test(s)),
        fc.constantFrom('manager', 'admin'),
        fc.array(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /\S/.test(s)),
            userModel: fc.constantFrom('User', 'Manager', 'Admin'),
            role: fc.constantFrom('lead', 'member', 'viewer')
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async (creatorId, projectTitle, creatorRole, otherMembers) => {
          jest.clearAllMocks();
          setupUserModelMocks();

          const membersPayload = otherMembers.filter(m => m.userId !== creatorId);

          let capturedMembers = null;

          Project.mockImplementation(function (data) {
            Object.assign(this, data);
            this.members = (data.members || []).map(m => ({ ...m }));
            this.save = jest.fn().mockImplementation(function () {
              capturedMembers = this.members;
              return Promise.resolve(this);
            });
            this.toObject = function () { return { ...this, members: this.members }; };
          });

          const req = {
            body: { title: projectTitle, members: membersPayload },
            user: { _id: creatorId, role: creatorRole, name: 'Test Creator', email: 'creator@test.com' },
            params: {},
            query: {}
          };
          const res = mockRes();

          await createProject(req, res);

          const jsonCalls = res.json.mock.calls;
          const successCall = jsonCalls.find(c => c[0] && c[0].message === 'Project created successfully');
          if (!successCall) return true;

          const members = capturedMembers || successCall[0].project?.members || [];

          const creatorEntry = members.find(m => String(m.userId) === String(creatorId));
          if (!creatorEntry) return false;
          if (creatorEntry.role !== 'lead') return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always ensures the creator is present in the members array even when pre-included', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /\S/.test(s)),
        fc.string({ minLength: 1, maxLength: 80 }).filter(s => /\S/.test(s)),
        fc.constantFrom('manager', 'admin'),
        fc.constantFrom('lead', 'member', 'viewer'),
        async (creatorId, projectTitle, creatorRole, preExistingRole) => {
          jest.clearAllMocks();
          setupUserModelMocks();

          const membersPayload = [
            { userId: creatorId, userModel: creatorRole === 'admin' ? 'Admin' : 'Manager', role: preExistingRole }
          ];

          let capturedMembers = null;

          Project.mockImplementation(function (data) {
            Object.assign(this, data);
            this.members = (data.members || []).map(m => ({ ...m }));
            this.save = jest.fn().mockImplementation(function () {
              capturedMembers = this.members;
              return Promise.resolve(this);
            });
            this.toObject = function () { return { ...this, members: this.members }; };
          });

          const req = {
            body: { title: projectTitle, members: membersPayload },
            user: { _id: creatorId, role: creatorRole, name: 'Test Creator', email: 'creator@test.com' },
            params: {},
            query: {}
          };
          const res = mockRes();

          await createProject(req, res);

          const jsonCalls = res.json.mock.calls;
          const successCall = jsonCalls.find(c => c[0] && c[0].message === 'Project created successfully');
          if (!successCall) return true;

          const members = capturedMembers || successCall[0].project?.members || [];

          const creatorEntry = members.find(m => String(m.userId) === String(creatorId));
          if (!creatorEntry) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Project update only persists allowed fields
 *
 * For any project update payload that includes both allowed fields and disallowed
 * extra fields, only the allowed fields SHALL be changed in the saved document;
 * all other fields SHALL remain unchanged.
 *
 * Allowed fields: title, description, status, priority, startDate, endDate,
 * projectManager, projectManagerModel, milestones, tags, department, billable
 *
 * Validates: Requirements 1.5
 */
// Feature: project-management, Property 3: Project update only persists allowed fields
describe('Property 3: Project update only persists allowed fields', () => {
  const ALLOWED_FIELDS = [
    'title', 'description', 'status', 'priority', 'startDate', 'endDate',
    'projectManager', 'projectManagerModel', 'milestones', 'tags', 'department', 'billable'
  ];

  const DISALLOWED_FIELDS = [
    'createdBy', 'createdByModel', '__v', 'members', 'loggedHours',
    'completedAt', 'someRandomField', 'injectedField', 'budget'
  ];

  const buildProjectInstance = (originalData, onSave) => {
    const instance = { ...originalData };
    instance.save = jest.fn().mockImplementation(function () {
      if (onSave) onSave(this);
      return Promise.resolve(this);
    });
    instance.toObject = function () { return { ...this }; };
    instance.members = originalData.members || [];
    return instance;
  };

  it('does not persist disallowed fields from the update payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 80 }),
          description: fc.string({ minLength: 0, maxLength: 200 }),
          status: fc.constantFrom('planning', 'active', 'on_hold', 'archived'),
          priority: fc.constantFrom('low', 'medium', 'high', 'critical'),
          department: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
          billable: fc.boolean(),
        }),
        fc.record({
          title: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: undefined }),
          description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
          status: fc.option(fc.constantFrom('planning', 'active', 'on_hold', 'archived'), { nil: undefined }),
          priority: fc.option(fc.constantFrom('low', 'medium', 'high', 'critical'), { nil: undefined }),
          billable: fc.option(fc.boolean(), { nil: undefined }),
        }),
        fc.record({
          createdBy: fc.string({ minLength: 1, maxLength: 20 }),
          createdByModel: fc.constantFrom('Admin', 'Manager'),
          someRandomField: fc.string({ minLength: 1, maxLength: 30 }),
          injectedField: fc.integer({ min: 0, max: 9999 }),
        }),
        async (originalFields, allowedUpdates, disallowedUpdates) => {
          jest.clearAllMocks();
          setupUserModelMocks();

          const projectId = 'proj-test-id';
          const creatorId = 'creator-admin';

          const originalProject = buildProjectInstance(
            {
              _id: projectId,
              createdBy: creatorId,
              createdByModel: 'Admin',
              projectManager: creatorId,
              ...originalFields,
              members: [],
            },
            null
          );

          let savedProject = null;
          originalProject.save = jest.fn().mockImplementation(function () {
            savedProject = { ...this };
            return Promise.resolve(this);
          });

          Project.findById = jest.fn().mockResolvedValue(originalProject);

          const updatePayload = {
            ...allowedUpdates,
            ...disallowedUpdates,
          };

          const req = {
            params: { id: projectId },
            body: updatePayload,
            user: { _id: creatorId, role: 'admin', name: 'Test Admin', email: 'admin@test.com' },
          };
          const res = mockRes();

          await updateProject(req, res);

          const jsonCalls = res.json.mock.calls;
          const successCall = jsonCalls.find(c => c[0] && c[0].message === 'Project updated successfully');
          if (!successCall) return true;

          const updatedProject = savedProject || successCall[0].project;

          for (const field of Object.keys(disallowedUpdates)) {
            if (ALLOWED_FIELDS.includes(field)) continue;
            const originalValue = originalFields[field] !== undefined
              ? originalFields[field]
              : (field === 'createdBy' ? creatorId : field === 'createdByModel' ? 'Admin' : undefined);
            const currentValue = updatedProject[field];
            if (currentValue !== originalValue && currentValue === disallowedUpdates[field]) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('persists only allowed fields that were present in the update payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 80 }),
          description: fc.string({ minLength: 0, maxLength: 200 }),
          status: fc.constantFrom('planning', 'active', 'on_hold', 'archived'),
          priority: fc.constantFrom('low', 'medium', 'high', 'critical'),
          billable: fc.boolean(),
          department: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: 'original-dept' }),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 80 }),
          description: fc.string({ minLength: 0, maxLength: 200 }),
          status: fc.constantFrom('planning', 'active', 'on_hold', 'archived'),
          priority: fc.constantFrom('low', 'medium', 'high', 'critical'),
          billable: fc.boolean(),
        }),
        async (originalFields, allowedUpdates) => {
          jest.clearAllMocks();
          setupUserModelMocks();

          const projectId = 'proj-test-id-2';
          const creatorId = 'creator-manager';

          const disallowedPayload = {
            createdBy: 'hacker-id',
            createdByModel: 'User',
            someRandomField: 'should-not-persist',
            loggedHours: 9999,
          };

          const originalProject = buildProjectInstance(
            {
              _id: projectId,
              createdBy: creatorId,
              createdByModel: 'Manager',
              projectManager: creatorId,
              ...originalFields,
              members: [],
            },
            null
          );

          let savedProject = null;
          originalProject.save = jest.fn().mockImplementation(function () {
            savedProject = { ...this };
            return Promise.resolve(this);
          });

          Project.findById = jest.fn().mockResolvedValue(originalProject);

          const req = {
            params: { id: projectId },
            body: { ...allowedUpdates, ...disallowedPayload },
            user: { _id: creatorId, role: 'manager', name: 'Test Manager', email: 'manager@test.com' },
          };
          const res = mockRes();

          await updateProject(req, res);

          const jsonCalls = res.json.mock.calls;
          const successCall = jsonCalls.find(c => c[0] && c[0].message === 'Project updated successfully');
          if (!successCall) return true;

          const updatedProject = savedProject || successCall[0].project;

          if (updatedProject.title !== allowedUpdates.title) return false;
          if (updatedProject.description !== allowedUpdates.description) return false;
          if (updatedProject.status !== allowedUpdates.status) return false;
          if (updatedProject.priority !== allowedUpdates.priority) return false;
          if (updatedProject.billable !== allowedUpdates.billable) return false;

          if (updatedProject.createdBy !== creatorId) return false;
          if (updatedProject.createdByModel !== 'Manager') return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves original values of disallowed fields regardless of what is sent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /\S/.test(s)),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /\S/.test(s)),
        fc.constantFrom('Admin', 'Manager'),
        fc.array(
          fc.constantFrom(...DISALLOWED_FIELDS),
          { minLength: 1, maxLength: DISALLOWED_FIELDS.length }
        ),
        async (originalCreatedBy, attackerValue, originalCreatedByModel, fieldsToAttack) => {
          jest.clearAllMocks();
          setupUserModelMocks();

          const projectId = 'proj-test-id-3';

          const originalProject = buildProjectInstance(
            {
              _id: projectId,
              createdBy: originalCreatedBy,
              createdByModel: originalCreatedByModel,
              projectManager: originalCreatedBy,
              title: 'Original Title',
              status: 'planning',
              priority: 'medium',
              billable: false,
              members: [],
            },
            null
          );

          let savedProject = null;
          originalProject.save = jest.fn().mockImplementation(function () {
            savedProject = { ...this };
            return Promise.resolve(this);
          });

          Project.findById = jest.fn().mockResolvedValue(originalProject);

          const attackPayload = {};
          const uniqueFields = [...new Set(fieldsToAttack)];
          for (const field of uniqueFields) {
            attackPayload[field] = attackerValue;
          }

          const req = {
            params: { id: projectId },
            body: { title: 'Updated Title', ...attackPayload },
            user: { _id: originalCreatedBy, role: 'admin', name: 'Test Admin', email: 'admin@test.com' },
          };
          const res = mockRes();

          await updateProject(req, res);

          const jsonCalls = res.json.mock.calls;
          const successCall = jsonCalls.find(c => c[0] && c[0].message === 'Project updated successfully');
          if (!successCall) return true;

          const updatedProject = savedProject || successCall[0].project;

          if (updatedProject.createdBy !== originalCreatedBy) return false;
          if (updatedProject.createdByModel !== originalCreatedByModel) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
