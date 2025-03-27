// lib/apollo-client.js
import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "http://localhost:8000/graphql", // 🔁 This is your Django backend
  cache: new InMemoryCache(),
});

export default client;
