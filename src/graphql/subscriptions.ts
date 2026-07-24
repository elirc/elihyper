/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API'
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType
  __generatedSubscriptionOutput: OutputType
}

export const onCreateProject =
  /* GraphQL */ `subscription OnCreateProject($filter: ModelSubscriptionProjectFilterInput) {
  onCreateProject(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnCreateProjectSubscriptionVariables, APITypes.OnCreateProjectSubscription>
export const onUpdateProject =
  /* GraphQL */ `subscription OnUpdateProject($filter: ModelSubscriptionProjectFilterInput) {
  onUpdateProject(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnUpdateProjectSubscriptionVariables, APITypes.OnUpdateProjectSubscription>
export const onDeleteProject =
  /* GraphQL */ `subscription OnDeleteProject($filter: ModelSubscriptionProjectFilterInput) {
  onDeleteProject(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnDeleteProjectSubscriptionVariables, APITypes.OnDeleteProjectSubscription>
export const onCreateLead = /* GraphQL */ `subscription OnCreateLead($filter: ModelSubscriptionLeadFilterInput) {
  onCreateLead(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnCreateLeadSubscriptionVariables, APITypes.OnCreateLeadSubscription>
export const onUpdateLead = /* GraphQL */ `subscription OnUpdateLead($filter: ModelSubscriptionLeadFilterInput) {
  onUpdateLead(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnUpdateLeadSubscriptionVariables, APITypes.OnUpdateLeadSubscription>
export const onDeleteLead = /* GraphQL */ `subscription OnDeleteLead($filter: ModelSubscriptionLeadFilterInput) {
  onDeleteLead(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnDeleteLeadSubscriptionVariables, APITypes.OnDeleteLeadSubscription>
export const onCreateLeadReceiver = /* GraphQL */ `subscription OnCreateLeadReceiver(
  $filter: ModelSubscriptionLeadReceiverFilterInput
) {
  onCreateLeadReceiver(filter: $filter) {
    email
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateLeadReceiverSubscriptionVariables,
  APITypes.OnCreateLeadReceiverSubscription
>
export const onUpdateLeadReceiver = /* GraphQL */ `subscription OnUpdateLeadReceiver(
  $filter: ModelSubscriptionLeadReceiverFilterInput
) {
  onUpdateLeadReceiver(filter: $filter) {
    email
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateLeadReceiverSubscriptionVariables,
  APITypes.OnUpdateLeadReceiverSubscription
>
export const onDeleteLeadReceiver = /* GraphQL */ `subscription OnDeleteLeadReceiver(
  $filter: ModelSubscriptionLeadReceiverFilterInput
) {
  onDeleteLeadReceiver(filter: $filter) {
    email
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteLeadReceiverSubscriptionVariables,
  APITypes.OnDeleteLeadReceiverSubscription
>
