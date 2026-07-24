# Plasmic State Setup - Step by Step

## Individual State Variables

1. **Scope State**

   - In Plasmic Studio, go to the ProjectEstimator component
   - Create a new text state variable called `scope`
   - Bind it to the scopeOfWork textarea component
   - Type: Text
   - Initial value: Empty string

2. **Timeline State**

   - Create a new text state variable called `timeline`
   - Bind it to the timeline textarea component
   - Type: Text
   - Initial value: Empty string

3. **Team Selection State**

   - Create a new choice state variable called `selectedTeam`
   - Type: Choice (Single select)
   - Options:
     - "1Developer"
     - "2Developers"
     - "2Developers1Designer"
     - "4Developers1Designer"
   - Bind to the team selection cards

4. **Infrastructure State**

   - Create a new choice state variable called `infrastructure`
   - Type: Choice (Single select)
   - Options:
     - "staticVm"
     - "awsEphemeral"
     - "kubernetes"
   - Bind to the infrastructure selection cards

5. **Checkbox States**
   - Create boolean state variables for:
     - `timelineAutoGenerate`
     - `recommendedTeamCheckbox`
   - Type: Boolean
   - Initial value: false
   - Bind to respective checkboxes

## State Transitions

1. **Next Button Actions**

   ```
   When clicked:
   if current step is "scope":
     - Save scope value
     - Change step variant to "timeline"
   if current step is "timeline":
     - Save timeline value
     - Change step variant to "team"
   // etc.
   ```

2. **Back Button Actions**
   ```
   When clicked:
   if current step is "timeline":
     - Change step variant to "scope"
   if current step is "team":
     - Change step variant to "timeline"
   // etc.
   ```

## Step Variant

- Keep the existing step variant
- It controls which form section is visible
- Options: "start", "scope", "timeline", "team", "infrastructure", "loading", "summary"

## Benefits

- Each state variable is independently managed
- Clear data flow
- Easier to debug
- No state synchronization issues
