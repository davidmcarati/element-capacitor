/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import React, { type JSX, memo, useState } from "react";
import classNames from "classnames";

import { useViewModel } from "../../../../core/viewmodel";
import { _t } from "../../../../core/i18n/i18n";
import { NotificationDecoration } from "./NotificationDecoration";
import { type RoomListItemViewModel } from "./RoomListItemView";
import styles from "./RoomListItemView.module.css";

/** Maximum number of threads shown before the "show more" expander is displayed. */
const MAX_VISIBLE_THREADS = 5;

/**
 * Props for {@link RoomListItemThreads}.
 */
export interface RoomListItemThreadsProps {
    /** The room item view model */
    vm: RoomListItemViewModel;
}

/**
 * Renders the list of active threads beneath a room in the room list.
 * Each thread is a button that opens the thread when clicked. When there are more
 * than {@link MAX_VISIBLE_THREADS} threads, a "show more"/"show less" toggle is shown.
 */
export const RoomListItemThreads = memo(function RoomListItemThreads({
    vm,
}: RoomListItemThreadsProps): JSX.Element | null {
    const item = useViewModel(vm);
    const [expanded, setExpanded] = useState(false);

    const threads = item.activeThreads;
    if (threads.length === 0) return null;

    const canExpand = threads.length > MAX_VISIBLE_THREADS;
    const visibleThreads = expanded || !canExpand ? threads : threads.slice(0, MAX_VISIBLE_THREADS);
    const hiddenCount = threads.length - MAX_VISIBLE_THREADS;

    return (
        <ul className={styles.threadList}>
            {visibleThreads.map((thread) => (
                <li key={thread.id}>
                    <button
                        type="button"
                        className={classNames(styles.threadItem, {
                            [styles.threadItemUnread]: thread.notification.hasAnyNotificationOrActivity,
                        })}
                        title={thread.name}
                        aria-label={_t("room_list|threads|open_thread", { threadName: thread.name })}
                        onClick={() => vm.onOpenThread(thread.id)}
                    >
                        <span className={styles.threadItemName}>{thread.name}</span>
                        {/* aria-hidden because the unread status is summarised in the button aria-label */}
                        <span className={styles.threadItemNotification} aria-hidden={true}>
                            <NotificationDecoration {...thread.notification} />
                        </span>
                    </button>
                </li>
            ))}
            {canExpand && (
                <li>
                    <button
                        type="button"
                        className={styles.threadShowMore}
                        onClick={() => setExpanded((value) => !value)}
                    >
                        {expanded
                            ? _t("room_list|threads|show_less")
                            : _t("room_list|threads|show_n_more", { count: hiddenCount })}
                    </button>
                </li>
            )}
        </ul>
    );
});
