# Tableau ODM Metric Calculation Guide

## 🎯 Gartner ODM Metric

**Question**: "What percentage of critical and high-risk applications are protected by multifactor authentication?"

## 📊 CSV Fields Required

The MFA Data Generator now outputs **26 columns** including these ODM-specific fields:

| Field | Values | Description |
|-------|--------|-------------|
| `APPLICATION_NAME` | String | Name of the application |
| `APPLICATION_ID` | String | Unique app identifier (APP0001) |
| `APP_RISK_LEVEL` | String | CRITICAL, HIGH_RISK, MEDIUM_RISK, or LOW_RISK |
| `APP_MFA_REQUIRED` | Boolean | True/False - Does this app require MFA? |

## 📐 Tableau Calculated Fields

### Step 1: Create "Is Critical or High Risk" Filter

This identifies which apps are in scope for the ODM metric.

**Calculated Field Name**: `Is Critical or High Risk`

**Formula**:
```tableau
[APP_RISK_LEVEL] = "CRITICAL" OR [APP_RISK_LEVEL] = "HIGH_RISK"
```

**Type**: Boolean
**Usage**: Filter or dimension

---

### Step 2: Calculate ODM Percentage

This is your main ODM metric.

**Calculated Field Name**: `ODM: % Critical/High-Risk Apps with MFA`

**Formula**:
```tableau
SUM(
    IF [Is Critical or High Risk] AND [APP_MFA_REQUIRED] = "True"
    THEN 1
    ELSE 0
    END
)
/
SUM(
    IF [Is Critical or High Risk]
    THEN 1
    ELSE 0
    END
)
```

**Type**: Percentage
**Aggregation**: Computed at Application level
**Format**: Percentage with 1 decimal place (e.g., 75.0%)

---

### Alternative: Simpler LOD Approach

Use Level of Detail (LOD) expressions for more accurate app-level calculations:

**Calculated Field Name**: `ODM: MFA Coverage (LOD)`

**Formula**:
```tableau
{ FIXED [APPLICATION_ID] :
    MAX(
        IF [APP_RISK_LEVEL] = "CRITICAL" OR [APP_RISK_LEVEL] = "HIGH_RISK"
        THEN
            CASE [APP_MFA_REQUIRED]
                WHEN "True" THEN 1
                ELSE 0
            END
        ELSE NULL
        END
    )
}
```

Then create the percentage:

**Calculated Field Name**: `ODM: MFA Coverage %`

**Formula**:
```tableau
SUM([ODM: MFA Coverage (LOD)]) / COUNTD(IF [Is Critical or High Risk] THEN [APPLICATION_ID] END)
```

---

## 📊 Tableau Dashboard Setup

### Method 1: Simple Percentage Display

1. Drag `ODM: % Critical/High-Risk Apps with MFA` to **Text**
2. Format as Percentage
3. Add to **KPI Card** or **Big Number** visualization

### Method 2: Detailed Breakdown Table

Create a table showing all critical/high-risk apps:

**Columns**:
- `APPLICATION_NAME`
- `APP_RISK_LEVEL`
- `APP_MFA_REQUIRED`
- Count of Sign-Ins

**Filters**:
- `Is Critical or High Risk` = True

**Example Output**:
| Application | Risk Level | MFA Required | Sign-Ins |
|-------------|------------|--------------|----------|
| Core Banking System | CRITICAL | True | 234 |
| Payment Gateway | CRITICAL | True | 189 |
| Trading Platform | CRITICAL | False | 156 |
| ... | ... | ... | ... |

### Method 3: ODM Trend Over Time

Show how MFA coverage improves month-over-month:

1. **Rows**: `ODM: MFA Coverage %`
2. **Columns**: `TL_DATE` (Month)
3. **Visualization**: Line Chart
4. **Target Line**: Add reference line at 90% (Gartner target)

---

## 🔢 Example Calculations

### Sample Data Scenario

From your generated data:
- **Total Applications**: 82
- **Critical Apps**: 17
- **High-Risk Apps**: 20
- **Critical/High-Risk Total**: 37
- **Critical/High-Risk with MFA**: 26

**ODM Calculation**:
```
26 apps with MFA ÷ 37 total critical/high-risk apps = 70.3%
```

---

## 📋 Pre-Built Tableau Worksheets

### Worksheet 1: ODM KPI Card

**Title**: "MFA Coverage - Critical & High-Risk Apps"

**Metrics**:
- **Main Number**: `ODM: % Critical/High-Risk Apps with MFA`
- **Subtitle**: "{count of apps with MFA} of {total critical/high-risk apps} protected"

**Formula for subtitle**:
```tableau
STR(
    SUM(IF [Is Critical or High Risk] AND [APP_MFA_REQUIRED] = "True" THEN 1 ELSE 0 END)
)
+ " of " +
STR(
    SUM(IF [Is Critical or High Risk] THEN 1 ELSE 0 END)
)
+ " protected"
```

### Worksheet 2: Apps Missing MFA

Show which critical/high-risk apps DON'T have MFA:

**Filters**:
- `APP_RISK_LEVEL`: CRITICAL or HIGH_RISK
- `APP_MFA_REQUIRED`: False

**Columns**:
- `APPLICATION_NAME`
- `APP_RISK_LEVEL`
- Count of `UNIQUE_SIGNIN` (number of sign-ins)
- Count Distinct of `EMPLOYEE_EMAIL` (users impacted)

---

## ✅ Validation

### Verify Your Calculation

1. **Total Critical/High-Risk Apps**:
```tableau
COUNTD(IF [Is Critical or High Risk] THEN [APPLICATION_ID] END)
```
Expected: ~37 apps (20% + 25% of 82 total apps)

2. **Apps with MFA**:
```tableau
COUNTD(IF [Is Critical or High Risk] AND [APP_MFA_REQUIRED] = "True" THEN [APPLICATION_ID] END)
```
Expected: ~26 apps (75% baseline coverage)

3. **ODM Percentage**:
```tableau
26 ÷ 37 = 70.3%
```

---

## 🎨 Dashboard Design Tips

### Color Coding

Use conditional formatting based on ODM percentage:

- **Green** (✅): ≥ 90% (meets Gartner target)
- **Yellow** (⚠️): 80-89% (good, but below target)
- **Red** (❌): < 80% (action required)

**Tableau Color Formula**:
```tableau
IF [ODM: % Critical/High-Risk Apps with MFA] >= 0.90 THEN "Green"
ELSEIF [ODM: % Critical/High-Risk Apps with MFA] >= 0.80 THEN "Yellow"
ELSE "Red"
END
```

### Target Line

Add a **Reference Line** at 90%:
1. Right-click Y-axis
2. Add Reference Line
3. Value: Constant 0.90
4. Label: "Gartner Target (90%)"
5. Line color: Gray dashed

---

## 🚀 Advanced Calculations

### ODM by Organization Level

See which departments have best MFA coverage:

**Rows**: `LEVEL_2` (Department)
**Columns**: `ODM: % Critical/High-Risk Apps with MFA`
**Filter**: `Is Critical or High Risk` = True

### ODM Compliance Gap

Calculate how many apps need MFA to hit target:

**Calculated Field Name**: `Apps Needed for 90% Target`

**Formula**:
```tableau
CEILING(
    (0.90 * SUM(IF [Is Critical or High Risk] THEN 1 END))
    - SUM(IF [Is Critical or High Risk] AND [APP_MFA_REQUIRED] = "True" THEN 1 END)
)
```

---

## 📊 Sample Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  🎯 MFA ODM Metric Dashboard                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  70.3%       │  │  26 of 37    │  │  11 Apps  │ │
│  │  MFA Coverage│  │  Protected   │  │  At Risk  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │         MFA Coverage Trend (Monthly)             ││
│  │  100%                                            ││
│  │   90% ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ Target                    ││
│  │   80%                                            ││
│  │   70%  ●──●──●──●──●──●                         ││
│  │   60%                                            ││
│  │        Jan Feb Mar Apr May Jun                   ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │  Critical/High-Risk Apps Missing MFA            ││
│  ├────────────────────┬───────────┬────────────────┤│
│  │ Application        │ Risk      │ Sign-Ins       ││
│  ├────────────────────┼───────────┼────────────────┤│
│  │ Trading Platform   │ CRITICAL  │ 156            ││
│  │ Cloud Console-AWS  │ HIGH_RISK │ 234            ││
│  │ Production DB      │ CRITICAL  │ 189            ││
│  └────────────────────┴───────────┴────────────────┘│
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Summary

**Fields You Need**:
- `APP_RISK_LEVEL` - Identifies critical/high-risk apps
- `APP_MFA_REQUIRED` - Shows which apps have MFA enabled
- `APPLICATION_ID` - For unique app counting

**Main Calculated Field**:
```tableau
SUM(IF [Is Critical or High Risk] AND [APP_MFA_REQUIRED] = "True" THEN 1 ELSE 0 END)
/
SUM(IF [Is Critical or High Risk] THEN 1 ELSE 0 END)
```

**Result**: The percentage of your critical and high-risk applications that are protected by MFA.

---

## 🆘 Troubleshooting

### Issue: Getting 100% when it should be 70%

**Cause**: Calculating at sign-in level instead of application level

**Fix**: Use COUNTD([APPLICATION_ID]) or LOD expressions to calculate at app level

### Issue: Numbers don't match generator summary

**Cause**: Including all apps instead of just critical/high-risk

**Fix**: Ensure filter `[Is Critical or High Risk] = True` is applied

### Issue: App shows both True and False for MFA_REQUIRED

**Cause**: App assignment changed during data generation (shouldn't happen)

**Fix**: Use `MAX([APP_MFA_REQUIRED])` or `{FIXED [APPLICATION_ID]: MAX([APP_MFA_REQUIRED])}`

---

**Need Help?** Check the generator's summary output (--summary-only) to verify expected values.

**Generated with**: MFA Data Generator v2.5.0
