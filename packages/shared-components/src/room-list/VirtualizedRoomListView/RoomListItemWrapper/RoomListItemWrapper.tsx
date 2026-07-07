/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import React, { memo, type JSX } from "react";
import { useDraggable, useDragOperation, useDroppable } from "@dnd-kit/react";
import { Feedback } from "@dnd-kit/dom";
import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { useMergeRefs } from "react-merge-refs";

import { RoomListItemView, type RoomListItemViewProps } from "./RoomListItemView";
import { getItemAccessibleProps } from "../../../core/VirtualizedList";
import { useViewModel } from "../../../core/viewmodel";
import { type RoomDragData, type RoomListDragData } from "../dragAndDrop";

export interface RoomListItemWrapperProps extends RoomListItemViewProps {
    /** Index of this room in the list */
    roomIndex: number;
    /** Index of this room in its section */
    roomIndexInSection: number;
    /** Total number of rooms in the list */
    roomCount: number;
    /** Whether the room list is displayed as a flat list */
    isInFlatList: boolean;
}

/**
 * Wraps RoomListItemView with the correct accessibility and drag-and-drop props
 * based on whether the list is flat (listbox) or grouped (treegrid).
 */
export const RoomListItemWrapper = memo(function RoomListItemWrapper({
    roomIndex,
    roomCount,
    roomIndexInSection,
    isInFlatList,
    ...rest
}: RoomListItemWrapperProps): JSX.Element {
    if (isInFlatList) {
        return <RoomListItemView {...rest} {...getItemAccessibleProps("listbox", roomIndex, roomCount)} />;
    }

    const isFirstInSection = roomIndexInSection === 0;
    return (
        <div {...getItemAccessibleProps("treegrid", roomIndex, roomIndexInSection)}>
            <div role="gridcell" aria-selected={rest.isSelected}>
                <DraggableWrapper
                    {...rest}
                    onKeyDown={(e) => {
                        if (e.code === "ArrowLeft" && isFirstInSection) {
                            // Move focus to the section header
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.dispatchEvent(
                                new KeyboardEvent("keydown", {
                                    code: "ArrowUp",
                                    key: "ArrowUp",
                                    bubbles: true,
                                }),
                            );
                        }
                    }}
                />
            </div>
        </div>
    );
});

/**
 * Wraps RoomListItemView with the drag-and-drop functionality. This is only used for treegrid mode, as flat list items are not draggable.
 */
function DraggableWrapper(props: RoomListItemViewProps): JSX.Element {
    const item = useViewModel(props.vm);
    const {
        ref: draggableRef,
        handleRef,
        isDragSource,
    } = useDraggable<RoomDragData>({
        id: item.id,
        data: { type: "room" },
        // We clone the item in the dnd overlay to avoid putting a hole in the list
        plugins: [Feedback.configure({ feedback: "clone" })],
        modifiers: [RestrictToVerticalAxis],
    });

    // Rooms are also drop targets so a dragged room can be dropped onto another room to reorder
    // within the section. Disabled while this row is the drag source so it can't target itself.
    const { ref: droppableRef, isDropTarget } = useDroppable<RoomDragData>({
        id: item.id,
        data: { type: "room" },
        disabled: isDragSource,
    });

    // Only surface the reorder indicator when the thing being dragged is a room (not a section).
    const { source } = useDragOperation<RoomListDragData>();
    const isRoomReorderTarget = isDropTarget && source?.data?.type === "room";

    const dndRef = useMergeRefs([draggableRef, handleRef, droppableRef]);
    return (
        <RoomListItemView {...props} ref={dndRef} isDragSource={isDragSource} isDropTarget={isRoomReorderTarget} />
    );
}
