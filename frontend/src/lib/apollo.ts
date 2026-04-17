import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';
import Cookies from 'js-cookie';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = Cookies.get('slooze_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

let wsLink: GraphQLWsLink | null = null;

// WebSocket link is only created on the client side
if (typeof window !== 'undefined') {
  wsLink = new GraphQLWsLink(
    createClient({
      url: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000/graphql',
      connectionParams: () => {
        const token = Cookies.get('slooze_token');
        return { authorization: token ? `Bearer ${token}` : '' };
      },
    }),
  );
}

const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink),
    )
  : authLink.concat(httpLink);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
