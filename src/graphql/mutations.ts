/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API'
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType
  __generatedMutationOutput: OutputType
}

export const createProject = /* GraphQL */ `mutation CreateProject(
  $input: CreateProjectInput!
  $condition: ModelProjectConditionInput
) {
  createProject(input: $input, condition: $condition) {
    id
    scope
    timeline
    teamSize
    infrastructure
    cost
    estimatedCost
    estimatedTimeline
    summary
    AI_timeline
    AI_scope
    AI_teamSize
    AI_infrastructure
    AI_cost
    AI_estimatedCost
    AI_estimatedTimeline
    AI_summary
    AI_improvedScope
    AI_costAnalysis
    AI_timelineValidation
    AI_infrastructureRecommendations
    AI_riskAssessment
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateProjectMutationVariables, APITypes.CreateProjectMutation>
export const updateProject = /* GraphQL */ `mutation UpdateProject(
  $input: UpdateProjectInput!
  $condition: ModelProjectConditionInput
) {
  updateProject(input: $input, condition: $condition) {
    id
    scope
    timeline
    teamSize
    infrastructure
    cost
    estimatedCost
    estimatedTimeline
    summary
    AI_timeline
    AI_scope
    AI_teamSize
    AI_infrastructure
    AI_cost
    AI_estimatedCost
    AI_estimatedTimeline
    AI_summary
    AI_improvedScope
    AI_costAnalysis
    AI_timelineValidation
    AI_infrastructureRecommendations
    AI_riskAssessment
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateProjectMutationVariables, APITypes.UpdateProjectMutation>
export const deleteProject = /* GraphQL */ `mutation DeleteProject(
  $input: DeleteProjectInput!
  $condition: ModelProjectConditionInput
) {
  deleteProject(input: $input, condition: $condition) {
    id
    scope
    timeline
    teamSize
    infrastructure
    cost
    estimatedCost
    estimatedTimeline
    summary
    AI_timeline
    AI_scope
    AI_teamSize
    AI_infrastructure
    AI_cost
    AI_estimatedCost
    AI_estimatedTimeline
    AI_summary
    AI_improvedScope
    AI_costAnalysis
    AI_timelineValidation
    AI_infrastructureRecommendations
    AI_riskAssessment
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteProjectMutationVariables, APITypes.DeleteProjectMutation>
export const createLead = /* GraphQL */ `mutation CreateLead(
  $input: CreateLeadInput!
  $condition: ModelLeadConditionInput
) {
  createLead(input: $input, condition: $condition) {
    email
    id
    firstName
    lastName
    phoneNumber
    description
    environment
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateLeadMutationVariables, APITypes.CreateLeadMutation>
export const updateLead = /* GraphQL */ `mutation UpdateLead(
  $input: UpdateLeadInput!
  $condition: ModelLeadConditionInput
) {
  updateLead(input: $input, condition: $condition) {
    email
    id
    firstName
    lastName
    phoneNumber
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateLeadMutationVariables, APITypes.UpdateLeadMutation>
export const deleteLead = /* GraphQL */ `mutation DeleteLead(
  $input: DeleteLeadInput!
  $condition: ModelLeadConditionInput
) {
  deleteLead(input: $input, condition: $condition) {
    email
    id
    firstName
    lastName
    phoneNumber
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteLeadMutationVariables, APITypes.DeleteLeadMutation>
export const createLeadReceiver = /* GraphQL */ `mutation CreateLeadReceiver(
  $input: CreateLeadReceiverInput!
  $condition: ModelLeadReceiverConditionInput
) {
  createLeadReceiver(input: $input, condition: $condition) {
    email
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateLeadReceiverMutationVariables, APITypes.CreateLeadReceiverMutation>
export const updateLeadReceiver = /* GraphQL */ `mutation UpdateLeadReceiver(
  $input: UpdateLeadReceiverInput!
  $condition: ModelLeadReceiverConditionInput
) {
  updateLeadReceiver(input: $input, condition: $condition) {
    email
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateLeadReceiverMutationVariables, APITypes.UpdateLeadReceiverMutation>
export const deleteLeadReceiver = /* GraphQL */ `mutation DeleteLeadReceiver(
  $input: DeleteLeadReceiverInput!
  $condition: ModelLeadReceiverConditionInput
) {
  deleteLeadReceiver(input: $input, condition: $condition) {
    email
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteLeadReceiverMutationVariables, APITypes.DeleteLeadReceiverMutation>
