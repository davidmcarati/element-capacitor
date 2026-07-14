/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import React, { type JSX, memo, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import classNames from "classnames";
import { useMergeRefs } from "react-merge-refs";

import { Flex } from "../../../../core/utils/Flex";
import { type NotificationDecorationData } from "./NotificationDecoration";
import { RoomListItemContextMenu } from "./RoomListItemContextMenu";
import { RoomListItemContent } from "./RoomListItemContent";
import { RoomListItemThreads } from "./RoomListItemThreads";
import { type RoomNotifState } from "./RoomNotifs";
import styles from "./RoomListItemView.module.css";
import { useViewModel, type ViewModel } from "../../../../core/viewmodel";
import { _t } from "../../../../core/i18n/i18n";

/**
 * Opaque type representing a Room object from the parent application
 */
export type Room = unknown;

/**
 * Generate an accessible label for a room based on its notification state.
 */
function getA11yLabel(roomName: string, notification: NotificationDecorationData): string {
    if (notification.isUnsentMessage) {
        return _t("room_list|a11y|unsent_message", { roomName });
    } else if (notification.invited) {
        return _t("room_list|a11y|invitation", { roomName });
    } else if (notification.isMention && notification.count) {
        return _t("room_list|a11y|mention", { roomName, count: notification.count });
    } else if (notification.hasUnreadCount && notification.count) {
        return _t("room_list|a11y|unread", { roomName, count: notification.count });
    } else if (notification.callType === "voice") {
        return _t("room_list|a11y|voice_call", { roomName });
    } else if (notification.callType === "video") {
        return _t("room_list|a11y|video_call", { roomName });
    } else {
        return _t("room_list|a11y|default", { roomName });
    }
}

/**
 * Describes a section that a room can be assigned to.
 * Used to render toggle items in the "Move to section" submenu.
 */
export interface Section {
    /** The tag that identifies this section (e.g. `m.favourite`, custom tag) */
    tag: string;
    /** The human-readable display name of the section */
    name: string;
    /** Whether the room currently belongs to this section */
    isSelected: boolean;
}

/**
 * Describes a single active thread shown beneath a room in the room list.
 */
export interface ActiveThreadItem {
    /** The thread root event id, used as the thread identifier */
    id: string;
    /** Display name for the thread (its root message preview) */
    name: string;
    /** Notification decoration data for the thread (unread count, mention, activity, etc.) */
    notification: NotificationDecorationData;
}

/**
 * Snapshot for a room list item.
 * Contains all the data needed to render a room in the list.
 */
export interface RoomListItemViewSnapshot {
    /** Unique identifier for the room (used for list keying) */
    id: string;
    /** The opaque Room object from the client (e.g., matrix-js-sdk Room) */
    room: Room;
    /** The name of the room */
    name: string;
    /** Whether the room name should be bolded (has unread/activity) */
    isBold: boolean;
    /** Optional message preview text */
    messagePreview?: string;
    /** Notification decoration data */
    notification: NotificationDecorationData;
    /** Whether the more options menu should be shown */
    showMoreOptionsMenu: boolean;
    /** Whether the notification menu should be shown */
    showNotificationMenu: boolean;
    /** Whether the room is a favourite room */
    isFavourite: boolean;
    /** Whether the room is a low priority room */
    isLowPriority: boolean;
    /** Can invite other users in the room */
    canInvite: boolean;
    /** Can copy the room link */
    canCopyRoomLink: boolean;
    /** Can mark the room as read */
    canMarkAsRead: boolean;
    /** Can mark the room as unread */
    canMarkAsUnread: boolean;
    /** The room's notification state */
    roomNotifState: RoomNotifState;
    /** Available sections the room can be assigned to */
    sections: Section[];
    /** Active threads (recent activity) to display beneath the room */
    activeThreads: ActiveThreadItem[];
    /** Whether the room's active thread list is collapsed (hidden) by the user */
    threadsCollapsed: boolean;
}

/**
 * Actions interface for room list item operations.
 * Implemented by the room item view model.
 */
export interface RoomListItemViewActions {
    /** Called when the room should be opened */
    onOpenRoom: () => void;
    /** Called when one of the room's active threads should be opened */
    onOpenThread: (threadId: string) => void;
    /** Called when the room's active thread list should be collapsed/expanded */
    onToggleThreadsCollapsed: () => void;
    /** Called when the room should be marked as read */
    onMarkAsRead: () => void;
    /** Called when the room should be marked as unread */
    onMarkAsUnread: () => void;
    /** Called when the room's favorite status should be toggled */
    onToggleFavorite: () => void;
    /** Called when the room's low priority status should be toggled */
    onToggleLowPriority: () => void;
    /** Called when inviting users to the room */
    onInvite: () => void;
    /** Called when copying the room link */
    onCopyRoomLink: () => void;
    /** Called when leaving the room */
    onLeaveRoom: () => void;
    /** Called when setting the room notification state */
    onSetRoomNotifState: (state: RoomNotifState) => void;
    /** Called when creating a new section */
    onCreateSection: () => void;
    /** Called when toggling a room's membership in a section */
    onToggleSection: (tag: string) => void;
    /** Called when removing the room from a section */
    onRemoveFromSection: () => void;
}

/**
 * The view model type for a room list item
 */
export type RoomListItemViewModel = ViewModel<RoomListItemViewSnapshot, RoomListItemViewActions>;

/**
 * Props for RoomListItemView component
 */
export interface RoomListItemViewProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, "onFocus"> {
    /** The room item view model */
    vm: RoomListItemViewModel;
    /** Whether the room is selected */
    isSelected: boolean;
    /** Whether the room should be focused */
    isFocused: boolean;
    /** Callback when item receives focus */
    onFocus: (roomId: string, e: React.FocusEvent) => void;
    /** Whether this is the first item in the list */
    isFirstItem: boolean;
    /** Whether this is the last item in the list */
    isLastItem: boolean;
    /** Function to render the room avatar */
    renderAvatar: (room: Room) => ReactNode;
    /** Whether this item is the source of an active drag operation */
    isDragSource?: boolean;
    /** Whether another room is currently being dragged over this item (reorder drop target) */
    isDropTarget?: boolean;
    ref?: Ref<Element>;
}

/**
 * A presentational room list item component.
 * Displays room name, avatar, message preview, and notifications.
 */
export const RoomListItemView = memo(function RoomListItemView({
    vm,
    isSelected,
    isFocused,
    onFocus,
    isFirstItem,
    isLastItem,
    renderAvatar,
    isDragSource = false,
    isDropTarget = false,
    ref,
    ...props
}: RoomListItemViewProps): JSX.Element {
    const internalRef = useRef<HTMLButtonElement>(null);
    const mergedRef = useMergeRefs([ref, internalRef]);
    const item = useViewModel(vm);

    // Reveal the hover menu when the row is focused via the keyboard (not the mouse), and keep it
    // revealed while focus moves onto the menu buttons so they stay reachable by Tab. A pure CSS
    // :focus-visible rule can't do the latter: it drops the instant focus leaves the row for a child,
    // hiding the menu mid-Tab and dropping focus to <body>. A :focus-within rule reveals it for mouse
    // focus too, which clutters selected/clicked rows. So we mark keyboard focus in JS (using the
    // browser's own :focus-visible determination) and keep it set until focus leaves the row entirely.
    const [keyboardActive, setKeyboardActive] = useState(false);

    useEffect(() => {
        if (isFocused) {
            internalRef.current?.focus({ preventScroll: true } as FocusOptions);
        }
    }, [isFocused]);

    const onItemFocus = (e: React.FocusEvent<HTMLButtonElement>): void => {
        onFocus(item.id, e);
        // Only when focus enters the row from outside via the keyboard.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null) && e.currentTarget.matches(":focus-visible")) {
            setKeyboardActive(true);
        }
    };

    const onItemBlur = (e: React.FocusEvent<HTMLButtonElement>): void => {
        // Keep it revealed while focus is on a child menu button, and while one of the menus is open
        // (focus is then in the portaled popover, outside the row). The latter means that when the
        // menu closes with Escape, the trigger is still revealed, so the popover's own focus
        // restoration lands on it instead of dropping to <body>. Clear once focus leaves for good.
        if (
            !e.currentTarget.contains(e.relatedTarget as Node | null) &&
            !e.currentTarget.querySelector('[data-state="open"]')
        ) {
            setKeyboardActive(false);
        }
    };

    // Generate a11y label from notification state and room name
    const a11yLabel = getA11yLabel(item.name, item.notification);

    const roomButton = (
        <RoomListItemContextMenu vm={vm}>
            <Flex
                as="button"
                ref={mergedRef}
                className={classNames(styles.roomListItem, "mx_RoomListItemView", {
                    [styles.keyboardActive]: keyboardActive,
                    [styles.selected]: isSelected,
                    [styles.bold]: item.isBold,
                    [styles.firstItem]: isFirstItem,
                    [styles.lastItem]: isLastItem,
                    [styles.dragSource]: isDragSource,
                    [styles.dropTarget]: isDropTarget,
                    mx_RoomListItemView_selected: isSelected,
                })}
                gap="var(--cpd-space-3x)"
                align="stretch"
                type="button"
                aria-label={a11yLabel}
                onClick={vm.onOpenRoom}
                onFocus={onItemFocus}
                onBlur={onItemBlur}
                tabIndex={isFocused ? 0 : -1}
                aria-selected={props.role === "option" ? isSelected : undefined}
                {...props}
            >
                <RoomListItemContent vm={vm} renderAvatar={renderAvatar} />
            </Flex>
        </RoomListItemContextMenu>
    );

    // Only wrap the row in a container when there are threads to show beneath it, so rooms without
    // active threads keep their original single-button structure.
    if (item.activeThreads.length === 0) return roomButton;

    return (
        <div className={styles.roomListItemWrapper}>
            {roomButton}
            {!item.threadsCollapsed && <RoomListItemThreads vm={vm} />}
        </div>
    );
});
