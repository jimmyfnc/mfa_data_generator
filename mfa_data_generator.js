//==================================================================================
// 🔐 MFA (MULTI-FACTOR AUTHENTICATION) DATA GENERATOR WITH ODM ANALYTICS
// VERSION 2.0 - Enhanced with Validation and Config Improvements
//==================================================================================
//
// 📋 USAGE INSTRUCTIONS:
// =====================
//
// 1. SUMMARY ONLY (Statistics without data flood):
//    node mfa_data_generator_v2.js --summary-only
//    • Shows detailed MFA coverage statistics and analysis
//    • No CSV data output to console (clean, readable results)
//    • Perfect for reviewing metrics and insights
//
// 2. SAVE TO FILE (Full data + summary):
//    node mfa_data_generator_v2.js > mfa_data.csv
//    • Saves all MFA sign-in records to CSV file
//    • Automatically creates companion mfa_stats_[timestamp].txt file with statistics
//    • Clean CSV data for analysis, readable statistics in separate text file
//
// 3. FULL CONSOLE OUTPUT (All data to screen):
//    node mfa_data_generator_v2.js
//    • Displays everything in console (very long output)
//    • Use only if you need to see raw data immediately
//
// 4. REPRODUCIBLE DATA (Using seed):
//    node mfa_data_generator_v2.js --seed 12345
//    • Generates identical data every time with the same seed
//    • Perfect for testing, debugging, and consistent demo data
//    • Can be combined with other options: --summary-only --seed 12345
//
// 5. VALIDATION MODE (Check data quality):
//    node mfa_data_generator_v2.js --validate
//    • Runs validation checks after generation
//    • Reports if generated data meets config targets
//    • Automatically enabled with --summary-only
//
// 6. CONFIGURATION OPTIONS:
//    • Set RECORD_COUNT for total number of sign-in records to generate
//    • Adjust APPLICATION_COUNT for number of applications
//    • Modify BASELINE_MFA_COVERAGE for MFA protection on critical/high-risk apps
//    • Set RANDOM_SEED to a number for reproducible data (or use --seed argument)
//
//==================================================================================

// Import required modules
const fs = require('fs');
const path = require('path');

// Add configuration option for summary-only mode
const CONFIG = {
    // Data generation settings
    RECORD_COUNT: 50000,         // Number of sign-in records to generate (12 months of activity)
    EMPLOYEE_COUNT: 5000,        // Number of unique employees
    APPLICATION_COUNT: 80,       // Number of applications in environment
    DATE_RANGE_DAYS: 365,        // Date range for sign-in data (12 months)
    
    // Reproducible data generation
    RANDOM_SEED: null, // Set to a number (e.g., 12345) for reproducible results, null for random

    // Application risk classification
    // NOTE: These percentages are based on actual app counts in APPLICATION_CATEGORIES below
    CRITICAL_APP_PERCENTAGE: 0.20,      // 20% of apps are critical (calculated from actual count)
    HIGH_RISK_APP_PERCENTAGE: 0.25,     // 25% of apps are high-risk (calculated from actual count)
    MEDIUM_RISK_APP_PERCENTAGE: 0.35,   // 35% of apps are medium-risk (calculated from actual count)
    LOW_RISK_APP_PERCENTAGE: 0.20,      // 20% of apps are low-risk (calculated from actual count)
    
    // MFA adoption and compliance
    // IMPORTANT: BASELINE_MFA_COVERAGE determines what % of critical/high-risk apps have MFA enabled
    // This is the PRIMARY metric for Gartner ODM calculation
    BASELINE_MFA_COVERAGE: 0.75,        // 75% of critical/high-risk apps have MFA enabled
    NON_CRITICAL_MFA_RATE: 0.45,        // 45% of medium/low-risk apps have MFA enabled
    ADMIN_MFA_ENFORCEMENT: 0.95,        // 95% of admin accounts require MFA
    
    // Gartner ODM - MFA Coverage Target
    // Target question: What percentage of critical and high-risk applications 
    // are protected by multifactor authentication?
    MFA_ODM_ENABLED: true,              // Enable MFA coverage ODM calculations
    TARGET_MFA_COVERAGE: 0.90,          // Target: 90% of critical/high-risk apps with MFA
    ODM_MEASUREMENT_PERIOD_MONTHS: 12,  // Track over 12-month rolling period
    
    // Sign-in patterns
    AVG_SIGNINS_PER_EMPLOYEE_PER_MONTH: 40,  // Average sign-ins per employee monthly
    BUSINESS_HOURS_PERCENTAGE: 0.75,         // 75% of sign-ins during business hours
    WEEKDAY_PERCENTAGE: 0.85,                // 85% of sign-ins on weekdays
    
    // Admin user settings
    ADMIN_USER_PERCENTAGE: 0.08,        // 8% of users have admin privileges
    
    // Output settings
    OUTPUT_FORMAT: 'csv',               // Format for data output: 'csv', 'tsv', or 'json'
    SUMMARY_ONLY: false,                // Set to true to show only statistics without data output
    ENABLE_VALIDATION: false,           // Set to true to validate generated data against targets
    
    // Company structure
    COMPANY_NAME: 'TechCorp Industries',
    EMAIL_DOMAIN: '@techcorp.com',
    
    // Trendline Settings - MFA adoption over time
    // IMPORTANT: Monthly weights are MULTIPLIERS applied to BASELINE_MFA_COVERAGE
    // Example: January = 0.65 × 75% = 48.75% actual MFA coverage for that month
    // This creates a realistic rollout scenario where MFA adoption grows over time
    ENABLE_TRENDLINE: true,             // Enable time-based trending in MFA adoption
    MFA_ROLLOUT_START_MONTH: 0,         // January (0-indexed) - when MFA rollout began
    MFA_ROLLOUT_PEAK_MONTH: 8,          // September (0-indexed) - peak adoption push
    MFA_ADOPTION_GROWTH_RATE: 0.05,     // Monthly growth in MFA adoption (5% improvement)
    
    // Monthly MFA Adoption Weights (Multipliers applied to baseline coverage)
    // Pattern: Gradual rollout with enforcement phases
    // CALCULATION: Actual MFA coverage for a month = BASELINE_MFA_COVERAGE × MONTHLY_WEIGHT
    MONTHLY_MFA_WEIGHTS: [
        0.65,  // Jan - 65% of baseline (48.75% actual coverage - rollout just started)
        0.70,  // Feb - 70% (52.5% actual - early adoption)
        0.78,  // Mar - 78% (58.5% actual - growing awareness)
        0.85,  // Apr - 85% (63.75% actual - increasing enforcement)
        0.92,  // May - 92% (69% actual - pre-summer push)
        0.95,  // Jun - 95% (71.25% actual - summer enforcement)
        0.98,  // Jul - 98% (73.5% actual - near target)
        1.00,  // Aug - 100% (75% actual - baseline target achieved)
        1.05,  // Sep - 105% (78.75% actual - peak enforcement/audit season)
        1.08,  // Oct - 108% (81% actual - maintained enforcement)
        1.06,  // Nov - 106% (79.5% actual - slight dip, holidays approaching)
        1.02   // Dec - 102% (76.5% actual - holiday season maintenance)
    ],
    
    // Sign-in source distribution
    // Exact target achievement
    // YOUR MAIN KPI - Current Month Target Compliance
    CURRENT_MONTH_TARGET_COMPLIANCE: 0.95,    // 95% - What dashboard will show

    ENABLE_EXACT_TARGET_CORRECTION: true,      // Adjust data to hit EXACT target
    CORRECTION_TOLERANCE: 0.001,               // Within 0.1% of target

    SIGNIN_SOURCES: [
        { name: 'Okta', weight: 0.45 },
        { name: 'Azure AD', weight: 0.30 },
        { name: 'Google Workspace', weight: 0.15 },
        { name: 'OneLogin', weight: 0.07 },
        { name: 'Direct LDAP', weight: 0.03 }
    ]
};

// ========== VALIDATION THRESHOLDS ==========
const VALIDATION = {
    MFA_COVERAGE_TOLERANCE: 0.05,       // ±5% tolerance for MFA coverage checks
    ADMIN_MFA_TOLERANCE: 0.05,          // ±5% tolerance for admin MFA rate
    RISK_DISTRIBUTION_TOLERANCE: 0.02,  // ±2% tolerance for app risk distribution
    MIN_RECORDS_PER_APP: 10,            // Minimum sign-ins per app for statistical validity
};

// ========== SEEDED RANDOM NUMBER GENERATOR ==========
class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }
    
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    choice(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
    
    weighted(choices) {
        const totalWeight = choices.reduce((sum, c) => sum + c.weight, 0);
        let random = this.next() * totalWeight;
        
        for (let choice of choices) {
            random -= choice.weight;
            if (random <= 0) return choice;
        }
        return choices[choices.length - 1];
    }
}

// Initialize random number generator
let rng;
const seedArg = process.argv.find(arg => arg.startsWith('--seed='));
if (seedArg) {
    CONFIG.RANDOM_SEED = parseInt(seedArg.split('=')[1]);
} else if (process.argv.includes('--seed')) {
    const seedIndex = process.argv.indexOf('--seed');
    if (process.argv[seedIndex + 1]) {
        CONFIG.RANDOM_SEED = parseInt(process.argv[seedIndex + 1]);
    }
}

if (CONFIG.RANDOM_SEED !== null) {
    rng = new SeededRandom(CONFIG.RANDOM_SEED);
    console.error(`🎲 Using seed: ${CONFIG.RANDOM_SEED} for reproducible data generation`);
} else {
    rng = new SeededRandom(Date.now());
}

// Check for summary-only mode
if (process.argv.includes('--summary-only')) {
    CONFIG.SUMMARY_ONLY = true;
    CONFIG.ENABLE_VALIDATION = true; // Auto-enable validation in summary mode
}

// Check for validation mode
if (process.argv.includes('--validate')) {
    CONFIG.ENABLE_VALIDATION = true;
}

//==================================================================================
// 🎭 MOCK DATA LIBRARIES
//==================================================================================

const FIRST_NAMES = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
    'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
    'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
    'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
    'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
    'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen', 'Stephen', 'Anna',
    'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Nicole', 'Brandon', 'Emma',
    'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra',
    'Frank', 'Rachel', 'Alexander', 'Catherine', 'Patrick', 'Carolyn', 'Raymond', 'Janet',
    'Jack', 'Ruth', 'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane',
    'Aaron', 'Virginia', 'Jose', 'Julie', 'Adam', 'Joyce', 'Henry', 'Victoria',
    'Nathan', 'Olivia', 'Douglas', 'Kelly', 'Zachary', 'Christina', 'Peter', 'Lauren',
    'Kyle', 'Joan', 'Walter', 'Evelyn', 'Ethan', 'Judith', 'Jeremy', 'Megan',
    'Harold', 'Cheryl', 'Keith', 'Andrea', 'Christian', 'Hannah', 'Roger', 'Jacqueline',
    'Noah', 'Martha', 'Gerald', 'Gloria', 'Carl', 'Teresa', 'Terry', 'Ann',
    'Sean', 'Sara', 'Austin', 'Madison', 'Arthur', 'Frances', 'Lawrence', 'Kathryn',
    'Jesse', 'Janice', 'Dylan', 'Jean', 'Bryan', 'Abigail', 'Joe', 'Sophia',
    'Jordan', 'Judy', 'Billy', 'Grace', 'Bruce', 'Denise', 'Albert', 'Amber',
    'Willie', 'Doris', 'Gabriel', 'Marilyn', 'Logan', 'Danielle', 'Alan', 'Beverly',
    'Juan', 'Isabella', 'Wayne', 'Theresa', 'Roy', 'Diana', 'Ralph', 'Natalie',
    'Randy', 'Brittany', 'Eugene', 'Charlotte', 'Vincent', 'Marie', 'Russell', 'Kayla',
    'Elijah', 'Alexis', 'Louis', 'Lori', 'Bobby', 'Alice', 'Philip', 'Julia',
    'Johnny', 'Jean', 'Bradley', 'Rita'
];

const LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
    'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
    'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
    'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
    'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
    'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
    'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
    'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell',
    'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher',
    'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham',
    'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant',
    'Herrera', 'Gibson', 'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray',
    'Ford', 'Castro', 'Marshall', 'Owens', 'Harrison', 'Fernandez', 'McDonald', 'Woods',
    'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman', 'Webb',
    'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter',
    'Gordon', 'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz',
    'Hunt', 'Hicks', 'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd',
    'Rose', 'Stone', 'Salazar', 'Fox', 'Warren', 'Mills', 'Meyer', 'Rice',
    'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto', 'Weaver',
    'Ryan', 'Gardner', 'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins',
    'Arnold', 'Pierce', 'Vazquez', 'Hansen'
];

const JOB_TITLES = [
    'Software Engineer', 'Senior Software Engineer', 'Lead Software Engineer', 'Staff Engineer',
    'Product Manager', 'Senior Product Manager', 'Director of Product',
    'Data Analyst', 'Senior Data Analyst', 'Data Scientist', 'Senior Data Scientist',
    'DevOps Engineer', 'Senior DevOps Engineer', 'Site Reliability Engineer',
    'Security Engineer', 'Senior Security Engineer', 'Information Security Analyst',
    'Network Engineer', 'Senior Network Engineer', 'Network Administrator',
    'Systems Administrator', 'Senior Systems Administrator', 'IT Manager',
    'Database Administrator', 'Senior DBA', 'Data Engineer',
    'QA Engineer', 'Senior QA Engineer', 'Test Automation Engineer',
    'UX Designer', 'Senior UX Designer', 'UI Developer',
    'Technical Writer', 'Documentation Manager', 'Content Strategist',
    'Project Manager', 'Senior Project Manager', 'Program Manager',
    'Business Analyst', 'Senior Business Analyst', 'Business Intelligence Analyst',
    'Sales Engineer', 'Account Manager', 'Customer Success Manager',
    'HR Manager', 'HR Business Partner', 'Talent Acquisition Specialist',
    'Finance Manager', 'Financial Analyst', 'Controller',
    'Marketing Manager', 'Digital Marketing Specialist', 'Content Marketing Manager',
    'Operations Manager', 'Supply Chain Analyst', 'Procurement Specialist'
];

// Application portfolio - mix of critical, high-risk, medium, and low-risk applications
const APPLICATION_CATEGORIES = {
    CRITICAL: [
        'Core Banking System', 'Payment Processing Gateway', 'Trading Platform',
        'Customer Database (PII)', 'Financial Reporting System', 'ERP - Finance Module',
        'Healthcare Records System', 'Identity Management', 'Privileged Access Management',
        'Active Directory Admin', 'AWS Root Account', 'Azure Tenant Admin',
        'Production Database Admin', 'Security Operations Console', 'Firewall Management',
        'Backup Admin Console', 'Certificate Authority'
    ],
    HIGH_RISK: [
        'CRM - Salesforce', 'HR Information System', 'Payroll System',
        'Legal Document Management', 'Compliance Portal', 'Audit Management System',
        'VPN - Executive Access', 'Code Repository - GitHub Enterprise', 'CI/CD Pipeline - Production',
        'Cloud Console - AWS', 'Cloud Console - Azure', 'Cloud Console - GCP',
        'Email Admin Portal', 'Network Management', 'Endpoint Security Console',
        'Data Loss Prevention', 'SIEM Platform', 'Vulnerability Scanner',
        'Privileged Session Manager', 'Secrets Management Vault'
    ],
    MEDIUM_RISK: [
        'Jira', 'Confluence', 'SharePoint', 'Teams', 'Slack',
        'Zoom', 'Webex', 'Okta User Portal', 'Azure AD Portal',
        'Google Workspace Admin', 'Office 365', 'OneDrive', 'Box',
        'Dropbox Business', 'ServiceNow', 'Zendesk', 'Splunk',
        'Datadog', 'New Relic', 'PagerDuty', 'Monday.com',
        'Asana', 'Trello', 'Notion', 'Miro', 'Figma',
        'Adobe Creative Cloud', 'DocuSign'
    ],
    LOW_RISK: [
        'Employee Directory', 'Cafeteria Booking', 'Parking Management',
        'Badge Access Portal', 'Training Portal', 'Survey Tool',
        'Event Registration', 'Travel Booking', 'Expense Reports',
        'Time Tracking', 'Benefits Portal', 'Company Intranet',
        'News & Announcements', 'Social Recognition Platform', 'Wellness App',
        'Employee Store', 'IT Help Desk Portal'
    ]
};

// Organizational hierarchy levels
const LEVEL_1_ORGS = ['TechCorp Industries'];
const LEVEL_2_ORGS = ['Engineering', 'Product', 'Sales & Marketing', 'Operations', 'Finance', 'HR & Legal'];
const LEVEL_3_ORGS = {
    'Engineering': ['Software Development', 'Infrastructure', 'Security', 'QA & Testing', 'Data Engineering'],
    'Product': ['Product Management', 'UX/UI Design', 'Product Marketing', 'Analytics'],
    'Sales & Marketing': ['Enterprise Sales', 'SMB Sales', 'Marketing', 'Customer Success'],
    'Operations': ['IT Operations', 'Facilities', 'Supply Chain', 'Business Operations'],
    'Finance': ['Accounting', 'FP&A', 'Treasury', 'Tax & Compliance'],
    'HR & Legal': ['Human Resources', 'Recruiting', 'Legal', 'Compliance']
};

const LEVEL_4_ORGS = {
    'Software Development': ['Frontend', 'Backend', 'Mobile', 'Platform'],
    'Infrastructure': ['Cloud Services', 'Network', 'Systems', 'DevOps'],
    'Security': ['Application Security', 'Infrastructure Security', 'Security Operations', 'GRC'],
    'QA & Testing': ['Manual Testing', 'Automation', 'Performance Testing'],
    'Data Engineering': ['Data Platform', 'Data Analytics', 'Business Intelligence'],
    'Product Management': ['Core Product', 'Platform', 'Enterprise', 'Consumer'],
    'UX/UI Design': ['UX Research', 'Visual Design', 'Interaction Design'],
    'Enterprise Sales': ['East Region', 'West Region', 'EMEA', 'APAC'],
    'Marketing': ['Digital Marketing', 'Content Marketing', 'Events', 'Brand'],
    'IT Operations': ['End User Computing', 'IT Support', 'IT Security'],
    'Accounting': ['Accounts Payable', 'Accounts Receivable', 'General Ledger'],
    'Human Resources': ['HR Operations', 'Compensation & Benefits', 'Employee Relations']
};

//==================================================================================
// 👥 EMPLOYEE AND APPLICATION GENERATION
//==================================================================================

// Generate employee pool
const employees = [];
const employeeEmailSet = new Set();

for (let i = 0; i < CONFIG.EMPLOYEE_COUNT; i++) {
    const firstName = rng.choice(FIRST_NAMES);
    const lastName = rng.choice(LAST_NAMES);
    const employeeId = `EMP${String(i + 1).padStart(6, '0')}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${CONFIG.EMAIL_DOMAIN}`;
    
    // Ensure unique emails
    let uniqueEmail = email;
    let counter = 1;
    while (employeeEmailSet.has(uniqueEmail)) {
        uniqueEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}${CONFIG.EMAIL_DOMAIN}`;
        counter++;
    }
    employeeEmailSet.add(uniqueEmail);
    
    const jobTitle = rng.choice(JOB_TITLES);
    const isAdmin = rng.next() < CONFIG.ADMIN_USER_PERCENTAGE;
    
    // Assign organizational hierarchy
    const level1 = LEVEL_1_ORGS[0];
    const level2 = rng.choice(LEVEL_2_ORGS);
    const level3Options = LEVEL_3_ORGS[level2] || [level2];
    const level3 = rng.choice(level3Options);
    const level4Options = LEVEL_4_ORGS[level3] || [level3];
    const level4 = rng.choice(level4Options);
    const level5 = `Team ${rng.nextInt(1, 8)}`;
    const level6 = rng.next() < 0.3 ? `Sub-Team ${String.fromCharCode(65 + rng.nextInt(0, 3))}` : null;
    
    employees.push({
        employeeId,
        email: uniqueEmail,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        jobTitle,
        isAdmin,
        level1,
        level2,
        level3,
        level4,
        level5,
        level6
    });
}

// Assign managers (roughly 1:8 manager to employee ratio)
employees.forEach((emp, idx) => {
    if (idx % 8 === 0) {
        // This person is a manager
        emp.managerId = null;
        emp.managerName = null;
        emp.managerEmail = null;
    } else {
        // Assign to a manager in same L3 org
        const managersInOrg = employees.filter(e => 
            e.level3 === emp.level3 && 
            employees.indexOf(e) % 8 === 0 &&
            e !== emp
        );
        if (managersInOrg.length > 0) {
            const manager = rng.choice(managersInOrg);
            emp.managerId = manager.employeeId;
            emp.managerName = manager.fullName;
            emp.managerEmail = manager.email;
        } else {
            // Fallback to any manager
            const anyManager = employees[Math.floor(employees.indexOf(emp) / 8) * 8];
            emp.managerId = anyManager.employeeId;
            emp.managerName = anyManager.fullName;
            emp.managerEmail = anyManager.email;
        }
    }
});

// Generate application portfolio
const applications = [];
let appIdCounter = 1;

Object.entries(APPLICATION_CATEGORIES).forEach(([riskLevel, appNames]) => {
    appNames.forEach(appName => {
        const appId = `APP${String(appIdCounter).padStart(4, '0')}`;
        appIdCounter++;
        
        // Determine if this app requires MFA based on risk level
        // This is the CRITICAL calculation for Gartner ODM metric
        let mfaRequired;
        if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH_RISK') {
            // Critical/High-risk apps: Use BASELINE_MFA_COVERAGE to determine MFA protection
            // This directly impacts the ODM metric calculation
            mfaRequired = rng.next() < CONFIG.BASELINE_MFA_COVERAGE;
        } else {
            // Medium/Low-risk apps have lower MFA adoption
            mfaRequired = rng.next() < CONFIG.NON_CRITICAL_MFA_RATE;
        }
        
        applications.push({
            appId,
            appName,
            riskLevel,
            mfaRequired,
            isCriticalOrHighRisk: (riskLevel === 'CRITICAL' || riskLevel === 'HIGH_RISK')
        });
    });
});

console.error(`📊 Generated ${employees.length} employees and ${applications.length} applications`);
console.error(`🔐 Critical/High-Risk applications: ${applications.filter(a => a.isCriticalOrHighRisk).length}`);
console.error(`✅ MFA-protected Critical/High-Risk apps: ${applications.filter(a => a.isCriticalOrHighRisk && a.mfaRequired).length}`);

//==================================================================================
// 📅 DATE AND TIME UTILITIES
//==================================================================================

function getRandomDate(startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const randomTime = start + rng.next() * (end - start);
    return new Date(randomTime);
}

function getBusinessHoursDate(baseDate) {
    const date = new Date(baseDate);
    
    // Business hours: 7 AM to 7 PM
    if (rng.next() < CONFIG.BUSINESS_HOURS_PERCENTAGE) {
        date.setHours(7 + rng.nextInt(0, 12));
    } else {
        // Off-hours: 7 PM to 7 AM
        const offHour = rng.nextInt(19, 30) % 24;
        date.setHours(offHour);
    }
    
    date.setMinutes(rng.nextInt(0, 59));
    date.setSeconds(rng.nextInt(0, 59));
    
    return date;
}

function isWeekday(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday to Friday
}

function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMonthIndex(date) {
    return date.getMonth(); // 0-indexed (0=Jan, 11=Dec)
}

function getMFAAdoptionMultiplier(date) {
    if (!CONFIG.ENABLE_TRENDLINE || !CONFIG.MONTHLY_MFA_WEIGHTS) {
        return 1.0;
    }
    
    const monthIndex = getMonthIndex(date);
    return CONFIG.MONTHLY_MFA_WEIGHTS[monthIndex] || 1.0;
}

//==================================================================================
// 📝 MFA SIGN-IN RECORD GENERATION
//==================================================================================

function generateMFARecord(recordNumber, currentDate) {
    // Select random employee
    const employee = rng.choice(employees);
    
    // Select random application
    const application = rng.choice(applications);
    
    // Generate sign-in time
    let signinDate = getRandomDate(
        new Date(currentDate.getTime() - CONFIG.DATE_RANGE_DAYS * 24 * 60 * 60 * 1000),
        currentDate
    );
    
    // Apply weekday bias
    let attempts = 0;
    while (rng.next() < CONFIG.WEEKDAY_PERCENTAGE && !isWeekday(signinDate) && attempts < 5) {
        signinDate = getRandomDate(
            new Date(currentDate.getTime() - CONFIG.DATE_RANGE_DAYS * 24 * 60 * 60 * 1000),
            currentDate
        );
        attempts++;
    }
    
    signinDate = getBusinessHoursDate(signinDate);
    
    // Determine if MFA was used
    // This logic applies to SIGN-INS, not to whether the app has MFA enabled
    let isMFA;
    const mfaMultiplier = getMFAAdoptionMultiplier(signinDate);
    
    if (application.mfaRequired) {
        // App requires MFA - high compliance but not 100%
        // Users mostly comply with MFA requirements
        isMFA = rng.next() < (0.95 * mfaMultiplier);
    } else if (employee.isAdmin) {
        // Admin users have high MFA usage even on non-required apps
        isMFA = rng.next() < (CONFIG.ADMIN_MFA_ENFORCEMENT * mfaMultiplier);
    } else {
        // Regular users on non-MFA apps - lower adoption
        isMFA = rng.next() < (0.30 * mfaMultiplier);
    }
    
    // Determine compliance status
    // Compliant if: (App requires MFA AND user used MFA) OR (App doesn't require MFA)
    const isCompliant = application.mfaRequired ? isMFA : true;
    
    // Select sign-in source
    const signinSource = rng.weighted(CONFIG.SIGNIN_SOURCES).name;
    
    // Generate unique sign-in ID
    const uniqueSignin = `SIGNIN-${formatDate(signinDate).replace(/-/g, '')}-${application.appId}-${employee.employeeId}-${String(recordNumber).padStart(8, '0')}`;
    
    // Load date (typically same as sign-in date or next day for batch processing)
    const loadDate = new Date(signinDate);
    if (rng.next() < 0.3) {
        loadDate.setDate(loadDate.getDate() + 1);
    }
    
    // Trendline date (monthly aggregation)
    const tlDate = new Date(signinDate.getFullYear(), signinDate.getMonth(), 1);
    
    return {
        EMPLOYEE_EMAIL: employee.email,
        APPLICATION_NAME: application.appName,
        APPLICATION_ID: application.appId,
        SIGNIN_TIME: formatDateTime(signinDate),
        SIGNIN_SOURCE: signinSource,
        IS_MFA: isMFA,
        UNIQUE_SIGNIN: uniqueSignin,
        LOAD_DATE: formatDate(loadDate),
        COMPLIANCE_STATUS: isCompliant,
        EMPLOYEE_FULL_NAME: employee.fullName,
        EMPLOYEE_ID: employee.employeeId,
        EMPLOYEE_JOB_TITLE: employee.jobTitle,
        MANAGER_FULL_NAME: employee.managerName || '',
        MANAGER_EMPLOYEE_ID: employee.managerId || '',
        MANAGER_EMAIL_ADDRESS: employee.managerEmail || '',
        LEVEL_1: employee.level1,
        LEVEL_2: employee.level2,
        LEVEL_3: employee.level3,
        LEVEL_4: employee.level4,
        LEVEL_5: employee.level5,
        LEVEL_6: employee.level6 || '',
        IS_ADMIN: employee.isAdmin,
        TL_DATE: formatDate(tlDate),
        DATA_AS_OF: formatDate(currentDate), // Reporting date - when data was generated
        // ODM fields for calculation (not output in CSV)
        APP_RISK_LEVEL: application.riskLevel,
        APP_IS_CRITICAL_OR_HIGH_RISK: application.isCriticalOrHighRisk,
        APP_MFA_REQUIRED: application.mfaRequired
    };
}

//==================================================================================
// 📤 OUTPUT FORMATTING
//==================================================================================

function formatAsCSV(record) {
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
    };
    
    // Format boolean values as capitalized True/False for compatibility
    const formatBoolean = (value) => {
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }
        return String(value);
    };
    
    // Output 24 columns per MFA Data Dictionary (excluding ODM helper fields)
    return [
        escapeCSV(record.EMPLOYEE_EMAIL),
        escapeCSV(record.APPLICATION_NAME),
        escapeCSV(record.APPLICATION_ID),
        escapeCSV(record.SIGNIN_TIME),
        escapeCSV(record.SIGNIN_SOURCE),
        escapeCSV(formatBoolean(record.IS_MFA)),
        escapeCSV(record.UNIQUE_SIGNIN),
        escapeCSV(record.LOAD_DATE),
        escapeCSV(formatBoolean(record.COMPLIANCE_STATUS)),
        escapeCSV(record.EMPLOYEE_FULL_NAME),
        escapeCSV(record.EMPLOYEE_ID),
        escapeCSV(record.EMPLOYEE_JOB_TITLE),
        escapeCSV(record.MANAGER_FULL_NAME),
        escapeCSV(record.MANAGER_EMPLOYEE_ID),
        escapeCSV(record.MANAGER_EMAIL_ADDRESS),
        escapeCSV(record.LEVEL_1),
        escapeCSV(record.LEVEL_2),
        escapeCSV(record.LEVEL_3),
        escapeCSV(record.LEVEL_4),
        escapeCSV(record.LEVEL_5),
        escapeCSV(record.LEVEL_6),
        escapeCSV(formatBoolean(record.IS_ADMIN)),
        escapeCSV(record.TL_DATE),
        escapeCSV(record.DATA_AS_OF)
    ].join(',');
}

function formatAsTSV(record) {
    const escapeTSV = (value) => {
        if (value === null || value === undefined) return '';
        return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
    };
    
    // Format boolean values as capitalized True/False for compatibility
    const formatBoolean = (value) => {
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }
        return String(value);
    };
    
    return [
        escapeTSV(record.EMPLOYEE_EMAIL),
        escapeTSV(record.APPLICATION_NAME),
        escapeTSV(record.APPLICATION_ID),
        escapeTSV(record.SIGNIN_TIME),
        escapeTSV(record.SIGNIN_SOURCE),
        escapeTSV(formatBoolean(record.IS_MFA)),
        escapeTSV(record.UNIQUE_SIGNIN),
        escapeTSV(record.LOAD_DATE),
        escapeTSV(formatBoolean(record.COMPLIANCE_STATUS)),
        escapeTSV(record.EMPLOYEE_FULL_NAME),
        escapeTSV(record.EMPLOYEE_ID),
        escapeTSV(record.EMPLOYEE_JOB_TITLE),
        escapeTSV(record.MANAGER_FULL_NAME),
        escapeTSV(record.MANAGER_EMPLOYEE_ID),
        escapeTSV(record.MANAGER_EMAIL_ADDRESS),
        escapeTSV(record.LEVEL_1),
        escapeTSV(record.LEVEL_2),
        escapeTSV(record.LEVEL_3),
        escapeTSV(record.LEVEL_4),
        escapeTSV(record.LEVEL_5),
        escapeTSV(record.LEVEL_6),
        escapeTSV(formatBoolean(record.IS_ADMIN)),
        escapeTSV(record.TL_DATE),
        escapeTSV(record.DATA_AS_OF)
    ].join('\t');
}

function formatAsJSON(record) {
    // Output clean record without ODM helper fields
    const cleanRecord = { ...record };
    delete cleanRecord.APP_RISK_LEVEL;
    delete cleanRecord.APP_IS_CRITICAL_OR_HIGH_RISK;
    delete cleanRecord.APP_MFA_REQUIRED;
    return JSON.stringify(cleanRecord);
}

//==================================================================================
// 🎯 MAIN DATA GENERATION
//==================================================================================

console.error('🚀 Starting MFA data generation...');

const currentDate = new Date(); // Current date for the simulation
let records = [];

// Generate sign-in records
for (let i = 0; i < CONFIG.RECORD_COUNT; i++) {
    const record = generateMFARecord(i + 1, currentDate);
    records.push(record);
    
    if ((i + 1) % 10000 === 0) {
        console.error(`   Generated ${i + 1} records...`);
    }
}

console.error(`✅ Generated ${records.length} total sign-in records`);

// V3: Apply final data correction to hit exact KPI target
if (CONFIG.ENABLE_EXACT_TARGET_CORRECTION) {
    records = correctDataToTarget(records, currentDate);
}
//==================================================================================
// 🎯 FINAL DATA CORRECTION - Hit Exact Target (V3 Feature)
//==================================================================================

function correctDataToTarget(records, currentDate) {
    if (!CONFIG.ENABLE_EXACT_TARGET_CORRECTION) {
        return records;
    }

    console.error('\n🎯 Applying final data correction to hit exact target...');

    // Get current month records using string comparison to avoid timezone issues
    const targetYearMonth = currentDate.getFullYear() + "-" + String(currentDate.getMonth() + 1).padStart(2, "0");

    const currentMonthRecords = records.filter(r => {
        const tlYearMonth = r.TL_DATE.substring(0, 7); // Extract "2024-10" from "2024-10-01"
        return tlYearMonth === targetYearMonth;
    });

    if (currentMonthRecords.length === 0) {
        console.error(`   ⚠️  No current month records found for ${targetYearMonth}`);
        return records;
    }

    // Count current compliance
    const currentCompliant = currentMonthRecords.filter(r => r.COMPLIANCE_STATUS).length;
    const currentTotal = currentMonthRecords.length;
    const currentRate = currentCompliant / currentTotal;
    const targetRate = CONFIG.CURRENT_MONTH_TARGET_COMPLIANCE;
    const diff = Math.abs(currentRate - targetRate);

    console.error(`   Current: ${currentCompliant}/${currentTotal} = ${(currentRate * 100).toFixed(2)}%`);
    console.error(`   Target: ${(targetRate * 100).toFixed(2)}%`);
    console.error(`   Difference: ${(diff * 100).toFixed(2)}pp`);

    if (diff <= CONFIG.CORRECTION_TOLERANCE) {
        console.error(`   ✅ Already within tolerance (±${(CONFIG.CORRECTION_TOLERANCE * 100).toFixed(1)}%)`);
        return records;
    }

    // Calculate records to flip
    const targetCompliant = Math.round(currentTotal * targetRate);
    const needToFlip = Math.abs(currentCompliant - targetCompliant);

    console.error(`   Adjusting ${needToFlip} records to reach ${targetCompliant} compliant...`);

    // Flip records
    const recordsToFlip = [];

    if (currentCompliant < targetCompliant) {
        // Need MORE compliant
        const nonCompliant = currentMonthRecords.filter(r => !r.COMPLIANCE_STATUS);
        for (let i = 0; i < Math.min(needToFlip, nonCompliant.length); i++) {
            const idx = rng.nextInt(0, nonCompliant.length - 1);
            recordsToFlip.push(nonCompliant[idx]);
            nonCompliant.splice(idx, 1);
        }
    } else {
        // Need FEWER compliant
        const compliant = currentMonthRecords.filter(r => r.COMPLIANCE_STATUS);
        for (let i = 0; i < Math.min(needToFlip, compliant.length); i++) {
            const idx = rng.nextInt(0, compliant.length - 1);
            recordsToFlip.push(compliant[idx]);
            compliant.splice(idx, 1);
        }
    }

    // Apply flips
    recordsToFlip.forEach(record => {
        record.COMPLIANCE_STATUS = !record.COMPLIANCE_STATUS;
        if (record.APP_MFA_REQUIRED) {
            record.IS_MFA = record.COMPLIANCE_STATUS;
        }
    });

    // Verify
    const newCompliant = currentMonthRecords.filter(r => r.COMPLIANCE_STATUS).length;
    const newRate = newCompliant / currentTotal;

    console.error(`   ✅ Final: ${newCompliant}/${currentTotal} = ${(newRate * 100).toFixed(2)}%`);

    return records;
}

//==================================================================================
// 📊 GARTNER ODM CALCULATIONS
//==================================================================================

console.error('\n🔍 Calculating Gartner ODM Metrics...');

// Filter to critical and high-risk applications
const criticalHighRiskApps = applications.filter(a => a.isCriticalOrHighRisk);
const criticalHighRiskAppsWithMFA = criticalHighRiskApps.filter(a => a.mfaRequired);

// Calculate MFA coverage percentage (PRIMARY GARTNER ODM METRIC)
const mfaCoveragePercentage = criticalHighRiskApps.length > 0
    ? (criticalHighRiskAppsWithMFA.length / criticalHighRiskApps.length) * 100
    : 0;

// Calculate compliance rate (sign-ins to MFA-required apps that actually used MFA)
const mfaRequiredSignins = records.filter(r => r.APP_MFA_REQUIRED && r.APP_IS_CRITICAL_OR_HIGH_RISK);
const compliantMFASignins = mfaRequiredSignins.filter(r => r.IS_MFA);
const mfaComplianceRate = mfaRequiredSignins.length > 0
    ? (compliantMFASignins.length / mfaRequiredSignins.length) * 100
    : 0;

// Sign-in statistics
const totalSignins = records.length;
const mfaSignins = records.filter(r => r.IS_MFA).length;
const mfaUsageRate = (mfaSignins / totalSignins) * 100;

// Admin statistics
const adminSignins = records.filter(r => r.IS_ADMIN).length;
const adminMFASignins = records.filter(r => r.IS_ADMIN && r.IS_MFA).length;
const adminMFARate = adminSignins > 0 ? (adminMFASignins / adminSignins) * 100 : 0;

// Non-compliant sign-ins (should have used MFA but didn't)
const nonCompliantSignins = records.filter(r => !r.COMPLIANCE_STATUS).length;
const nonComplianceRate = (nonCompliantSignins / totalSignins) * 100;

// Current/Latest Month Statistics (for dashboard validation)
const allMonths = [...new Set(records.map(r => r.TL_DATE))].sort();
const latestMonth = allMonths[allMonths.length - 1];
const currentMonthRecords = records.filter(r => r.TL_DATE === latestMonth);
const currentMonthTotal = currentMonthRecords.length;
const currentMonthMFA = currentMonthRecords.filter(r => r.IS_MFA).length;
const currentMonthCompliant = currentMonthRecords.filter(r => r.COMPLIANCE_STATUS).length;
const currentMonthNonCompliant = currentMonthRecords.filter(r => !r.COMPLIANCE_STATUS).length;
const currentMonthComplianceRate = currentMonthTotal > 0 
    ? (currentMonthCompliant / currentMonthTotal) * 100 
    : 0;
const currentMonthMFARate = currentMonthTotal > 0 
    ? (currentMonthMFA / currentMonthTotal) * 100 
    : 0;

// Per-user MFA statistics (ensure users have variance in MFA usage)
const userMFAStats = {};
records.forEach(r => {
    if (!userMFAStats[r.EMPLOYEE_ID]) {
        userMFAStats[r.EMPLOYEE_ID] = { 
            total: 0, 
            mfa: 0, 
            noMfa: 0,
            email: r.EMPLOYEE_EMAIL,
            name: r.EMPLOYEE_FULL_NAME,
            isAdmin: r.IS_ADMIN
        };
    }
    userMFAStats[r.EMPLOYEE_ID].total++;
    if (r.IS_MFA) {
        userMFAStats[r.EMPLOYEE_ID].mfa++;
    } else {
        userMFAStats[r.EMPLOYEE_ID].noMfa++;
    }
});

// Categorize users by non-MFA sign-in count
const usersWithNoMFASignins = Object.values(userMFAStats).filter(stat => stat.noMfa > 0).length;
const usersWithMFASignins = Object.values(userMFAStats).filter(stat => stat.mfa > 0).length;
const usersWith1to2NoMFA = Object.values(userMFAStats).filter(stat => stat.noMfa >= 1 && stat.noMfa <= 2).length;
const usersWith3to5NoMFA = Object.values(userMFAStats).filter(stat => stat.noMfa >= 3 && stat.noMfa <= 5).length;
const usersWith6to10NoMFA = Object.values(userMFAStats).filter(stat => stat.noMfa >= 6 && stat.noMfa <= 10).length;
const usersWith11PlusNoMFA = Object.values(userMFAStats).filter(stat => stat.noMfa >= 11).length;

// Top offenders - users with most non-MFA sign-ins
const topNoMFAUsers = Object.entries(userMFAStats)
    .map(([id, stats]) => ({ id, ...stats }))
    .filter(user => user.noMfa > 0)
    .sort((a, b) => b.noMfa - a.noMfa)
    .slice(0, 10);

// Per-application compliance statistics
const appComplianceStats = {};
applications.forEach(app => {
    const appRecords = records.filter(r => r.APPLICATION_ID === app.appId);
    const appCompliant = appRecords.filter(r => r.COMPLIANCE_STATUS).length;
    const appTotal = appRecords.length;
    appComplianceStats[app.appId] = {
        name: app.appName,
        total: appTotal,
        compliant: appCompliant,
        nonCompliant: appTotal - appCompliant,
        complianceRate: appTotal > 0 ? (appCompliant / appTotal) * 100 : 0
    };
});
const appsWithNonCompliance = Object.values(appComplianceStats).filter(stat => stat.nonCompliant > 0).length;

//==================================================================================
// ✅ VALIDATION CHECKS
//==================================================================================

function runValidationChecks() {
    console.error('\n🔬 Running validation checks...\n');
    
    const validationResults = [];
    let allPassed = true;
    
    // Check 1: MFA Coverage on Critical/High-Risk Apps
    const expectedMFACoverage = CONFIG.BASELINE_MFA_COVERAGE * 100;
    const mfaDiff = Math.abs(mfaCoveragePercentage - expectedMFACoverage);
    const mfaPass = mfaDiff <= (VALIDATION.MFA_COVERAGE_TOLERANCE * 100);
    
    validationResults.push({
        check: 'MFA Coverage (Critical/High-Risk Apps)',
        expected: `${expectedMFACoverage.toFixed(1)}%`,
        actual: `${mfaCoveragePercentage.toFixed(1)}%`,
        tolerance: `±${(VALIDATION.MFA_COVERAGE_TOLERANCE * 100).toFixed(1)}%`,
        passed: mfaPass,
        details: `Target is BASELINE_MFA_COVERAGE (${CONFIG.BASELINE_MFA_COVERAGE})`
    });
    
    if (!mfaPass) allPassed = false;
    
    // Check 2: Admin MFA Rate
    const expectedAdminMFA = CONFIG.ADMIN_MFA_ENFORCEMENT * 100;
    const adminDiff = Math.abs(adminMFARate - expectedAdminMFA);
    const adminPass = adminDiff <= (VALIDATION.ADMIN_MFA_TOLERANCE * 100);
    
    validationResults.push({
        check: 'Admin MFA Usage Rate',
        expected: `${expectedAdminMFA.toFixed(1)}%`,
        actual: `${adminMFARate.toFixed(1)}%`,
        tolerance: `±${(VALIDATION.ADMIN_MFA_TOLERANCE * 100).toFixed(1)}%`,
        passed: adminPass,
        details: `Target is ADMIN_MFA_ENFORCEMENT (${CONFIG.ADMIN_MFA_ENFORCEMENT})`
    });
    
    if (!adminPass) allPassed = false;
    
    // Check 3: Application Risk Distribution
    const criticalCount = applications.filter(a => a.riskLevel === 'CRITICAL').length;
    const highRiskCount = applications.filter(a => a.riskLevel === 'HIGH_RISK').length;
    const mediumRiskCount = applications.filter(a => a.riskLevel === 'MEDIUM_RISK').length;
    const lowRiskCount = applications.filter(a => a.riskLevel === 'LOW_RISK').length;
    
    const criticalPct = (criticalCount / applications.length);
    const highRiskPct = (highRiskCount / applications.length);
    const mediumRiskPct = (mediumRiskCount / applications.length);
    const lowRiskPct = (lowRiskCount / applications.length);
    
    const riskDistPass = (
        Math.abs(criticalPct - CONFIG.CRITICAL_APP_PERCENTAGE) <= VALIDATION.RISK_DISTRIBUTION_TOLERANCE &&
        Math.abs(highRiskPct - CONFIG.HIGH_RISK_APP_PERCENTAGE) <= VALIDATION.RISK_DISTRIBUTION_TOLERANCE &&
        Math.abs(mediumRiskPct - CONFIG.MEDIUM_RISK_APP_PERCENTAGE) <= VALIDATION.RISK_DISTRIBUTION_TOLERANCE &&
        Math.abs(lowRiskPct - CONFIG.LOW_RISK_APP_PERCENTAGE) <= VALIDATION.RISK_DISTRIBUTION_TOLERANCE
    );
    
    validationResults.push({
        check: 'Application Risk Distribution',
        expected: `C:${(CONFIG.CRITICAL_APP_PERCENTAGE*100).toFixed(0)}% H:${(CONFIG.HIGH_RISK_APP_PERCENTAGE*100).toFixed(0)}% M:${(CONFIG.MEDIUM_RISK_APP_PERCENTAGE*100).toFixed(0)}% L:${(CONFIG.LOW_RISK_APP_PERCENTAGE*100).toFixed(0)}%`,
        actual: `C:${(criticalPct*100).toFixed(0)}% H:${(highRiskPct*100).toFixed(0)}% M:${(mediumRiskPct*100).toFixed(0)}% L:${(lowRiskPct*100).toFixed(0)}%`,
        tolerance: `±${(VALIDATION.RISK_DISTRIBUTION_TOLERANCE * 100).toFixed(1)}%`,
        passed: riskDistPass,
        details: 'Based on actual app counts in APPLICATION_CATEGORIES'
    });
    
    if (!riskDistPass) allPassed = false;
    
    // Check 4: Data Volume per Application
    const appsWithLowSignins = applications.filter(app => {
        const signinCount = records.filter(r => r.APPLICATION_ID === app.appId).length;
        return signinCount < VALIDATION.MIN_RECORDS_PER_APP;
    }).length;
    
    const dataVolumePass = appsWithLowSignins === 0;
    
    validationResults.push({
        check: 'Sign-In Data Coverage',
        expected: `≥${VALIDATION.MIN_RECORDS_PER_APP} sign-ins per app`,
        actual: `${appsWithLowSignins} apps below threshold`,
        tolerance: '0 apps',
        passed: dataVolumePass,
        details: 'All apps should have minimum statistical validity'
    });
    
    if (!dataVolumePass) allPassed = false;
    
    // Check 5: Monthly Trendline Validation
    if (CONFIG.ENABLE_TRENDLINE) {
        const monthlyData = {};
        records.forEach(r => {
            const month = r.TL_DATE.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = { total: 0, mfa: 0 };
            }
            monthlyData[month].total++;
            if (r.IS_MFA) monthlyData[month].mfa++;
        });
        
        // Check if later months show higher MFA adoption than earlier months
        const months = Object.keys(monthlyData).sort();
        if (months.length >= 2) {
            const firstMonthMFA = (monthlyData[months[0]].mfa / monthlyData[months[0]].total) * 100;
            const lastMonthMFA = (monthlyData[months[months.length - 1]].mfa / monthlyData[months[months.length - 1]].total) * 100;
            const trendlinePass = lastMonthMFA > firstMonthMFA;
            
            validationResults.push({
                check: 'MFA Adoption Trendline',
                expected: 'Increasing over time',
                actual: `${firstMonthMFA.toFixed(1)}% → ${lastMonthMFA.toFixed(1)}%`,
                tolerance: 'Positive trend',
                passed: trendlinePass,
                details: 'MFA usage should increase from early to late months'
            });
            
            if (!trendlinePass) allPassed = false;
        }
    }
    
    // Check 6: Current/Latest Month Compliance (Critical for Dashboard)
    const currentMonthPass = currentMonthComplianceRate < 100 && currentMonthNonCompliant > 0;
    
    validationResults.push({
        check: 'Current Month Non-Compliance',
        expected: '< 100% (must have non-compliant records)',
        actual: `${currentMonthComplianceRate.toFixed(1)}% (${currentMonthNonCompliant} non-compliant)`,
        tolerance: 'Must have variance',
        passed: currentMonthPass,
        details: `Latest month: ${latestMonth} - Dashboard needs realistic data`
    });
    
    if (!currentMonthPass) allPassed = false;
    
    // Check 7: Users with Non-MFA Sign-Ins
    const userMFAVariancePass = usersWithNoMFASignins > 0 && usersWith6to10NoMFA > 0;
    
    validationResults.push({
        check: 'Users with Non-MFA Sign-Ins',
        expected: '> 0 users with 6+ non-MFA sign-ins',
        actual: `${usersWithNoMFASignins} total (${usersWith6to10NoMFA} with 6-10, ${usersWith11PlusNoMFA} with 11+)`,
        tolerance: 'Must have repeat non-MFA users',
        passed: userMFAVariancePass,
        details: 'Dashboard needs users with patterns of non-MFA usage'
    });
    
    if (!userMFAVariancePass) allPassed = false;
    
    // Check 8: Applications with Non-Compliance
    const appComplianceVariancePass = appsWithNonCompliance > 0;
    
    validationResults.push({
        check: 'Apps with Non-Compliant Sign-Ins',
        expected: '> 0 apps',
        actual: `${appsWithNonCompliance} apps (${((appsWithNonCompliance/applications.length)*100).toFixed(1)}%)`,
        tolerance: 'Must have app-level variance',
        passed: appComplianceVariancePass,
        details: 'Dashboard needs to show non-compliant apps'
    });
    
    if (!appComplianceVariancePass) allPassed = false;
    
    // Print validation results
    console.error('─'.repeat(90));
    console.error('VALIDATION CHECK'.padEnd(40) + 'EXPECTED'.padEnd(15) + 'ACTUAL'.padEnd(15) + 'STATUS');
    console.error('─'.repeat(90));
    
    validationResults.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.error(
            result.check.padEnd(40) +
            result.expected.padEnd(15) +
            result.actual.padEnd(15) +
            status
        );
    });
    
    console.error('─'.repeat(90));
    console.error(`\nOverall Validation: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}\n`);
    
    return { allPassed, results: validationResults };
}

// Run validation if enabled
let validationResults = null;
if (CONFIG.ENABLE_VALIDATION) {
    validationResults = runValidationChecks();
}

//==================================================================================
// 📄 OUTPUT DATA
//==================================================================================

if (!CONFIG.SUMMARY_ONLY) {
    // Output header
    if (CONFIG.OUTPUT_FORMAT === 'csv') {
        console.log('EMPLOYEE_EMAIL,APPLICATION_NAME,APPLICATION_ID,SIGNIN_TIME,SIGNIN_SOURCE,IS_MFA,UNIQUE_SIGNIN,LOAD_DATE,COMPLIANCE_STATUS,EMPLOYEE_FULL_NAME,EMPLOYEE_ID,EMPLOYEE_JOB_TITLE,MANAGER_FULL_NAME,MANAGER_EMPLOYEE_ID,MANAGER_EMAIL_ADDRESS,LEVEL_1,LEVEL_2,LEVEL_3,LEVEL_4,LEVEL_5,LEVEL_6,IS_ADMIN,TL_DATE,DATA_AS_OF');
    } else if (CONFIG.OUTPUT_FORMAT === 'tsv') {
        console.log('EMPLOYEE_EMAIL\tAPPLICATION_NAME\tAPPLICATION_ID\tSIGNIN_TIME\tSIGNIN_SOURCE\tIS_MFA\tUNIQUE_SIGNIN\tLOAD_DATE\tCOMPLIANCE_STATUS\tEMPLOYEE_FULL_NAME\tEMPLOYEE_ID\tEMPLOYEE_JOB_TITLE\tMANAGER_FULL_NAME\tMANAGER_EMPLOYEE_ID\tMANAGER_EMAIL_ADDRESS\tLEVEL_1\tLEVEL_2\tLEVEL_3\tLEVEL_4\tLEVEL_5\tLEVEL_6\tIS_ADMIN\tTL_DATE\tDATA_AS_OF');
    }
    
    // Output records
    records.forEach(record => {
        if (CONFIG.OUTPUT_FORMAT === 'csv') {
            console.log(formatAsCSV(record));
        } else if (CONFIG.OUTPUT_FORMAT === 'tsv') {
            console.log(formatAsTSV(record));
        } else if (CONFIG.OUTPUT_FORMAT === 'json') {
            console.log(formatAsJSON(record));
        }
    });
}

//==================================================================================
// 📊 GENERATE STATISTICS SUMMARY
//==================================================================================

const statsOutput = `
${'='.repeat(80)}
🔐 MFA DATA GENERATOR - STATISTICS SUMMARY (v2.3)
${'='.repeat(80)}

📅 Generation Date: ${new Date().toISOString()}
🎲 Random Seed: ${CONFIG.RANDOM_SEED !== null ? CONFIG.RANDOM_SEED : 'Random (not seeded)'}

${'─'.repeat(80)}
📊 DATA GENERATION OVERVIEW
${'─'.repeat(80)}
Total Sign-In Records:              ${totalSignins.toLocaleString()}
Total Employees:                    ${CONFIG.EMPLOYEE_COUNT.toLocaleString()}
Total Applications:                 ${applications.length}
Date Range:                         ${CONFIG.DATE_RANGE_DAYS} days (${formatDate(new Date(currentDate.getTime() - CONFIG.DATE_RANGE_DAYS * 24 * 60 * 60 * 1000))} to ${formatDate(currentDate)})

${'─'.repeat(80)}
🏢 APPLICATION PORTFOLIO BREAKDOWN
${'─'.repeat(80)}
Critical Applications:              ${applications.filter(a => a.riskLevel === 'CRITICAL').length} (${(applications.filter(a => a.riskLevel === 'CRITICAL').length/applications.length*100).toFixed(1)}%)
High-Risk Applications:             ${applications.filter(a => a.riskLevel === 'HIGH_RISK').length} (${(applications.filter(a => a.riskLevel === 'HIGH_RISK').length/applications.length*100).toFixed(1)}%)
Medium-Risk Applications:           ${applications.filter(a => a.riskLevel === 'MEDIUM_RISK').length} (${(applications.filter(a => a.riskLevel === 'MEDIUM_RISK').length/applications.length*100).toFixed(1)}%)
Low-Risk Applications:              ${applications.filter(a => a.riskLevel === 'LOW_RISK').length} (${(applications.filter(a => a.riskLevel === 'LOW_RISK').length/applications.length*100).toFixed(1)}%)

Critical/High-Risk Total:           ${criticalHighRiskApps.length}
Critical/High-Risk with MFA:        ${criticalHighRiskAppsWithMFA.length}

${'─'.repeat(80)}
🎯 GARTNER ODM: MFA COVERAGE METRIC
${'─'.repeat(80)}
Target Question: What percentage of critical and high-risk applications 
                 are protected by multifactor authentication?

Scope Definition:
  • In-scope systems: Critical and High-Risk applications (${criticalHighRiskApps.length} apps)
  • MFA protection: Application has MFA enforcement enabled
  • Measurement period: 12-month rolling period (all generated data)

Calculation:
  In-Scope Systems:                 ${criticalHighRiskApps.length} (Critical + High-Risk apps)
  Systems with MFA Protection:      ${criticalHighRiskAppsWithMFA.length}
  
  📈 MFA COVERAGE PERCENTAGE:       ${mfaCoveragePercentage.toFixed(1)}%
  
  Formula: (${criticalHighRiskAppsWithMFA.length} ÷ ${criticalHighRiskApps.length}) × 100 = ${mfaCoveragePercentage.toFixed(1)}%

Gartner Benchmark:
  Typical Range:                    80% to 100%
  Target (CONFIG.TARGET_MFA_COVERAGE): ${CONFIG.TARGET_MFA_COVERAGE * 100}%
  Current vs Target:                ${mfaCoveragePercentage >= CONFIG.TARGET_MFA_COVERAGE * 100 ? '✅ MEETS TARGET' : '⚠️  BELOW TARGET'}
  Gap to Target:                    ${(CONFIG.TARGET_MFA_COVERAGE * 100 - mfaCoveragePercentage).toFixed(1)} percentage points

${'─'.repeat(80)}
🔐 MFA USAGE STATISTICS (Sign-In Behavior)
${'─'.repeat(80)}
Note: This measures actual MFA USAGE during sign-ins, which is different
      from the ODM metric (which measures app-level MFA enforcement)

Total Sign-Ins:                     ${totalSignins.toLocaleString()}
Sign-Ins with MFA:                  ${mfaSignins.toLocaleString()} (${mfaUsageRate.toFixed(1)}%)
Sign-Ins without MFA:               ${(totalSignins - mfaSignins).toLocaleString()} (${(100 - mfaUsageRate).toFixed(1)}%)

Sign-Ins to MFA-Required Apps:      ${mfaRequiredSignins.length.toLocaleString()}
Compliant MFA Sign-Ins:             ${compliantMFASignins.length.toLocaleString()} (${mfaComplianceRate.toFixed(1)}%)
Non-Compliant Sign-Ins:             ${nonCompliantSignins.toLocaleString()} (${nonComplianceRate.toFixed(1)}%)

${'─'.repeat(80)}
👤 ADMIN USER MFA STATISTICS
${'─'.repeat(80)}
Admin Users:                        ${employees.filter(e => e.isAdmin).length} (${CONFIG.ADMIN_USER_PERCENTAGE * 100}% of workforce)
Admin Sign-Ins:                     ${adminSignins.toLocaleString()}
Admin Sign-Ins with MFA:            ${adminMFASignins.toLocaleString()} (${adminMFARate.toFixed(1)}%)
Admin MFA Enforcement Target:       ${CONFIG.ADMIN_MFA_ENFORCEMENT * 100}%
Admin Target Status:                ${adminMFARate >= CONFIG.ADMIN_MFA_ENFORCEMENT * 100 - 5 ? '✅ MEETS TARGET' : '⚠️  BELOW TARGET'}

${'─'.repeat(80)}
📅 CURRENT/LATEST MONTH STATISTICS (TL_DATE: ${latestMonth})
${'─'.repeat(80)}
*** CRITICAL FOR DASHBOARD VALIDATION ***

Total Sign-Ins in Current Month:    ${currentMonthTotal.toLocaleString()}
Sign-Ins with MFA:                   ${currentMonthMFA.toLocaleString()} (${currentMonthMFARate.toFixed(1)}%)
Sign-Ins without MFA:                ${(currentMonthTotal - currentMonthMFA).toLocaleString()} (${(100 - currentMonthMFARate).toFixed(1)}%)

Compliant Sign-Ins:                  ${currentMonthCompliant.toLocaleString()} (${currentMonthComplianceRate.toFixed(1)}%)
Non-Compliant Sign-Ins:              ${currentMonthNonCompliant.toLocaleString()} (${(100 - currentMonthComplianceRate).toFixed(1)}%)

Dashboard Validation Status:         ${currentMonthComplianceRate < 100 ? '✅ GOOD - Shows realistic variance' : '⚠️  WARNING - 100% compliance (unrealistic)'}

User-Level Variance:
  Users with ≥1 MFA sign-in:          ${usersWithMFASignins.toLocaleString()} users
  Users with ≥1 non-MFA sign-in:      ${usersWithNoMFASignins.toLocaleString()} users (${((usersWithNoMFASignins/Object.keys(userMFAStats).length)*100).toFixed(1)}%)
  
User Non-MFA Sign-In Distribution:
  Users with 1-2 non-MFA sign-ins:    ${usersWith1to2NoMFA.toLocaleString()} users
  Users with 3-5 non-MFA sign-ins:    ${usersWith3to5NoMFA.toLocaleString()} users
  Users with 6-10 non-MFA sign-ins:   ${usersWith6to10NoMFA.toLocaleString()} users
  Users with 11+ non-MFA sign-ins:    ${usersWith11PlusNoMFA.toLocaleString()} users

Top 10 Users Not Using MFA (Most Non-MFA Sign-Ins):
${topNoMFAUsers.map((user, idx) => {
    const pct = ((user.noMfa / user.total) * 100).toFixed(1);
    return `  ${(idx + 1).toString().padStart(2)}. ${user.name.padEnd(30)} ${user.noMfa.toString().padStart(3)} non-MFA sign-ins (${pct.padStart(5)}% of ${user.total})`;
}).join('\n')}
  
App-Level Variance:
  Apps with non-compliance:           ${appsWithNonCompliance} apps (${((appsWithNonCompliance/applications.length)*100).toFixed(1)}%)

${'─'.repeat(80)}
🔍 SIGN-IN SOURCE BREAKDOWN
${'─'.repeat(80)}
${CONFIG.SIGNIN_SOURCES.map(source => {
    const count = records.filter(r => r.SIGNIN_SOURCE === source.name).length;
    const pct = (count / totalSignins * 100).toFixed(1);
    return `${source.name.padEnd(30)} ${count.toLocaleString().padStart(10)} (${pct.padStart(5)}%)`;
}).join('\n')}

${'─'.repeat(80)}
📈 TRENDLINE ANALYSIS (MFA ADOPTION OVER TIME)
${'─'.repeat(80)}
Trendline Enabled:                  ${CONFIG.ENABLE_TRENDLINE ? 'Yes' : 'No'}
${CONFIG.ENABLE_TRENDLINE ? `MFA Rollout Period:                 ${CONFIG.DATE_RANGE_DAYS} days
Peak Enforcement Month:             ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][CONFIG.MFA_ROLLOUT_PEAK_MONTH]}
Baseline MFA Coverage:              ${CONFIG.BASELINE_MFA_COVERAGE * 100}%

Monthly MFA Adoption Multipliers:
(Multipliers applied to ${CONFIG.BASELINE_MFA_COVERAGE * 100}% baseline)
${CONFIG.MONTHLY_MFA_WEIGHTS.map((weight, idx) => {
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx];
    const actualCoverage = (CONFIG.BASELINE_MFA_COVERAGE * weight * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(weight * 20));
    return `  ${month}: ${weight.toFixed(2)}x → ${actualCoverage}% coverage ${bar}`;
}).join('\n')}` : ''}

${'─'.repeat(80)}
💡 KEY INSIGHTS & RECOMMENDATIONS
${'─'.repeat(80)}
${mfaCoveragePercentage >= 90 
    ? '✅ EXCELLENT: MFA coverage exceeds 90% for critical/high-risk apps'
    : mfaCoveragePercentage >= 80
    ? '✓ GOOD: MFA coverage meets Gartner typical range (80-100%)'
    : '⚠️  ACTION REQUIRED: MFA coverage below 80% - priority remediation needed'}

${mfaComplianceRate >= 95
    ? '✅ Strong MFA compliance - users consistently using MFA on protected apps'
    : mfaComplianceRate >= 85
    ? '✓ Good compliance but room for improvement - consider user training'
    : '⚠️  Low compliance - technical enforcement or user education needed'}

${adminMFARate >= 95
    ? '✅ Admin accounts well protected with MFA'
    : '⚠️  Admin MFA usage below target - high-priority security risk'}

${nonComplianceRate < 5
    ? '✅ Low non-compliance rate - strong security posture'
    : '⚠️  Significant non-compliant sign-ins detected'}

${'─'.repeat(80)}
📁 OUTPUT DETAILS
${'─'.repeat(80)}
Output Format:                      ${CONFIG.OUTPUT_FORMAT.toUpperCase()}
Records Generated:                  ${totalSignins.toLocaleString()}
File Size (estimated):              ~${Math.round(totalSignins * 0.35 / 1024)} MB

${'='.repeat(80)}
`;

// Write statistics to stderr (visible) or to file
if (CONFIG.SUMMARY_ONLY || process.stdout.isTTY) {
    console.error(statsOutput);
} else {
    // Write to file when output is redirected
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const statsFilename = `mfa_stats_${timestamp}.txt`;
    fs.writeFileSync(statsFilename, statsOutput);
    console.error(`\n📊 Statistics saved to: ${statsFilename}`);
}

console.error('\n✅ MFA data generation complete!');
console.error(`📁 Generated ${records.length.toLocaleString()} sign-in records`);
console.error(`🔐 MFA Coverage: ${mfaCoveragePercentage.toFixed(1)}% of critical/high-risk apps protected`);

if (validationResults && !validationResults.allPassed) {
    console.error(`⚠️  Validation: Some checks failed - review output above\n`);
} else if (validationResults) {
    console.error(`✅ Validation: All checks passed\n`);}
