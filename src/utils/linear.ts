import { GraphQLClient, gql } from 'graphql-request'

const LINEAR_ENDPOINT = 'https://api.linear.app/graphql'

export const getLinearClient = () => {
  const token = localStorage.getItem('linear_api_token') || import.meta.env.VITE_LINEAR_API_KEY
  if (!token) return null

  return new GraphQLClient(LINEAR_ENDPOINT, {
    headers: {
      Authorization: token,
    },
  })
}

export const ISSUES_QUERY = gql`
  query Issues {
    issues(filter: { state: { name: { neq: "Canceled" } } }) {
      nodes {
        id
        title
        identifier
        state {
          name
          color
        }
        cycle {
          id
          number
          startsAt
          endsAt
        }
        assignee {
          id
          name
          avatarUrl
        }
      }
    }
  }
`

export const CYCLES_QUERY = gql`
  query Cycles {
    cycles(first: 20) {
      nodes {
        id
        number
        startsAt
        endsAt
      }
    }
  }
`

export interface LinearIssue {
  id: string
  title: string
  identifier: string
  state: {
    name: string
    color: string
  }
  cycle?: {
    id: string
    number: number
    startsAt: string
    endsAt: string
  }
  assignee?: {
    id: string
    name: string
    avatarUrl?: string
  }
}

export interface LinearCycle {
  id: string
  number: number
  startsAt: string
  endsAt: string
}

export const fetchIssues = async (): Promise<LinearIssue[]> => {
  const client = getLinearClient()
  if (!client) throw new Error('No API Token found')

  const data = await client.request<{ issues: { nodes: LinearIssue[] } }>(ISSUES_QUERY)
  return data.issues.nodes
}

export const fetchCycles = async (): Promise<LinearCycle[]> => {
  const client = getLinearClient()
  if (!client) throw new Error('No API Token found')

  const data = await client.request<{ cycles: { nodes: LinearCycle[] } }>(CYCLES_QUERY)
  return data.cycles.nodes
}
