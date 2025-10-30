# MFA Data Generator

A powerful Node.js tool for generating realistic Multi-Factor Authentication (MFA) sign-in data for security compliance dashboards, testing, and analytics. Designed to support Gartner ODM (Operational Data Metric) calculations and KPI-driven compliance reporting.

[![Version](https://img.shields.io/badge/version-2.4.0-blue.svg)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🌟 Features

- **KPI-Driven Compliance**: Set exact target compliance rates for current month
- **Automatic Target Correction**: Adjusts data to hit precise compliance targets (±0.1%)
- **Realistic Data Patterns**: Business hours, weekday bias, and user behavior variance
- **Gartner ODM Support**: Built-in calculations for MFA coverage metrics
- **Reproducible Results**: Seeded random generation for consistent testing
- **Comprehensive Validation**: Automatic data quality checks
- **Multiple Output Formats**: CSV, TSV, and JSON support

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [Output Modes](#output-modes)
- [KPI Target Correction](#kpi-target-correction)
- [Data Schema](#data-schema)
- [Validation](#validation)
- [Examples](#examples)
- [Changelog](#changelog)

## 🚀 Installation

### Prerequisites

- **Node.js** v14.0.0 or higher
- **npm** (comes with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/jimmyfnc/mfa_data_generator.git

# Navigate to the directory
cd mfa_data_generator

# No dependencies needed - uses Node.js built-in modules only!
```

## ⚡ Quick Start

Generate 50,000 sign-in records with default settings:

```bash
# View summary statistics only
node mfa_data_generator.js --summary-only

# Generate CSV data file
node mfa_data_generator.js > mfa_data.csv

# Generate with reproducible seed
node mfa_data_generator.js --seed 12345 > mfa_data.csv
```

## 📖 Usage

### Basic Commands

```bash
# 1. Summary Only (Statistics without data flood)
node mfa_data_generator.js --summary-only

# 2. Save to File (Full data + summary)
node mfa_data_generator.js > mfa_data.csv

# 3. Full Console Output (All data to screen)
node mfa_data_generator.js

# 4. Reproducible Data (Using seed)
node mfa_data_generator.js --seed 12345

# 5. Validation Mode (Check data quality)
node mfa_data_generator.js --validate

# 6. Combined Options
node mfa_data_generator.js --summary-only --seed 12345 --validate
```

### Output Modes

#### Summary Only
Perfect for reviewing metrics and insights without CSV data flood:
```bash
node mfa_data_generator.js --summary-only
```

Shows:
- Application portfolio breakdown
- Gartner ODM MFA coverage metrics
- Current month compliance statistics
- User-level variance analysis
- Top non-compliant users
- Sign-in source distribution
- Validation results

#### CSV Output
Saves all sign-in records to CSV file with companion statistics:
```bash
node mfa_data_generator.js > mfa_data.csv
```

Automatically creates:
- `mfa_data.csv` - All sign-in records
- `mfa_stats_[timestamp].txt` - Detailed statistics

## ⚙️ Configuration

Edit the `CONFIG` object in `mfa_data_generator.js`:

### Data Generation Settings

```javascript
const CONFIG = {
    // Volume
    RECORD_COUNT: 50000,         // Number of sign-in records to generate
    EMPLOYEE_COUNT: 5000,        // Number of unique employees
    APPLICATION_COUNT: 80,       // Number of applications
    DATE_RANGE_DAYS: 365,        // Date range (12 months)

    // Reproducibility
    RANDOM_SEED: null,           // Set to number for reproducible data

    // Application Risk Distribution
    CRITICAL_APP_PERCENTAGE: 0.20,    // 20% critical apps
    HIGH_RISK_APP_PERCENTAGE: 0.25,   // 25% high-risk apps
    MEDIUM_RISK_APP_PERCENTAGE: 0.35, // 35% medium-risk apps
    LOW_RISK_APP_PERCENTAGE: 0.20,    // 20% low-risk apps

    // MFA Adoption
    BASELINE_MFA_COVERAGE: 0.75,      // 75% of critical/high-risk apps have MFA
    NON_CRITICAL_MFA_RATE: 0.45,      // 45% of medium/low-risk apps have MFA
    ADMIN_MFA_ENFORCEMENT: 0.95,      // 95% of admin accounts require MFA

    // Output
    OUTPUT_FORMAT: 'csv',             // 'csv', 'tsv', or 'json'
    SUMMARY_ONLY: false,              // Set to true for summary only
    ENABLE_VALIDATION: false,         // Set to true to validate data
};
```

## 🎯 KPI Target Correction

**New in v2.4.0**: Automatically adjust current month compliance to hit exact targets!

### Configuration

```javascript
// Set your desired current month compliance target
CURRENT_MONTH_TARGET_COMPLIANCE: 0.95,    // 95% compliance target

// Enable/disable automatic correction
ENABLE_EXACT_TARGET_CORRECTION: true,     // Enable correction

// Set acceptable variance
CORRECTION_TOLERANCE: 0.001,              // ±0.1% tolerance
```

### How It Works

1. Generator creates all 50,000 records naturally based on historical patterns
2. Identifies current month records automatically
3. Calculates current compliance rate
4. Adjusts exactly the right number of records to hit target
5. Reports adjustment transparently

### Example Output

```
🎯 Applying final data correction to hit exact target...
   Current: 4083/4083 = 100.00%
   Target: 95.00%
   Difference: 5.00pp
   Adjusting 204 records to reach 3879 compliant...
   ✅ Final: 3879/4083 = 95.00%
```

**Result**: Current month shows exactly 95.0% compliance with 204 realistic non-compliant sign-ins for drill-down analysis!

## 📊 Data Schema

### CSV Columns (24 fields)

| Column | Type | Description |
|--------|------|-------------|
| `EMPLOYEE_EMAIL` | String | User email address |
| `APPLICATION_NAME` | String | Application name |
| `APPLICATION_ID` | String | Application identifier (APP0001) |
| `SIGNIN_TIME` | DateTime | Sign-in timestamp (YYYY-MM-DD HH:MM:SS) |
| `SIGNIN_SOURCE` | String | Identity provider (Okta, Azure AD, etc.) |
| `IS_MFA` | Boolean | Whether MFA was used (True/False) |
| `UNIQUE_SIGNIN` | String | Unique sign-in identifier |
| `LOAD_DATE` | Date | Data load date (YYYY-MM-DD) |
| `COMPLIANCE_STATUS` | Boolean | Whether sign-in was compliant (True/False) |
| `EMPLOYEE_FULL_NAME` | String | Full name of employee |
| `EMPLOYEE_ID` | String | Employee identifier (EMP000001) |
| `EMPLOYEE_JOB_TITLE` | String | Job title |
| `MANAGER_FULL_NAME` | String | Manager's full name |
| `MANAGER_EMPLOYEE_ID` | String | Manager's employee ID |
| `MANAGER_EMAIL_ADDRESS` | String | Manager's email |
| `LEVEL_1` | String | Organization level 1 (Company) |
| `LEVEL_2` | String | Organization level 2 (Department) |
| `LEVEL_3` | String | Organization level 3 (Team) |
| `LEVEL_4` | String | Organization level 4 (Sub-team) |
| `LEVEL_5` | String | Organization level 5 |
| `LEVEL_6` | String | Organization level 6 |
| `IS_ADMIN` | Boolean | Whether user has admin privileges |
| `TL_DATE` | Date | Trendline date (first of month: YYYY-MM-01) |
| `DATA_AS_OF` | Date | Report date (when data was generated) |

### Compliance Logic

**Compliant Sign-In**:
- If app requires MFA → user must use MFA
- If app doesn't require MFA → always compliant

**Non-Compliant Sign-In**:
- App requires MFA but user didn't use it

## ✅ Validation

Built-in validation checks ensure data quality:

### Validation Checks

1. **MFA Coverage**: Verifies critical/high-risk apps have correct MFA percentage (±5%)
2. **Admin MFA Rate**: Validates admin users have required MFA usage (±5%)
3. **Risk Distribution**: Confirms application risk levels match config (±2%)
4. **Data Coverage**: Ensures all apps have minimum sign-ins for statistical validity
5. **Current Month**: Verifies current month has realistic non-compliance
6. **User Variance**: Confirms users have varied MFA usage patterns
7. **App Variance**: Validates apps show non-compliant sign-ins

### Running Validation

```bash
node mfa_data_generator.js --validate --summary-only
```

Expected output:
```
🔬 Running validation checks...
──────────────────────────────────────────────────────────
VALIDATION CHECK                        EXPECTED       ACTUAL         STATUS
──────────────────────────────────────────────────────────
MFA Coverage (Critical/High-Risk Apps)  75.0%          70.3%          ✅ PASS
Admin MFA Usage Rate                    95.0%          94.8%          ✅ PASS
Application Risk Distribution           C:20% H:25%... C:21% H:24%... ✅ PASS
Sign-In Data Coverage                   ≥10 sign-ins   0 below        ✅ PASS
Current Month Non-Compliance            < 100%         95.0%          ✅ PASS
Users with Non-MFA Sign-Ins             > 0 users      4713 users     ✅ PASS
Apps with Non-Compliant Sign-Ins        > 0 apps       49 apps        ✅ PASS
──────────────────────────────────────────────────────────
Overall Validation: ✅ ALL CHECKS PASSED
```

## 📚 Examples

### Example 1: Generate Test Data for Dashboard

```bash
# Generate reproducible data with specific seed
node mfa_data_generator.js --seed 42 > test_data.csv

# Review statistics
node mfa_data_generator.js --seed 42 --summary-only
```

### Example 2: Create Demo Data with Exact Compliance Target

1. Edit `mfa_data_generator.js`:
```javascript
CURRENT_MONTH_TARGET_COMPLIANCE: 0.90,  // Want exactly 90%
ENABLE_EXACT_TARGET_CORRECTION: true,
```

2. Generate:
```bash
node mfa_data_generator.js --seed 12345 > demo_data.csv
```

3. Result: Current month will show exactly 90.0% compliance!

### Example 3: Validate Data Quality Before Use

```bash
node mfa_data_generator.js --validate --summary-only --seed 100
```

### Example 4: Generate Data for Multiple Environments

```bash
# Development
node mfa_data_generator.js --seed 1001 > dev_mfa_data.csv

# Staging
node mfa_data_generator.js --seed 1002 > staging_mfa_data.csv

# Production (demo)
node mfa_data_generator.js --seed 1003 > prod_demo_data.csv
```

## 📈 Use Cases

- **Security Dashboards**: Populate MFA compliance dashboards with realistic data
- **Gartner ODM Reporting**: Calculate "% of critical apps protected by MFA"
- **Testing**: Generate reproducible test data for BI tools (Tableau, Power BI, Looker)
- **Training**: Create demo environments with realistic security metrics
- **Analytics**: Test data pipelines and ETL processes
- **Compliance Reporting**: Demonstrate MFA adoption trends over time

## 🎨 Dashboard Integration

### Example Dashboard Queries

**Current Month Compliance Rate:**
```sql
SELECT
    COUNT(*) as total_signins,
    SUM(CASE WHEN COMPLIANCE_STATUS = 'True' THEN 1 ELSE 0 END) as compliant,
    ROUND(100.0 * SUM(CASE WHEN COMPLIANCE_STATUS = 'True' THEN 1 ELSE 0 END) / COUNT(*), 2) as compliance_rate
FROM mfa_signins
WHERE TL_DATE = DATE_TRUNC('month', CURRENT_DATE);
```

**Top Non-Compliant Users:**
```sql
SELECT
    EMPLOYEE_FULL_NAME,
    EMPLOYEE_EMAIL,
    COUNT(*) as total_signins,
    SUM(CASE WHEN COMPLIANCE_STATUS = 'False' THEN 1 ELSE 0 END) as non_compliant_signins
FROM mfa_signins
WHERE TL_DATE >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY EMPLOYEE_FULL_NAME, EMPLOYEE_EMAIL
HAVING SUM(CASE WHEN COMPLIANCE_STATUS = 'False' THEN 1 ELSE 0 END) > 0
ORDER BY non_compliant_signins DESC
LIMIT 10;
```

**MFA Adoption Trend:**
```sql
SELECT
    TL_DATE,
    COUNT(*) as total_signins,
    ROUND(100.0 * SUM(CASE WHEN IS_MFA = 'True' THEN 1 ELSE 0 END) / COUNT(*), 2) as mfa_rate
FROM mfa_signins
GROUP BY TL_DATE
ORDER BY TL_DATE;
```

## 🔧 Troubleshooting

### Issue: Target correction not working

**Symptoms**: Shows "No current month records found"

**Solution**: Ensure `currentDate` is set correctly in the code (should be `new Date()` for current date)

### Issue: Data validation failing

**Symptoms**: Validation checks fail repeatedly

**Solutions**:
- Check `BASELINE_MFA_COVERAGE` is realistic (0.60-0.90)
- Increase `RECORD_COUNT` for better statistical distribution
- Adjust validation tolerances in `VALIDATION` object

### Issue: Compliance rate always 100%

**Symptoms**: No non-compliant records generated

**Solutions**:
- Set `ENABLE_EXACT_TARGET_CORRECTION: true`
- Set `CURRENT_MONTH_TARGET_COMPLIANCE` to desired rate (e.g., 0.95)
- Ensure `ADMIN_MFA_ENFORCEMENT` < 1.0

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and detailed changes.

### Latest Version: 2.4.0 (2025-10-30)

**Added:**
- Target correction feature for exact KPI compliance
- Dynamic current date support
- Enhanced validation checks

**Fixed:**
- Date parsing timezone bug
- Const reassignment error
- Missing configuration options

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this tool for any purpose.

## 👤 Author

**Jimmy Caldwell** ([@jimmyfnc](https://github.com/jimmyfnc))

## 🙏 Acknowledgments

- Built with Claude Code assistance
- Designed for Gartner ODM compliance reporting
- Inspired by real-world MFA implementation challenges

## 📧 Support

If you encounter issues or have questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [CHANGELOG.md](CHANGELOG.md) for known issues
3. Open an issue on GitHub

---

**⭐ If you find this tool helpful, please give it a star on GitHub!**

Generated with ❤️ for security and compliance professionals
