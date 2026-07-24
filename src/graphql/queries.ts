/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API'
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType
  __generatedQueryOutput: OutputType
}

export const getProject = /* GraphQL */ `query GetProject($id: ID!) {
  getProject(id: $id) {
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
` as GeneratedQuery<APITypes.GetProjectQueryVariables, APITypes.GetProjectQuery>
export const listProjects = /* GraphQL */ `query ListProjects(
  $filter: ModelProjectFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListProjectsQueryVariables, APITypes.ListProjectsQuery>
export const getLead = /* GraphQL */ `query GetLead($email: String!) {
  getLead(email: $email) {
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
` as GeneratedQuery<APITypes.GetLeadQueryVariables, APITypes.GetLeadQuery>
export const listLeads = /* GraphQL */ `query ListLeads(
  $email: String
  $filter: ModelLeadFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listLeads(
    email: $email
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListLeadsQueryVariables, APITypes.ListLeadsQuery>
export const getLeadReceiver = /* GraphQL */ `query GetLeadReceiver($email: String!) {
  getLeadReceiver(email: $email) {
    email
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetLeadReceiverQueryVariables, APITypes.GetLeadReceiverQuery>
export const listLeadReceivers = /* GraphQL */ `query ListLeadReceivers(
  $email: String
  $filter: ModelLeadReceiverFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listLeadReceivers(
    email: $email
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      email
      name
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListLeadReceiversQueryVariables, APITypes.ListLeadReceiversQuery>
