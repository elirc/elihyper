# Plasmic State Management Changes

## 1. Global State Setup in Plasmic

- Create a new Global State called `projectData`
- Add the following state variables:
  ```typescript
  {
    scope: string
    timeline: string
    teamSize: string
    infrastructure: string
    timelineAutoGenerate: boolean
    recommendedTeamCheckbox: boolean
  }
  ```

## 2. Component State Bindings

1. **Step Variant**

   - Keep as is, managed by Plasmic's variant system
   - Remove duplicate state from ProjectEstimator.tsx

2. **Form Inputs**

   - Bind `scopeOfWork` input to `projectData.scope`
   - Bind `timeline` input to `projectData.timeline`
   - Bind team selection to `projectData.teamSize`
   - Bind infrastructure selection to `projectData.infrastructure`

3. **Navigation Buttons**
   - Configure "Next" button actions in Plasmic:
     ```
     If step === "scope":
       Set step = "timeline"
     If step === "timeline":
       Set step = "team"
     // etc.
     ```
   - Configure "Back" button similarly

## 3. API Integration

In Plasmic Studio:

1. Add an action called "submitProject"
2. Configure API call in the action
3. Bind to infrastructure step's "Next" button

## 4. Modified ProjectEstimator.tsx

```typescript
import * as React from "react";
import {
  PlasmicProjectEstimator,
  DefaultProjectEstimatorProps
} from "./plasmic/hypernova_inc/PlasmicProjectEstimator";
import { HTMLElementRefOf } from "@plasmicapp/react-web";
import { client } from "../src/utils/api-client";
import { createProject } from "../src/graphql/mutations";

function ProjectEstimator_(
  props: DefaultProjectEstimatorProps,
  ref: HTMLElementRefOf<"div">
) {
  // API submission handler
  const handleProjectSubmit = async (projectData: any) => {
    try {
      const result = await client.graphql({
        query: createProject,
        variables: { input: projectData }
      });
      return result.data.createProject.id;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  };

  return (
    <PlasmicProjectEstimator
      root={{ ref }}
      {...props}
      onProjectSubmit={handleProjectSubmit}
    />
  );
}

const ProjectEstimator = React.forwardRef(ProjectEstimator_);
export default ProjectEstimator;
```

## Migration Steps

1. Make Plasmic changes first
2. Update ProjectEstimator.tsx to use new structure
3. Test state flow and API integration
4. Remove old state management code

## Benefits

- Single source of truth for state
- Proper state transitions managed by Plasmic
- Cleaner, more maintainable code
- No state synchronization issues
