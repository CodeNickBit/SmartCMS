/**
 * PayrollCalculationEngine
 *
 * Phase 3: The Payroll Calculation Engine
 * 
 * For a given employee, resolves all salary component values in the correct
 * dependency order (flat first, then percentage-of-a-component, 
 * then percentage-of-gross), applies pro-rata if LOP rules are on,
 * and outputs gross earnings, total deductions, and net pay.
 */

const User = require('../models/User');
const SalaryComponent = require('../models/SalaryComponent');
const SalaryTemplate = require('../models/SalaryTemplate');
const CompanySettings = require('../models/CompanySettings');

/**
 * Resolves a single component's value.
 * @param {object} component - The SalaryComponent document
 * @param {number|null} overrideAmount - Per-employee or per-template override
 * @param {Map<string, number>} resolvedValues - Map of already-resolved component IDs to their values
 * @returns {number}
 */
function resolveComponentValue(component, overrideAmount, resolvedValues) {
    if (overrideAmount !== null && overrideAmount !== undefined && !isNaN(overrideAmount)) {
        return overrideAmount;
    }

    if (component.calculationType === 'flat') {
        return component.amountOrPercentage || 0;
    }

    if (component.calculationType === 'percentage') {
        const pct = component.amountOrPercentage / 100;

        if (component.percentageOf) {
            // Percentage of a specific other component
            const baseValue = resolvedValues.get(component.percentageOf.toString());
            return baseValue ? baseValue * pct : 0;
        } else {
            // Percentage of total gross earnings (earnings sum so far)
            let grossSoFar = 0;
            for (const [, val] of resolvedValues) {
                grossSoFar += val;
            }
            return grossSoFar * pct;
        }
    }

    return 0;
}

/**
 * Topological sort: flat earnings → percentage-of-component earnings → percentage-of-gross earnings → deductions
 * This ensures that when we resolve component B (which is "20% of component A"), A is already resolved.
 */
function sortComponentsByDependency(componentEntries) {
    const sorted = [];
    const visited = new Set();
    
    // First pass: all flat earnings
    for (const entry of componentEntries) {
        if (entry.component.calculationType === 'flat' && entry.component.type === 'earning') {
            sorted.push(entry);
            visited.add(entry.component._id.toString());
        }
    }

    // Second pass: percentage-of-specific-component earnings
    let maxIterations = componentEntries.length * 2;
    let remaining = componentEntries.filter(e => !visited.has(e.component._id.toString()));
    
    while (remaining.length > 0 && maxIterations-- > 0) {
        const before = remaining.length;
        for (const entry of [...remaining]) {
            const id = entry.component._id.toString();
            if (visited.has(id)) { remaining = remaining.filter(e => e.component._id.toString() !== id); continue; }
            
            const dep = entry.component.percentageOf?.toString();
            if (entry.component.calculationType === 'percentage' && dep && !visited.has(dep)) {
                continue; // Dependency not resolved yet
            }
            sorted.push(entry);
            visited.add(id);
            remaining = remaining.filter(e => e.component._id.toString() !== id);
        }
        if (remaining.length === before) break; // Circular dependency guard
    }

    // Final pass: anything remaining (percentage-of-gross deductions, etc.)
    for (const entry of remaining) {
        if (!visited.has(entry.component._id.toString())) {
            sorted.push(entry);
        }
    }

    return sorted;
}

/**
 * Main calculation engine entry point.
 * @param {string} employeeId
 * @param {{ paidDays: number, totalWorkingDays: number, overtimeHours: number }} syncData
 * @param {object|null} overtimeRules - OT rules from CompanySettings
 * @returns {Promise<{
 *   components: Array<object>,
 *   grossEarnings: number,
 *   totalDeductions: number,
 *   netPay: number,
 *   salaryTemplateId: string|null
 * }>}
 */
async function calculateEmployeePayroll(employeeId, syncData, overtimeRules = null) {
    const { paidDays, totalWorkingDays, overtimeHours } = syncData;
    const proRataFactor = totalWorkingDays > 0 ? paidDays / totalWorkingDays : 1;

    // 1. Load the employee with their salary template and overrides
    const employee = await User.findById(employeeId)
        .populate({
            path: 'salaryTemplate',
            populate: {
                path: 'components.component',
                model: 'SalaryComponent'
            }
        })
        .lean();

    if (!employee || !employee.salaryTemplate) {
        throw new Error(`Employee ${employeeId} does not have a salary template assigned.`);
    }

    const template = employee.salaryTemplate;
    const userOverrides = employee.salaryOverrides || [];

    // 2. Build a map of user-level overrides: componentId -> overrideAmount
    const userOverrideMap = new Map();
    for (const override of userOverrides) {
        const compId = override.component?.toString() || override.component;
        userOverrideMap.set(compId, override.overrideAmount);
    }

    // 3. Build the list of component entries to process
    const componentEntries = [];
    for (const tplComp of template.components) {
        const comp = tplComp.component;
        if (!comp || !comp.isActive) continue;

        const compId = comp._id.toString();
        // Priority: user override > template override > component default
        const overrideAmount = userOverrideMap.has(compId)
            ? userOverrideMap.get(compId)
            : (tplComp.overrideAmount ?? null);

        componentEntries.push({ component: comp, overrideAmount });
    }

    // 4. Sort by dependency order
    const sorted = sortComponentsByDependency(componentEntries);

    // 5. Resolve each component value in order
    const resolvedValues = new Map(); // Only earnings go in here for the gross calculation
    const outputComponents = [];

    for (const entry of sorted) {
        const { component, overrideAmount } = entry;
        let resolved = resolveComponentValue(component, overrideAmount, resolvedValues);

        // 6. Apply pro-rata if this component depends on attendance
        let isProRated = false;
        if (component.dependsOnAttendance && proRataFactor < 1) {
            resolved = resolved * proRataFactor;
            isProRated = true;
        }

        resolved = Math.round(resolved * 100) / 100; // Round to 2 decimal places

        if (component.type === 'earning' && component.isPartOfGross) {
            resolvedValues.set(component._id.toString(), resolved);
        }

        outputComponents.push({
            component: component._id,
            name: component.name,
            type: component.type,
            calculationType: component.calculationType,
            resolvedAmount: resolved,
            isProRated,
            isPartOfGross: component.isPartOfGross
        });
    }

    // 7. Add Overtime component if OT rules are enabled and hours were logged
    if (overtimeRules?.enabled && overtimeHours > 0 && overtimeRules.overtimeEarningComponentId) {
        const otComp = await SalaryComponent.findById(overtimeRules.overtimeEarningComponentId).lean();
        if (otComp && otComp.isActive) {
            const standardHours = overtimeRules.standardWorkHoursPerDay || 8;
            const dailyRate = (otComp.amountOrPercentage || 0) / standardHours;
            const otAmount = Math.round(dailyRate * overtimeHours * (overtimeRules.overtimeMultiplier || 1.5) * 100) / 100;
            
            outputComponents.push({
                component: otComp._id,
                name: otComp.name + ' (OT)',
                type: 'earning',
                calculationType: 'flat',
                resolvedAmount: otAmount,
                isProRated: false,
                isPartOfGross: true
            });

            resolvedValues.set(otComp._id.toString(), otAmount);
        }
    }

    // 8. Compute totals
    let grossEarnings = 0;
    let totalDeductions = 0;

    for (const comp of outputComponents) {
        if (comp.type === 'earning') {
            grossEarnings += comp.resolvedAmount;
        } else if (comp.type === 'deduction') {
            totalDeductions += comp.resolvedAmount;
        }
    }

    grossEarnings = Math.round(grossEarnings * 100) / 100;
    totalDeductions = Math.round(totalDeductions * 100) / 100;
    const netPay = Math.max(0, Math.round((grossEarnings - totalDeductions) * 100) / 100);

    return {
        components: outputComponents,
        grossEarnings,
        totalDeductions,
        netPay,
        salaryTemplateId: template._id
    };
}

module.exports = { calculateEmployeePayroll };
