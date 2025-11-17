import { kv } from '@vercel/kv';

// Keys structure:
// group:{id} -> group object
// group:{id}:participants -> list of participants
// group:{id}:wishlist -> wishlist data
// group:{id}:pairing -> pairing data

export async function getGroup(id) {
  try {
    const group = await kv.get(`group:${id}`);
    return group;
  } catch (error) {
    console.error('Error getting group:', error);
    return null;
  }
}

export async function saveGroup(id, group) {
  try {
    await kv.set(`group:${id}`, group);
    return true;
  } catch (error) {
    console.error('Error saving group:', error);
    return false;
  }
}

export async function deleteGroup(id) {
  try {
    await kv.del(`group:${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    return false;
  }
}

export async function getWishlist(groupId, participantId) {
  try {
    const wishlist = await kv.get(`group:${groupId}:wishlist:${participantId}`);
    return wishlist || [];
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return [];
  }
}

export async function saveWishlist(groupId, participantId, wishlist) {
  try {
    await kv.set(`group:${groupId}:wishlist:${participantId}`, wishlist);
    return true;
  } catch (error) {
    console.error('Error saving wishlist:', error);
    return false;
  }
}

export async function getPairing(groupId) {
  try {
    const pairing = await kv.get(`group:${groupId}:pairing`);
    return pairing || null;
  } catch (error) {
    console.error('Error getting pairing:', error);
    return null;
  }
}

export async function savePairing(groupId, pairing) {
  try {
    await kv.set(`group:${groupId}:pairing`, pairing);
    return true;
  } catch (error) {
    console.error('Error saving pairing:', error);
    return false;
  }
}
