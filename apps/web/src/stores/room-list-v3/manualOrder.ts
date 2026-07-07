/*
Copyright 2026 Capacitor

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { type MatrixClient, type Room } from "matrix-js-sdk/src/matrix";

/**
 * Account-data event type that stores the user's manual ordering of rooms within room-list
 * sections. Persisting to account data means the ordering syncs across the user's devices.
 *
 * Content shape: `{ sections: { [sectionTag]: string[] /* ordered room ids *\/ } }`
 */
export const MANUAL_ORDER_EVENT_TYPE = "im.capacitor.room_list.manual_order";

export type ManualOrderMap = Record<string, string[]>;

export interface ManualOrderContent {
    sections?: ManualOrderMap;
}

/**
 * Read the manual-order map from the client's account data.
 */
export function readManualOrder(client: MatrixClient): ManualOrderMap {
    const content = client.getAccountData(MANUAL_ORDER_EVENT_TYPE)?.getContent<ManualOrderContent>();
    return content?.sections ?? {};
}

/**
 * Persist the ordered room ids for a single section to account data, preserving other sections.
 */
export async function persistManualOrder(
    client: MatrixClient,
    sectionTag: string,
    orderedRoomIds: string[],
): Promise<void> {
    const current = readManualOrder(client);
    const next: ManualOrderMap = { ...current, [sectionTag]: orderedRoomIds };
    await client.setAccountData(MANUAL_ORDER_EVENT_TYPE, { sections: next });
}

/**
 * Apply a manual ordering to a list of rooms.
 *
 * This is a stable overlay on top of the store's global sort: rooms present in `order` are placed
 * first, in the saved order; any rooms not listed keep their incoming (auto-sorted) relative order
 * and appear afterwards. This lets newly-created rooms surface via the normal sort until the user
 * explicitly places them.
 */
export function applyManualOrder(rooms: Room[], order: string[] | undefined): Room[] {
    if (!order || order.length === 0) return rooms;
    const rank = new Map<string, number>();
    order.forEach((roomId, index) => rank.set(roomId, index));
    return rooms
        .map((room, index) => ({
            room,
            index,
            key: rank.has(room.roomId) ? rank.get(room.roomId)! : Number.POSITIVE_INFINITY,
        }))
        .sort((a, b) => a.key - b.key || a.index - b.index)
        .map((entry) => entry.room);
}

/**
 * Compute a new fully-ordered list of room ids by moving `sourceRoomId` to the position currently
 * occupied by `targetRoomId`. `currentOrderedRoomIds` should be the section's rooms in their
 * currently displayed order (so the result deterministically pins every room).
 */
export function computeReorderedIds(
    currentOrderedRoomIds: string[],
    sourceRoomId: string,
    targetRoomId: string,
): string[] {
    if (sourceRoomId === targetRoomId) return currentOrderedRoomIds;
    const ids = currentOrderedRoomIds.filter((id) => id !== sourceRoomId);
    const targetIndex = ids.indexOf(targetRoomId);
    if (targetIndex === -1) {
        ids.push(sourceRoomId);
    } else {
        ids.splice(targetIndex, 0, sourceRoomId);
    }
    return ids;
}
