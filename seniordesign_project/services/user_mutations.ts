import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      email
      name
      role
      user_id
      created_at
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;


//added this 

export const SUBMIT_ASSIGNMENT_MUTATION = gql`
  mutation SubmitAssignment($assignmentId: Int!, $submissionFile: String!) {
    submit_assignment(assignment_id: $assignmentId, submission_file: $submissionFile)
  }
`;
