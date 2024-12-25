import { Account, Avatars, Client, Databases, OAuthProvider, Query } from 'react-native-appwrite';
import { openAuthSessionAsync } from "expo-web-browser";

import * as Linking from 'expo-linking';

export const config = {
  platform: 'com.vvv.restate',
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  galleriesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
  propertiesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
}

export const client = new Client();

client.setEndpoint(config.endpoint!).setProject(config.projectId!).setPlatform(config.platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);

export async function login() {
  try {
    const redirectUri = Linking.createURL('/');
    const response = await account.createOAuth2Token(OAuthProvider.Google, redirectUri);
    if (!response) throw new Error("Create OAuth2 token failed");

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );
    if (browserResult.type !== "success")
      throw new Error("Create OAuth2 token failed");

    const url = new URL(browserResult.url);
    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();
    if (!secret || !userId) throw new Error("Create OAuth2 token failed");

    const session = await account.createSession(userId, secret);
    if (!session) throw new Error("Failed to create session");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function logout() {
  try {
    return await account.deleteSession("current");
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getUser() {
  try {
    const response = await account.get();
    if (response.$id) {
      const userAvatar = avatar.getInitials(response.name);

      return {
        ...response,
        avatar: userAvatar.toString(),
      };
    }

    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getLatestProperties() {
  try {
    const response = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.orderAsc('$createdAt'), Query.limit(5)]
    )
    return response.documents;
  } catch (error) {
    console.error(error)
    return [];
  }
}

export async function getProperties({ filter, query, limit }: { filter: string; query: string; limit?: number }) {
  try {
    const buildQuery = [Query.orderDesc('$createdAt')];
    if (filter && filter !== 'All') buildQuery.push(Query.equal('type', filter));
    if (query) buildQuery.push(Query.or([Query.search('name', query), Query.search('address', query), Query.search('type', query)]));
    if (limit) buildQuery.push(Query.limit(limit));

    const response = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery
    );
    return response.documents;
  } catch (error) {
    console.error(error);
    return []
  }
}