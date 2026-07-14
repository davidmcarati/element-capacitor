/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import React, { type JSX, memo, type ReactNode } from "react";
import { Text } from "@vector-im/compound-web";
import { ChevronDownIcon, ChevronUpIcon } from "@vector-im/compound-design-tokens/assets/web/icons";
import classNames from "classnames";

import { Flex } from "../../../../core/utils/Flex";
import { useViewModel } from "../../../../core/viewmodel";
import { _t } from "../../../../core/i18n/i18n";
import { NotificationDecoration } from "./NotificationDecoration";
import { RoomListItemHoverMenu } from "./RoomListItemHoverMenu";
import { type Room, type RoomListItemViewModel } from "./RoomListItemView";
import styles from "./RoomListItemView.module.css";

/**
 * Props for {@link RoomListItemContent}.
 */
export interface RoomListItemContentProps {
    /** The room item view model */
    vm: RoomListItemViewModel;
    /** Function to render the room avatar */
    renderAvatar: (room: Room) => ReactNode;
    /** Whether the item is being dragged */
    isDragging?: boolean;
}

/**
 * The inner content of a room list item: avatar, room name, message preview,
 * hover menu and notification decoration. Used both inside the full
 * {@link RoomListItemView} and inside the drag overlay.
 */
export const RoomListItemContent = memo(function RoomListItemContent({
    vm,
    renderAvatar,
    isDragging = false,
}: RoomListItemContentProps): JSX.Element {
    const item = useViewModel(vm);

    // Only offer the collapse toggle in the actual row (not the drag overlay) and only when the
    // room has active threads to hide/show.
    const showThreadsToggle = !isDragging && item.activeThreads.length > 0;

    return (
        <Flex
            className={classNames(styles.container, {
                [styles.dragging]: isDragging,
            })}
            gap="var(--cpd-space-3x)"
            align="center"
        >
            {renderAvatar(item.room)}
            <Flex className={styles.content} gap="var(--cpd-space-2x)" align="center" justify="space-between">
                {/* We truncate the room name when too long. Title here is to show the full name on hover */}
                <div className={styles.ellipsis}>
                    <div className={styles.roomNameRow}>
                        <div className={styles.roomName} title={item.name} data-testid="room-name">
                            {item.name}
                        </div>
                        {showThreadsToggle && (
                            <button
                                type="button"
                                className={styles.threadsToggle}
                                aria-expanded={!item.threadsCollapsed}
                                aria-label={
                                    item.threadsCollapsed
                                        ? _t("room_list|threads|expand")
                                        : _t("room_list|threads|collapse")
                                }
                                title={
                                    item.threadsCollapsed
                                        ? _t("room_list|threads|expand")
                                        : _t("room_list|threads|collapse")
                                }
                                onClick={(e) => {
                                    // Prevent the parent room button from also opening the room.
                                    e.stopPropagation();
                                    vm.onToggleThreadsCollapsed();
                                }}
                            >
                                {item.threadsCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
                            </button>
                        )}
                    </div>
                    {item.messagePreview && (
                        <Text as="div" size="sm" className={styles.ellipsis} title={item.messagePreview}>
                            {item.messagePreview}
                        </Text>
                    )}
                </div>
                {!isDragging && (item.showMoreOptionsMenu || item.showNotificationMenu) && (
                    <RoomListItemHoverMenu
                        showMoreOptionsMenu={item.showMoreOptionsMenu}
                        showNotificationMenu={item.showNotificationMenu}
                        vm={vm}
                    />
                )}

                {/* aria-hidden because we summarise the unread count/notification status in a11yLabel */}
                <div className={styles.notificationDecoration} aria-hidden={true}>
                    <NotificationDecoration {...item.notification} />
                </div>
            </Flex>
        </Flex>
    );
});
