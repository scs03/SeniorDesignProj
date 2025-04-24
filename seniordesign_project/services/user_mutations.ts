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

export const CREATE_USER_MUTATION = gql`
  mutation RegisterUser($name: String!, $email: String!, $password: String!, $role: String!) {
    register_user(name: $name, email: $email, password: $password, role: $role) {
      user_id
      name
      email
      role
      created_at
    }
  }
`

  export const CREATE_ASSIGNMENT = gql`
    mutation CreateAssignment(
      $classId: Int!
      $name: String!
      $dueDate: DateTime
      $prompt: String
    ) {
      create_assignment(
        class_id: $classId
        name: $name
        due_date: $dueDate
        prompt: $prompt
      )
    }
`;


