/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateProjectInput = {
  id?: string | null
  scope?: string | null
  timeline?: string | null
  teamSize?: string | null
  infrastructure?: string | null
  cost?: string | null
  estimatedCost?: string | null
  estimatedTimeline?: string | null
  summary?: string | null
  AI_timeline?: string | null
  AI_scope?: string | null
  AI_teamSize?: string | null
  AI_infrastructure?: string | null
  AI_cost?: string | null
  AI_estimatedCost?: string | null
  AI_estimatedTimeline?: string | null
  AI_summary?: string | null
  AI_improvedScope?: string | null
  AI_costAnalysis?: string | null
  AI_timelineValidation?: string | null
  AI_infrastructureRecommendations?: string | null
  AI_riskAssessment?: string | null
}

export type ModelProjectConditionInput = {
  scope?: ModelStringInput | null
  timeline?: ModelStringInput | null
  teamSize?: ModelStringInput | null
  infrastructure?: ModelStringInput | null
  cost?: ModelStringInput | null
  estimatedCost?: ModelStringInput | null
  estimatedTimeline?: ModelStringInput | null
  summary?: ModelStringInput | null
  AI_timeline?: ModelStringInput | null
  AI_scope?: ModelStringInput | null
  AI_teamSize?: ModelStringInput | null
  AI_infrastructure?: ModelStringInput | null
  AI_cost?: ModelStringInput | null
  AI_estimatedCost?: ModelStringInput | null
  AI_estimatedTimeline?: ModelStringInput | null
  AI_summary?: ModelStringInput | null
  AI_improvedScope?: ModelStringInput | null
  AI_costAnalysis?: ModelStringInput | null
  AI_timelineValidation?: ModelStringInput | null
  AI_infrastructureRecommendations?: ModelStringInput | null
  AI_riskAssessment?: ModelStringInput | null
  and?: Array<ModelProjectConditionInput | null> | null
  or?: Array<ModelProjectConditionInput | null> | null
  not?: ModelProjectConditionInput | null
  createdAt?: ModelStringInput | null
  updatedAt?: ModelStringInput | null
}

export type ModelStringInput = {
  ne?: string | null
  eq?: string | null
  le?: string | null
  lt?: string | null
  ge?: string | null
  gt?: string | null
  contains?: string | null
  notContains?: string | null
  between?: Array<string | null> | null
  beginsWith?: string | null
  attributeExists?: boolean | null
  attributeType?: ModelAttributeTypes | null
  size?: ModelSizeInput | null
}

export enum ModelAttributeTypes {
  binary = 'binary',
  binarySet = 'binarySet',
  bool = 'bool',
  list = 'list',
  map = 'map',
  number = 'number',
  numberSet = 'numberSet',
  string = 'string',
  stringSet = 'stringSet',
  _null = '_null',
}

export type ModelSizeInput = {
  ne?: number | null
  eq?: number | null
  le?: number | null
  lt?: number | null
  ge?: number | null
  gt?: number | null
  between?: Array<number | null> | null
}

export type Project = {
  __typename: 'Project'
  id: string
  scope?: string | null
  timeline?: string | null
  teamSize?: string | null
  infrastructure?: string | null
  cost?: string | null
  estimatedCost?: string | null
  estimatedTimeline?: string | null
  summary?: string | null
  AI_timeline?: string | null
  AI_scope?: string | null
  AI_teamSize?: string | null
  AI_infrastructure?: string | null
  AI_cost?: string | null
  AI_estimatedCost?: string | null
  AI_estimatedTimeline?: string | null
  AI_summary?: string | null
  AI_improvedScope?: string | null
  AI_costAnalysis?: string | null
  AI_timelineValidation?: string | null
  AI_infrastructureRecommendations?: string | null
  AI_riskAssessment?: string | null
  createdAt: string
  updatedAt: string
}

export type UpdateProjectInput = {
  id: string
  scope?: string | null
  timeline?: string | null
  teamSize?: string | null
  infrastructure?: string | null
  cost?: string | null
  estimatedCost?: string | null
  estimatedTimeline?: string | null
  summary?: string | null
  AI_timeline?: string | null
  AI_scope?: string | null
  AI_teamSize?: string | null
  AI_infrastructure?: string | null
  AI_cost?: string | null
  AI_estimatedCost?: string | null
  AI_estimatedTimeline?: string | null
  AI_summary?: string | null
  AI_improvedScope?: string | null
  AI_costAnalysis?: string | null
  AI_timelineValidation?: string | null
  AI_infrastructureRecommendations?: string | null
  AI_riskAssessment?: string | null
}

export type DeleteProjectInput = {
  id: string
}

export type CreateLeadInput = {
  email: string
  id?: string | null
  firstName: string
  lastName: string
  phoneNumber: string
  description?: string | null
  environment?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type ModelLeadConditionInput = {
  firstName?: ModelStringInput | null
  lastName?: ModelStringInput | null
  phoneNumber?: ModelStringInput | null
  description?: ModelStringInput | null
  environment?: ModelStringInput | null
  createdAt?: ModelStringInput | null
  updatedAt?: ModelStringInput | null
  and?: Array<ModelLeadConditionInput | null> | null
  or?: Array<ModelLeadConditionInput | null> | null
  not?: ModelLeadConditionInput | null
}

export type Lead = {
  __typename: 'Lead'
  email: string
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  description?: string | null
  environment?: string | null
  createdAt: string
  updatedAt: string
}

export type UpdateLeadInput = {
  email: string
  id?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  description?: string | null
  environment?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type DeleteLeadInput = {
  email: string
}

export type CreateLeadReceiverInput = {
  email: string
  name?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type ModelLeadReceiverConditionInput = {
  name?: ModelStringInput | null
  createdAt?: ModelStringInput | null
  updatedAt?: ModelStringInput | null
  and?: Array<ModelLeadReceiverConditionInput | null> | null
  or?: Array<ModelLeadReceiverConditionInput | null> | null
  not?: ModelLeadReceiverConditionInput | null
}

export type LeadReceiver = {
  __typename: 'LeadReceiver'
  email: string
  name?: string | null
  createdAt: string
  updatedAt: string
}

export type UpdateLeadReceiverInput = {
  email: string
  name?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type DeleteLeadReceiverInput = {
  email: string
}

export type ModelProjectFilterInput = {
  id?: ModelIDInput | null
  scope?: ModelStringInput | null
  timeline?: ModelStringInput | null
  teamSize?: ModelStringInput | null
  infrastructure?: ModelStringInput | null
  cost?: ModelStringInput | null
  estimatedCost?: ModelStringInput | null
  estimatedTimeline?: ModelStringInput | null
  summary?: ModelStringInput | null
  AI_timeline?: ModelStringInput | null
  AI_scope?: ModelStringInput | null
  AI_teamSize?: ModelStringInput | null
  AI_infrastructure?: ModelStringInput | null
  AI_cost?: ModelStringInput | null
  AI_estimatedCost?: ModelStringInput | null
  AI_estimatedTimeline?: ModelStringInput | null
  AI_summary?: ModelStringInput | null
  AI_improvedScope?: ModelStringInput | null
  AI_costAnalysis?: ModelStringInput | null
  AI_timelineValidation?: ModelStringInput | null
  AI_infrastructureRecommendations?: ModelStringInput | null
  AI_riskAssessment?: ModelStringInput | null
  createdAt?: ModelStringInput | null
  updatedAt?: ModelStringInput | null
  and?: Array<ModelProjectFilterInput | null> | null
  or?: Array<ModelProjectFilterInput | null> | null
  not?: ModelProjectFilterInput | null
}

export type ModelIDInput = {
  ne?: string | null
  eq?: string | null
  le?: string | null
  lt?: string | null
  ge?: string | null
  gt?: string | null
  contains?: string | null
  notContains?: string | null
  between?: Array<string | null> | null
  beginsWith?: string | null
  attributeExists?: boolean | null
  attributeType?: ModelAttributeTypes | null
  size?: ModelSizeInput | null
}

export type ModelProjectConnection = {
  __typename: 'ModelProjectConnection'
  items: Array<Project | null>
  nextToken?: string | null
}

export type ModelLeadFilterInput = {
  email?: ModelStringInput | null
  id?: ModelIDInput | null
  firstName?: ModelStringInput | null
  lastName?: ModelStringInput | null
  phoneNumber?: ModelStringInput | null
  description?: ModelStringInput | null
  createdAt?: ModelStringInput | null
  updatedAt?: ModelStringInput | null
  and?: Array<ModelLeadFilterInput | null> | null
  or?: Array<ModelLeadFilterInput | null> | null
  not?: ModelLeadFilterInput | null
}

export enum ModelSortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type ModelLeadConnection = {
  __typename: 'ModelLeadConnection'
  items: Array<Lead | null>
  nextToken?: string | null
}

export type ModelLeadReceiverFilterInput = {
  email?: ModelStringInput | null
  name?: ModelStringInput | null
  createdAt?: ModelStringInput | null
  updatedAt?: ModelStringInput | null
  id?: ModelIDInput | null
  and?: Array<ModelLeadReceiverFilterInput | null> | null
  or?: Array<ModelLeadReceiverFilterInput | null> | null
  not?: ModelLeadReceiverFilterInput | null
}

export type ModelLeadReceiverConnection = {
  __typename: 'ModelLeadReceiverConnection'
  items: Array<LeadReceiver | null>
  nextToken?: string | null
}

export type ModelSubscriptionProjectFilterInput = {
  id?: ModelSubscriptionIDInput | null
  scope?: ModelSubscriptionStringInput | null
  timeline?: ModelSubscriptionStringInput | null
  teamSize?: ModelSubscriptionStringInput | null
  infrastructure?: ModelSubscriptionStringInput | null
  cost?: ModelSubscriptionStringInput | null
  estimatedCost?: ModelSubscriptionStringInput | null
  estimatedTimeline?: ModelSubscriptionStringInput | null
  summary?: ModelSubscriptionStringInput | null
  AI_timeline?: ModelSubscriptionStringInput | null
  AI_scope?: ModelSubscriptionStringInput | null
  AI_teamSize?: ModelSubscriptionStringInput | null
  AI_infrastructure?: ModelSubscriptionStringInput | null
  AI_cost?: ModelSubscriptionStringInput | null
  AI_estimatedCost?: ModelSubscriptionStringInput | null
  AI_estimatedTimeline?: ModelSubscriptionStringInput | null
  AI_summary?: ModelSubscriptionStringInput | null
  AI_improvedScope?: ModelSubscriptionStringInput | null
  AI_costAnalysis?: ModelSubscriptionStringInput | null
  AI_timelineValidation?: ModelSubscriptionStringInput | null
  AI_infrastructureRecommendations?: ModelSubscriptionStringInput | null
  AI_riskAssessment?: ModelSubscriptionStringInput | null
  createdAt?: ModelSubscriptionStringInput | null
  updatedAt?: ModelSubscriptionStringInput | null
  and?: Array<ModelSubscriptionProjectFilterInput | null> | null
  or?: Array<ModelSubscriptionProjectFilterInput | null> | null
}

export type ModelSubscriptionIDInput = {
  ne?: string | null
  eq?: string | null
  le?: string | null
  lt?: string | null
  ge?: string | null
  gt?: string | null
  contains?: string | null
  notContains?: string | null
  between?: Array<string | null> | null
  beginsWith?: string | null
  in?: Array<string | null> | null
  notIn?: Array<string | null> | null
}

export type ModelSubscriptionStringInput = {
  ne?: string | null
  eq?: string | null
  le?: string | null
  lt?: string | null
  ge?: string | null
  gt?: string | null
  contains?: string | null
  notContains?: string | null
  between?: Array<string | null> | null
  beginsWith?: string | null
  in?: Array<string | null> | null
  notIn?: Array<string | null> | null
}

export type ModelSubscriptionLeadFilterInput = {
  email?: ModelSubscriptionStringInput | null
  id?: ModelSubscriptionIDInput | null
  firstName?: ModelSubscriptionStringInput | null
  lastName?: ModelSubscriptionStringInput | null
  phoneNumber?: ModelSubscriptionStringInput | null
  description?: ModelSubscriptionStringInput | null
  createdAt?: ModelSubscriptionStringInput | null
  updatedAt?: ModelSubscriptionStringInput | null
  and?: Array<ModelSubscriptionLeadFilterInput | null> | null
  or?: Array<ModelSubscriptionLeadFilterInput | null> | null
}

export type ModelSubscriptionLeadReceiverFilterInput = {
  email?: ModelSubscriptionStringInput | null
  name?: ModelSubscriptionStringInput | null
  createdAt?: ModelSubscriptionStringInput | null
  updatedAt?: ModelSubscriptionStringInput | null
  id?: ModelSubscriptionIDInput | null
  and?: Array<ModelSubscriptionLeadReceiverFilterInput | null> | null
  or?: Array<ModelSubscriptionLeadReceiverFilterInput | null> | null
}

export type CreateProjectMutationVariables = {
  input: CreateProjectInput
  condition?: ModelProjectConditionInput | null
}

export type CreateProjectMutation = {
  createProject?: {
    __typename: 'Project'
    id: string
    scope?: string | null
    timeline?: string | null
    teamSize?: string | null
    infrastructure?: string | null
    cost?: string | null
    estimatedCost?: string | null
    estimatedTimeline?: string | null
    summary?: string | null
    AI_timeline?: string | null
    AI_scope?: string | null
    AI_teamSize?: string | null
    AI_infrastructure?: string | null
    AI_cost?: string | null
    AI_estimatedCost?: string | null
    AI_estimatedTimeline?: string | null
    AI_summary?: string | null
    AI_improvedScope?: string | null
    AI_costAnalysis?: string | null
    AI_timelineValidation?: string | null
    AI_infrastructureRecommendations?: string | null
    AI_riskAssessment?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type UpdateProjectMutationVariables = {
  input: UpdateProjectInput
  condition?: ModelProjectConditionInput | null
}

export type UpdateProjectMutation = {
  updateProject?: {
    __typename: 'Project'
    id: string
    scope?: string | null
    timeline?: string | null
    teamSize?: string | null
    infrastructure?: string | null
    cost?: string | null
    estimatedCost?: string | null
    estimatedTimeline?: string | null
    summary?: string | null
    AI_timeline?: string | null
    AI_scope?: string | null
    AI_teamSize?: string | null
    AI_infrastructure?: string | null
    AI_cost?: string | null
    AI_estimatedCost?: string | null
    AI_estimatedTimeline?: string | null
    AI_summary?: string | null
    AI_improvedScope?: string | null
    AI_costAnalysis?: string | null
    AI_timelineValidation?: string | null
    AI_infrastructureRecommendations?: string | null
    AI_riskAssessment?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type DeleteProjectMutationVariables = {
  input: DeleteProjectInput
  condition?: ModelProjectConditionInput | null
}

export type DeleteProjectMutation = {
  deleteProject?: {
    __typename: 'Project'
    id: string
    scope?: string | null
    timeline?: string | null
    teamSize?: string | null
    infrastructure?: string | null
    cost?: string | null
    estimatedCost?: string | null
    estimatedTimeline?: string | null
    summary?: string | null
    AI_timeline?: string | null
    AI_scope?: string | null
    AI_teamSize?: string | null
    AI_infrastructure?: string | null
    AI_cost?: string | null
    AI_estimatedCost?: string | null
    AI_estimatedTimeline?: string | null
    AI_summary?: string | null
    AI_improvedScope?: string | null
    AI_costAnalysis?: string | null
    AI_timelineValidation?: string | null
    AI_infrastructureRecommendations?: string | null
    AI_riskAssessment?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type CreateLeadMutationVariables = {
  input: CreateLeadInput
  condition?: ModelLeadConditionInput | null
}

export type CreateLeadMutation = {
  createLead?: {
    __typename: 'Lead'
    email: string
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    description?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type UpdateLeadMutationVariables = {
  input: UpdateLeadInput
  condition?: ModelLeadConditionInput | null
}

export type UpdateLeadMutation = {
  updateLead?: {
    __typename: 'Lead'
    email: string
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    description?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type DeleteLeadMutationVariables = {
  input: DeleteLeadInput
  condition?: ModelLeadConditionInput | null
}

export type DeleteLeadMutation = {
  deleteLead?: {
    __typename: 'Lead'
    email: string
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    description?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type CreateLeadReceiverMutationVariables = {
  input: CreateLeadReceiverInput
  condition?: ModelLeadReceiverConditionInput | null
}

export type CreateLeadReceiverMutation = {
  createLeadReceiver?: {
    __typename: 'LeadReceiver'
    email: string
    name?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type UpdateLeadReceiverMutationVariables = {
  input: UpdateLeadReceiverInput
  condition?: ModelLeadReceiverConditionInput | null
}

export type UpdateLeadReceiverMutation = {
  updateLeadReceiver?: {
    __typename: 'LeadReceiver'
    email: string
    name?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type DeleteLeadReceiverMutationVariables = {
  input: DeleteLeadReceiverInput
  condition?: ModelLeadReceiverConditionInput | null
}

export type DeleteLeadReceiverMutation = {
  deleteLeadReceiver?: {
    __typename: 'LeadReceiver'
    email: string
    name?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type GetProjectQueryVariables = {
  id: string
}

export type GetProjectQuery = {
  getProject?: {
    __typename: 'Project'
    id: string
    scope?: string | null
    timeline?: string | null
    teamSize?: string | null
    infrastructure?: string | null
    cost?: string | null
    estimatedCost?: string | null
    estimatedTimeline?: string | null
    summary?: string | null
    AI_timeline?: string | null
    AI_scope?: string | null
    AI_teamSize?: string | null
    AI_infrastructure?: string | null
    AI_cost?: string | null
    AI_estimatedCost?: string | null
    AI_estimatedTimeline?: string | null
    AI_summary?: string | null
    AI_improvedScope?: string | null
    AI_costAnalysis?: string | null
    AI_timelineValidation?: string | null
    AI_infrastructureRecommendations?: string | null
    AI_riskAssessment?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type ListProjectsQueryVariables = {
  filter?: ModelProjectFilterInput | null
  limit?: number | null
  nextToken?: string | null
}

export type ListProjectsQuery = {
  listProjects?: {
    __typename: 'ModelProjectConnection'
    items: Array<{
      __typename: 'Project'
      id: string
      scope?: string | null
      timeline?: string | null
      teamSize?: string | null
      infrastructure?: string | null
      cost?: string | null
      estimatedCost?: string | null
      estimatedTimeline?: string | null
      summary?: string | null
      AI_timeline?: string | null
      AI_scope?: string | null
      AI_teamSize?: string | null
      AI_infrastructure?: string | null
      AI_cost?: string | null
      AI_estimatedCost?: string | null
      AI_estimatedTimeline?: string | null
      AI_summary?: string | null
      AI_improvedScope?: string | null
      AI_costAnalysis?: string | null
      AI_timelineValidation?: string | null
      AI_infrastructureRecommendations?: string | null
      AI_riskAssessment?: string | null
      createdAt: string
      updatedAt: string
    } | null>
    nextToken?: string | null
  } | null
}

export type GetLeadQueryVariables = {
  email: string
}

export type GetLeadQuery = {
  getLead?: {
    __typename: 'Lead'
    email: string
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    description?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type ListLeadsQueryVariables = {
  email?: string | null
  filter?: ModelLeadFilterInput | null
  limit?: number | null
  nextToken?: string | null
  sortDirection?: ModelSortDirection | null
}

export type ListLeadsQuery = {
  listLeads?: {
    __typename: 'ModelLeadConnection'
    items: Array<{
      __typename: 'Lead'
      email: string
      id: string
      firstName: string
      lastName: string
      phoneNumber: string
      description?: string | null
      createdAt: string
      updatedAt: string
    } | null>
    nextToken?: string | null
  } | null
}

export type GetLeadReceiverQueryVariables = {
  email: string
}

export type GetLeadReceiverQuery = {
  getLeadReceiver?: {
    __typename: 'LeadReceiver'
    email: string
    name?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type ListLeadReceiversQueryVariables = {
  email?: string | null
  filter?: ModelLeadReceiverFilterInput | null
  limit?: number | null
  nextToken?: string | null
  sortDirection?: ModelSortDirection | null
}

export type ListLeadReceiversQuery = {
  listLeadReceivers?: {
    __typename: 'ModelLeadReceiverConnection'
    items: Array<{
      __typename: 'LeadReceiver'
      email: string
      name?: string | null
      createdAt: string
      updatedAt: string
    } | null>
    nextToken?: string | null
  } | null
}

export type OnCreateProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null
}

export type OnCreateProjectSubscription = {
  onCreateProject?: {
    __typename: 'Project'
    id: string
    scope?: string | null
    timeline?: string | null
    teamSize?: string | null
    infrastructure?: string | null
    cost?: string | null
    estimatedCost?: string | null
    estimatedTimeline?: string | null
    summary?: string | null
    AI_timeline?: string | null
    AI_scope?: string | null
    AI_teamSize?: string | null
    AI_infrastructure?: string | null
    AI_cost?: string | null
    AI_estimatedCost?: string | null
    AI_estimatedTimeline?: string | null
    AI_summary?: string | null
    AI_improvedScope?: string | null
    AI_costAnalysis?: string | null
    AI_timelineValidation?: string | null
    AI_infrastructureRecommendations?: string | null
    AI_riskAssessment?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type OnUpdateProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null
}

export type OnUpdateProjectSubscription = {
  onUpdateProject?: {
    __typename: 'Project'
    id: string
    scope?: string | null
    timeline?: string | null
    teamSize?: string | null
    infrastructure?: string | null
    cost?: string | null
    estimatedCost?: string | null
    estimatedTimeline?: string | null
    summary?: string | null
    AI_timeline?: string | null
    AI_scope?: string | null
    AI_teamSize?: string | null
    AI_infrastructure?: string | null
    AI_cost?: string | null
    AI_estimatedCost?: string | null
    AI_estimatedTimeline?: string | null
    AI_summary?: string | null
    AI_improvedScope?: string | null
    AI_costAnalysis?: string | null
    AI_timelineValidation?: string | null
    AI_infrastructureRecommendations?: string | null
    AI_riskAssessment?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type OnDeleteProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null
}

export type OnDeleteProjectSubscription = {
  onDeleteProject?: {
    __typename: 'Project'
    id: string
    scope?: string | null
    timeline?: string | null
    teamSize?: string | null
    infrastructure?: string | null
    cost?: string | null
    estimatedCost?: string | null
    estimatedTimeline?: string | null
    summary?: string | null
    AI_timeline?: string | null
    AI_scope?: string | null
    AI_teamSize?: string | null
    AI_infrastructure?: string | null
    AI_cost?: string | null
    AI_estimatedCost?: string | null
    AI_estimatedTimeline?: string | null
    AI_summary?: string | null
    AI_improvedScope?: string | null
    AI_costAnalysis?: string | null
    AI_timelineValidation?: string | null
    AI_infrastructureRecommendations?: string | null
    AI_riskAssessment?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type OnCreateLeadSubscriptionVariables = {
  filter?: ModelSubscriptionLeadFilterInput | null
}

export type OnCreateLeadSubscription = {
  onCreateLead?: {
    __typename: 'Lead'
    email: string
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    description?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type OnUpdateLeadSubscriptionVariables = {
  filter?: ModelSubscriptionLeadFilterInput | null
}

export type OnUpdateLeadSubscription = {
  onUpdateLead?: {
    __typename: 'Lead'
    email: string
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    description?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type OnDeleteLeadSubscriptionVariables = {
  filter?: ModelSubscriptionLeadFilterInput | null
}

export type OnDeleteLeadSubscription = {
  onDeleteLead?: {
    __typename: 'Lead'
    email: string
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    description?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type OnCreateLeadReceiverSubscriptionVariables = {
  filter?: ModelSubscriptionLeadReceiverFilterInput | null
}

export type OnCreateLeadReceiverSubscription = {
  onCreateLeadReceiver?: {
    __typename: 'LeadReceiver'
    email: string
    name?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type OnUpdateLeadReceiverSubscriptionVariables = {
  filter?: ModelSubscriptionLeadReceiverFilterInput | null
}

export type OnUpdateLeadReceiverSubscription = {
  onUpdateLeadReceiver?: {
    __typename: 'LeadReceiver'
    email: string
    name?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type OnDeleteLeadReceiverSubscriptionVariables = {
  filter?: ModelSubscriptionLeadReceiverFilterInput | null
}

export type OnDeleteLeadReceiverSubscription = {
  onDeleteLeadReceiver?: {
    __typename: 'LeadReceiver'
    email: string
    name?: string | null
    createdAt: string
    updatedAt: string
  } | null
}
